"""Bring a window matching a process name or title to the foreground."""
import asyncio
import ctypes
import ctypes.wintypes

import psutil
import win32con
import win32gui

user32 = ctypes.windll.user32


async def run(config: dict) -> None:
    process_name = config.get("processName", "").lower().strip()
    window_title = config.get("windowTitle", "").lower().strip()

    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _focus, process_name, window_title)


def _focus(process_name: str, window_title: str) -> None:
    target_pids: set[int] = set()
    if process_name:
        for proc in psutil.process_iter(["pid", "name"]):
            try:
                if process_name in proc.info["name"].lower():
                    target_pids.add(proc.info["pid"])
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass

    candidates: list[tuple[int, int]] = []  # (area, hwnd)

    def _cb(hwnd: int, _: None) -> bool:
        if not win32gui.IsWindowVisible(hwnd):
            return True
        if user32.GetWindow(hwnd, win32con.GW_OWNER):
            return True
        title = win32gui.GetWindowText(hwnd)
        if not title:
            return True

        pid = ctypes.wintypes.DWORD()
        user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
        wpid = pid.value

        title_match = not window_title or window_title in title.lower()
        pid_match = not target_pids or wpid in target_pids

        if title_match and pid_match:
            rect = win32gui.GetWindowRect(hwnd)
            area = (rect[2] - rect[0]) * (rect[3] - rect[1])
            candidates.append((area, hwnd))
        return True

    win32gui.EnumWindows(_cb, None)

    if not candidates:
        raise RuntimeError(
            f"No visible window found matching "
            f"process='{process_name}' title='{window_title}'"
        )

    _, hwnd = max(candidates)

    if win32gui.IsIconic(hwnd):
        user32.ShowWindow(hwnd, win32con.SW_RESTORE)
    user32.SetForegroundWindow(hwnd)
    user32.BringWindowToTop(hwnd)
