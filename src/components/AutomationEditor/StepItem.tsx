import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  GripVertical, ChevronRight, Trash2, Copy, ToggleLeft,
  ToggleRight, AlertCircle
} from 'lucide-react'
import type { Step } from '@/types'
import { STEP_TYPE_META } from '@/types'

interface StepItemProps {
  step: Step
  index: number
  isSelected: boolean
  onSelect: () => void
  onToggle: () => void
  onDelete: () => void
  onDuplicate: () => void
}

export function StepItem({
  step,
  index,
  isSelected,
  onSelect,
  onToggle,
  onDelete,
  onDuplicate,
}: StepItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  }

  const meta = STEP_TYPE_META[step.type]
  const stepSummary = getStepSummary(step)
  const catClass = STEP_CATEGORY_CLASS[step.type] ?? ''

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group flex items-center gap-3 p-3 rounded-xl border transition-all duration-150
        cursor-pointer select-none overflow-hidden
        ${isSelected
          ? 'bg-accent-primary/8 border-accent-primary/30'
          : 'bg-surface-raised border-surface-border hover:border-surface-muted hover:shadow-card'
        }
        ${!step.enabled ? 'opacity-40' : ''}
        ${catClass}
      `}
      onClick={onSelect}
    >
      {/* Step index */}
      <span className="text-xs font-mono text-text-muted w-5 text-center shrink-0">
        {index + 1}
      </span>

      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="drag-handle opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        onClick={e => e.stopPropagation()}
        title="Drag to reorder"
      >
        <GripVertical size={16} />
      </button>

      {/* Step icon */}
      <span className="text-lg shrink-0">{meta.icon}</span>

      {/* Step info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary truncate">
            {step.name}
          </span>
          {!step.enabled && (
            <span className="badge-muted text-[10px]">disabled</span>
          )}
        </div>
        {stepSummary && (
          <p className="text-xs text-text-muted truncate mt-0.5 font-mono">
            {stepSummary}
          </p>
        )}
      </div>

      {/* Action buttons (show on hover) */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
           onClick={e => e.stopPropagation()}>
        <button
          onClick={onDuplicate}
          className="btn-ghost p-1 text-text-muted hover:text-text-primary"
          title="Duplicate step"
        >
          <Copy size={13} />
        </button>
        <button
          onClick={onToggle}
          className="btn-ghost p-1 text-text-muted hover:text-text-primary"
          title={step.enabled ? 'Disable step' : 'Enable step'}
        >
          {step.enabled
            ? <ToggleRight size={15} className="text-accent-primary" />
            : <ToggleLeft size={15} />
          }
        </button>
        <button
          onClick={onDelete}
          className="btn-ghost p-1 text-text-muted hover:text-accent-danger"
          title="Delete step"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Expand arrow */}
      <ChevronRight
        size={14}
        className={`text-text-muted shrink-0 transition-transform duration-150
          ${isSelected ? 'rotate-90' : ''}`}
      />
    </div>
  )
}

// ─── Category → left-border color class ──────────────────────────────────────

const STEP_CATEGORY_CLASS: Partial<Record<string, string>> = {
  open_app:         'step-cat-app',
  open_url:         'step-cat-app',
  wait:             'step-cat-timing',
  wait_for_window:  'step-cat-timing',
  type_text:        'step-cat-key',
  press_key:        'step-cat-key',
  hold_key:         'step-cat-key',
  click_element:    'step-cat-mouse',
  scroll:           'step-cat-mouse',
  drag_drop:        'step-cat-mouse',
  move_window:      'step-cat-window',
  focus_window:     'step-cat-window',
  minimize_window:  'step-cat-window',
  close_window:     'step-cat-window',
  kill_process:     'step-cat-window',
  show_notification:'step-cat-notif',
}

// ─── Step summary text (shown under the step name) ────────────────────────────

function getStepSummary(step: Step): string {
  const c = step.config as Record<string, unknown>

  switch (step.type) {
    case 'open_app':
      return String(c.appPath ?? '')
    case 'open_url':
      return String(c.url ?? '')
    case 'wait':
      return `${c.seconds ?? 2}s`
    case 'type_text': {
      const text = String(c.text ?? '')
      return text.length > 40 ? text.slice(0, 40) + '…' : text
    }
    case 'press_key': {
      const keys = c.keys as string[]
      return keys?.length ? keys.join(' + ') : ''
    }
    case 'move_window':
      return c.maximize ? `${c.processName ?? ''} → maximize` : `${c.processName ?? ''} → ${c.width ?? 1280}×${c.height ?? 720}`
    case 'click_element':
      return `${c.button ?? 'left'} click @ (${c.x ?? 0}, ${c.y ?? 0})`
    case 'wait_for_window':
      return String(c.windowTitle ?? '')
    case 'scroll':
      return `${c.direction ?? 'down'} ${c.amount ?? 3}× @ (${c.x ?? 0}, ${c.y ?? 0})`
    case 'drag_drop':
      return `(${c.x1 ?? 0}, ${c.y1 ?? 0}) → (${c.x2 ?? 0}, ${c.y2 ?? 0})`
    case 'hold_key': {
      const keys = c.keys as string[]
      return keys?.length ? `${keys.join(' + ')} for ${c.duration ?? 1}s` : ''
    }
    case 'focus_window':
    case 'minimize_window':
    case 'close_window':
      return String(c.processName ?? c.windowTitle ?? '')
    case 'kill_process':
      return String(c.processName ?? '')
    case 'login':
      return `Using: ${c.credentialName}`
    case 'show_notification':
      return String(c.title ?? '')
    default:
      return ''
  }
}
