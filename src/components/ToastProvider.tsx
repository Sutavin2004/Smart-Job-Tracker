'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
}

const ToastContext = createContext<{
  toast: (message: string, type?: ToastType) => void
}>({ toast: () => {} })

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  const dismiss = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={cn(
              'flex items-start gap-3 p-3.5 rounded-xl shadow-lg border pointer-events-auto',
              'animate-in slide-in-from-bottom-2 fade-in duration-200',
              t.type === 'success' && 'bg-green-50 border-green-200 dark:bg-green-900/40 dark:border-green-700',
              t.type === 'error' && 'bg-red-50 border-red-200 dark:bg-red-900/40 dark:border-red-700',
              t.type === 'info' && 'bg-blue-50 border-blue-200 dark:bg-blue-900/40 dark:border-blue-700',
            )}
          >
            {t.type === 'success' && <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />}
            {t.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />}
            {t.type === 'info' && <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />}
            <p className="text-sm flex-1 text-slate-800 dark:text-slate-200">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-slate-600 shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
