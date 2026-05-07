import { useState, useEffect } from 'react'
import { Minus, Square, X, Zap } from 'lucide-react'
import { useStore } from '@/store/automationStore'

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)
  const { engineStatus } = useStore()

  useEffect(() => {
    window.flowmate.window.isMaximized().then(setIsMaximized)
  }, [])

  const handleMinimize  = () => window.flowmate.window.minimize()
  const handleMaximize  = async () => {
    window.flowmate.window.maximize()
    const max = await window.flowmate.window.isMaximized()
    setIsMaximized(max)
  }
  const handleClose = () => window.flowmate.window.close()

  return (
    <div
      className="flex items-center h-10 px-3 border-b border-surface-border
                 drag-region select-none shrink-0 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #16192200 0%, #0d0f14 100%), #0d0f14' }}
    >
      {/* Subtle top shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-px"
           style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(79,142,247,0.4) 50%, transparent 100%)' }} />

      {/* App icon + name */}
      <div className="flex items-center gap-2.5 no-drag">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center relative"
             style={{ background: 'linear-gradient(135deg, #4f8ef7, #7c5ff7)', boxShadow: '0 0 12px rgba(79,142,247,0.5)' }}>
          <Zap size={13} className="text-white" fill="white" />
        </div>

        <span className="text-sm font-bold tracking-tight text-gradient">FlowMate</span>

        {/* Separator */}
        <div className="w-px h-3.5 bg-surface-muted mx-0.5" />

        {/* Engine status */}
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <div className={`w-1.5 h-1.5 rounded-full ${
              engineStatus.ready ? 'bg-accent-success' : 'bg-accent-warning'
            }`} />
            {engineStatus.ready && (
              <div className="absolute inset-0 rounded-full bg-accent-success animate-ping-slow opacity-60" />
            )}
          </div>
          <span className="text-[10px] text-text-muted font-mono">
            {engineStatus.ready ? 'ready' : 'starting…'}
          </span>
        </div>
      </div>

      <div className="flex-1" />

      {/* Window controls */}
      <div className="flex items-center no-drag gap-0.5">
        <WinBtn onClick={handleMinimize} title="Minimize">
          <Minus size={11} />
        </WinBtn>
        <WinBtn onClick={handleMaximize} title={isMaximized ? 'Restore' : 'Maximize'}>
          <Square size={10} />
        </WinBtn>
        <WinBtn onClick={handleClose} title="Close to tray" danger>
          <X size={12} />
        </WinBtn>
      </div>
    </div>
  )
}

function WinBtn({ children, onClick, title, danger }: {
  children: React.ReactNode
  onClick: () => void
  title: string
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-8 h-7 flex items-center justify-center rounded-md
                  transition-all duration-150 text-text-muted
                  ${danger
                    ? 'hover:bg-accent-danger hover:text-white'
                    : 'hover:bg-surface-overlay hover:text-text-primary'
                  }`}
    >
      {children}
    </button>
  )
}
