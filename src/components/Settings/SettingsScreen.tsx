import { useState, useEffect } from 'react'
import { Download, Upload, Info, Loader2 } from 'lucide-react'

import { useStore } from '@/store/automationStore'

export function SettingsScreen() {
  const { automations, addNotification } = useStore()
  const [startOnLogin, setStartOnLogin] = useState(false)
  const [minimizeToTray, setMinimizeToTray] = useState(true)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  useEffect(() => {
    window.flowmate.settings.get().then(s => {
      setStartOnLogin(Boolean(s.startOnLogin))
      setMinimizeToTray(s.minimizeToTray !== false)
      setSettingsLoaded(true)
    })
  }, [])

  const setSetting = async (key: string, value: unknown) => {
    await window.flowmate.settings.set(key, value)
  }

  const handleExport = () => {
    const data = JSON.stringify({ automations, exportedAt: new Date().toISOString() }, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `flowmate-backup-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    addNotification({ type: 'success', title: 'Automations exported', duration: 3000 })
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        addNotification({
          type: 'info',
          title: 'Import ready',
          message: `Found ${data.automations?.length ?? 0} automations. Full import coming in a future update.`,
        })
      } catch {
        addNotification({ type: 'error', title: 'Invalid file', message: 'Could not read the backup file.' })
      }
    }
    input.click()
  }

  return (
    <div className="h-full overflow-y-auto px-8 py-6 animate-fade-in max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">Settings</h1>
        <p className="text-sm text-text-secondary mt-1">Manage app behavior and data</p>
      </div>

      {/* Startup section */}
      <SettingsSection title="Startup">
        <SettingsRow
          label="Start FlowMate on Windows login"
          description="FlowMate will launch minimized to the system tray when you log in."
        >
          {settingsLoaded ? (
            <Toggle
              checked={startOnLogin}
              onChange={v => { setStartOnLogin(v); setSetting('startOnLogin', v) }}
            />
          ) : <Loader2 size={16} className="animate-spin text-text-muted" />}
        </SettingsRow>
        <SettingsRow
          label="Minimize to tray on close"
          description="Clicking the X button hides FlowMate instead of quitting it."
        >
          {settingsLoaded ? (
            <Toggle
              checked={minimizeToTray}
              onChange={v => { setMinimizeToTray(v); setSetting('minimizeToTray', v) }}
            />
          ) : <Loader2 size={16} className="animate-spin text-text-muted" />}
        </SettingsRow>
      </SettingsSection>

      {/* Data section */}
      <SettingsSection title="Data">
        <SettingsRow
          label="Export automations"
          description="Download all your automations as a JSON file for backup or sharing."
        >
          <button onClick={handleExport} className="btn-secondary text-xs gap-1.5">
            <Download size={13} />
            Export
          </button>
        </SettingsRow>
        <SettingsRow
          label="Import automations"
          description="Load automations from a previously exported JSON file."
        >
          <button onClick={handleImport} className="btn-secondary text-xs gap-1.5">
            <Upload size={13} />
            Import
          </button>
        </SettingsRow>
      </SettingsSection>

      {/* About section */}
      <SettingsSection title="About">
        <div className="flex items-start gap-3 p-3 bg-surface-overlay rounded-xl">
          <Info size={15} className="text-accent-primary shrink-0 mt-0.5" />
          <div className="text-xs text-text-secondary space-y-1">
            <p><span className="text-text-primary font-medium">FlowMate</span> — Windows Automation Engine</p>
            <p>Version 1.0.0 — Phase 1 MVP</p>
            <p className="text-text-muted">
              Engine: Python + FastAPI · UI: Electron + React + TypeScript
            </p>
          </div>
        </div>
      </SettingsSection>
    </div>
  )
}

// ─── Components ───────────────────────────────────────────────────────────────

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-3">
        {title}
      </h2>
      <div className="card divide-y divide-surface-border overflow-hidden">
        {children}
      </div>
    </div>
  )
}

function SettingsRow({
  label, description, children
}: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5">
      <div className="flex-1">
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {description && (
          <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`
        relative w-10 h-5 rounded-full transition-colors duration-200
        ${checked ? 'bg-accent-primary' : 'bg-surface-muted'}
      `}
    >
      <span
        className={`
          absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200
          ${checked ? 'translate-x-5' : 'translate-x-0.5'}
        `}
      />
    </button>
  )
}
