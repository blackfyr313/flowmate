"""
FlowMate Engine — Data Models
All models match the TypeScript types in src/types/index.ts exactly.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Literal, Optional, Union
from pydantic import BaseModel, Field
import uuid


# ─── Enums ───────────────────────────────────────────────────────────────────

class StepType(str, Enum):
    OPEN_APP          = "open_app"
    OPEN_URL          = "open_url"
    WAIT              = "wait"
    TYPE_TEXT         = "type_text"
    PRESS_KEY         = "press_key"
    MOVE_WINDOW       = "move_window"
    SHOW_NOTIFICATION = "show_notification"
    CLICK_ELEMENT     = "click_element"
    WAIT_FOR_WINDOW   = "wait_for_window"
    # Phase 2
    SCROLL            = "scroll"
    DRAG_DROP         = "drag_drop"
    HOLD_KEY          = "hold_key"
    FOCUS_WINDOW      = "focus_window"
    MINIMIZE_WINDOW   = "minimize_window"
    CLOSE_WINDOW      = "close_window"
    KILL_PROCESS      = "kill_process"
    # Phase 3+ — kept for DB compatibility
    LOGIN             = "login"
    SYSTEM_SETTING    = "system_setting"
    RUN_SCRIPT        = "run_script"
    CONDITION         = "condition"
    LOOP              = "loop"


class TriggerType(str, Enum):
    MANUAL    = "manual"
    STARTUP   = "startup"
    SCHEDULE  = "schedule"
    HOTKEY    = "hotkey"
    APP_LAUNCH = "app_launch"


class AutomationStatus(str, Enum):
    IDLE    = "idle"
    RUNNING = "running"
    PAUSED  = "paused"
    SUCCESS = "success"
    ERROR   = "error"


class StepRunStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED  = "failed"
    SKIPPED = "skipped"


class OnFailure(str, Enum):
    PAUSE  = "pause"   # Default: stop and wait for user input
    SKIP   = "skip"    # Auto-skip and continue
    NOTIFY = "notify"  # Notify and continue


# Map legacy "stop" value to "pause" for DB compatibility
LEGACY_ON_FAILURE_MAP = {"stop": "pause"}


# ─── Step Configs ─────────────────────────────────────────────────────────────

class OpenAppConfig(BaseModel):
    appPath: str
    arguments: list[str] = []
    waitForLoad: bool = True


class OpenUrlConfig(BaseModel):
    url: str
    browser: Literal["default", "chrome", "firefox", "edge"] = "default"
    waitForLoad: bool = True


class WaitConfig(BaseModel):
    seconds: float = 2.0  # Fixed-duration only in Phase 1


class TypeTextConfig(BaseModel):
    text: str
    intervalMs: int = 0
    pressEnter: bool = False


class PressKeyConfig(BaseModel):
    keys: list[str]
    repeatCount: int = 1
    delayMs: int = 0


class MoveWindowConfig(BaseModel):
    processName: str
    maximize: bool = True
    x: int = 0
    y: int = 0
    width: int = 1280
    height: int = 720


class ShowNotificationConfig(BaseModel):
    title: str
    message: str
    duration: int = 5


class ClickElementConfig(BaseModel):
    x: int = 0
    y: int = 0
    button: Literal["left", "right", "double"] = "left"


class WaitForWindowConfig(BaseModel):
    windowTitle: str
    processName: str = ""
    timeoutSeconds: int = 30


class ScrollConfig(BaseModel):
    x: int = 0
    y: int = 0
    direction: Literal["up", "down"] = "down"
    amount: int = 3


class DragDropConfig(BaseModel):
    x1: int = 0
    y1: int = 0
    x2: int = 100
    y2: int = 100
    duration: float = 0.5


class HoldKeyConfig(BaseModel):
    keys: list[str]
    duration: float = 1.0


class FocusWindowConfig(BaseModel):
    processName: str = ""
    windowTitle: str = ""


class MinimizeWindowConfig(BaseModel):
    processName: str = ""
    windowTitle: str = ""


class CloseWindowConfig(BaseModel):
    processName: str = ""
    windowTitle: str = ""


class KillProcessConfig(BaseModel):
    processName: str


class LoginConfig(BaseModel):
    credentialName: str


class SystemSettingConfig(BaseModel):
    setting: str
    value: Union[int, bool]


class RunScriptConfig(BaseModel):
    scriptType: Literal["python", "batch", "powershell"]
    inlineScript: Optional[str] = None


class ConditionConfig(BaseModel):
    conditionType: str
    target: str
    value: str


class LoopConfig(BaseModel):
    count: int
    targetStepId: str


StepConfig = Union[
    OpenAppConfig, OpenUrlConfig, WaitConfig, TypeTextConfig,
    PressKeyConfig, MoveWindowConfig, ShowNotificationConfig,
    ClickElementConfig, WaitForWindowConfig,
    ScrollConfig, DragDropConfig, HoldKeyConfig,
    FocusWindowConfig, MinimizeWindowConfig, CloseWindowConfig, KillProcessConfig,
    LoginConfig, SystemSettingConfig,
    RunScriptConfig, ConditionConfig, LoopConfig,
]


# ─── Step ─────────────────────────────────────────────────────────────────────

class Step(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: StepType
    name: str
    enabled: bool = True
    config: dict[str, Any]
    onFailure: OnFailure = OnFailure.PAUSE
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    def model_post_init(self, __context: Any) -> None:
        # Normalise legacy "stop" → "pause"
        if isinstance(self.onFailure, str) and self.onFailure == "stop":
            object.__setattr__(self, "onFailure", OnFailure.PAUSE)


# ─── Trigger ──────────────────────────────────────────────────────────────────

class TriggerConfig(BaseModel):
    type: TriggerType
    schedule: Optional[str] = None
    hotkey: Optional[str] = None
    appName: Optional[str] = None


# ─── Automation ───────────────────────────────────────────────────────────────

class Automation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = ""
    emoji: Optional[str] = "⚡"
    steps: list[Step] = []
    trigger: TriggerConfig
    enabled: bool = False
    status: AutomationStatus = AutomationStatus.IDLE
    lastRunAt: Optional[str] = None
    lastRunSuccess: Optional[bool] = None
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class AutomationCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    emoji: Optional[str] = "⚡"
    steps: list[Step] = []
    trigger: TriggerConfig
    enabled: bool = False


class AutomationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    emoji: Optional[str] = None
    steps: Optional[list[Step]] = None
    trigger: Optional[TriggerConfig] = None
    enabled: Optional[bool] = None


# ─── Run Results ──────────────────────────────────────────────────────────────

class StepRunResult(BaseModel):
    stepId: str
    stepName: str
    status: StepRunStatus
    durationMs: int
    error: Optional[str] = None
    retryCount: int = 0


class RunStatus(str, Enum):
    RUNNING   = "running"
    PAUSED    = "paused"
    COMPLETED = "completed"
    STOPPED   = "stopped"


class AutomationRun(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    automationId: str
    automationName: str
    startedAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    completedAt: Optional[str] = None
    success: bool = False
    stepResults: list[StepRunResult] = []
    error: Optional[str] = None
    # Live execution state
    runStatus: RunStatus = RunStatus.RUNNING
    currentStepIndex: int = 0
    failedStepId: Optional[str] = None


# ─── Action Request ───────────────────────────────────────────────────────────

class RunActionRequest(BaseModel):
    action: Literal["retry", "skip", "resume", "stop"]


# ─── API responses ────────────────────────────────────────────────────────────

class RunStartResponse(BaseModel):
    runId: str
    message: str = "Automation started"


class HealthResponse(BaseModel):
    ready: bool = True
    version: str = "1.0.0"
    platform: str = "Windows"
