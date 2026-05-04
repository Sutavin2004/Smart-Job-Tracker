'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, Calendar, AlertCircle, Clock, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Reminder } from '@/app/api/reminders/route'

const TYPE_CONFIG: Record<Reminder['type'], { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  interview_soon: { icon: Calendar, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  deadline_soon: { icon: AlertCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
  follow_up_date: { icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  stale_application: { icon: Bell, color: 'text-brand-600 dark:text-brand-400', bg: 'bg-brand-50 dark:bg-brand-900/20' },
  follow_up_overdue: { icon: Bell, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
}

export function RemindersWidget() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/reminders')
      .then(r => r.json())
      .then((data: Reminder[]) => setReminders(Array.isArray(data) ? data.slice(0, 5) : []))
      .catch(() => setReminders([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="card p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-4 h-4 text-brand-500" />
          <span className="text-sm font-semibold">Reminders</span>
        </div>
        <div className="space-y-2">
          {[1, 2].map(i => <div key={i} className="h-10 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" />)}
        </div>
      </div>
    )
  }

  if (reminders.length === 0) {
    return (
      <div className="card p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-4 h-4 text-brand-500" />
          <span className="text-sm font-semibold">Reminders</span>
        </div>
        <p className="text-xs text-slate-400 text-center py-3">All caught up! 🎉</p>
      </div>
    )
  }

  return (
    <div className="card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-brand-500" />
          <span className="text-sm font-semibold">Reminders</span>
        </div>
        <span className={cn(
          'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
          reminders.some(r => r.urgency === 'high')
            ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
        )}>
          {reminders.length}
        </span>
      </div>

      <div className="space-y-2">
        {reminders.map(reminder => {
          const cfg = TYPE_CONFIG[reminder.type]
          const Icon = cfg.icon
          return (
            <Link
              key={reminder.id}
              href={`/jobs?id=${reminder.jobId}`}
              className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
            >
              <div className={cn('w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5', cfg.bg)}>
                <Icon className={cn('w-3 h-3', cfg.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                  {reminder.company}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{reminder.message}</p>
              </div>
              <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-slate-500 shrink-0 mt-1" />
            </Link>
          )
        })}
      </div>

      <Link
        href="/tasks"
        className="flex items-center justify-center gap-1 mt-3 text-xs text-brand-600 dark:text-brand-400 hover:underline"
      >
        View all tasks <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  )
}
