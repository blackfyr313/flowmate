import { Play, Loader2, ChevronRight, CheckCircle2, XCircle } from 'lucide-react'
import { useStore } from '@/store/automationStore'
import type { Automation } from '@/types'

interface AutomationCardProps {
  automation: Automation
  isRunning: boolean
  onOpen: () => void
}

export function AutomationCard({ automation, isRunning, onOpen }: AutomationCardProps) {
  const { startRun, stopRun } = useStore()

  const handleRun = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isRunning) await stopRun(automation.id)
    else await startRun(automation.id)
  }

  const stepCount    = automation.steps.length
  const enabledSteps = automation.steps.filter(s => s.enabled).length

  return (
    <div
      onClick={onOpen}
      className="group relative rounded-2xl border cursor-pointer overflow-hidden
                 transition-all duration-250 select-none"
      style={{
        background: 'linear-gradient(145deg, #13161e 0%, #111420 100%)',
        borderColor: isRunning ? 'rgba(34,211,162,0.35)' : 'rgba(37,41,54,1)',
        boxShadow: isRunning
          ? '0 0 24px rgba(34,211,162,0.15), 0 4px 16px rgba(0,0,0,0.4)'
          : '0 4px 16px rgba(0,0,0,0.35)',
      }}
      onMouseEnter={e => {
        if (!isRunning) {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(79,142,247,0.3)'
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(79,142,247,0.1)'
          ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
        }
      }}
      onMouseLeave={e => {
        if (!isRunning) {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(37,41,54,1)'
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.35)'
          ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
        }
      }}
    >
      {/* Top accent line */}
      <div className="h-px w-full"
           style={{
             background: isRunning
               ? 'linear-gradient(90deg, transparent, rgba(34,211,162,0.6), transparent)'
               : 'linear-gradient(90deg, transparent, rgba(79,142,247,0.25), transparent)',
           }} />

      {/* Running glow overlay */}
      {isRunning && (
        <div className="absolute inset-0 pointer-events-none"
             style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(34,211,162,0.06), transparent 70%)' }} />
      )}

      <div className="p-4 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl transition-transform duration-200 group-hover:scale-110">
              {automation.emoji ?? '⚡'}
            </span>
            <div>
              <h3 className="font-semibold text-text-primary text-sm leading-tight truncate max-w-[130px]">
                {automation.name}
              </h3>
              <StatusBadge automation={automation} isRunning={isRunning} />
            </div>
          </div>
          <ChevronRight size={14}
            className="text-text-muted group-hover:text-accent-primary transition-all duration-150
                       group-hover:translate-x-0.5 shrink-0 mt-0.5" />
        </div>

        {/* Description */}
        {automation.description && (
          <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
            {automation.description}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-accent-primary/60" />
            {enabledSteps}/{stepCount} steps
          </span>
          <span>·</span>
          <span className="capitalize">{automation.trigger.type}</span>
          {automation.lastRunAt && (
            <>
              <span>·</span>
              <LastRunBadge lastRunAt={automation.lastRunAt} success={automation.lastRunSuccess} />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-surface-border">
          <TriggerLabel automation={automation} />
          <button
            onClick={handleRun}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                        transition-all duration-150 active:scale-95
                        ${isRunning
                          ? 'bg-accent-success/10 text-accent-success border border-accent-success/20 hover:bg-accent-success/20'
                          : 'text-white border border-accent-primary/30 hover:border-accent-primary/60'
                        }`}
            style={!isRunning ? {
              background: 'linear-gradient(135deg, rgba(79,142,247,0.2), rgba(124,95,247,0.15))',
            } : undefined}
          >
            {isRunning ? (
              <><Loader2 size={11} className="animate-spin" />Running</>
            ) : (
              <><Play size={11} fill="currentColor" />Run</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ automation, isRunning }: { automation: Automation; isRunning: boolean }) {
  if (isRunning)                            return <span className="badge-info mt-0.5">Running</span>
  if (!automation.enabled)                  return <span className="badge-muted mt-0.5">Disabled</span>
  if (automation.lastRunSuccess === false)   return <span className="badge-error mt-0.5">Failed</span>
  if (automation.lastRunSuccess === true)    return <span className="badge-success mt-0.5">Ready</span>
  return <span className="badge-muted mt-0.5">Not run yet</span>
}

function LastRunBadge({ lastRunAt, success }: { lastRunAt: string; success?: boolean }) {
  const diffMs   = Date.now() - new Date(lastRunAt).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHrs  = Math.floor(diffMins / 60)
  const label    = diffMins < 1 ? 'just now'
    : diffMins < 60 ? `${diffMins}m ago`
    : diffHrs < 24  ? `${diffHrs}h ago`
    : new Date(lastRunAt).toLocaleDateString()

  return (
    <span className="flex items-center gap-1">
      {success === false
        ? <XCircle size={10} className="text-accent-danger" />
        : <CheckCircle2 size={10} className="text-accent-success" />
      }
      {label}
    </span>
  )
}

function TriggerLabel({ automation }: { automation: Automation }) {
  const t = automation.trigger
  const labels: Record<string, string> = {
    manual:     '🖱 Manual',
    startup:    '🖥 On startup',
    schedule:   `⏰ ${t.schedule ?? 'Scheduled'}`,
    hotkey:     `⌨ ${t.hotkey ?? 'Hotkey'}`,
    app_launch: '📱 On app launch',
  }
  return <span className="text-xs text-text-muted">{labels[t.type] ?? t.type}</span>
}
