"""
FlowMate Engine — Database Layer (SQLite via aiosqlite)
Handles all persistence: automations, run history, settings.
"""
import json
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Optional
import uuid

from models import Automation, AutomationRun, AutomationCreate, AutomationUpdate


# ─── Database Setup ───────────────────────────────────────────────────────────

def get_db_path(data_dir: Optional[str] = None) -> Path:
    """Return path to the SQLite database file."""
    if data_dir:
        db_dir = Path(data_dir)
    else:
        # Default to ./data during development
        db_dir = Path(__file__).parent / "data"
    db_dir.mkdir(parents=True, exist_ok=True)
    return db_dir / "flowmate.db"


def create_connection(db_path: Path) -> sqlite3.Connection:
    """Create and configure a SQLite connection."""
    conn = sqlite3.connect(str(db_path), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")   # Better concurrent read performance
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS automations (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT DEFAULT '',
    emoji       TEXT DEFAULT '⚡',
    steps_json  TEXT NOT NULL DEFAULT '[]',
    trigger_json TEXT NOT NULL DEFAULT '{"type":"manual"}',
    enabled     INTEGER NOT NULL DEFAULT 0,
    status      TEXT NOT NULL DEFAULT 'idle',
    last_run_at TEXT,
    last_run_success INTEGER,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS runs (
    id              TEXT PRIMARY KEY,
    automation_id   TEXT NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
    automation_name TEXT NOT NULL,
    started_at      TEXT NOT NULL,
    completed_at    TEXT,
    success         INTEGER NOT NULL DEFAULT 0,
    step_results_json TEXT NOT NULL DEFAULT '[]',
    error           TEXT,
    FOREIGN KEY (automation_id) REFERENCES automations(id)
);

CREATE INDEX IF NOT EXISTS idx_runs_automation_id ON runs(automation_id);
CREATE INDEX IF NOT EXISTS idx_runs_started_at ON runs(started_at DESC);
"""


# ─── Database Class ───────────────────────────────────────────────────────────

class FlowMateDB:
    """Thread-safe SQLite database wrapper for FlowMate data."""

    def __init__(self, data_dir: Optional[str] = None) -> None:
        self._path = get_db_path(data_dir)
        self._conn = create_connection(self._path)
        self._init_schema()

    def _init_schema(self) -> None:
        """Create tables if they don't exist."""
        self._conn.executescript(SCHEMA_SQL)
        self._conn.commit()

    def close(self) -> None:
        self._conn.close()

    # ── Automations ───────────────────────────────────────────────────────────

    def list_automations(self) -> list[Automation]:
        rows = self._conn.execute(
            "SELECT * FROM automations ORDER BY created_at DESC"
        ).fetchall()
        return [self._row_to_automation(r) for r in rows]

    def get_automation(self, automation_id: str) -> Optional[Automation]:
        row = self._conn.execute(
            "SELECT * FROM automations WHERE id = ?", (automation_id,)
        ).fetchone()
        return self._row_to_automation(row) if row else None

    def create_automation(self, data: AutomationCreate) -> Automation:
        now = datetime.utcnow().isoformat()
        automation_id = str(uuid.uuid4())

        self._conn.execute(
            """INSERT INTO automations
               (id, name, description, emoji, steps_json, trigger_json,
                enabled, status, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, 'idle', ?, ?)""",
            (
                automation_id,
                data.name,
                data.description or "",
                data.emoji or "⚡",
                json.dumps([s.model_dump() for s in data.steps]),
                data.trigger.model_dump_json(),
                int(data.enabled),
                now,
                now,
            )
        )
        self._conn.commit()
        return self.get_automation(automation_id)  # type: ignore[return-value]

    def update_automation(self, automation_id: str, data: AutomationUpdate) -> Optional[Automation]:
        existing = self.get_automation(automation_id)
        if not existing:
            return None

        now = datetime.utcnow().isoformat()

        # Build SET clause dynamically — only update provided fields
        fields: dict[str, object] = {"updated_at": now}

        if data.name is not None:       fields["name"]         = data.name
        if data.description is not None: fields["description"]  = data.description
        if data.emoji is not None:      fields["emoji"]        = data.emoji
        if data.enabled is not None:    fields["enabled"]      = int(data.enabled)
        if data.trigger is not None:    fields["trigger_json"] = data.trigger.model_dump_json()
        if data.steps is not None:
            fields["steps_json"] = json.dumps([s.model_dump() for s in data.steps])

        set_clause = ", ".join(f"{k} = ?" for k in fields.keys())
        values = list(fields.values()) + [automation_id]

        self._conn.execute(
            f"UPDATE automations SET {set_clause} WHERE id = ?", values
        )
        self._conn.commit()
        return self.get_automation(automation_id)

    def update_automation_status(
        self,
        automation_id: str,
        status: str,
        last_run_at: Optional[str] = None,
        last_run_success: Optional[bool] = None,
    ) -> None:
        fields: dict[str, object] = {"status": status}
        if last_run_at is not None:      fields["last_run_at"]      = last_run_at
        if last_run_success is not None: fields["last_run_success"] = int(last_run_success)

        set_clause = ", ".join(f"{k} = ?" for k in fields.keys())
        self._conn.execute(
            f"UPDATE automations SET {set_clause} WHERE id = ?",
            list(fields.values()) + [automation_id]
        )
        self._conn.commit()

    def delete_automation(self, automation_id: str) -> bool:
        cursor = self._conn.execute(
            "DELETE FROM automations WHERE id = ?", (automation_id,)
        )
        self._conn.commit()
        return cursor.rowcount > 0

    # ── Run History ───────────────────────────────────────────────────────────

    def save_run(self, run: AutomationRun) -> None:
        self._conn.execute(
            """INSERT OR REPLACE INTO runs
               (id, automation_id, automation_name, started_at, completed_at,
                success, step_results_json, error)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                run.id,
                run.automationId,
                run.automationName,
                run.startedAt,
                run.completedAt,
                int(run.success),
                json.dumps([r.model_dump() for r in run.stepResults]),
                run.error,
            )
        )
        self._conn.commit()

    def list_runs(
        self, automation_id: Optional[str] = None, limit: int = 50
    ) -> list[AutomationRun]:
        if automation_id:
            rows = self._conn.execute(
                """SELECT * FROM runs WHERE automation_id = ?
                   ORDER BY started_at DESC LIMIT ?""",
                (automation_id, limit)
            ).fetchall()
        else:
            rows = self._conn.execute(
                "SELECT * FROM runs ORDER BY started_at DESC LIMIT ?",
                (limit,)
            ).fetchall()
        return [self._row_to_run(r) for r in rows]

    def get_run(self, run_id: str) -> Optional[AutomationRun]:
        row = self._conn.execute(
            "SELECT * FROM runs WHERE id = ?", (run_id,)
        ).fetchone()
        return self._row_to_run(row) if row else None

    # ── Private helpers ───────────────────────────────────────────────────────

    def _row_to_automation(self, row: sqlite3.Row) -> Automation:
        from models import Step, TriggerConfig
        d = dict(row)
        steps_raw = json.loads(d["steps_json"] or "[]")
        trigger_raw = json.loads(d["trigger_json"] or '{"type":"manual"}')
        return Automation(
            id=d["id"],
            name=d["name"],
            description=d.get("description", ""),
            emoji=d.get("emoji", "⚡"),
            steps=[Step(**s) for s in steps_raw],
            trigger=TriggerConfig(**trigger_raw),
            enabled=bool(d["enabled"]),
            status=d["status"],
            lastRunAt=d.get("last_run_at"),
            lastRunSuccess=None if d.get("last_run_success") is None
                          else bool(d["last_run_success"]),
            createdAt=d["created_at"],
            updatedAt=d["updated_at"],
        )

    def _row_to_run(self, row: sqlite3.Row) -> AutomationRun:
        from models import StepRunResult
        d = dict(row)
        results_raw = json.loads(d["step_results_json"] or "[]")
        return AutomationRun(
            id=d["id"],
            automationId=d["automation_id"],
            automationName=d["automation_name"],
            startedAt=d["started_at"],
            completedAt=d.get("completed_at"),
            success=bool(d["success"]),
            stepResults=[StepRunResult(**r) for r in results_raw],
            error=d.get("error"),
        )
