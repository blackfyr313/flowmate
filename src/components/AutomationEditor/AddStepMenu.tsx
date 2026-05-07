import { useEffect, useRef } from 'react'
import type { StepType } from '@/types'
import { STEP_TYPE_META } from '@/types'

interface AddStepMenuProps {
  onSelect: (type: StepType) => void
  onClose: () => void
}

const PHASE_1_STEPS: StepType[] = [
  'open_app', 'open_url', 'wait', 'wait_for_window',
  'type_text', 'press_key', 'move_window', 'click_element', 'show_notification',
]

const PHASE_2_STEPS: StepType[] = [
  'scroll', 'drag_drop', 'hold_key',
  'focus_window', 'minimize_window', 'close_window', 'kill_process',
]

const PHASE_3_STEPS: StepType[] = [
  'login', 'run_script', 'clipboard_write', 'clipboard_paste', 'clipboard_read',
  'set_volume', 'lock_screen', 'toggle_night_light', 'set_brightness', 'power_action',
  'system_setting',
]

const PHASE_4_STEPS: StepType[] = [
  'condition', 'loop', 'loop_break', 'variable', 'run_automation',
  'file_create', 'file_copy', 'file_delete', 'file_write', 'file_read', 'file_open',
]

const PHASE_5_STEPS: StepType[] = [
  'wait_for_image', 'ocr_click', 'click_by_image',
  'http_request', 'download_file', 'play_sound', 'send_email', 'text_to_speech',
]

const PHASE_6_STEPS: StepType[] = [
  'use_secret', 'set_audio_device', 'registry_read', 'registry_write', 'env_variable', 'empty_recycle_bin',
]

// Group steps by category
function groupByCategory(steps: StepType[]): Map<string, StepType[]> {
  const grouped = new Map<string, StepType[]>()
  steps.forEach(step => {
    const category = STEP_TYPE_META[step].category
    if (!grouped.has(category)) {
      grouped.set(category, [])
    }
    grouped.get(category)!.push(step)
  })
  return grouped
}

interface PhaseSection {
  title: string
  steps: StepType[]
  disabled?: boolean
}

function renderPhaseSection(section: PhaseSection, onSelect: (type: StepType) => void) {
  const grouped = groupByCategory(section.steps)
  const categories = Array.from(grouped.keys())

  return (
    <div key={section.title}>
      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-widest mb-2 px-1 mt-3">
        {section.title}
      </p>

      {categories.map(category => (
        <div key={category} className="mb-2">
          <p className="text-[9px] font-medium text-text-muted/70 px-2 mb-1">{category}</p>
          <div className="grid grid-cols-2 gap-1 px-1">
            {grouped.get(category)!.map(type => (
              <StepTypeButton
                key={type}
                type={type}
                disabled={section.disabled}
                onClick={() => onSelect(type)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function AddStepMenu({ onSelect, onClose }: AddStepMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 right-0 mt-2 bg-surface-overlay
                 border border-surface-border rounded-2xl shadow-card
                 z-50 animate-slide-in-up max-h-[70vh] overflow-y-auto"
    >
      <div className="p-3">
        {renderPhaseSection(
          { title: 'Phase 1 — Current (Built)', steps: PHASE_1_STEPS },
          onSelect
        )}
        {renderPhaseSection(
          { title: 'Phase 2 — Mouse & Window Control', steps: PHASE_2_STEPS, disabled: true },
          onSelect
        )}
        {renderPhaseSection(
          { title: 'Phase 3 — Clipboard & System Controls', steps: PHASE_3_STEPS, disabled: true },
          onSelect
        )}
        {renderPhaseSection(
          { title: 'Phase 4 — Files & Logic', steps: PHASE_4_STEPS, disabled: true },
          onSelect
        )}
        {renderPhaseSection(
          { title: 'Phase 5 — Smart Vision & Integrations', steps: PHASE_5_STEPS, disabled: true },
          onSelect
        )}
        {renderPhaseSection(
          { title: 'Phase 6 — Advanced & Scripts', steps: PHASE_6_STEPS, disabled: true },
          onSelect
        )}
      </div>
    </div>
  )
}

interface StepTypeButtonProps {
  type: StepType
  onClick: () => void
  disabled?: boolean
}

function StepTypeButton({ type, onClick, disabled }: StepTypeButtonProps) {
  const meta = STEP_TYPE_META[type]

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`
        flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-colors
        ${disabled
          ? 'opacity-40 cursor-not-allowed'
          : 'hover:bg-surface-muted cursor-pointer'
        }
      `}
    >
      <span className="text-base">{meta.icon}</span>
      <span className="text-xs text-text-primary font-medium truncate">{meta.label}</span>
    </button>
  )
}
