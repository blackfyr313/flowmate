import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { engineApi } from '@/utils/engineApi'

interface WindowEntry {
  processName: string
  windowTitle: string
  pid: number
}

interface ProcessPickerProps {
  label: string
  value: string
  onChange: (processName: string, windowTitle: string) => void
  placeholder?: string
}

export function ProcessPicker({ label, value, onChange, placeholder }: ProcessPickerProps) {
  const [windows, setWindows] = useState<WindowEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const list = await engineApi.getOpenWindows()
      setWindows(list)
    } catch {
      setError('Could not fetch open windows.')
    } finally {
      setLoading(false)
    }
  }

  // Load once on mount
  useEffect(() => { load() }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="label mb-0">{label}</label>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors"
          title="Refresh list"
        >
          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error ? (
        <p className="text-xs text-accent-danger mt-1">{error}</p>
      ) : windows.length === 0 && !loading ? (
        <p className="text-xs text-text-muted mt-1">No open windows found. Make sure the app is running.</p>
      ) : (
        <select
          className="input"
          value={value}
          onChange={e => {
            const selected = windows.find(w => w.processName === e.target.value)
            onChange(e.target.value, selected?.windowTitle ?? '')
          }}
        >
          <option value="">
            {loading ? 'Loading…' : placeholder ?? '— Select an open app —'}
          </option>
          {windows.map(w => (
            <option key={w.pid} value={w.processName}>
              {w.windowTitle}  ({w.processName})
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
