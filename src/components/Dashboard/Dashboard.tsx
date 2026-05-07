import { useEffect } from 'react'
import { useStore } from '@/store/automationStore'
import { AutomationCard } from './AutomationCard'
import { Zap, Clock, CheckCircle2, TrendingUp, Plus } from 'lucide-react'

export function Dashboard() {
  const { automations, activeRuns, runHistory, fetchRunHistory, navigateTo, createAutomation } = useStore()

  useEffect(() => { fetchRunHistory() }, [])

  const totalRuns      = runHistory.length
  const activeCount    = automations.filter(a => a.enabled).length
  const runningNow     = activeRuns.size
  const lastRunSuccess = automations.filter(a => a.lastRunSuccess === true).length

  const handleNew = async () => {
    const automation = await createAutomation({
      name: 'Untitled Automation',
      description: '',
      emoji: '⚡',
      steps: [],
      trigger: { type: 'manual' },
      enabled: false,
    })
    navigateTo('editor', automation.id)
  }

  return (
    <div className="h-full overflow-y-auto px-8 py-6 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-gradient">Dashboard</span>
        </h1>
        <p className="text-sm text-text-secondary mt-1">Your automation command center</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Zap size={16} />}          label="Automations" value={automations.length} sublabel={`${totalRuns} total runs`}   color="blue"   accentClass="accent-line-blue"   delay={0} />
        <StatCard icon={<CheckCircle2 size={16} />}  label="Active"      value={activeCount}        sublabel="enabled automations"          color="green"  accentClass="accent-line-green"  delay={1} />
        <StatCard icon={<TrendingUp size={16} />}    label="Running Now" value={runningNow}         sublabel="in progress"                  color="violet" accentClass="accent-line-violet" delay={2} pulse={runningNow > 0} />
        <StatCard icon={<Clock size={16} />}         label="Successful"  value={lastRunSuccess}     sublabel="last run succeeded"           color="amber"  accentClass="accent-line-amber"  delay={3} />
      </div>

      {/* Automations grid */}
      {automations.length === 0 ? (
        <EmptyState onNew={handleNew} />
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest">
              All Automations
            </h2>
            <button onClick={handleNew} className="btn-ghost text-xs gap-1.5">
              <Plus size={13} />New
            </button>
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
            {automations.map((automation, i) => (
              <div key={automation.id}
                   className="animate-fade-in"
                   style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}>
                <AutomationCard
                  automation={automation}
                  isRunning={activeRuns.has(automation.id)}
                  onOpen={() => navigateTo('editor', automation.id)}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

const colorMap = {
  blue:   { icon: 'text-accent-primary',   glow: 'rgba(79,142,247,0.15)',  bg: 'rgba(79,142,247,0.08)' },
  green:  { icon: 'text-accent-success',   glow: 'rgba(34,211,162,0.15)',  bg: 'rgba(34,211,162,0.08)' },
  violet: { icon: 'text-accent-secondary', glow: 'rgba(124,95,247,0.15)', bg: 'rgba(124,95,247,0.08)' },
  amber:  { icon: 'text-accent-warning',   glow: 'rgba(247,169,79,0.15)', bg: 'rgba(247,169,79,0.08)' },
}

function StatCard({ icon, label, value, sublabel, color, accentClass, delay, pulse }: {
  icon: React.ReactNode
  label: string
  value: number
  sublabel: string
  color: keyof typeof colorMap
  accentClass: string
  delay: number
  pulse?: boolean
}) {
  const c = colorMap[color]
  return (
    <div
      className="rounded-2xl border border-surface-border overflow-hidden animate-fade-in"
      style={{
        animationDelay: `${delay * 60}ms`,
        animationFillMode: 'both',
        background: 'linear-gradient(145deg, #13161e, #111420)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      }}
    >
      {/* Accent top line */}
      <div className={accentClass} />

      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
               style={{ background: c.bg, boxShadow: `0 0 12px ${c.glow}` }}>
            <span className={c.icon}>{icon}</span>
          </div>
          {pulse && (
            <div className="relative">
              <span className="w-2 h-2 rounded-full bg-accent-success block animate-pulse" />
              <span className="absolute inset-0 rounded-full bg-accent-success animate-ping-slow opacity-50" />
            </div>
          )}
        </div>

        <div className={`text-3xl font-bold font-mono text-text-primary ${pulse ? 'text-gradient-green' : ''}`}>
          {value}
        </div>
        <div className="text-[11px] text-text-muted mt-0.5">{sublabel}</div>
        <div className="text-xs font-medium text-text-secondary mt-1">{label}</div>
      </div>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center animate-scale-in">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 animate-float"
           style={{
             background: 'linear-gradient(135deg, rgba(79,142,247,0.15), rgba(124,95,247,0.1))',
             border: '1px solid rgba(79,142,247,0.2)',
             boxShadow: '0 0 32px rgba(79,142,247,0.15)',
           }}>
        <Zap size={28} className="text-accent-primary" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">No automations yet</h3>
      <p className="text-sm text-text-secondary max-w-xs mb-6 leading-relaxed">
        Build your first automation and let FlowMate handle the repetitive work.
      </p>
      <button onClick={onNew} className="btn-primary">
        <Plus size={15} />Create your first automation
      </button>
    </div>
  )
}
