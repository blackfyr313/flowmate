"""
Step: Click at Position
Moves the mouse cursor to (x, y) on screen and clicks.
"""
import asyncio
import logging
from typing import Any

import pyautogui

log = logging.getLogger("flowmate.steps.click")

# Don't raise an exception when the mouse reaches a screen corner
pyautogui.FAILSAFE = False


async def run(config: dict[str, Any]) -> None:
    x: int = int(config.get("x", 0))
    y: int = int(config.get("y", 0))
    button: str = config.get("button", "left")

    log.info(f"Clicking ({x}, {y}) button={button}")

    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _do_click, x, y, button)


def _do_click(x: int, y: int, button: str) -> None:
    pyautogui.moveTo(x, y, duration=0.25)
    if button == "double":
        pyautogui.doubleClick(x, y)
    else:
        pyautogui.click(x, y, button=button)
