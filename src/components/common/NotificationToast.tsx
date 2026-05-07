import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { useStore } from '@/store/automationStore'
import type { Notification } from '@/types'

export function NotificationToast() {
  const { notifications, removeNotification } = useStore()

  if (notifications.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
      {notifications.map(notif => (
        <ToastItem
          key={notif.id}
          notification={notif}
          onClose={() => removeNotification(notif.id)}
        />
      ))}
    </div>
  )
}

interface ToastItemProps {
  notification: Notification
  onClose: () => void
}

function ToastItem({ notification, onClose }: ToastItemProps) {
  const { type, title, message } = notification

  const styles = {
    success: {
      bg: 'bg-surface-raised border-accent-success/30',
      icon: <CheckCircle2 size={16} className="text-accent-success shrink-0" />,
    },
    error: {
      bg: 'bg-surface-raised border-accent-danger/30',
      icon: <AlertCircle size={16} className="text-accent-danger shrink-0" />,
    },
    warning: {
      bg: 'bg-surface-raised border-accent-warning/30',
      icon: <AlertTriangle size={16} className="text-accent-warning shrink-0" />,
    },
    info: {
      bg: 'bg-surface-raised border-accent-primary/30',
      icon: <Info size={16} className="text-accent-primary shrink-0" />,
    },
  }

  const { bg, icon } = styles[type]

  return (
    <div
      className={`
        flex items-start gap-3 p-3.5 rounded-xl border shadow-card
        animate-slide-in-up ${bg}
      `}
    >
      <div className="mt-0.5">{icon}</div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        {message && (
          <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{message}</p>
        )}
      </div>

      <button
        onClick={onClose}
        className="btn-ghost p-1 shrink-0 mt-0.5"
      >
        <X size={13} />
      </button>
    </div>
  )
}
