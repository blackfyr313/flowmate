"""
FlowMate Engine — FastAPI Server
Listens on localhost:7823 (or FLOWMATE_PORT env var).
"""
import asyncio
import argparse
import logging
import os
from contextlib import asynccontextmanager
from typing import Optional

import uvicorn
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from database import FlowMateDB
from executor import AutomationExecutor
from models import (
    Automation,
    AutomationCreate,
    AutomationRun,
    AutomationUpdate,
    HealthResponse,
    RunActionRequest,
    RunStartResponse,
)

# ─── Logging ──────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("flowmate.api")

# ─── App State ────────────────────────────────────────────────────────────────

# Only one automation may run at a time (global input-device lock)
execution_lock: asyncio.Lock

# Active executors keyed by run_id
active_executors: dict[str, AutomationExecutor] = {}

# Which automation_id owns the lock (so we can reject duplicate starts)
locked_automation_id: Optional[str] = None

db: Optional[FlowMateDB] = None


# ─── Lifespan ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db, execution_lock
    execution_lock = asyncio.Lock()
    data_dir = os.environ.get("FLOWMATE_DATA_DIR")
    log.info(f"Starting FlowMate engine. Data directory: {data_dir or './data'}")
    db = FlowMateDB(data_dir=data_dir)
    log.info("Database initialized.")

    yield

    log.info("Shutting down — cancelling active runs...")
    for executor in list(active_executors.values()):
        executor.cancel()
    db.close()
    log.info("FlowMate engine stopped.")


# ─── FastAPI App ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="FlowMate Automation Engine",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "app://.", "file://"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db() -> FlowMateDB:
    if db is None:
        raise RuntimeError("Database not initialized")
    return db


# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse()


# ─── System ───────────────────────────────────────────────────────────────────

@app.get("/windows")
async def list_open_windows() -> list[dict]:
    """Return all visible windows with a non-empty title, deduplicated by process name."""
    try:
        import win32gui
        import win32process
        import psutil

        entries: list[dict] = []
        seen_pids: set[int] = set()

        def callback(hwnd: int, _) -> bool:
            if not win32gui.IsWindowVisible(hwnd):
                return True
            title = win32gui.GetWindowText(hwnd)
            if not title:
                return True
            try:
                _, pid = win32process.GetWindowThreadProcessId(hwnd)
                if pid in seen_pids:
                    return True
                seen_pids.add(pid)
                proc = psutil.Process(pid)
                entries.append({
                    "processName": proc.name(),
                    "windowTitle": title,
                    "pid": pid,
                })
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
            return True

        win32gui.EnumWindows(callback, None)
        return sorted(entries, key=lambda e: e["processName"].lower())

    except ImportError:
        return []


# ─── Automations ──────────────────────────────────────────────────────────────

@app.get("/automations", response_model=list[Automation])
async def list_automations() -> list[Automation]:
    return get_db().list_automations()


@app.get("/automations/{automation_id}", response_model=Automation)
async def get_automation(automation_id: str) -> Automation:
    automation = get_db().get_automation(automation_id)
    if not automation:
        raise HTTPException(status_code=404, detail=f"Automation '{automation_id}' not found.")
    return automation


@app.post("/automations", response_model=Automation, status_code=201)
async def create_automation(data: AutomationCreate) -> Automation:
    return get_db().create_automation(data)


@app.put("/automations/{automation_id}", response_model=Automation)
async def update_automation(automation_id: str, data: AutomationUpdate) -> Automation:
    updated = get_db().update_automation(automation_id, data)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Automation '{automation_id}' not found.")
    return updated


@app.delete("/automations/{automation_id}", status_code=204)
async def delete_automation(automation_id: str) -> None:
    deleted = get_db().delete_automation(automation_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Automation '{automation_id}' not found.")


# ─── Execution ────────────────────────────────────────────────────────────────

@app.post("/automations/{automation_id}/run", response_model=RunStartResponse)
async def run_automation(automation_id: str) -> RunStartResponse:
    global locked_automation_id

    automation = get_db().get_automation(automation_id)
    if not automation:
        raise HTTPException(status_code=404, detail="Automation not found.")

    if not automation.steps:
        raise HTTPException(status_code=400, detail="This automation has no steps to run.")

    if execution_lock.locked():
        running_name = locked_automation_id or "another automation"
        raise HTTPException(
            status_code=409,
            detail=f"'{running_name}' is already running. Stop it first.",
        )

    def on_progress(run: AutomationRun) -> None:
        get_db().save_run(run)
        get_db().update_automation_status(automation_id, "running")

    def on_complete(run: AutomationRun) -> None:
        get_db().save_run(run)
        get_db().update_automation_status(
            automation_id,
            "success" if run.success else "error",
            last_run_at=run.completedAt,
            last_run_success=run.success,
        )
        active_executors.pop(run.id, None)
        log.info(f"Automation '{automation.name}' completed. Success={run.success}")

    executor = AutomationExecutor(
        automation=automation,
        on_progress=on_progress,
        on_complete=on_complete,
    )
    active_executors[executor.run_id] = executor

    async def _run_with_lock() -> None:
        global locked_automation_id
        async with execution_lock:
            locked_automation_id = automation.name
            try:
                await executor.execute()
            finally:
                locked_automation_id = None
                active_executors.pop(executor.run_id, None)

    asyncio.create_task(_run_with_lock())
    get_db().update_automation_status(automation_id, "running")

    return RunStartResponse(runId=executor.run_id)


@app.post("/runs/{run_id}/action")
async def run_action(run_id: str, body: RunActionRequest) -> dict:
    """
    Forward a user decision (retry / skip / resume / stop) to the paused executor.
    """
    executor = active_executors.get(run_id)
    if not executor:
        raise HTTPException(status_code=404, detail="No active run found.")
    if not executor.is_paused and body.action != "stop":
        raise HTTPException(status_code=409, detail="Run is not paused.")

    await executor.send_action(body.action)
    return {"ok": True, "action": body.action}


@app.post("/automations/{automation_id}/stop", status_code=200)
async def stop_automation(automation_id: str) -> dict:
    # Find the active executor for this automation
    executor = next(
        (e for e in active_executors.values() if e._run.automationId == automation_id),
        None,
    )
    if not executor:
        raise HTTPException(status_code=404, detail="No active run for this automation.")

    executor.cancel()
    get_db().update_automation_status(automation_id, "idle")
    return {"message": "Automation stopped."}


@app.post("/automations/{automation_id}/steps/{step_id}/test")
async def test_step(automation_id: str, step_id: str) -> dict:
    automation = get_db().get_automation(automation_id)
    if not automation:
        raise HTTPException(status_code=404, detail="Automation not found.")

    step = next((s for s in automation.steps if s.id == step_id), None)
    if not step:
        raise HTTPException(status_code=404, detail="Step not found.")

    from executor import STEP_RUNNERS
    import time

    runner = STEP_RUNNERS.get(step.type)
    if not runner:
        return {"success": False, "error": f"Step type '{step.type}' is not supported.", "durationMs": 0}

    start = time.monotonic_ns()
    try:
        await runner(step)
        return {"success": True, "durationMs": (time.monotonic_ns() - start) // 1_000_000}
    except Exception as e:
        return {"success": False, "error": str(e), "durationMs": (time.monotonic_ns() - start) // 1_000_000}


# ─── Run History ──────────────────────────────────────────────────────────────

@app.get("/runs", response_model=list[AutomationRun])
async def list_runs(
    automation_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=500),
) -> list[AutomationRun]:
    return get_db().list_runs(automation_id=automation_id, limit=limit)


@app.get("/runs/{run_id}", response_model=AutomationRun)
async def get_run(run_id: str) -> AutomationRun:
    # Check active executors first for live state
    executor = active_executors.get(run_id)
    if executor:
        return executor._run

    run = get_db().get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found.")
    return run


# ─── Entry Point ──────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="FlowMate Automation Engine")
    parser.add_argument("--port", type=int, default=7823)
    parser.add_argument("--host", type=str, default="127.0.0.1")
    args = parser.parse_args()

    log.info(f"Starting FlowMate engine on {args.host}:{args.port}")

    uvicorn.run(
        "main:app",
        host=args.host,
        port=args.port,
        log_level="info",
        access_log=False,
        loop="asyncio",
    )


if __name__ == "__main__":
    main()
