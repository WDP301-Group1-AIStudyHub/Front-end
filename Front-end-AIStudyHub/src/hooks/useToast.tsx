import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { CheckCircle2, Info, TriangleAlert, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ToastTone = 'success' | 'error' | 'warning' | 'info'

export type ToastInput = {
  tone: ToastTone
  message: string
}

type ToastItem = ToastInput & {
  id: number
}

type ToastContextValue = {
  showToast: (toast: ToastInput) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const toneStyles: Record<ToastTone, string> = {
  error: 'border-destructive/30 bg-destructive/10 text-destructive',
  info: 'border-sky-400/30 bg-sky-500/10 text-sky-200',
  success: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
  warning: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
}

const toneIcons = {
  error: XCircle,
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback(
    (toast: ToastInput) => {
      const id = Date.now()
      setToasts((current) => [...current, { ...toast, id }].slice(-4))
      window.setTimeout(() => dismiss(id), 4200)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[70] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((toast) => {
          const Icon = toneIcons[toast.tone]

          return (
            <div
              className={`pointer-events-auto flex items-start gap-3 rounded-lg border px-3 py-3 text-sm shadow-lg backdrop-blur ${toneStyles[toast.tone]}`}
              key={toast.id}
              role={toast.tone === 'error' ? 'alert' : 'status'}
            >
              <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <p className="min-w-0 flex-1 leading-5">{toast.message}</p>
              <Button
                aria-label="Dismiss notification"
                className="size-6"
                onClick={() => dismiss(toast.id)}
                size="icon-xs"
                type="button"
                variant="ghost"
              >
                x
              </Button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }

  return context
}
