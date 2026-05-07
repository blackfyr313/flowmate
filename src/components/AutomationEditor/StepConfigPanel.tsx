import { useState } from 'react'
import { X, Info, Crosshair } from 'lucide-react'
import type {
  Step, OpenAppConfig, OpenUrlConfig, WaitConfig,
  TypeTextConfig, PressKeyConfig, ShowNotificationConfig, MoveWindowConfig,
  ClickElementConfig, WaitForWindowConfig,
  ScrollConfig, DragDropConfig, HoldKeyConfig,
  FocusWindowConfig, MinimizeWindowConfig, CloseWindowConfig, KillProcessConfig,
} from '@/types'
import { STEP_TYPE_META } from '@/types'
import { ProcessPicker } from './ProcessPicker'

interface StepConfigPanelProps {
  step: Step
  onUpdate: (patch: Partial<Step>) => void
  onClose: () => void
}

export function StepConfigPanel({ step, onUpdate, onClose }: StepConfigPanelProps) {
  const meta = STEP_TYPE_META[step.type]

  const updateConfig = (configPatch: Record<string, unknown>) => {
    onUpdate({ config: { ...step.config, ...configPatch } as Step['config'] })
  }

  return (
    <aside className="w-80 bg-surface-raised border-l border-surface-border flex flex-col
                      overflow-hidden animate-slide-in-right shrink-0">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-surface-border shrink-0">
        <span className="text-xl">{meta.icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text-primary text-sm truncate">{meta.label}</h3>
          <p className="text-xs text-text-muted truncate">{meta.description}</p>
        </div>
        <button onClick={onClose} className="btn-ghost p-1 shrink-0">
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="label">Step Label</label>
          <input
            className="input"
            value={step.name}
            onChange={e => onUpdate({ name: e.target.value })}
            placeholder="Step name"
          />
        </div>

        {meta.phase >= 3 ? (
          <div className="flex items-start gap-2 p-3 bg-accent-warning/10 rounded-xl border
                          border-accent-warning/20 text-xs text-accent-warning">
            <Info size={13} className="shrink-0 mt-0.5" />
            <span>This step type is coming in Phase {meta.phase}. Stay tuned!</span>
          </div>
        ) : (
          <ConfigSection step={step} onConfigUpdate={updateConfig} />
        )}

        <div className="pt-2 border-t border-surface-border">
          <label className="label">On Failure</label>
          <select
            className="input"
            value={step.onFailure === 'stop' ? 'pause' : step.onFailure}
            onChange={e => onUpdate({ onFailure: e.target.value as Step['onFailure'] })}
          >
            <option value="pause">Pause and ask me what to do</option>
            <option value="skip">Skip this step and continue</option>
            <option value="notify">Notify me and continue</option>
          </select>
        </div>
      </div>
    </aside>
  )
}

// ─── Config Section ───────────────────────────────────────────────────────────

interface ConfigSectionProps {
  step: Step
  onConfigUpdate: (patch: Record<string, unknown>) => void
}

function ConfigSection({ step, onConfigUpdate }: ConfigSectionProps) {
  switch (step.type) {
    case 'open_app':
      return <OpenAppFields config={step.config as OpenAppConfig} onChange={onConfigUpdate} />
    case 'open_url':
      return <OpenUrlFields config={step.config as OpenUrlConfig} onChange={onConfigUpdate} />
    case 'wait':
      return <WaitFields config={step.config as WaitConfig} onChange={onConfigUpdate} />
    case 'type_text':
      return <TypeTextFields config={step.config as TypeTextConfig} onChange={onConfigUpdate} />
    case 'press_key':
      return <PressKeyFields config={step.config as PressKeyConfig} onChange={onConfigUpdate} />
    case 'move_window':
      return <MoveWindowFields config={step.config as MoveWindowConfig} onChange={onConfigUpdate} />
    case 'click_element':
      return <ClickFields config={step.config as ClickElementConfig} onChange={onConfigUpdate} />
    case 'wait_for_window':
      return <WaitForWindowFields config={step.config as WaitForWindowConfig} onChange={onConfigUpdate} />
    case 'scroll':
      return <ScrollFields config={step.config as ScrollConfig} onChange={onConfigUpdate} />
    case 'drag_drop':
      return <DragDropFields config={step.config as DragDropConfig} onChange={onConfigUpdate} />
    case 'hold_key':
      return <HoldKeyFields config={step.config as HoldKeyConfig} onChange={onConfigUpdate} />
    case 'focus_window':
      return <WindowActionFields config={step.config as FocusWindowConfig} onChange={onConfigUpdate} label="Focus" />
    case 'minimize_window':
      return <WindowActionFields config={step.config as MinimizeWindowConfig} onChange={onConfigUpdate} label="Minimize" />
    case 'close_window':
      return <WindowActionFields config={step.config as CloseWindowConfig} onChange={onConfigUpdate} label="Close" />
    case 'kill_process':
      return <KillProcessFields config={step.config as KillProcessConfig} onChange={onConfigUpdate} />
    case 'show_notification':
      return <NotifFields config={step.config as ShowNotificationConfig} onChange={onConfigUpdate} />
    default:
      return null
  }
}

// ─── Per-step config forms ────────────────────────────────────────────────────

function OpenAppFields({ config, onChange }: { config: OpenAppConfig; onChange: (p: Record<string, unknown>) => void }) {
  return (
    <>
      <div>
        <label className="label">Application Path</label>
        <input
          className="input font-mono text-xs"
          value={config.appPath}
          onChange={e => onChange({ appPath: e.target.value })}
          placeholder="e.g. C:\Program Files\App\app.exe  or  notepad"
        />
        <p className="text-xs text-text-muted mt-1.5">
          Full path to the .exe, or just the app name if it's on your PATH.
        </p>
      </div>
      <div>
        <label className="label">Launch Arguments (optional)</label>
        <input
          className="input font-mono text-xs"
          value={(config.arguments ?? []).join(' ')}
          onChange={e => onChange({ arguments: e.target.value.split(' ').filter(Boolean) })}
          placeholder="--arg1 --arg2"
        />
      </div>
      <CheckboxField
        label="Wait for app to load"
        checked={config.waitForLoad ?? true}
        onChange={v => onChange({ waitForLoad: v })}
        hint="Pause execution until the app window is visible."
      />
    </>
  )
}

function OpenUrlFields({ config, onChange }: { config: OpenUrlConfig; onChange: (p: Record<string, unknown>) => void }) {
  return (
    <>
      <div>
        <label className="label">URL</label>
        <input
          className="input font-mono text-xs"
          value={config.url}
          onChange={e => onChange({ url: e.target.value })}
          placeholder="https://example.com"
        />
      </div>
      <div>
        <label className="label">Browser</label>
        <select
          className="input"
          value={config.browser ?? 'default'}
          onChange={e => onChange({ browser: e.target.value })}
        >
          <option value="default">Default browser</option>
          <option value="chrome">Google Chrome</option>
          <option value="firefox">Mozilla Firefox</option>
          <option value="edge">Microsoft Edge</option>
        </select>
      </div>
      <CheckboxField
        label="Wait for page to load"
        checked={config.waitForLoad ?? true}
        onChange={v => onChange({ waitForLoad: v })}
        hint="Wait until the browser tab finishes loading."
      />
    </>
  )
}

function WaitFields({ config, onChange }: { config: WaitConfig; onChange: (p: Record<string, unknown>) => void }) {
  return (
    <div>
      <label className="label">Duration (seconds)</label>
      <input
        className="input"
        type="number"
        min={0.1}
        step={0.5}
        value={config.seconds ?? 2}
        onChange={e => onChange({ seconds: parseFloat(e.target.value) || 1 })}
      />
      <p className="text-xs text-text-muted mt-1.5">
        How long to pause before the next step.
      </p>
    </div>
  )
}

function TypeTextFields({ config, onChange }: { config: TypeTextConfig; onChange: (p: Record<string, unknown>) => void }) {
  return (
    <>
      <div>
        <label className="label">Text to Type</label>
        <textarea
          className="input resize-none"
          rows={4}
          value={config.text}
          onChange={e => onChange({ text: e.target.value })}
          placeholder="Enter the text to type..."
        />
      </div>
      <div>
        <label className="label">Typing Speed (ms between chars)</label>
        <input
          className="input"
          type="number"
          min={0}
          max={500}
          value={config.intervalMs ?? 0}
          onChange={e => onChange({ intervalMs: parseInt(e.target.value) || 0 })}
        />
        <p className="text-xs text-text-muted mt-1.5">
          0 = instant. Use 30–100ms to simulate human typing speed.
        </p>
      </div>
      <CheckboxField
        label="Press Enter after typing"
        checked={config.pressEnter ?? false}
        onChange={v => onChange({ pressEnter: v })}
      />
    </>
  )
}

function PressKeyFields({ config, onChange }: { config: PressKeyConfig; onChange: (p: Record<string, unknown>) => void }) {
  return (
    <>
      <div>
        <label className="label">Keys / Shortcut</label>
        <input
          className="input font-mono"
          value={(config.keys ?? []).join('+')}
          onChange={e => onChange({ keys: e.target.value.split('+').map(k => k.trim()).filter(Boolean) })}
          placeholder="e.g. ctrl+c  or  alt+tab  or  enter"
        />
        <p className="text-xs text-text-muted mt-1.5">
          Separate keys with <code className="font-mono">+</code>.
          Supported: ctrl, alt, shift, win, tab, enter, esc, f1–f12, and letter keys.
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {['ctrl+c', 'ctrl+v', 'alt+tab', 'win+d', 'ctrl+shift+t'].map(preset => (
          <button
            key={preset}
            onClick={() => onChange({ keys: preset.split('+') })}
            className="text-xs font-mono px-2 py-1 rounded-md bg-surface-overlay
                       text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors"
          >
            {preset}
          </button>
        ))}
      </div>
      <div>
        <label className="label">Repeat</label>
        <input
          className="input"
          type="number"
          min={1}
          max={100}
          value={config.repeatCount ?? 1}
          onChange={e => onChange({ repeatCount: parseInt(e.target.value) || 1 })}
        />
      </div>
    </>
  )
}

function MoveWindowFields({ config, onChange }: { config: MoveWindowConfig; onChange: (p: Record<string, unknown>) => void }) {
  const isMaximize = config.maximize ?? false

  return (
    <>
      <ProcessPicker
        label="Application"
        value={config.processName}
        onChange={processName => onChange({ processName })}
        placeholder="— Select an open app —"
      />

      <CheckboxField
        label="Maximize window (full screen)"
        checked={isMaximize}
        onChange={v => onChange({ maximize: v })}
        hint="Fills the entire screen. When checked, position and size fields are ignored."
      />

      {!isMaximize && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">X (left)</label>
              <input
                className="input"
                type="number"
                value={config.x ?? 0}
                onChange={e => onChange({ x: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="label">Y (top)</label>
              <input
                className="input"
                type="number"
                value={config.y ?? 0}
                onChange={e => onChange({ y: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="label">Width</label>
              <input
                className="input"
                type="number"
                min={100}
                value={config.width ?? 1280}
                onChange={e => onChange({ width: parseInt(e.target.value) || 1280 })}
              />
            </div>
            <div>
              <label className="label">Height</label>
              <input
                className="input"
                type="number"
                min={100}
                value={config.height ?? 720}
                onChange={e => onChange({ height: parseInt(e.target.value) || 720 })}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: 'Full HD', w: 1920, h: 1080 },
              { label: 'Half screen', w: 960, h: 1080 },
              { label: 'Quarter', w: 960, h: 540 },
            ].map(preset => (
              <button
                key={preset.label}
                onClick={() => onChange({ width: preset.w, height: preset.h })}
                className="text-xs px-2 py-1 rounded-md bg-surface-overlay
                           text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors"
              >
                {preset.label} ({preset.w}×{preset.h})
              </button>
            ))}
          </div>
        </>
      )}
    </>
  )
}

function WaitForWindowFields({ config, onChange }: { config: WaitForWindowConfig; onChange: (p: Record<string, unknown>) => void }) {
  return (
    <>
      <ProcessPicker
        label="Wait for this app's window"
        value={config.processName ?? ''}
        onChange={(processName, windowTitle) => onChange({ processName, windowTitle })}
        placeholder="— Select an open app —"
      />
      <p className="text-xs text-text-muted -mt-2">
        Open the app first, select it here, then close it — FlowMate will wait for its window to reappear.
      </p>

      <div>
        <label className="label">Window Title (contains)</label>
        <input
          className="input"
          value={config.windowTitle ?? ''}
          onChange={e => onChange({ windowTitle: e.target.value })}
          placeholder="Auto-filled from picker, or type manually"
        />
        <p className="text-xs text-text-muted mt-1.5">
          Matches any visible window whose title contains this text (case-insensitive).
        </p>
      </div>

      <div>
        <label className="label">Timeout (seconds)</label>
        <input
          className="input"
          type="number"
          min={5}
          max={300}
          value={config.timeoutSeconds ?? 30}
          onChange={e => onChange({ timeoutSeconds: parseInt(e.target.value) || 30 })}
        />
        <p className="text-xs text-text-muted mt-1.5">
          If the window doesn't appear within this time, the step fails.
          Use a longer timeout on slow connections or large apps.
        </p>
      </div>
    </>
  )
}

function ClickFields({ config, onChange }: { config: ClickElementConfig; onChange: (p: Record<string, unknown>) => void }) {
  const [picking, setPicking] = useState(false)

  async function handlePick() {
    setPicking(true)
    try {
      const point = await window.flowmate.cursor.pick()
      onChange({ x: point.x, y: point.y })
    } finally {
      setPicking(false)
    }
  }

  return (
    <>
      <div className="flex items-end gap-2">
        <div className="flex-1 grid grid-cols-2 gap-3">
          <div>
            <label className="label">X (pixels from left)</label>
            <input
              className="input"
              type="number"
              value={config.x ?? 0}
              onChange={e => onChange({ x: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="label">Y (pixels from top)</label>
            <input
              className="input"
              type="number"
              value={config.y ?? 0}
              onChange={e => onChange({ y: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>
      </div>

      <button
        onClick={handlePick}
        disabled={picking}
        className="flex items-center gap-2 w-full justify-center px-3 py-2 rounded-xl
                   border border-dashed border-surface-muted text-sm text-text-secondary
                   hover:border-accent-primary hover:text-accent-primary transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Crosshair size={14} />
        {picking ? 'Move your cursor to the target… (3s)' : 'Pick coordinates from screen'}
      </button>
      <p className="text-xs text-text-muted -mt-2">
        FlowMate minimizes for 3 seconds — move your cursor to the target spot and hold it there.
      </p>

      <div>
        <label className="label">Click Type</label>
        <select
          className="input"
          value={config.button ?? 'left'}
          onChange={e => onChange({ button: e.target.value })}
        >
          <option value="left">Left click</option>
          <option value="right">Right click</option>
          <option value="double">Double click</option>
        </select>
      </div>
    </>
  )
}

function NotifFields({ config, onChange }: { config: ShowNotificationConfig; onChange: (p: Record<string, unknown>) => void }) {
  return (
    <>
      <div>
        <label className="label">Notification Title</label>
        <input
          className="input"
          value={config.title}
          onChange={e => onChange({ title: e.target.value })}
          placeholder="e.g. Automation Complete"
        />
      </div>
      <div>
        <label className="label">Message</label>
        <textarea
          className="input resize-none"
          rows={3}
          value={config.message}
          onChange={e => onChange({ message: e.target.value })}
          placeholder="e.g. Your morning setup is ready!"
        />
      </div>
      <div>
        <label className="label">Duration (seconds)</label>
        <input
          className="input"
          type="number"
          min={1}
          max={30}
          value={config.duration ?? 5}
          onChange={e => onChange({ duration: parseInt(e.target.value) || 5 })}
        />
      </div>
    </>
  )
}

// ─── Phase 2 config forms ─────────────────────────────────────────────────────

function ScrollFields({ config, onChange }: { config: ScrollConfig; onChange: (p: Record<string, unknown>) => void }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">X (pixels from left)</label>
          <input className="input" type="number" value={config.x ?? 0}
            onChange={e => onChange({ x: parseInt(e.target.value) || 0 })} />
        </div>
        <div>
          <label className="label">Y (pixels from top)</label>
          <input className="input" type="number" value={config.y ?? 0}
            onChange={e => onChange({ y: parseInt(e.target.value) || 0 })} />
        </div>
      </div>
      <div>
        <label className="label">Direction</label>
        <select className="input" value={config.direction ?? 'down'}
          onChange={e => onChange({ direction: e.target.value })}>
          <option value="down">Scroll Down</option>
          <option value="up">Scroll Up</option>
        </select>
      </div>
      <div>
        <label className="label">Amount (scroll steps)</label>
        <input className="input" type="number" min={1} max={20} value={config.amount ?? 3}
          onChange={e => onChange({ amount: parseInt(e.target.value) || 3 })} />
        <p className="text-xs text-text-muted mt-1.5">Each step is roughly one notch of the scroll wheel.</p>
      </div>
    </>
  )
}

function DragDropFields({ config, onChange }: { config: DragDropConfig; onChange: (p: Record<string, unknown>) => void }) {
  const [pickingFrom, setPickingFrom] = useState(false)
  const [pickingTo, setPickingTo] = useState(false)

  async function handlePickFrom() {
    setPickingFrom(true)
    try {
      const p = await window.flowmate.cursor.pick()
      onChange({ x1: p.x, y1: p.y })
    } finally { setPickingFrom(false) }
  }

  async function handlePickTo() {
    setPickingTo(true)
    try {
      const p = await window.flowmate.cursor.pick()
      onChange({ x2: p.x, y2: p.y })
    } finally { setPickingTo(false) }
  }

  return (
    <>
      <div>
        <label className="label">From (start position)</label>
        <div className="grid grid-cols-2 gap-2 mb-1.5">
          <input className="input" type="number" placeholder="X1" value={config.x1 ?? 0}
            onChange={e => onChange({ x1: parseInt(e.target.value) || 0 })} />
          <input className="input" type="number" placeholder="Y1" value={config.y1 ?? 0}
            onChange={e => onChange({ y1: parseInt(e.target.value) || 0 })} />
        </div>
        <button onClick={handlePickFrom} disabled={pickingFrom}
          className="flex items-center gap-2 w-full justify-center px-3 py-2 rounded-xl
                     border border-dashed border-surface-muted text-xs text-text-secondary
                     hover:border-accent-primary hover:text-accent-primary transition-colors disabled:opacity-50">
          <Crosshair size={12} />
          {pickingFrom ? 'Hold cursor at start… (3s)' : 'Pick start position'}
        </button>
      </div>
      <div>
        <label className="label">To (end position)</label>
        <div className="grid grid-cols-2 gap-2 mb-1.5">
          <input className="input" type="number" placeholder="X2" value={config.x2 ?? 100}
            onChange={e => onChange({ x2: parseInt(e.target.value) || 0 })} />
          <input className="input" type="number" placeholder="Y2" value={config.y2 ?? 100}
            onChange={e => onChange({ y2: parseInt(e.target.value) || 0 })} />
        </div>
        <button onClick={handlePickTo} disabled={pickingTo}
          className="flex items-center gap-2 w-full justify-center px-3 py-2 rounded-xl
                     border border-dashed border-surface-muted text-xs text-text-secondary
                     hover:border-accent-primary hover:text-accent-primary transition-colors disabled:opacity-50">
          <Crosshair size={12} />
          {pickingTo ? 'Hold cursor at end… (3s)' : 'Pick end position'}
        </button>
      </div>
      <div>
        <label className="label">Drag Duration (seconds)</label>
        <input className="input" type="number" min={0.1} max={5} step={0.1} value={config.duration ?? 0.5}
          onChange={e => onChange({ duration: parseFloat(e.target.value) || 0.5 })} />
        <p className="text-xs text-text-muted mt-1.5">Longer duration = slower, smoother drag.</p>
      </div>
    </>
  )
}

function HoldKeyFields({ config, onChange }: { config: HoldKeyConfig; onChange: (p: Record<string, unknown>) => void }) {
  return (
    <>
      <div>
        <label className="label">Keys to Hold</label>
        <input
          className="input font-mono"
          value={(config.keys ?? []).join('+')}
          onChange={e => onChange({ keys: e.target.value.split('+').map(k => k.trim()).filter(Boolean) })}
          placeholder="e.g. shift  or  ctrl+shift"
        />
        <p className="text-xs text-text-muted mt-1.5">Separate multiple keys with <code className="font-mono">+</code>.</p>
      </div>
      <div>
        <label className="label">Hold Duration (seconds)</label>
        <input className="input" type="number" min={0.1} max={30} step={0.1} value={config.duration ?? 1.0}
          onChange={e => onChange({ duration: parseFloat(e.target.value) || 1.0 })} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {['shift', 'ctrl', 'alt', 'win', 'ctrl+shift'].map(preset => (
          <button key={preset} onClick={() => onChange({ keys: preset.split('+') })}
            className="text-xs font-mono px-2 py-1 rounded-md bg-surface-overlay
                       text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors">
            {preset}
          </button>
        ))}
      </div>
    </>
  )
}

function WindowActionFields({
  config, onChange, label,
}: { config: FocusWindowConfig | MinimizeWindowConfig | CloseWindowConfig; onChange: (p: Record<string, unknown>) => void; label: string }) {
  return (
    <>
      <ProcessPicker
        label={`${label} this app's window`}
        value={config.processName ?? ''}
        onChange={(processName, windowTitle) => onChange({ processName, windowTitle })}
        placeholder="— Select an open app —"
      />
      <div>
        <label className="label">Window Title (optional filter)</label>
        <input
          className="input"
          value={config.windowTitle ?? ''}
          onChange={e => onChange({ windowTitle: e.target.value })}
          placeholder="Auto-filled from picker, or type to filter"
        />
        <p className="text-xs text-text-muted mt-1.5">
          Leave blank to match any window for the selected process.
        </p>
      </div>
    </>
  )
}

function KillProcessFields({ config, onChange }: { config: KillProcessConfig; onChange: (p: Record<string, unknown>) => void }) {
  return (
    <>
      <ProcessPicker
        label="Process to kill"
        value={config.processName}
        onChange={processName => onChange({ processName })}
        placeholder="— Select a running process —"
      />
      <div>
        <label className="label">Process Name (manual)</label>
        <input
          className="input font-mono text-xs"
          value={config.processName}
          onChange={e => onChange({ processName: e.target.value })}
          placeholder="e.g. notepad.exe"
        />
        <p className="text-xs text-text-muted mt-1.5 text-accent-danger">
          ⚠ This forcibly terminates the process without saving.
        </p>
      </div>
    </>
  )
}

// ─── Checkbox helper ──────────────────────────────────────────────────────────

function CheckboxField({
  label, checked, onChange, hint,
}: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <div>
      <label className="flex items-center gap-2.5 cursor-pointer group">
        <div
          onClick={() => onChange(!checked)}
          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0
                      transition-all ${checked
                        ? 'bg-accent-primary border-accent-primary'
                        : 'border-surface-muted bg-surface-base group-hover:border-accent-primary/50'
                      }`}
        >
          {checked && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </div>
        <span className="text-sm text-text-primary">{label}</span>
      </label>
      {hint && <p className="text-xs text-text-muted mt-1.5 ml-6">{hint}</p>}
    </div>
  )
}
