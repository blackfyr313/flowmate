"""
Step: Wait
Either waits a fixed number of seconds, or waits until specific text
appears on screen (Phase 2 — OCR required).
"""
import asyncio
import logging
import time
from typing import Any

log = logging.getLogger("flowmate.steps.wait")


async def run(config: dict[str, Any]) -> None:
    """
    Pause execution.

    Args:
        config: WaitConfig dict with keys:
            - mode (str): 'fixed' | 'element'
            - seconds (float): Duration for fixed mode
            - elementText (str): Text to watch for in element mode
            - timeoutSeconds (float): Max wait in element mode
    """
    mode: str = config.get("mode", "fixed")

    if mode == "fixed":
        seconds: float = float(config.get("seconds", 2.0))
        if seconds <= 0:
            raise ValueError("Wait duration must be greater than 0 seconds.")

        log.info(f"Waiting {seconds}s...")
        await asyncio.sleep(seconds)

    elif mode == "element":
        element_text: str = config.get("elementText", "").strip()
        timeout: float = float(config.get("timeoutSeconds", 30.0))

        if not element_text:
            raise ValueError("No text specified to wait for. Please enter a text to detect.")

        log.info(f"Waiting for text '{element_text}' to appear (timeout: {timeout}s)...")
        await _wait_for_text(element_text, timeout)

    else:
        raise ValueError(f"Unknown wait mode: '{mode}'. Use 'fixed' or 'element'.")


async def _wait_for_text(text: str, timeout: float) -> None:
    """
    Poll the screen using OCR until the given text appears.
    Phase 1: Requires pytesseract + Pillow.
    Phase 2: Will use OpenCV for better accuracy.
    """
    deadline = time.monotonic() + timeout
    poll_interval = 1.0  # Check every second

    while time.monotonic() < deadline:
        if await _text_visible_on_screen(text):
            log.info(f"Text '{text}' detected on screen.")
            return
        await asyncio.sleep(poll_interval)

    raise TimeoutError(
        f"Timed out after {timeout}s waiting for text '{text}' to appear on screen."
    )


async def _text_visible_on_screen(text: str) -> bool:
    """
    Take a screenshot and OCR it to find the given text.
    Returns True if the text is found (case-insensitive).
    """
    try:
        import pytesseract
        from PIL import ImageGrab

        # Take screenshot in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        screenshot = await loop.run_in_executor(None, ImageGrab.grab)
        ocr_text = await loop.run_in_executor(
            None, lambda: pytesseract.image_to_string(screenshot)
        )

        return text.lower() in ocr_text.lower()

    except ImportError:
        log.warning(
            "pytesseract or Pillow not installed. "
            "Screen text detection requires: pip install pytesseract Pillow. "
            "Falling back to a 2s wait."
        )
        await asyncio.sleep(2.0)
        return True  # Assume ready so we don't loop forever

    except Exception as e:
        log.error(f"OCR error during wait: {e}")
        return False
