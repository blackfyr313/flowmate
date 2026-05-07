"""
Step: Move & Resize Window
Positions or maximizes an open application window using its process name.
"""
import asyncio
import logging
import time
from typing import Any

log = logging.getLogger("flowmate.steps.move_window")

FIND_TIMEOUT = 10.0
POLL_INTERVAL = 0.4


async def run(config: dict[str, Any]) -> None:
    process_name: str = config.get("processName", "").strip()
    maximize: bool = bool(config.get("maximize", True))
    x: int = int(config.get("x", 0))
    y: int = int(config.get("y", 0))
    width: int = int(config.get("width", 1280))
    height: int = int(config.get("height", 720))

    if not process_name:
        raise ValueError("No process name provided.")

    hwnd = await _find_window(process_name, FIND_TIMEOUT)

    if maximize:
        log.info(f"Maximizing '{process_name}' window (hwnd={hwnd})")
        _maximize(hwnd)
    else:
        if width <= 0 or height <= 0:
            raise ValueError("Width and height must be positive.")
        log.info(f"Moving '{process_name}' window to ({x},{y}) size {width}×{height}")
        _move_and_resize(hwnd, x, y, width, height)

    log.info("Window action completed.")


async def _find_window(process_name: str, timeout: float) -> int:
    deadline = time.monotonic() + timeout
    normalized = process_name.lower()

    while time.monotonic() < deadline:
        hwnd = _scan_for_window(normalized)
        if hwnd:
            return hwnd
        await asyncio.sleep(POLL_INTERVAL)

    raise RuntimeError(
        f"No window found for process '{process_name}' within {timeout}s. "
        "Make sure the application is open."
    )


def _scan_for_window(process_name_lower: str) -> int:
    """
    Find the best main window for a process — prefers the window with the
    largest area (most likely the primary app window, not a toolbar or tray popup).
    """
    try:
        import win32gui
        import win32process
        import psutil

        candidates: list[tuple[int, int]] = []  # (area, hwnd)

        def callback(hwnd: int, _: Any) -> bool:
            if not win32gui.IsWindowVisible(hwnd):
                return True
            if not win32gui.GetWindowText(hwnd):
                return True
            # Only top-level windows (no owner)
            if win32gui.GetWindow(hwnd, 4):  # GW_OWNER = 4
                return True
            try:
                _, pid = win32process.GetWindowThreadProcessId(hwnd)
                proc = psutil.Process(pid)
                if proc.name().lower() != process_name_lower:
                    return True
                rect = win32gui.GetWindowRect(hwnd)
                area = max(0, rect[2] - rect[0]) * max(0, rect[3] - rect[1])
                candidates.append((area, hwnd))
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
            return True

        win32gui.EnumWindows(callback, None)

        if not candidates:
            return 0
        # Return the hwnd with the largest area
        candidates.sort(key=lambda c: c[0], reverse=True)
        return candidates[0][1]

    except ImportError:
        raise RuntimeError(
            "pywin32 is required for Move Window. "
            "Install it with: pip install pywin32"
        )


def _maximize(hwnd: int) -> None:
    import ctypes

    user32 = ctypes.windll.user32

    SW_RESTORE   = 9
    SW_MAXIMIZE  = 3

    try:
        import win32gui
        import win32con

        placement = win32gui.GetWindowPlacement(hwnd)
        current_state = placement[1]

        # Must restore first — SW_MAXIMIZE has no effect on a minimized window
        if current_state == win32con.SW_SHOWMINIMIZED:
            user32.ShowWindow(hwnd, SW_RESTORE)
            time.sleep(0.1)

        # Bring to foreground so the maximize is visible
        user32.SetForegroundWindow(hwnd)
        user32.BringWindowToTop(hwnd)

        # Maximize via ctypes (direct Win32, most reliable)
        user32.ShowWindow(hwnd, SW_MAXIMIZE)

    except Exception as e:
        raise RuntimeError(f"Failed to maximize window: {e}")


def _move_and_resize(hwnd: int, x: int, y: int, width: int, height: int) -> None:
    try:
        import win32gui
        import win32con

        # Restore if minimised/maximised so MoveWindow takes effect
        placement = win32gui.GetWindowPlacement(hwnd)
        if placement[1] in (win32con.SW_SHOWMINIMIZED, win32con.SW_SHOWMAXIMIZED):
            win32gui.ShowWindow(hwnd, win32con.SW_RESTORE)

        win32gui.MoveWindow(hwnd, x, y, width, height, True)

    except Exception as e:
        raise RuntimeError(f"Failed to move window: {e}")
