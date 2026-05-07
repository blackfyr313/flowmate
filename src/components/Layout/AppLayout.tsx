import { useStore } from '@/store/automationStore'
import { TitleBar } from './TitleBar'
import { Sidebar } from './Sidebar'
import { Dashboard } from '@/components/Dashboard/Dashboard'
import { AutomationEditor } from '@/components/AutomationEditor/AutomationEditor'
import { RunHistory } from '@/components/RunHistory/RunHistory'
import { SettingsScreen } from '@/components/Settings/SettingsScreen'

export function AppLayout() {
  const { currentView } = useStore()

  return (
    <div className="flex flex-col h-full">
      {/* Custom Windows title bar */}
      <TitleBar />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          <PageRenderer view={currentView} />
        </main>
      </div>
    </div>
  )
}

function PageRenderer({ view }: { view: string }) {
  switch (view) {
    case 'dashboard':   return <Dashboard />
    case 'editor':      return <AutomationEditor />
    case 'history':     return <RunHistory />
    case 'settings':    return <SettingsScreen />
    default:            return <Dashboard />
  }
}
