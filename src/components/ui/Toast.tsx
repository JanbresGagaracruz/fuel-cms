'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id:      string
  type:    ToastType
  title:   string
  message?: string
}

interface ToastContextType {
  toast: (type: ToastType, title: string, message?: string) => void
  success: (title: string, message?: string) => void
  error:   (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info:    (title: string, message?: string) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextType>({
  toast:   () => {},
  success: () => {},
  error:   () => {},
  warning: () => {},
  info:    () => {},
})

export const useToast = () => useContext(ToastContext)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev.slice(-4), { id, type, title, message }]) // max 5 at once
    setTimeout(() => remove(id), 4000)
  }, [remove])

  const success = useCallback((t: string, m?: string) => toast('success', t, m), [toast])
  const error   = useCallback((t: string, m?: string) => toast('error',   t, m), [toast])
  const warning = useCallback((t: string, m?: string) => toast('warning', t, m), [toast])
  const info    = useCallback((t: string, m?: string) => toast('info',    t, m), [toast])

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </ToastContext.Provider>
  )
}

// ─── Toast Container ──────────────────────────────────────────────────────────

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed top-5 right-5 z-[200] flex flex-col gap-2 pointer-events-none">
      {[...toasts].reverse().map(t => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  )
}

// ─── Single Toast ─────────────────────────────────────────────────────────────

const ICONS: Record<ToastType, any> = {
  success: CheckCircle,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
}

const STYLES: Record<ToastType, string> = {
  success: 'border-green-500/30 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300',
  error:   'border-red-500/30 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300',
  warning: 'border-amber-500/30 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
  info:    'border-blue-500/30 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
}

const ICON_STYLES: Record<ToastType, string> = {
  success: 'text-green-500',
  error:   'text-red-500',
  warning: 'text-amber-500',
  info:    'text-blue-500',
}

function ToastItem({ toast: t, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const Icon = ICONS[t.type]
  return (
    <div
      className={cn(
        'pointer-events-auto flex items-start gap-3 w-80 rounded-xl border px-4 py-3 shadow-lg animate-fade-up',
        STYLES[t.type],
      )}
    >
      <Icon size={16} className={cn('flex-shrink-0 mt-0.5', ICON_STYLES[t.type])} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-600 leading-snug">{t.title}</p>
        {t.message && <p className="text-xs mt-0.5 opacity-80">{t.message}</p>}
      </div>
      <button
        onClick={() => onRemove(t.id)}
        className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity mt-0.5"
      >
        <X size={13} />
      </button>
    </div>
  )
}
