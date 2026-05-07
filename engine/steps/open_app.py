"""
Step: Open Application
Launches a Windows application by path, name, or shortcut (.lnk).
"""
import asyncio
import logging
import os
import subprocess
import time
from typing import Any, Optional

import psutil

log = logging.getLogger("flowmate.steps.open_app")

APP_LOAD_TIMEOUT = 30
POLL_INTERVAL = 0.5

# File extensions that must go through the Windows Shell (not subprocess.Popen)
SHELL_EXTENSIONS = {'.lnk', '.url', '.pif'}


async def run(config: dict[str, Any]) -> None:
    app_path: str = config.get("appPath", "").strip().strip('"')
    arguments: list[str] = config.get("arguments", [])
    wait_for_load: bool = config.get("waitForLoad", True)

    if not app_path:
        raise ValueError("No application path provided. Please enter the path to the app.")

    ext = os.path.splitext(app_path)[1].lower()
    is_shell_file = ext in SHELL_EXTENSIONS or (ext not in ('.exe', '.bat', '.cmd', '.com') and not ext)

    log.info(f"Launching: {app_path} (shell={is_shell_file})")

    if is_shell_file:
        # .lnk shortcuts and similar MUST go through the Windows Shell.
        # Many shell-launched apps (Steam, game launchers, etc.) are bootstrappers that
        # immediately exit and re-spawn under a new PID, making PID-based window polling
        # unreliable. Use a fixed wait regardless of whether we got a PID back.
        _launch_via_shell(app_path)
        if wait_for_load:
            await asyncio.sleep(4.0)
    else:
        pid = _launch_exe(app_path, arguments)
        if wait_for_load:
            await _wait_for_window(pid, _process_display_name(app_path), APP_LOAD_TIMEOUT)
        else:
            await asyncio.sleep(0.5)


# ─── Launch helpers ───────────────────────────────────────────────────────────

def _launch_via_shell(app_path: str) -> Optional[int]:
    """
    Launch via Windows Shell — handles .lnk shortcuts, .url files, etc.
    Returns PID if obtainable via pywin32, otherwise None.
    """
    try:
        import win32api
        import win32con
        from win32com.shell import shell as _shell

        # SEE_MASK_NOCLOSEPROCESS lets us retrieve the process handle
        SEE_MASK_NOCLOSEPROCESS = 0x00000040
        result = _shell.ShellExecuteEx(
            fMask=SEE_MASK_NOCLOSEPROCESS,
            lpVerb='open',
            lpFile=app_path,
            nShow=win32con.SW_SHOWNORMAL,
        )
        h_process = result.get('hProcess')
        if h_process:
            try:
                import win32process
                pid = win32process.GetProcessId(h_process)
                return pid if pid else None
            finally:
                win32api.CloseHandle(h_process)
        return None

    except ImportError:
        # pywin32 not available — fall back to os.startfile
        log.warning("pywin32 not available, using os.startfile (no PID tracking)")
        os.startfile(app_path)
        return None

    except Exception as e:
        err = str(e)
        if 'Access' in err or 'denied' in err.lower() or '5' in err:
            raise PermissionError(
                f"Access denied launching '{app_path}'. "
                "Try running FlowMate as administrator."
            )
        raise RuntimeError(f"Failed to launch '{app_path}': {e}")


def _launch_exe(app_path: str, arguments: list[str]) -> int:
    """Launch an executable directly via subprocess and return its PID."""
    cmd = [app_path] + arguments
    try:
        proc = subprocess.Popen(
            cmd,
            creationflags=subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP
            if hasattr(subprocess, 'DETACHED_PROCESS') else 0,
        )
        log.info(f"Launched PID {proc.pid}")
        return proc.pid

    except FileNotFoundError:
        raise FileNotFoundError(
            f"Could not find '{app_path}'. "
            "Make sure the path is correct or the app is installed."
        )
    except PermissionError:
        raise PermissionError(
            f"Access denied launching '{app_path}'. "
            "Try running FlowMate as administrator."
        )
    except OSError as e:
        raise RuntimeError(f"Failed to launch '{app_path}': {e}")


# ─── Window wait ──────────────────────────────────────────────────────────────

async def _wait_for_window(pid: int, display_name: str, timeout: float) -> None:
    """Poll until the process has a visible window, or timeout."""
    deadline = time.monotonic() + timeout
    log.info(f"Waiting for '{display_name}' window (PID {pid}, timeout {timeout}s)...")

    while time.monotonic() < deadline:
        try:
            proc = psutil.Process(pid)
            if proc.status() == psutil.STATUS_ZOMBIE:
                raise RuntimeError(f"'{display_name}' exited immediately after launch.")
        except psutil.NoSuchProcess:
            raise RuntimeError(f"'{display_name}' closed unexpectedly right after launching.")

        if _has_visible_window(pid):
            log.info(f"'{display_name}' is ready.")
            return

        await asyncio.sleep(POLL_INTERVAL)

    log.warning(f"Timed out waiting for '{display_name}' window — continuing anyway.")


def _has_visible_window(pid: int) -> bool:
    try:
        import win32gui
        import win32process

        found: list[int] = []

        def callback(hwnd: int, _: Any) -> bool:
            if not win32gui.IsWindowVisible(hwnd):
                return True
            _, window_pid = win32process.GetWindowThreadProcessId(hwnd)
            if window_pid == pid and win32gui.GetWindowText(hwnd):
                found.append(hwnd)
            return True

        win32gui.EnumWindows(callback, None)
        return len(found) > 0

    except ImportError:
        return True  # Assume ready if pywin32 not available


def _process_display_name(app_path: str) -> str:
    return os.path.splitext(os.path.basename(app_path))[0]
