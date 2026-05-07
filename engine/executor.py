"""
FlowMate Engine — Automation Executor
Executes steps sequentially, pausing on failure and waiting for user action.
"""
import asyncio
import logging
import time
from datetime import datetime
from typing import Callable, Optional

from models import (
    Automation,
    AutomationRun,
    OnFailure,
    RunStatus,
    Step,
    StepRunResult,
    StepRunStatus,
    StepType,
)

log = logging.getLogger("flowmate.executor")

ProgressCallback = Callable[[AutomationRun], None]


# ─── Step Runner Registry ─────────────────────────────────────────────────────

async def _run_open_app(step: Step) -> None:
    from steps.open_app import run
    await run(step.config)

async def _run_open_url(step: Step) -> None:
    from steps.open_url import run
    await run(step.config)

async def _run_wait(step: Step) -> None:
    from steps.wait_step import run
    await run(step.config)

async def _run_type_text(step: Step) -> None:
    from steps.type_text import run
    await run(step.config)

async def _run_press_key(step: Step) -> None:
    from steps.press_key import run
    await run(step.config)

async def _run_move_window(step: Step) -> None:
    from steps.move_window import run
    await run(step.config)

async def _run_show_notification(step: Step) -> None:
    from steps.show_notification import run
    await run(step.config)

async def _run_click(step: Step) -> None:
    from steps.click import run
    await run(step.config)

async def _run_wait_for_window(step: Step) -> None:
    from steps.wait_for_window import run
    await run(step.config)

async def _run_scroll(step: Step) -> None:
    from steps.scroll import run
    await run(step.config)

async def _run_drag_drop(step: Step) -> None:
    from steps.drag_drop import run
    await run(step.config)

async def _run_hold_key(step: Step) -> None:
    from steps.hold_key import run
    await run(step.config)

async def _run_focus_window(step: Step) -> None:
    from steps.focus_window import run
    await run(step.config)

async def _run_minimize_window(step: Step) -> None:
    from steps.minimize_window import run
    await run(step.config)

async def _run_close_window(step: Step) -> None:
    from steps.close_window import run
    await run(step.config)

async def _run_kill_process(step: Step) -> None:
    from steps.kill_process import run
    await run(step.config)


STEP_RUNNERS: dict[StepType, Callable] = {
    StepType.OPEN_APP:          _run_open_app,
    StepType.OPEN_URL:          _run_open_url,
    StepType.WAIT:              _run_wait,
    StepType.TYPE_TEXT:         _run_type_text,
    StepType.PRESS_KEY:         _run_press_key,
    StepType.MOVE_WINDOW:       _run_move_window,
    StepType.SHOW_NOTIFICATION: _run_show_notification,
    StepType.CLICK_ELEMENT:     _run_click,
    StepType.WAIT_FOR_WINDOW:   _run_wait_for_window,
    StepType.SCROLL:            _run_scroll,
    StepType.DRAG_DROP:         _run_drag_drop,
    StepType.HOLD_KEY:          _run_hold_key,
    StepType.FOCUS_WINDOW:      _run_focus_window,
    StepType.MINIMIZE_WINDOW:   _run_minimize_window,
    StepType.CLOSE_WINDOW:      _run_close_window,
    StepType.KILL_PROCESS:      _run_kill_process,
}


# ─── Executor ─────────────────────────────────────────────────────────────────

class AutomationExecutor:
    """
    Executes one automation run step-by-step.

    On failure the executor pauses and exposes send_action() so the API layer
    can forward the user's choice (retry / skip / resume / stop) back in.
    """

    def __init__(
        self,
        automation: Automation,
        on_progress: Optional[ProgressCallback] = None,
        on_complete: Optional[ProgressCallback] = None,
    ) -> None:
        self._automation = automation
        self._on_progress = on_progress
        self._on_complete = on_complete
        self._cancelled = False

        # Pause/resume mechanism
        self._action_event: asyncio.Event = asyncio.Event()
        self._pending_action: Optional[str] = None

        self._run = AutomationRun(
            id=str(__import__("uuid").uuid4()),
            automationId=automation.id,
            automationName=automation.name,
            startedAt=datetime.utcnow().isoformat(),
        )
        # Internal dict so retry replaces the result rather than appending
        self._results: dict[str, StepRunResult] = {}

    @property
    def run_id(self) -> str:
        return self._run.id

    @property
    def is_paused(self) -> bool:
        return self._run.runStatus == RunStatus.PAUSED

    def cancel(self) -> None:
        self._cancelled = True
        # Unblock any waiting action
        self._pending_action = "stop"
        self._action_event.set()

    async def send_action(self, action: str) -> None:
        """Called by the HTTP handler when the user clicks Retry / Skip / etc."""
        log.info(f"User action '{action}' received for run {self._run.id}")
        self._pending_action = action
        self._action_event.set()

    # ── Main execution loop ───────────────────────────────────────────────────

    async def execute(self) -> AutomationRun:
        log.info(
            f"Starting '{self._automation.name}' "
            f"(run {self._run.id}, {len(self._automation.steps)} steps)"
        )

        steps = self._automation.steps
        i = 0

        while i < len(steps):
            if self._cancelled:
                break

            step = steps[i]
            self._run.currentStepIndex = i

            if not step.enabled:
                self._set_result(StepRunResult(
                    stepId=step.id, stepName=step.name,
                    status=StepRunStatus.SKIPPED, durationMs=0,
                ))
                self._emit_progress()
                i += 1
                continue

            # Execute the step (single attempt — user retries manually)
            result = await self._attempt_step(step)
            self._set_result(result)
            self._emit_progress()

            if result.status == StepRunStatus.FAILED:
                action = await self._handle_failure(step, result)

                if action == "retry":
                    # Remove previous result and run again (same i)
                    self._results.pop(step.id, None)
                    self._run.stepResults = list(self._results.values())
                    continue

                elif action in ("skip", "resume"):
                    # Replace failed result with skipped
                    self._set_result(StepRunResult(
                        stepId=step.id, stepName=step.name,
                        status=StepRunStatus.SKIPPED, durationMs=result.durationMs,
                    ))
                    self._emit_progress()

                elif action == "stop":
                    self._finalise(success=False, stopped=True)
                    if self._on_complete:
                        self._on_complete(self._run)
                    return self._run

            i += 1

        # ── Wrap up ───────────────────────────────────────────────────────────
        self._finalise(
            success=not self._cancelled and all(
                r.status in (StepRunStatus.SUCCESS, StepRunStatus.SKIPPED)
                for r in self._run.stepResults
            )
        )

        log.info(
            f"Run {self._run.id} finished. "
            f"Success={self._run.success}, Steps={len(self._run.stepResults)}"
        )

        if self._on_complete:
            self._on_complete(self._run)

        return self._run

    # ── Failure handling ──────────────────────────────────────────────────────

    async def _handle_failure(self, step: Step, result: StepRunResult) -> str:
        """
        Decides what to do after a step fails.
        - onFailure=PAUSE → ask the user
        - onFailure=SKIP  → auto-skip, no prompt
        - onFailure=NOTIFY → auto-skip after notification
        """
        on_failure = step.onFailure

        if on_failure == OnFailure.SKIP:
            log.info(f"Step '{step.name}' failed — auto-skipping (onFailure=skip)")
            return "skip"

        if on_failure == OnFailure.NOTIFY:
            log.info(f"Step '{step.name}' failed — notifying and skipping")
            try:
                from steps.show_notification import send_notification
                await send_notification(
                    f"Step failed: {step.name}",
                    result.error or "An error occurred",
                )
            except Exception:
                pass
            return "skip"

        # OnFailure.PAUSE — default
        log.warning(f"Step '{step.name}' failed — pausing for user input")
        self._run.runStatus = RunStatus.PAUSED
        self._run.failedStepId = step.id
        self._emit_progress()

        action = await self._wait_for_action()

        self._run.runStatus = RunStatus.RUNNING
        self._run.failedStepId = None
        return action

    async def _wait_for_action(self) -> str:
        """Block until the user sends an action via send_action(), checking for cancellation."""
        self._action_event.clear()

        while not self._cancelled:
            try:
                await asyncio.wait_for(
                    asyncio.shield(self._action_event.wait()),
                    timeout=0.5,
                )
                break
            except asyncio.TimeoutError:
                pass

        if self._cancelled:
            return "stop"

        self._action_event.clear()
        action = self._pending_action or "stop"
        self._pending_action = None
        return action

    # ── Step attempt ──────────────────────────────────────────────────────────

    async def _attempt_step(self, step: Step) -> StepRunResult:
        runner = STEP_RUNNERS.get(step.type)

        if runner is None:
            return StepRunResult(
                stepId=step.id, stepName=step.name,
                status=StepRunStatus.FAILED, durationMs=0,
                error=f"Step type '{step.type}' is not supported in this version.",
            )

        start_ms = time.monotonic_ns() // 1_000_000
        try:
            log.info(f"Executing step '{step.name}' ({step.type.value})")

            # Mark as running in UI before we start
            self._set_result(StepRunResult(
                stepId=step.id, stepName=step.name,
                status=StepRunStatus.RUNNING, durationMs=0,
            ))
            self._emit_progress()

            await runner(step)
            duration_ms = (time.monotonic_ns() // 1_000_000) - start_ms
            log.info(f"Step '{step.name}' succeeded in {duration_ms}ms")

            return StepRunResult(
                stepId=step.id, stepName=step.name,
                status=StepRunStatus.SUCCESS, durationMs=duration_ms,
            )

        except Exception as exc:
            duration_ms = (time.monotonic_ns() // 1_000_000) - start_ms
            error_msg = _format_error(exc)
            log.warning(f"Step '{step.name}' failed: {error_msg}")

            return StepRunResult(
                stepId=step.id, stepName=step.name,
                status=StepRunStatus.FAILED, durationMs=duration_ms,
                error=error_msg,
            )

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _set_result(self, result: StepRunResult) -> None:
        self._results[result.stepId] = result
        self._run.stepResults = list(self._results.values())

    def _emit_progress(self) -> None:
        if self._on_progress:
            try:
                self._on_progress(self._run)
            except Exception as e:
                log.error(f"Progress callback error: {e}")

    def _finalise(self, success: bool, stopped: bool = False) -> None:
        self._run.completedAt = datetime.utcnow().isoformat()
        self._run.success = success
        self._run.runStatus = RunStatus.STOPPED if stopped else RunStatus.COMPLETED
        self._run.failedStepId = None
        if not success and not stopped and not self._cancelled:
            self._run.error = "One or more steps failed."


# ─── Error formatting ─────────────────────────────────────────────────────────

def _format_error(exc: Exception) -> str:
    message = str(exc)
    if "FileNotFoundError" in type(exc).__name__ or "No such file" in message:
        return f"Could not find the file or application: {message}"
    if "PermissionError" in type(exc).__name__:
        return "Permission denied — try running FlowMate as administrator."
    if "TimeoutError" in type(exc).__name__ or "timed out" in message.lower():
        return "Timed out waiting for this step to complete."
    return message or type(exc).__name__
