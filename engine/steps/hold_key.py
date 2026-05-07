"""Hold one or more keys down for a set duration."""
import asyncio
import pyautogui


async def run(config: dict) -> None:
    keys = config.get("keys", [])
    duration = float(config.get("duration", 1.0))

    if not keys:
        return

    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _do_hold, keys, duration)


def _do_hold(keys: list[str], duration: float) -> None:
    import time
    key_list = [k.lower() for k in keys]

    for key in key_list:
        pyautogui.keyDown(key)

    time.sleep(duration)

    for key in reversed(key_list):
        pyautogui.keyUp(key)
