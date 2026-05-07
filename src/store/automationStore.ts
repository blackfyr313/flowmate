import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type {
  ActiveRun,
  Automation,
  AutomationRun,
  AppView,
  Notification,
  EngineStatus,
  RunAction,
} from '@/types'
import { engineApi } from '@/utils/engineApi'

// ─── State Shape ──────────────────────────────────────────────────────────────

interface AutomationStore {
  engineStatus: EngineStatus
  setEngineStatus(status: EngineStatus): void

  currentView: AppView
  selectedAutomationId: string | null
  navigateTo(view: AppView, automationId?: string): void

  automations: Automation[]
  isLoadingAutomations: boolean
  fetchAutomations(): Promise<void>
  createAutomation(data: Omit<Automation, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Automation>
  updateAutomation(id: string, data: Partial<Automation>): Promise<void>
  deleteAutomation(id: string): Promise<void>

  // ── Active Runs ──────────────────────────────────────────────────────────────
  activeRuns: Map<string, ActiveRun>
  runPollers: Map<string, ReturnType<typeof setInterval>>
  startRun(automationId: string): Promise<void>
  stopRun(automationId: string): Promise<void>
  sendAction(automationId: string, action: RunAction): Promise<void>
  _startPolling(automationId: string, runId: string): void
  _stopPolling(automationId: string): void

  // ── Run History ─────────────────────────────────────────────────────────────
  runHistory: AutomationRun[]
  fetchRunHistory(automationId?: string): Promise<void>

  // ── Notifications ────────────────────────────────────────────────────────────
  notifications: Notification[]
  addNotification(n: Omit<Notification, 'id'>): void
  removeNotification(id: string): void

  getSelectedAutomation(): Automation | undefined
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useStore = create<AutomationStore>()(
  subscribeWithSelector((set, get) => ({
    // ── Engine ────────────────────────────────────────────────────────────────
    engineStatus: { ready: false },

    setEngineStatus(status) {
      set({ engineStatus: status })
    },

    // ── Navigation ────────────────────────────────────────────────────────────
    currentView: 'dashboard',
    selectedAutomationId: null,

    navigateTo(view, automationId) {
      set({
        currentView: view,
        selectedAutomationId: automationId ?? get().selectedAutomationId,
      })
    },

    // ── Automations ───────────────────────────────────────────────────────────
    automations: [],
    isLoadingAutomations: false,

    async fetchAutomations() {
      set({ isLoadingAutomations: true })
      try {
        const automations = await engineApi.listAutomations()
        set({ automations })
      } catch (err) {
        get().addNotification({
          type: 'error',
          title: 'Failed to load automations',
          message: err instanceof Error ? err.message : String(err),
        })
      } finally {
        set({ isLoadingAutomations: false })
      }
    },

    async createAutomation(data) {
      const automation = await engineApi.createAutomation(data)
      set(state => ({ automations: [...state.automations, automation] }))
      get().addNotification({ type: 'success', title: `"${automation.name}" created`, duration: 3000 })
      return automation
    },

    async updateAutomation(id, data) {
      const updated = await engineApi.updateAutomation(id, data)
      set(state => ({
        automations: state.automations.map(a => a.id === id ? updated : a),
      }))
    },

    async deleteAutomation(id) {
      const name = get().automations.find(a => a.id === id)?.name ?? 'Automation'
      // Optimistically remove from UI state before the API call
      set(state => ({
        automations: state.automations.filter(a => a.id !== id),
        selectedAutomationId: state.selectedAutomationId === id ? null : state.selectedAutomationId,
        currentView: state.selectedAutomationId === id ? 'dashboard' : state.currentView,
      }))
      try {
        await engineApi.deleteAutomation(id)
        get().addNotification({ type: 'info', title: `"${name}" deleted`, duration: 3000 })
      } catch (err) {
        // Rollback: re-fetch to restore the automation if the API call failed
        get().fetchAutomations()
        get().addNotification({
          type: 'error',
          title: `Failed to delete "${name}"`,
          message: err instanceof Error ? err.message : String(err),
        })
      }
    },

    // ── Running ───────────────────────────────────────────────────────────────
    activeRuns: new Map(),
    runPollers: new Map(),

    async startRun(automationId) {
      set(state => ({
        automations: state.automations.map(a =>
          a.id === automationId ? { ...a, status: 'running' as const } : a
        ),
      }))

      try {
        const { runId } = await engineApi.runAutomation(automationId)
        get()._startPolling(automationId, runId)
      } catch (err) {
        const auto = get().automations.find(a => a.id === automationId)
        set(state => ({
          automations: state.automations.map(a =>
            a.id === automationId ? { ...a, status: 'error' as const } : a
          ),
        }))
        get().addNotification({
          type: 'error',
          title: `Failed to start "${auto?.name ?? 'automation'}"`,
          message: err instanceof Error ? err.message : String(err),
        })
      }
    },

    async stopRun(automationId) {
      await engineApi.stopAutomation(automationId)
      get()._stopPolling(automationId)
      set(state => {
        const runs = new Map(state.activeRuns)
        runs.delete(automationId)
        return {
          activeRuns: runs,
          automations: state.automations.map(a =>
            a.id === automationId ? { ...a, status: 'idle' as const } : a
          ),
        }
      })
    },

    async sendAction(automationId, action) {
      const activeRun = get().activeRuns.get(automationId)
      if (!activeRun) return

      try {
        await engineApi.sendRunAction(activeRun.runId, action)
        // If stopping, clean up immediately
        if (action === 'stop') {
          get()._stopPolling(automationId)
          set(state => {
            const runs = new Map(state.activeRuns)
            runs.delete(automationId)
            return {
              activeRuns: runs,
              automations: state.automations.map(a =>
                a.id === automationId ? { ...a, status: 'error' as const } : a
              ),
            }
          })
        }
      } catch (err) {
        get().addNotification({
          type: 'error',
          title: 'Failed to send action',
          message: err instanceof Error ? err.message : String(err),
        })
      }
    },

    _startPolling(automationId, runId) {
      // Seed activeRuns immediately so UI shows running state
      set(state => {
        const runs = new Map(state.activeRuns)
        runs.set(automationId, {
          automationId, runId, status: 'running',
          stepResults: [], currentStepIndex: 0,
        })
        return { activeRuns: runs }
      })

      const interval = setInterval(async () => {
        try {
          const run = await engineApi.getRun(runId)
          const isFinished = run.completedAt != null

          // Derive a UI status from the engine's run state
          let status: ActiveRun['status']
          if (run.runStatus === 'paused') {
            status = 'paused'
          } else if (isFinished) {
            status = run.success ? 'success' : 'error'
          } else {
            status = 'running'
          }

          const activeRun: ActiveRun = {
            automationId,
            runId,
            status,
            stepResults: run.stepResults.map(r => ({ ...r, retryCount: r.retryCount ?? 0 })),
            currentStepIndex: run.currentStepIndex ?? 0,
            failedStepId: run.failedStepId,
            error: run.error,
          }

          set(state => {
            const runs = new Map(state.activeRuns)
            if (isFinished) {
              runs.delete(automationId)
            } else {
              runs.set(automationId, activeRun)
            }
            return {
              activeRuns: runs,
              automations: state.automations.map(a => {
                if (a.id !== automationId) return a
                return {
                  ...a,
                  status,
                  ...(isFinished ? {
                    lastRunAt: run.completedAt,
                    lastRunSuccess: run.success,
                  } : {}),
                }
              }),
            }
          })

          if (isFinished) {
            get()._stopPolling(automationId)

            if (run.success) {
              const name = get().automations.find(a => a.id === automationId)?.name
              get().addNotification({
                type: 'success',
                title: `"${name}" completed`,
                message: `${run.stepResults.length} steps ran successfully`,
                duration: 4000,
              })
            } else if (run.runStatus !== 'stopped') {
              const name = get().automations.find(a => a.id === automationId)?.name
              get().addNotification({
                type: 'error',
                title: `"${name}" failed`,
                message: run.error ?? 'An unexpected error occurred',
              })
            }

            if (get().currentView === 'history') get().fetchRunHistory()
          }
        } catch {
          // Engine temporarily unreachable — keep polling
        }
      }, 500)

      set(state => {
        const pollers = new Map(state.runPollers)
        pollers.set(automationId, interval)
        return { runPollers: pollers }
      })
    },

    _stopPolling(automationId) {
      const interval = get().runPollers.get(automationId)
      if (interval != null) clearInterval(interval)
      set(state => {
        const pollers = new Map(state.runPollers)
        pollers.delete(automationId)
        return { runPollers: pollers }
      })
    },

    // ── Run History ───────────────────────────────────────────────────────────
    runHistory: [],

    async fetchRunHistory(automationId) {
      try {
        const history = await engineApi.getRunHistory(automationId)
        set({ runHistory: history })
      } catch (err) {
        console.error('Failed to fetch run history:', err)
      }
    },

    // ── Notifications ─────────────────────────────────────────────────────────
    notifications: [],

    addNotification(n) {
      const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const notification: Notification = { id, duration: 5000, ...n }
      set(state => ({ notifications: [...state.notifications, notification] }))
      if (notification.duration && notification.duration > 0) {
        setTimeout(() => get().removeNotification(id), notification.duration)
      }
    },

    removeNotification(id) {
      set(state => ({ notifications: state.notifications.filter(n => n.id !== id) }))
    },

    getSelectedAutomation() {
      const { automations, selectedAutomationId } = get()
      return automations.find(a => a.id === selectedAutomationId)
    },
  }))
)
