"""Forcibly terminate a process by name."""
import asyncio

import psutil


async def run(config: dict) -> None:
    process_name = config.get("processName", "").strip()
    if not process_name:
        raise ValueError("processName is required")

    loop = asyncio.get_event_loop()
    killed = await loop.run_in_executor(None, _kill, process_name.lower())

    if not killed:
        raise RuntimeError(f"No running process found matching '{process_name}'")


def _kill(process_name: str) -> bool:
    killed = False
    for proc in psutil.process_iter(["pid", "name"]):
        try:
            if process_name in proc.info["name"].lower():
                proc.kill()
                killed = True
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            pass
    return killed
