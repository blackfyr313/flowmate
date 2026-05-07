"""
Step: Show Notification
Displays a Windows desktop toast notification.
Tries win10toast first, then plyer, then falls back to a message box.
"""
import asyncio
import logging
from typing import Any

log = logging.getLogger("flowmate.steps.show_notification")

APP_NAME = "FlowMate"
DEFAULT_ICON = None  # Will use system default


async def run(config: dict[str, Any]) -> None:
    """
    Show a desktop notification.

    Args:
        config: ShowNotificationConfig dict with keys:
            - title (str): Notification title (default: 'FlowMate')
            - message (str): Notification body text
            - durationSeconds (int): How long to show it (default: 5)
    """
    title: str = config.get("title", APP_NAME).strip() or APP_NAME
    message: str = config.get("message", "").strip()
    duration: int = max(1, int(config.get("durationSeconds", 5)))

    if not message:
        raise ValueError("No notification message provided.")

    log.info(f"Showing notification: '{title}' — '{message}' ({duration}s)")

    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
        None,
        lambda: _show_notification_sync(title, message, duration),
    )


def _show_notification_sync(title: str, message: str, duration: int) -> None:
    """
    Try multiple notification backends in order of preference.
    This runs in a thread executor so blocking calls are fine.
    """
    if _try_win10toast(title, message, duration):
        return
    if _try_plyer(title, message, duration):
        return

    # Last resort: Windows MessageBox (blocks until dismissed)
    log.warning("No toast library available. Falling back to MessageBox.")
    _try_messagebox(title, message)


def _try_win10toast(title: str, message: str, duration: int) -> bool:
    """Attempt to show a toast using win10toast."""
    try:
        from win10toast import ToastNotifier

        toaster = ToastNotifier()
        toaster.show_toast(
            title,
            message,
            duration=duration,
            threaded=False,  # We're already in a thread
            icon_path=DEFAULT_ICON,
        )
        log.info("Notification shown via win10toast.")
        return True

    except ImportError:
        log.debug("win10toast not available.")
        return False

    except Exception as e:
        log.warning(f"win10toast failed: {e}")
        return False


def _try_plyer(title: str, message: str, duration: int) -> bool:
    """Attempt to show a notification using plyer."""
    try:
        from plyer import notification

        notification.notify(
            title=title,
            message=message,
            app_name=APP_NAME,
            timeout=duration,
        )
        log.info("Notification shown via plyer.")
        return True

    except ImportError:
        log.debug("plyer not available.")
        return False

    except Exception as e:
        log.warning(f"plyer notification failed: {e}")
        return False


def _try_messagebox(title: str, message: str) -> None:
    """Fallback: Windows MessageBox dialog."""
    try:
        import ctypes

        ctypes.windll.user32.MessageBoxW(  # type: ignore[attr-defined]
            0,          # hwnd
            message,    # text
            title,      # caption
            0x00000040, # MB_ICONINFORMATION
        )
        log.info("Notification shown via MessageBox fallback.")

    except Exception as e:
        log.error(f"All notification methods failed. Last error: {e}")
        # Don't re-raise — a failed notification shouldn't kill the automation
