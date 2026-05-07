import { useState, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import {
  Play, Save, Trash2, Plus, ChevronLeft,
  Loader2, ToggleLeft, ToggleRight,
} from 'lucide-react'
import { useStore } from '@/store/automationStore'
import { StepItem } from './StepItem'
import { StepConfigPanel } from './StepConfigPanel'
import { AddStepMenu } from './AddStepMenu'
import { ExecutionPanel } from './ExecutionPanel'
import type { RunAction, Step, StepType, Trigger, TriggerType } from '@/types'
import { STEP_TYPE_META, getDefaultStepConfig } from '@/types'
import { nanoid } from '@/utils/nanoid'

export function AutomationEditor() {
  const {
    getSelectedAutomation,
    updateAutomation,
    deleteAutomation,
    startRun,
    sendAction,
    activeRuns,
    navigateTo,
  } = useStore()

  const automation = getSelectedAutomation()
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  const [localSteps, setLocalSteps] = useState<Step[]>(automation?.steps ?? [])
  const [localName, setLocalName] = useState(automation?.name ?? '')
  const [localDescription, setLocalDescription] = useState(automation?.description ?? '')
  const [localEmoji, setLocalEmoji] = useState(automation?.emoji ?? '⚡')
  const [localEnabled, setLocalEnabled] = useState(automation?.enabled ?? false)
  const [localTrigger, setLocalTrigger] = useState<Trigger>(automation?.trigger ?? { type: 'manual' })

  const activeRun = automation ? activeRuns.get(automation.id) : undefined
  const isActive = activeRun != null  // running or paused

  // ── DnD ───────────────────────────────────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = localSteps.findIndex(s => s.id === active.id)
    const newIndex = localSteps.findIndex(s => s.id === over.id)
    setLocalSteps(arrayMove(localSteps, oldIndex, newIndex))
    setIsDirty(true)
  }

  // ── Step Operations ───────────────────────────────────────────────────────

  const addStep = useCallback((type: StepType) => {
    const meta = STEP_TYPE_META[type]
    const newStep: Step = {
      id: nanoid(),
      type,
      name: meta.label,
      enabled: true,
      config: getDefaultStepConfig(type),
      onFailure: 'pause',
      createdAt: new Date().toISOString(),
    }
    setLocalSteps(prev => [...prev, newStep])
    setSelectedStepId(newStep.id)
    setShowAddMenu(false)
    setIsDirty(true)
  }, [])

  const updateStep = useCallback((stepId: string, patch: Partial<Step>) => {
    setLocalSteps(prev => prev.map(s => s.id === stepId ? { ...s, ...patch } : s))
    setIsDirty(true)
  }, [])

  const deleteStep = useCallback((stepId: string) => {
    setLocalSteps(prev => prev.filter(s => s.id !== stepId))
    if (selectedStepId === stepId) setSelectedStepId(null)
    setIsDirty(true)
  }, [selectedStepId])

  const duplicateStep = useCallback((stepId: string) => {
    const step = localSteps.find(s => s.id === stepId)
    if (!step) return
    const clone: Step = { ...step, id: nanoid(), name: `${step.name} (copy)` }
    const index = localSteps.findIndex(s => s.id === stepId)
    const newSteps = [...localSteps]
    newSteps.splice(index + 1, 0, clone)
    setLocalSteps(newSteps)
    setIsDirty(true)
  }, [localSteps])

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!automation) return
    setIsSaving(true)
    try {
      await updateAutomation(automation.id, {
        name: localName,
        description: localDescription,
        emoji: localEmoji,
        steps: localSteps,
        trigger: localTrigger,
        enabled: localEnabled,
        updatedAt: new Date().toISOString(),
      })
      setIsDirty(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!automation) return
    const confirmed = window.confirm(`Delete "${automation.name}"? This cannot be undone.`)
    if (!confirmed) return
    // Navigate away immediately so the UI updates before the async API call
    navigateTo('dashboard')
    await deleteAutomation(automation.id)
  }

  const handleAction = (action: RunAction) => {
    if (!automation) return
    sendAction(automation.id, action)
  }

  if (!automation) {
    return (
      <div className="h-full flex items-center justify-center text-text-muted text-sm">
        Select an automation from the sidebar
      </div>
    )
  }

  const selectedStep = localSteps.find(s => s.id === selectedStepId) ?? null

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-surface-border bg-surface-raised shrink-0">
        <button onClick={() => navigateTo('dashboard')} className="btn-ghost p-1.5" title="Back">
          <ChevronLeft size={16} />
        </button>

        <button
          onClick={() => {
            if (isActive) return
            const emoji = window.prompt('Enter an emoji:', localEmoji)
            if (emoji) { setLocalEmoji(emoji); setIsDirty(true) }
          }}
          className={`text-2xl transition-transform ${isActive ? 'cursor-default' : 'hover:scale-110 cursor-pointer'}`}
          title="Change emoji"
        >
          {localEmoji}
        </button>

        <input
          value={localName}
          onChange={e => { if (!isActive) { setLocalName(e.target.value); setIsDirty(true) } }}
          readOnly={isActive}
          className={`flex-1 bg-transparent text-text-primary font-semibold text-lg
                     focus:outline-none border-b border-transparent
                     ${isActive ? 'cursor-default' : 'focus:border-accent-primary/40'} transition-colors`}
          placeholder="Automation name"
        />

        <button
          onClick={() => { if (!isActive) { setLocalEnabled(!localEnabled); setIsDirty(true) } }}
          disabled={isActive}
          className="flex items-center gap-1.5 text-xs font-medium text-text-secondary
                     hover:text-text-primary transition-colors disabled:opacity-50"
        >
          {localEnabled
            ? <ToggleRight size={20} className="text-accent-primary" />
            : <ToggleLeft size={20} className="text-text-muted" />}
          {localEnabled ? 'Enabled' : 'Disabled'}
        </button>

        <div className="w-px h-5 bg-surface-border" />

        {!isActive && (
          <button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="btn-primary text-xs py-1.5 px-3"
          >
            {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            Save
          </button>
        )}

        <button
          onClick={() => { if (!isActive) startRun(automation.id) }}
          disabled={isActive || localSteps.length === 0}
          className={`text-xs py-1.5 px-3 rounded-lg font-medium transition-all
            flex items-center gap-1.5
            ${isActive
              ? 'bg-accent-success/10 text-accent-success cursor-default'
              : 'btn-secondary'
            }`}
        >
          {isActive
            ? <><Loader2 size={13} className="animate-spin" />
                {activeRun?.status === 'paused' ? 'Paused' : 'Running'}</>
            : <><Play size={13} /> Run</>
          }
        </button>

        {!isActive && (
          <button onClick={handleDelete} className="btn-ghost p-1.5 text-accent-danger/60 hover:text-accent-danger">
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel: editor OR execution view */}
        {isActive && activeRun ? (
          <ExecutionPanel
            automation={{ ...automation, steps: localSteps }}
            activeRun={activeRun}
            onAction={handleAction}
          />
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            <input
              value={localDescription}
              onChange={e => { setLocalDescription(e.target.value); setIsDirty(true) }}
              className="w-full bg-transparent text-text-secondary text-sm
                         focus:outline-none mb-4 placeholder:text-text-muted"
              placeholder="Add a description (optional)..."
            />

            <TriggerConfigSection
              trigger={localTrigger}
              onChange={t => { setLocalTrigger(t); setIsDirty(true) }}
            />

            {localSteps.length === 0 ? (
              <EmptyStepList onAdd={() => setShowAddMenu(true)} />
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={localSteps.map(s => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {localSteps.map((step, index) => (
                      <StepItem
                        key={step.id}
                        step={step}
                        index={index}
                        isSelected={selectedStepId === step.id}
                        onSelect={() => setSelectedStepId(selectedStepId === step.id ? null : step.id)}
                        onToggle={() => updateStep(step.id, { enabled: !step.enabled })}
                        onDelete={() => deleteStep(step.id)}
                        onDuplicate={() => duplicateStep(step.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            <div className="mt-4 relative">
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="w-full py-3 border-2 border-dashed border-surface-muted
                           text-text-muted text-sm rounded-xl hover:border-accent-primary/40
                           hover:text-accent-primary transition-all flex items-center
                           justify-center gap-2"
              >
                <Plus size={15} />
                Add Step
              </button>
              {showAddMenu && (
                <AddStepMenu onSelect={addStep} onClose={() => setShowAddMenu(false)} />
              )}
            </div>
          </div>
        )}

        {/* Config panel — only shown in edit mode */}
        {!isActive && selectedStep && (
          <StepConfigPanel
            step={selectedStep}
            onUpdate={(patch) => updateStep(selectedStep.id, patch)}
            onClose={() => setSelectedStepId(null)}
          />
        )}
      </div>
    </div>
  )
}

// ─── Trigger Config Section ───────────────────────────────────────────────────

const TRIGGER_OPTIONS: Array<{ value: TriggerType; label: string; icon: string }> = [
  { value: 'manual',     label: 'Manual',      icon: '🖱' },
  { value: 'schedule',   label: 'Schedule',     icon: '⏰' },
  { value: 'hotkey',     label: 'Hotkey',       icon: '⌨' },
  { value: 'startup',    label: 'On startup',   icon: '🖥' },
  { value: 'app_launch', label: 'App launches', icon: '📱' },
]

function TriggerConfigSection({ trigger, onChange }: { trigger: Trigger; onChange: (t: Trigger) => void }) {
  return (
    <div className="mb-6 rounded-xl border border-surface-border bg-surface-overlay p-4">
      <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">Trigger</p>

      <div className="flex flex-wrap gap-2 mb-3">
        {TRIGGER_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange({ type: opt.value })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                        transition-colors border
                        ${trigger.type === opt.value
                          ? 'bg-accent-primary/10 border-accent-primary/30 text-accent-primary'
                          : 'bg-surface-base border-surface-border text-text-secondary hover:text-text-primary hover:border-accent-primary/20'
                        }`}
          >
            <span>{opt.icon}</span>
            {opt.label}
          </button>
        ))}
      </div>

      {trigger.type === 'schedule' && (
        <div>
          <label className="label">Cron Expression</label>
          <input
            className="input font-mono text-xs"
            value={trigger.schedule ?? ''}
            onChange={e => onChange({ ...trigger, schedule: e.target.value })}
            placeholder="e.g. 0 9 * * 1-5  (weekdays at 9 AM)"
          />
          <p className="text-xs text-text-muted mt-1.5">Standard 5-field cron: minute hour day month weekday</p>
        </div>
      )}

      {trigger.type === 'hotkey' && (
        <div>
          <label className="label">Key Combination</label>
          <input
            className="input font-mono"
            value={trigger.hotkey ?? ''}
            onChange={e => onChange({ ...trigger, hotkey: e.target.value })}
            placeholder="e.g. Ctrl+Shift+W"
          />
          <p className="text-xs text-text-muted mt-1.5">Use Ctrl, Alt, Shift, Win as modifiers separated by +</p>
        </div>
      )}

      {trigger.type === 'app_launch' && (
        <div>
          <label className="label">Application Process Name</label>
          <input
            className="input font-mono text-xs"
            value={trigger.appName ?? ''}
            onChange={e => onChange({ ...trigger, appName: e.target.value })}
            placeholder="e.g. chrome.exe  or  slack.exe"
          />
          <p className="text-xs text-text-muted mt-1.5">
            FlowMate will watch for this process and run the automation automatically.
          </p>
        </div>
      )}

      {(trigger.type === 'manual' || trigger.type === 'startup') && (
        <p className="text-xs text-text-muted">
          {trigger.type === 'manual'
            ? 'Run manually from the dashboard or editor.'
            : 'Runs automatically each time Windows starts and FlowMate launches.'}
        </p>
      )}
    </div>
  )
}

// ─── Empty Step List ──────────────────────────────────────────────────────────

function EmptyStepList({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-3">🪄</div>
      <h3 className="font-semibold text-text-primary mb-1.5">No steps yet</h3>
      <p className="text-sm text-text-secondary mb-5 max-w-xs">
        Add steps to define what this automation does when it runs.
      </p>
      <button onClick={onAdd} className="btn-primary">
        <Plus size={15} />
        Add your first step
      </button>
    </div>
  )
}
