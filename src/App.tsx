import { useEffect } from 'react'
import { useStore } from '@/store/automationStore'
import { AppLayout } from '@/components/Layout/AppLayout'
import { NotificationToast } from '@/components/common/NotificationToast'
import type { EngineStatus } from '@/types'

export default function App() {
  const { setEngineStatus, fetchAutomations } = useStore()

  // ── Bootstrap ────────────────────────────────────────────────────────────────

  useEffect(() => {
    // Load initial data
    fetchAutomations()

    // Listen for engine status changes from main process
    const unsubStatus = window.flowmate.on(
      'engine:status',
      (payload) => {
        setEngineStatus(payload as EngineStatus)
        if ((payload as EngineStatus).ready) {
          fetchAutomations()
        }
      }
    )

    return () => {
      unsubStatus()
    }
  }, [setEngineStatus, fetchAutomations])

  return (
    <div className="h-screen w-screen overflow-hidden bg-surface-base text-text-primary font-sans">
      <AppLayout />
      <NotificationToast />
    </div>
  )
}
