"""Scroll the mouse wheel at a screen position."""
import asyncio
import pyautogui

pyautogui.FAILSAFE = False


async def run(config: dict) -> None:
    x = int(config.get("x", 0))
    y = int(config.get("y", 0))
    direction = config.get("direction", "down")
    amount = int(config.get("amount", 3))

    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _do_scroll, x, y, direction, amount)


def _do_scroll(x: int, y: int, direction: str, amount: int) -> None:
    pyautogui.moveTo(x, y, duration=0.2)
    clicks = amount if direction == "up" else -amount
    pyautogui.scroll(clicks, x=x, y=y)
