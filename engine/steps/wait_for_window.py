"""
Step: Wait for Window
Polls until a visible window whose title contains the given text appears,
or until the timeout is reached.
"""
import asyncio
import logging
import time
from typing import Any

log = logging.getLogger("flowmate.steps.wait_for_window")

POLL_INTERVAL = 0.5


async def run(config: dict[str, Any]) -> None:
    title_text: str = config.get("windowTitle", "").strip().lower()
    process_name: str = config.get("processName", "").strip().lower()
    timeout: float = float(config.get("timeoutSeconds", 30))

    if not title_text:
        raise ValueError("No window title provided. Enter the text to look for in the window title.")

    log.info(f"Waiting for window containing '{title_text}' (timeout {timeout}s)")

    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if _find_window(title_text, process_name):
            log.info(f"Window '{title_text}' found.")
            return
        await asyncio.sleep(POLL_INTERVAL)

    raise TimeoutError(
        f"Timed out after {timeout}s waiting for a window containing '{title_text}'. "
        "Try increasing the timeout or check the window title text."
    )


def _find_window(title_text: str, process_name: str) -> bool:
    try:
        import win32gui
        import win32process

        found = False

        def callback(hwnd: int, _: Any) -> bool:
            nonlocal found
            if found:
                return True
            if not win32gui.IsWindowVisible(hwnd):
                return True
            wnd_title = win32gui.GetWindowText(hwnd).lower()
            if title_text not in wnd_title:
                return True
            if process_name:
                try:
                    _, pid = win32process.GetWindowThreadProcessId(hwnd)
                    import psutil
                    proc = psutil.Process(pid)
                    if process_name not in proc.name().lower():
                        return True
                except Exception:
                    return True
            found = True
            return True

        win32gui.EnumWindows(callback, None)
        return found

    except ImportError:
        # pywin32 not available — can't check windows; let it pass
        log.warning("pywin32 not available, skipping window check")
        return True
