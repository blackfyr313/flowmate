import { ipcMain, app } from 'electron'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

export interface AppSettings {
  startOnLogin: boolean
  minimizeToTray: boolean
}

interface SetupOptions {
  engineHost: string
  userData: string
  onSettingsChange(settings: AppSettings): void
}

interface EngineRequestPayload {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  body?: unknown
}

// ─── Setup ────────────────────────────────────────────────────────────────────

export function loadSettings(userData: string): AppSettings {
  const settingsPath = join(userData, 'settings.json')
  try {
    if (existsSync(settingsPath)) {
      const parsed = JSON.parse(readFileSync(settingsPath, 'utf-8'))
      return {
        startOnLogin: Boolean(parsed.startOnLogin),
        minimizeToTray: parsed.minimizeToTray !== false,
      }
    }
  } catch {
    // Corrupt file — fall through to defaults
  }
  return { startOnLogin: false, minimizeToTray: true }
}

export function setupIpcHandlers({ engineHost, userData, onSettingsChange }: SetupOptions): void {
  // ── Engine HTTP Proxy ──────────────────────────────────────────────────────
  // The renderer cannot call fetch() to localhost directly (CORS + security).
  // All engine requests go through this handler in the main process.

  ipcMain.handle('engine:request', async (_event, payload: EngineRequestPayload) => {
    const { method, path, body } = payload
    const url = `${engineHost}${path}`

    try {
      const options: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
      }

      if (body !== undefined && method !== 'GET') {
        options.body = JSON.stringify(body)
      }

      const res = await fetch(url, options)

      let data: unknown
      const contentType = res.headers.get('content-type') ?? ''

      if (contentType.includes('application/json')) {
        data = await res.json()
      } else {
        data = await res.text()
      }

      return {
        status: res.status,
        data: res.ok ? data : undefined,
        error: !res.ok ? (typeof data === 'object' && data !== null && 'detail' in data
          ? String((data as Record<string, unknown>).detail)
          : `Request failed with status ${res.status}`)
          : undefined,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return {
        status: 0,
        error: `Engine is not responding. Make sure the automation engine is running. (${message})`,
      }
    }
  })

  // ── App Info ───────────────────────────────────────────────────────────────

  ipcMain.handle('app:getVersion', () => app.getVersion())
  ipcMain.handle('app:getDataPath', () => userData)

  // ── Settings ───────────────────────────────────────────────────────────────

  const settingsPath = join(userData, 'settings.json')

  function readSettings(): AppSettings {
    return loadSettings(userData)
  }

  function writeSettings(data: Record<string, unknown>): void {
    writeFileSync(settingsPath, JSON.stringify(data, null, 2), 'utf-8')
  }

  ipcMain.handle('settings:get', () => readSettings())

  ipcMain.handle('settings:set', (_event, key: string, value: unknown) => {
    const current: Record<string, unknown> = { ...readSettings() }
    current[key] = value
    writeSettings(current)

    onSettingsChange(current as unknown as AppSettings)

    if (key === 'startOnLogin') {
      app.setLoginItemSettings({ openAtLogin: Boolean(value), openAsHidden: true })
    }

    return current
  })

}
