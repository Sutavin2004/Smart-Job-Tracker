'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, X, Calendar, AlertCircle, Clock, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Reminder } from '@/app/api/reminders/route'

const TYPE_CONFIG: Record<Reminder['type'], { icon: React.ComponentType<{ className?: string }>; label: string }> = {
  interview_soon: { icon: Calendar, label: 'Interview soon' },
  deadline_soon: { icon: AlertCircle, label: 'Deadline soon' },
  follow_up_date: { icon: Clock, label: 'Follow-up overdue' },
  stale_application: { icon: Bell, label: 'Follow up' },
  follow_up_overdue: { icon: Bell, label: 'Follow-up needed' },
}

export function FollowUpBanner() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetch('/api/reminders')
      .then(r => r.json())
      .then((data: Reminder[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setReminders(data)
          setOpen(true)
        }
      })
      .catch(() => null)
  }, [])

  const visible = reminders.filter(r => !dismissed.has(r.id))
  const highUrgency = visible.filter(r => r.urgency === 'high')

  if (!open || visible.length === 0) return null

  function dismiss(id: string) {
    setDismissed(prev => new Set([...prev, id]))
  }

  function dismissAll() {
    setOpen(false)
  }

  return (
    <div className={cn(
      'fixed bottom-4 right-4 z-50 w-80 rounded-2xl shadow-2xl border overflow-hidden',
      highUrgency.length > 0
        ? 'bg-amber-50 dark:bg-amber-900/90 border-amber-200 dark:border-amber-700'
        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
    )}>
      {/* Header */}
      <div className={cn(
        'flex items-center justify-between px-4 py-3 border-b',
        highUrgency.length > 0
          ? 'border-amber-200 dark:border-amber-700 bg-amber-100/60 dark:bg-amber-800/40'
          : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50'
      )}>
        <div className="flex items-center gap-2">
          <Bell className={cn('w-4 h-4', highUrgency.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-brand-500')} />
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            {visible.length} Reminder{visible.length !== 1 ? 's' : ''}
          </span>
          {highUrgency.length > 0 && (
            <span className="text-[10px] font-bold bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full">
              {highUrgency.length} urgent
            </span>
          )}
        </div>
        <button onClick={dismissAll} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Reminder list */}
      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
        {visible.slice(0, 6).map(reminder => {
          const cfg = TYPE_CONFIG[reminder.type]
          const Icon = cfg.icon
          return (
            <div key={reminder.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
              <div className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                reminder.urgency === 'high' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-brand-50 dark:bg-brand-900/20'
              )}>
                <Icon className={cn('w-3.5 h-3.5', reminder.urgency === 'high' ? 'text-red-600 dark:text-red-400' : 'text-brand-500')} />
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/jobs?id=${reminder.jobId}`}
                  className="text-xs font-semibold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 truncate block"
                  onClick={dismissAll}
                >
                  {reminder.company} — {reminder.role}
                </Link>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                  {reminder.message}
                </p>
              </div>
              <button
                onClick={() => dismiss(reminder.id)}
                className="text-slate-300 hover:text-slate-500 dark:hover:text-slate-300 shrink-0 mt-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <Link
        href="/tasks"
        onClick={dismissAll}
        className={cn(
          'flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium border-t transition-colors',
          'border-slate-100 dark:border-slate-700 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20'
        )}
      >
        View all tasks <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  )
}
