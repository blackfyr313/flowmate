import { contextBridge, ipcRenderer } from 'electron'

// ─── Type Definitions ─────────────────────────────────────────────────────────
// These types are shared with the renderer via window.flowmate

export interface EngineResponse<T = unknown> {
  data?: T
  error?: string
  status: number
}

export interface FlowMateAPI {
  // Engine HTTP proxy — all automation calls go through here
  engine: {
    get<T>(path: string): Promise<EngineResponse<T>>
    post<T>(path: string, body: unknown): Promise<EngineResponse<T>>
    put<T>(path: string, body: unknown): Promise<EngineResponse<T>>
    delete<T>(path: string): Promise<EngineResponse<T>>
  }

  // Window controls (custom title bar)
  window: {
    minimize(): void
    maximize(): void
    close(): void
    isMaximized(): Promise<boolean>
  }

  // Cursor utilities
  cursor: {
    pick(): Promise<{ x: number; y: number }>
  }

  // Events from main process
  on(channel: string, listener: (...args: unknown[]) => void): () => void

  // App info
  getVersion(): Promise<string>
  getDataPath(): Promise<string>

  // Persistent settings
  settings: {
    get(): Promise<Record<string, unknown>>
    set(key: string, value: unknown): Promise<Record<string, unknown>>
  }
}

// ─── Engine Proxy ─────────────────────────────────────────────────────────────
// All calls are routed through IPC → main process → Python engine
// This keeps the renderer sandboxed and the engine port unexposed to web

const engineProxy = {
  async get<T>(path: string): Promise<EngineResponse<T>> {
    return ipcRenderer.invoke('engine:request', { method: 'GET', path })
  },
  async post<T>(path: string, body: unknown): Promise<EngineResponse<T>> {
    return ipcRenderer.invoke('engine:request', { method: 'POST', path, body })
  },
  async put<T>(path: string, body: unknown): Promise<EngineResponse<T>> {
    return ipcRenderer.invoke('engine:request', { method: 'PUT', path, body })
  },
  async delete<T>(path: string): Promise<EngineResponse<T>> {
    return ipcRenderer.invoke('engine:request', { method: 'DELETE', path })
  },
}

// ─── Expose to Renderer ───────────────────────────────────────────────────────

contextBridge.exposeInMainWorld('flowmate', {
  engine: engineProxy,

  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  },

  on: (channel: string, listener: (...args: unknown[]) => void) => {
    const ALLOWED_CHANNELS = ['engine:status', 'automation:run-update', 'app:notification']

    if (!ALLOWED_CHANNELS.includes(channel)) {
      console.warn(`[Preload] Blocked subscription to unlisted channel: ${channel}`)
      return () => {}
    }

    const wrapped = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => {
      listener(...args)
    }

    ipcRenderer.on(channel, wrapped)

    // Return cleanup function
    return () => ipcRenderer.removeListener(channel, wrapped)
  },

  cursor: {
    pick: () => ipcRenderer.invoke('cursor:pick'),
  },

  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  getDataPath: () => ipcRenderer.invoke('app:getDataPath'),

  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (key: string, value: unknown) => ipcRenderer.invoke('settings:set', key, value),
  },
} satisfies FlowMateAPI)

// ─── TypeScript Global Declaration ───────────────────────────────────────────
// This makes window.flowmate typed in the renderer

declare global {
  interface Window {
    flowmate: FlowMateAPI
  }
}
