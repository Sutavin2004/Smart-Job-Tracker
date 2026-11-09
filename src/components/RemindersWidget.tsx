'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, Calendar, AlertCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Reminder } from '@/app/api/reminders/route'

const TYPE_CONFIG: Record<Reminder['type'], { icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; color: string; bg: string }> = {
  interview_soon: { icon: Calendar, color: 'text-sky-700 dark:text-sky-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
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

  return (
    <section className="card" aria-labelledby="reminders-heading">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-[#2A2B2E]">
        <h2 id="reminders-heading" className="text-sm font-semibold text-slate-900 dark:text-white">
          Needs attention
          {reminders.length > 0 && <span className="ml-1.5 font-normal tabular-nums text-slate-500">{reminders.length}</span>}
        </h2>
        <Link href="/tasks" className="text-[13px] text-slate-500 hover:text-slate-900 dark:hover:text-white">Tasks</Link>
      </div>
      {loading ? (
        <div className="space-y-2 p-4">{[1, 2].map(i => <div key={i} className="h-9 animate-pulse rounded bg-slate-100 dark:bg-[#222326]" />)}</div>
      ) : reminders.length === 0 ? (
        <p className="px-5 py-5 text-[13px] text-slate-500">Nothing is waiting on you. Follow-ups and upcoming interviews will appear here.</p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-[#26272A]">
          {reminders.map(reminder => {
            const cfg = TYPE_CONFIG[reminder.type]
            const Icon = cfg.icon
            return (
              <li key={reminder.id}>
                <Link href={`/jobs?id=${reminder.jobId}`} className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                  <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', cfg.color)} strokeWidth={1.75} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-slate-900 dark:text-white">{reminder.company}</span>
                    <span className="block text-[13px] leading-snug text-slate-500">{reminder.message}</span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
