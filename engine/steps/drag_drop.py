"""Click and drag from one screen position to another."""
import asyncio
import pyautogui

pyautogui.FAILSAFE = False


async def run(config: dict) -> None:
    x1 = int(config.get("x1", 0))
    y1 = int(config.get("y1", 0))
    x2 = int(config.get("x2", 100))
    y2 = int(config.get("y2", 100))
    duration = float(config.get("duration", 0.5))

    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _do_drag, x1, y1, x2, y2, duration)


def _do_drag(x1: int, y1: int, x2: int, y2: int, duration: float) -> None:
    pyautogui.moveTo(x1, y1, duration=0.2)
    pyautogui.dragTo(x2, y2, duration=duration, button="left")
