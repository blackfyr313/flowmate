"""
Step: Press Key
Presses one or more keys (including keyboard shortcuts) using pyautogui.
Supports key combos like 'ctrl+c', 'alt+F4', and single keys like 'enter'.
Can repeat the key press N times with an optional delay between repeats.
"""
import asyncio
import logging
from typing import Any

log = logging.getLogger("flowmate.steps.press_key")

# Map of friendly key names → pyautogui key strings
KEY_ALIASES: dict[str, str] = {
    "enter":      "enter",
    "return":     "enter",
    "tab":        "tab",
    "space":      "space",
    "backspace":  "backspace",
    "delete":     "delete",
    "del":        "delete",
    "escape":     "escape",
    "esc":        "escape",
    "up":         "up",
    "down":       "down",
    "left":       "left",
    "right":      "right",
    "home":       "home",
    "end":        "end",
    "pageup":     "pageup",
    "pagedown":   "pagedown",
    "f1":  "f1",  "f2":  "f2",  "f3":  "f3",  "f4":  "f4",
    "f5":  "f5",  "f6":  "f6",  "f7":  "f7",  "f8":  "f8",
    "f9":  "f9",  "f10": "f10", "f11": "f11", "f12": "f12",
    "ctrl":  "ctrl", "control": "ctrl",
    "alt":   "alt",
    "shift": "shift",
    "win":   "win", "windows": "win", "super": "win",
    "cmd":   "win",
}


async def run(config: dict[str, Any]) -> None:
    """
    Press a key or key combination.

    Args:
        config: PressKeyConfig dict with keys:
            - keys (str): Key combo string, e.g. 'ctrl+c', 'alt+F4', 'enter'
            - repeat (int): Number of times to press (default: 1)
            - delayMs (int): Milliseconds between repeats (default: 100)
    """
    keys_raw: str = config.get("keys", "").strip()
    repeat: int = max(1, int(config.get("repeat", 1)))
    delay_ms: int = max(0, int(config.get("delayMs", 100)))

    if not keys_raw:
        raise ValueError("No keys specified. Please enter a key or key combination.")

    parsed_keys = _parse_keys(keys_raw)
    if not parsed_keys:
        raise ValueError(f"Could not parse key combo: '{keys_raw}'")

    log.info(
        f"Pressing keys: {parsed_keys!r} × {repeat} "
        f"(delay={delay_ms}ms between repeats)"
    )

    try:
        import pyautogui
    except ImportError:
        raise RuntimeError(
            "pyautogui is not installed. Run: pip install pyautogui"
        )

    loop = asyncio.get_event_loop()
    delay_sec = delay_ms / 1000.0

    for i in range(repeat):
        await loop.run_in_executor(None, lambda: _press_keys_sync(pyautogui, parsed_keys))

        if repeat > 1 and i < repeat - 1 and delay_sec > 0:
            await asyncio.sleep(delay_sec)

    log.info("Key press complete.")


def _parse_keys(keys_raw: str) -> list[str]:
    """
    Parse a key combo string into a list of pyautogui key names.

    Examples:
        'ctrl+c'    → ['ctrl', 'c']
        'alt+F4'    → ['alt', 'f4']
        'enter'     → ['enter']
        'Ctrl+Shift+Esc' → ['ctrl', 'shift', 'escape']
    """
    parts = [p.strip().lower() for p in keys_raw.split("+") if p.strip()]
    resolved = []

    for part in parts:
        # Check alias map first
        if part in KEY_ALIASES:
            resolved.append(KEY_ALIASES[part])
        elif len(part) == 1:
            # Single character (letter, digit, symbol)
            resolved.append(part)
        else:
            # Pass through as-is — pyautogui may support it
            resolved.append(part)

    return resolved


def _press_keys_sync(pyautogui: Any, keys: list[str]) -> None:
    """Synchronous key press — called from a thread executor."""
    if len(keys) == 1:
        pyautogui.press(keys[0])
    else:
        pyautogui.hotkey(*keys)
