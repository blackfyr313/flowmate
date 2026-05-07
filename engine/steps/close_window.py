"""Gracefully close a window by sending WM_CLOSE."""
import asyncio
import ctypes
import ctypes.wintypes

import psutil
import win32con
import win32gui

user32 = ctypes.windll.user32

WM_CLOSE = 0x0010


async def run(config: dict) -> None:
    process_name = config.get("processName", "").lower().strip()
    window_title = config.get("windowTitle", "").lower().strip()

    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _close, process_name, window_title)


def _close(process_name: str, window_title: str) -> None:
    target_pids: set[int] = set()
    if process_name:
        for proc in psutil.process_iter(["pid", "name"]):
            try:
                if process_name in proc.info["name"].lower():
                    target_pids.add(proc.info["pid"])
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass

    candidates: list[tuple[int, int]] = []

    def _cb(hwnd: int, _: None) -> bool:
        if not win32gui.IsWindowVisible(hwnd):
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
    win32gui.PostMessage(hwnd, WM_CLOSE, 0, 0)
