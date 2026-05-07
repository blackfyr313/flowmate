"""
FlowMate Step Registry
======================
Maps step type identifiers (matching the TypeScript StepType enum) to their
async runner modules. Each module must expose an `async def run(config)` function.

Phase 1 steps are fully implemented.
Phase 2 stubs raise NotImplementedError with a helpful message.
"""
from typing import Callable, Any, Coroutine

# Type alias for a step runner coroutine
StepRunner = Callable[[dict[str, Any]], Coroutine[Any, Any, None]]

# ── Phase 1: Implemented ──────────────────────────────────────────────────────

from .open_app          import run as _open_app
from .open_url          import run as _open_url
from .wait_step         import run as _wait
from .type_text         import run as _type_text
from .press_key         import run as _press_key
from .show_notification import run as _show_notification

# ── Phase 2: Stubs ────────────────────────────────────────────────────────────

async def _not_implemented(config: dict[str, Any]) -> None:
    step_type = config.get("__stepType", "unknown")
    raise NotImplementedError(
        f"The '{step_type}' step is a Phase 2 feature and is not yet available. "
        "It will be enabled in a future update."
    )


# ── Registry ─────────────────────────────────────────────────────────────────

STEP_RUNNERS: dict[str, StepRunner] = {
    # Phase 1 — fully functional
    "open_app":          _open_app,
    "open_url":          _open_url,
    "wait":              _wait,
    "type_text":         _type_text,
    "press_key":         _press_key,
    "show_notification": _show_notification,

    # Phase 2 — coming soon
    "click_element":     _not_implemented,
    "login":             _not_implemented,
    "move_window":       _not_implemented,
    "system_setting":    _not_implemented,
    "run_script":        _not_implemented,
    "condition":         _not_implemented,
    "loop":              _not_implemented,
}


def get_runner(step_type: str) -> StepRunner:
    """
    Look up the runner for a given step type.
    Raises KeyError if the step type is unknown.
    """
    if step_type not in STEP_RUNNERS:
        raise KeyError(
            f"Unknown step type: '{step_type}'. "
            f"Valid types: {sorted(STEP_RUNNERS.keys())}"
        )
    runner = STEP_RUNNERS[step_type]
    # Inject step type into config for error messages in stubs
    return runner


__all__ = ["STEP_RUNNERS", "get_runner"]
