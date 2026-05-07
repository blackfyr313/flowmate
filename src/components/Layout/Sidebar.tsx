import { useState } from 'react'
import { LayoutDashboard, History, Settings, Plus, Zap, ChevronLeft, ChevronRight } from 'lucide-react'
import { useStore } from '@/store/automationStore'
import type { AppView, Automation } from '@/types'

const NAV_ITEMS: Array<{
  view: AppView
  label: string
  icon: React.FC<{ size?: number; className?: string }>
}> = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'history',   label: 'Run History', icon: History },
  { view: 'settings',  label: 'Settings',   icon: Settings },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const {
    currentView, selectedAutomationId, navigateTo,
    automations, activeRuns, createAutomation,
  } = useStore()

  const handleNewAutomation = async () => {
    const automation = await createAutomation({
      name: 'Untitled Automation',
      description: '',
      emoji: '⚡',
      steps: [],
      trigger: { type: 'manual' },
      enabled: false,
      lastRunAt: undefined,
      lastRunSuccess: undefined,
    })
    navigateTo('editor', automation.id)
  }

  return (
    <aside
      className="flex flex-col border-r border-surface-border shrink-0 overflow-hidden
                 relative transition-all duration-300 ease-in-out"
      style={{
        width: collapsed ? '56px' : '224px',
        background: 'linear-gradient(180deg, #13161e 0%, #0f1219 100%)',
      }}
    >
      {/* Subtle gradient accent on left edge */}
      <div className="absolute left-0 top-0 bottom-0 w-px"
           style={{ background: 'linear-gradient(180deg, transparent, rgba(79,142,247,0.3), transparent)' }} />

      {/* New Automation button */}
      <div className={`p-2.5 border-b border-surface-border transition-all duration-300 ${collapsed ? 'px-2' : ''}`}>
        <button
          onClick={handleNewAutomation}
          className="btn-primary w-full justify-center text-xs py-2 overflow-hidden"
          title={collapsed ? 'New Automation' : undefined}
        >
          <Plus size={14} className="shrink-0" />
          <span className={`transition-all duration-200 overflow-hidden whitespace-nowrap
                            ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            New Automation
          </span>
        </button>
      </div>

      {/* Nav items */}
      <nav className="p-2 border-b border-surface-border space-y-0.5">
        {NAV_ITEMS.map(({ view, label, icon: Icon }) => {
          const isActive = currentView === view && selectedAutomationId === null
          return (
            <button
              key={view}
              onClick={() => navigateTo(view)}
              title={collapsed ? label : undefined}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm font-medium
                          transition-all duration-150 relative group overflow-hidden
                          ${isActive
                            ? 'text-text-primary'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'
                          }`}
              style={isActive ? {
                background: 'linear-gradient(135deg, rgba(79,142,247,0.12) 0%, rgba(79,142,247,0.04) 100%)',
              } : undefined}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5
                                 rounded-full bg-accent-primary animate-fade-in" />
              )}
              <Icon size={15} className={`shrink-0 ${isActive ? 'text-accent-primary' : ''}`} />
              <span className={`transition-all duration-200 overflow-hidden whitespace-nowrap
                                ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                {label}
              </span>
            </button>
          )
        })}
      </nav>

      {/* Automations list */}
      <div className="flex-1 overflow-y-auto p-2">
        {!collapsed && (
          <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest
                        px-2.5 py-2 animate-fade-in">
            Automations
          </p>
        )}

        {automations.length === 0 && !collapsed ? (
          <div className="px-2.5 py-3 text-xs text-text-muted text-center animate-fade-in">
            No automations yet.
            <button onClick={handleNewAutomation} className="block text-accent-primary hover:underline mt-1 mx-auto">
              Create one
            </button>
          </div>
        ) : (
          <div className="space-y-0.5">
            {automations.map((automation, i) => (
              <AutomationNavItem
                key={automation.id}
                automation={automation}
                isSelected={selectedAutomationId === automation.id && currentView === 'editor'}
                isRunning={activeRuns.has(automation.id)}
                collapsed={collapsed}
                onSelect={() => navigateTo('editor', automation.id)}
                animDelay={i}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer: status + collapse toggle */}
      <div className="p-2 border-t border-surface-border flex items-center justify-between gap-2">
        {!collapsed && (
          <div className="flex items-center gap-1.5 px-1 animate-fade-in">
            <Zap size={11} className="text-accent-primary" />
            <span className="text-[10px] text-text-muted font-mono">
              {automations.filter(a => a.enabled).length} active
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="ml-auto w-7 h-7 flex items-center justify-center rounded-lg
                     text-text-muted hover:text-text-primary hover:bg-surface-overlay
                     transition-all duration-150"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <ChevronRight size={13} />
            : <ChevronLeft size={13} />
          }
        </button>
      </div>
    </aside>
  )
}

// ─── Nav Item ─────────────────────────────────────────────────────────────────

interface AutomationNavItemProps {
  automation: Automation
  isSelected: boolean
  isRunning: boolean
  collapsed: boolean
  animDelay: number
  onSelect: () => void
}

function AutomationNavItem({ automation, isSelected, isRunning, collapsed, animDelay, onSelect }: AutomationNavItemProps) {
  return (
    <button
      onClick={onSelect}
      title={collapsed ? automation.name : undefined}
      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-sm
                  transition-all duration-150 text-left group relative overflow-hidden
                  ${isSelected
                    ? 'text-text-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'
                  }`}
      style={{
        ...(isSelected ? {
          background: 'linear-gradient(135deg, rgba(79,142,247,0.1) 0%, rgba(79,142,247,0.03) 100%)',
        } : {}),
        animationDelay: `${animDelay * 40}ms`,
      }}
    >
      {isSelected && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4
                         rounded-full bg-accent-primary" />
      )}

      <span className="text-base shrink-0 transition-transform duration-150 group-hover:scale-110">
        {automation.emoji ?? '⚡'}
      </span>

      <span className={`flex-1 font-medium text-xs truncate transition-all duration-200
                        overflow-hidden whitespace-nowrap
                        ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
        {automation.name}
      </span>

      {/* Status dot */}
      {!collapsed && (
        <span className="shrink-0 relative">
          {isRunning ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-accent-success block" />
              <span className="absolute inset-0 rounded-full bg-accent-success animate-ping-slow opacity-70" />
            </>
          ) : (
            <span className={`w-1.5 h-1.5 rounded-full block transition-colors
              ${automation.enabled ? 'bg-accent-primary/50' : 'bg-surface-muted'}`} />
          )}
        </span>
      )}
    </button>
  )
}
