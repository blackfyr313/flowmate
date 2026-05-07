import { CheckCircle2, XCircle, Circle, Loader2, SkipForward, AlertTriangle } from 'lucide-react'
import type { ActiveRun, Automation, RunAction, Step, StepRunResult, StepRunStatus } from '@/types'

interface ExecutionPanelProps {
  automation: Automation
  activeRun: ActiveRun
  onAction: (action: RunAction) => void
}

export function ExecutionPanel({ automation, activeRun, onAction }: ExecutionPanelProps) {
  const isPaused = activeRun.status === 'paused'
  const failedResult = isPaused
    ? activeRun.stepResults.find(r => r.stepId === activeRun.failedStepId)
    : undefined

  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-fade-in">
      {/* Live step list */}
      <div className="flex-1 overflow-y-auto p-6 space-y-1.5">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-4">
          {isPaused ? 'Paused — Step Failed' : 'Running…'}
        </p>

        {automation.steps.map((step, index) => {
          const result = activeRun.stepResults.find(r => r.stepId === step.id)
          const isCurrent = index === activeRun.currentStepIndex && !result?.status || result?.status === 'running'
          const isPending = index > activeRun.currentStepIndex && !result

          return (
            <StepRow
              key={step.id}
              step={step}
              index={index}
              result={result}
              isCurrent={isCurrent && activeRun.status === 'running'}
              isPending={isPending || !step.enabled}
              disabled={!step.enabled}
            />
          )
        })}
      </div>

      {/* Failure action panel */}
      {isPaused && (
        <div className="border-t border-accent-danger/20 bg-accent-danger/5 p-5 shrink-0">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle size={18} className="text-accent-danger shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-semibold text-text-primary text-sm">
                Step failed: {failedResult?.stepName ?? 'Unknown step'}
              </p>
              {failedResult?.error && (
                <p className="text-xs text-text-secondary mt-1 break-words">
                  {failedResult.error}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <ActionButton
              label="Retry"
              hint="Re-run this step"
              icon="↺"
              variant="primary"
              onClick={() => onAction('retry')}
            />
            <ActionButton
              label="Skip"
              hint="Skip and continue"
              icon="→"
              variant="secondary"
              onClick={() => onAction('skip')}
            />
            <ActionButton
              label="Fix Manually & Resume"
              hint="Do it yourself, then continue"
              icon="✋"
              variant="secondary"
              onClick={() => onAction('resume')}
            />
            <ActionButton
              label="Stop"
              hint="Cancel the automation"
              icon="■"
              variant="danger"
              onClick={() => onAction('stop')}
            />
          </div>
        </div>
      )}

      {/* Running footer */}
      {!isPaused && (
        <div className="border-t border-surface-border px-5 py-3 shrink-0 flex items-center justify-between">
          <span className="text-xs text-text-muted flex items-center gap-1.5">
            <Loader2 size={12} className="animate-spin" />
            Running step {Math.min(activeRun.currentStepIndex + 1, automation.steps.length)} of {automation.steps.length}
          </span>
          <button
            onClick={() => onAction('stop')}
            className="text-xs text-accent-danger/70 hover:text-accent-danger transition-colors font-medium"
          >
            Stop
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Step Row ─────────────────────────────────────────────────────────────────

interface StepRowProps {
  step: Step
  index: number
  result?: StepRunResult
  isCurrent: boolean
  isPending: boolean
  disabled: boolean
}

function StepRow({ step, index, result, isCurrent, isPending, disabled }: StepRowProps) {
  const status: StepRunStatus = result?.status ?? 'pending'

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all
        ${isCurrent ? 'bg-accent-primary/10 border border-accent-primary/20' : 'border border-transparent'}
        ${disabled ? 'opacity-40' : ''}
      `}
    >
      <StatusIcon status={status} isCurrent={isCurrent} />

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isCurrent ? 'text-accent-primary' : 'text-text-primary'}`}>
          {step.name}
        </p>
        {result?.error && (
          <p className="text-xs text-accent-danger truncate mt-0.5">{result.error}</p>
        )}
      </div>

      {result?.durationMs != null && result.durationMs > 0 && (
        <span className="text-xs text-text-muted shrink-0">
          {result.durationMs < 1000
            ? `${result.durationMs}ms`
            : `${(result.durationMs / 1000).toFixed(1)}s`}
        </span>
      )}

      {disabled && (
        <span className="text-xs text-text-muted shrink-0">disabled</span>
      )}
    </div>
  )
}

// ─── Status Icon ──────────────────────────────────────────────────────────────

function StatusIcon({ status, isCurrent }: { status: StepRunStatus; isCurrent: boolean }) {
  if (isCurrent || status === 'running') {
    return <Loader2 size={16} className="animate-spin text-accent-primary shrink-0" />
  }
  switch (status) {
    case 'success':
      return <CheckCircle2 size={16} className="text-accent-success shrink-0" />
    case 'failed':
      return <XCircle size={16} className="text-accent-danger shrink-0" />
    case 'skipped':
      return <SkipForward size={16} className="text-text-muted shrink-0" />
    default:
      return <Circle size={16} className="text-surface-muted shrink-0" />
  }
}

// ─── Action Button ────────────────────────────────────────────────────────────

interface ActionButtonProps {
  label: string
  hint: string
  icon: string
  variant: 'primary' | 'secondary' | 'danger'
  onClick: () => void
}

function ActionButton({ label, hint, icon, variant, onClick }: ActionButtonProps) {
  const base = 'flex flex-col items-start gap-0.5 w-full px-3 py-2.5 rounded-xl text-left transition-all border'
  const variants = {
    primary:   'bg-accent-primary/10 border-accent-primary/20 hover:bg-accent-primary/20 text-accent-primary',
    secondary: 'bg-surface-overlay border-surface-border hover:bg-surface-muted text-text-primary',
    danger:    'bg-accent-danger/10 border-accent-danger/20 hover:bg-accent-danger/20 text-accent-danger',
  }

  return (
    <button onClick={onClick} className={`${base} ${variants[variant]}`}>
      <span className="text-sm font-semibold flex items-center gap-1.5">
        <span>{icon}</span>
        {label}
      </span>
      <span className="text-xs opacity-70">{hint}</span>
    </button>
  )
}
