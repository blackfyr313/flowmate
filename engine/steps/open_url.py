"""
Step: Open URL
Opens a URL in the user's default browser or a specified browser.
Optionally waits until the page has loaded.
"""
import asyncio
import logging
import subprocess
import webbrowser
from typing import Any

log = logging.getLogger("flowmate.steps.open_url")

# Browser executable names on Windows
BROWSER_PATHS = {
    "chrome":  ["chrome", "google-chrome", r"C:\Program Files\Google\Chrome\Application\chrome.exe"],
    "firefox": ["firefox", r"C:\Program Files\Mozilla Firefox\firefox.exe"],
    "edge":    ["msedge", r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"],
}


async def run(config: dict[str, Any]) -> None:
    """
    Open a URL in a browser.

    Args:
        config: OpenUrlConfig dict with keys:
            - url (str): The URL to open
            - browser (str): 'default' | 'chrome' | 'firefox' | 'edge'
            - waitForLoad (bool): Wait after opening (basic time-based delay)
    """
    url: str = config.get("url", "").strip()
    browser: str = config.get("browser", "default")
    wait_for_load: bool = config.get("waitForLoad", True)

    if not url:
        raise ValueError("No URL provided. Please enter a URL to open.")

    # Ensure URL has a scheme
    if not url.startswith(("http://", "https://", "file://")):
        url = "https://" + url
        log.info(f"Auto-prefixed URL with https://: {url}")

    log.info(f"Opening URL: {url} in {browser}")

    if browser == "default":
        # Use Python's webbrowser module for the default browser
        # Run in executor to avoid blocking the event loop
        await asyncio.get_event_loop().run_in_executor(
            None, lambda: webbrowser.open(url)
        )
    else:
        # Launch a specific browser
        opened = await _open_in_browser(url, browser)
        if not opened:
            log.warning(
                f"Could not launch {browser} directly. Falling back to default browser."
            )
            await asyncio.get_event_loop().run_in_executor(
                None, lambda: webbrowser.open(url)
            )

    if wait_for_load:
        # Basic wait — Phase 2 will use OCR to detect actual page load
        log.info("Waiting 2s for page to load...")
        await asyncio.sleep(2.0)


async def _open_in_browser(url: str, browser_name: str) -> bool:
    """Try to launch a specific browser. Returns True if successful."""
    executables = BROWSER_PATHS.get(browser_name, [])

    for exe in executables:
        try:
            subprocess.Popen([exe, url], creationflags=subprocess.DETACHED_PROCESS
                             if hasattr(subprocess, "DETACHED_PROCESS") else 0)
            log.info(f"Launched {browser_name} with: {exe}")
            return True
        except (FileNotFoundError, OSError):
            continue  # Try the next executable path

    return False
