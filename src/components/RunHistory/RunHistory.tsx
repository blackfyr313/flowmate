import { useEffect, useState } from 'react'
import { useStore } from '@/store/automationStore'
import { CheckCircle2, XCircle, Clock, ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import type { AutomationRun, StepRunResult } from '@/types'

export function RunHistory() {
  const { runHistory, fetchRunHistory, automations } = useStore()
  const [isLoading, setIsLoading] = useState(false)
  const [expandedRun, setExpandedRun] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    setIsLoading(true)
    fetchRunHistory(filter === 'all' ? undefined : filter).finally(() => setIsLoading(false))
  }, [filter])

  const filteredRuns = filter === 'all'
    ? runHistory
    : runHistory.filter(r => r.automationId === filter)

  return (
    <div className="h-full overflow-y-auto px-8 py-6 animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Run History</h1>
          <p className="text-sm text-text-secondary mt-1">
            Logs of every automation run
          </p>
        </div>

        {/* Filter by automation */}
        <select
          className="input w-48 text-sm"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          <option value="all">All automations</option>
          {automations.map(a => (
            <option key={a.id} value={a.id}>{a.emoji} {a.name}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 size={24} className="animate-spin text-accent-primary" />
        </div>
      ) : filteredRuns.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-text-muted text-sm">
          <Clock size={36} className="mb-3 opacity-30" />
          <p>No runs recorded yet.</p>
          <p className="text-xs mt-1">Run an automation to see its history here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredRuns.map(run => (
            <RunRow
              key={run.id}
              run={run}
              isExpanded={expandedRun === run.id}
              onToggle={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Run Row ──────────────────────────────────────────────────────────────────

interface RunRowProps {
  run: AutomationRun
  isExpanded: boolean
  onToggle: () => void
}

function RunRow({ run, isExpanded, onToggle }: RunRowProps) {
  const startDate = new Date(run.startedAt)
  const endDate = run.completedAt ? new Date(run.completedAt) : null
  const durationMs = endDate ? endDate.getTime() - startDate.getTime() : null
  const successCount = run.stepResults.filter(s => s.status === 'success').length
  const totalSteps = run.stepResults.length

  return (
    <div className={`card border overflow-hidden ${
      run.success ? 'border-accent-success/20' : 'border-accent-danger/20'
    }`}>
      {/* Summary row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-surface-overlay
                   transition-colors"
      >
        {/* Status icon */}
        {run.success ? (
          <CheckCircle2 size={18} className="text-accent-success shrink-0" />
        ) : (
          <XCircle size={18} className="text-accent-danger shrink-0" />
        )}

        {/* Name + time */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-text-primary text-sm">{run.automationName}</p>
          <p className="text-xs text-text-muted mt-0.5">
            {startDate.toLocaleString()} 
            {durationMs !== null && ` · ${formatDuration(durationMs)}`}
            {' · '}{successCount}/{totalSteps} steps
          </p>
        </div>

        {run.error && (
          <span className="text-xs text-accent-danger truncate max-w-xs">
            {run.error}
          </span>
        )}

        {isExpanded
          ? <ChevronDown size={14} className="text-text-muted shrink-0" />
          : <ChevronRight size={14} className="text-text-muted shrink-0" />
        }
      </button>

      {/* Step results */}
      {isExpanded && (
        <div className="border-t border-surface-border px-4 py-3 space-y-1.5 bg-surface-base/50">
          {run.stepResults.map((result, i) => (
            <StepResultRow key={result.stepId} result={result} index={i + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

function StepResultRow({ result, index }: { result: StepRunResult; index: number }) {
  const statusStyles = {
    success: { icon: <CheckCircle2 size={13} className="text-accent-success" />, text: 'text-accent-success' },
    failed:  { icon: <XCircle size={13} className="text-accent-danger" />,      text: 'text-accent-danger' },
    skipped: { icon: <Clock size={13} className="text-text-muted" />,            text: 'text-text-muted' },
    pending: { icon: <Clock size={13} className="text-text-muted" />,            text: 'text-text-muted' },
    running: { icon: <Loader2 size={13} className="animate-spin text-accent-primary" />, text: 'text-accent-primary' },
  }

  const { icon, text } = statusStyles[result.status] ?? statusStyles.pending

  return (
    <div className="flex items-center gap-2.5 text-xs">
      <span className="text-text-muted w-4 text-right shrink-0">{index}</span>
      {icon}
      <span className={`flex-1 font-medium ${text}`}>{result.stepName}</span>
      <span className="text-text-muted font-mono">{result.durationMs}ms</span>
      {result.retryCount > 0 && (
        <span className="badge-warning text-[10px]">{result.retryCount} retries</span>
      )}
      {result.error && (
        <span className="text-accent-danger max-w-[200px] truncate" title={result.error}>
          {result.error}
        </span>
      )}
    </div>
  )
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
}
