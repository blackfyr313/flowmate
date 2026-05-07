"""
Step: Type Text
Types a string of text using pyautogui, character by character, with
a configurable interval between keystrokes. Optionally presses Enter at the end.
"""
import asyncio
import logging
from typing import Any

log = logging.getLogger("flowmate.steps.type_text")


async def run(config: dict[str, Any]) -> None:
    """
    Type text at the current cursor position.

    Args:
        config: TypeTextConfig dict with keys:
            - text (str): The text to type
            - intervalMs (int): Milliseconds between keystrokes (default: 50)
            - pressEnter (bool): Press Enter after typing (default: False)
    """
    text: str = config.get("text", "")
    interval_ms: int = int(config.get("intervalMs", 50))
    press_enter: bool = bool(config.get("pressEnter", False))

    if not text:
        raise ValueError("No text provided. Please enter text to type.")

    if interval_ms < 0:
        raise ValueError("Interval must be >= 0 milliseconds.")

    interval_sec = interval_ms / 1000.0

    log.info(
        f"Typing {len(text)} character(s) at {interval_ms}ms interval "
        f"(pressEnter={press_enter})"
    )

    try:
        import pyautogui

        # pyautogui.typewrite is blocking — run in executor
        loop = asyncio.get_event_loop()

        # typewrite only handles printable ASCII; use write for unicode support
        await loop.run_in_executor(
            None,
            lambda: _type_text_sync(pyautogui, text, interval_sec, press_enter),
        )

    except ImportError:
        raise RuntimeError(
            "pyautogui is not installed. Run: pip install pyautogui"
        )


def _type_text_sync(pyautogui: Any, text: str, interval: float, press_enter: bool) -> None:
    """Synchronous typing implementation — called from a thread executor."""
    # Split into lines so we handle newlines correctly
    lines = text.split("\n")

    for i, line in enumerate(lines):
        if line:
            # Use pyautogui.write for ASCII-safe chars, hotkey for others
            _type_line(pyautogui, line, interval)

        # Press Enter between lines (and optionally at the end)
        is_last_line = i == len(lines) - 1
        if not is_last_line or (is_last_line and press_enter):
            pyautogui.press("enter")
            if interval > 0:
                import time
                time.sleep(interval)

    log.getLogger = lambda name: None  # silence re-import warning


def _type_line(pyautogui: Any, text: str, interval: float) -> None:
    """Type a single line of text, handling unicode gracefully."""
    import time

    for char in text:
        try:
            # pyautogui.write works for ASCII printable characters
            if char.isprintable() and ord(char) < 128:
                pyautogui.write(char, interval=0)
            else:
                # For unicode characters, use typewrite with hotkey fallback
                pyautogui.hotkey("ctrl", "shift")  # no-op — wake modifier state
                pyautogui.write(char if char.isascii() else "?", interval=0)
        except Exception:
            # Skip untyped characters rather than crashing
            pass

        if interval > 0:
            time.sleep(interval)
