import type { Automation, AutomationRun, EngineStatus, RunAction } from '@/types'

export class ApiCallError extends Error {
  constructor(
    public readonly message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'ApiCallError'
  }
}

async function call<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  let result

  switch (method) {
    case 'GET':    result = await window.flowmate.engine.get<T>(path); break
    case 'POST':   result = await window.flowmate.engine.post<T>(path, body); break
    case 'PUT':    result = await window.flowmate.engine.put<T>(path, body); break
    case 'DELETE': result = await window.flowmate.engine.delete<T>(path); break
  }

  if (result.error) throw new ApiCallError(result.error, result.status)
  return result.data as T
}

export const engineApi = {
  async getHealth(): Promise<EngineStatus> {
    return call<EngineStatus>('GET', '/health')
  },

  async listAutomations(): Promise<Automation[]> {
    return call<Automation[]>('GET', '/automations')
  },

  async getAutomation(id: string): Promise<Automation> {
    return call<Automation>('GET', `/automations/${id}`)
  },

  async createAutomation(data: Omit<Automation, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Automation> {
    return call<Automation>('POST', '/automations', data)
  },

  async updateAutomation(id: string, data: Partial<Automation>): Promise<Automation> {
    return call<Automation>('PUT', `/automations/${id}`, data)
  },

  async deleteAutomation(id: string): Promise<void> {
    return call<void>('DELETE', `/automations/${id}`)
  },

  async runAutomation(id: string): Promise<{ runId: string }> {
    return call<{ runId: string }>('POST', `/automations/${id}/run`)
  },

  async stopAutomation(id: string): Promise<void> {
    return call<void>('POST', `/automations/${id}/stop`)
  },

  async sendRunAction(runId: string, action: RunAction): Promise<void> {
    return call<void>('POST', `/runs/${runId}/action`, { action })
  },

  async testStep(automationId: string, stepId: string): Promise<{ success: boolean; error?: string; durationMs: number }> {
    return call('POST', `/automations/${automationId}/steps/${stepId}/test`)
  },

  async getRunHistory(automationId?: string, limit = 50): Promise<AutomationRun[]> {
    const params = new URLSearchParams({ limit: String(limit) })
    if (automationId) params.set('automation_id', automationId)
    return call<AutomationRun[]>('GET', `/runs?${params.toString()}`)
  },

  async getRun(runId: string): Promise<AutomationRun> {
    return call<AutomationRun>('GET', `/runs/${runId}`)
  },

  async getOpenWindows(): Promise<{ processName: string; windowTitle: string; pid: number }[]> {
    return call('GET', '/windows')
  },
}
