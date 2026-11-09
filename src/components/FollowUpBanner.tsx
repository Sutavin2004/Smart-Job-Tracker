'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, Calendar, AlertCircle, Clock, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Reminder } from '@/app/api/reminders/route'

const TYPE_ICON: Record<Reminder['type'], React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  interview_soon: Calendar,
  deadline_soon: AlertCircle,
  follow_up_date: Clock,
  stale_application: Bell,
  follow_up_overdue: Bell,
}

const SEEN_KEY = 'reminders-popup-closed'

/**
 * A small popup listing what needs attention, shown once per browser session.
 * Not shown on the dashboard, which already has a "Needs attention" panel.
 */
export function FollowUpBanner() {
  const pathname = usePathname()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try { if (sessionStorage.getItem(SEEN_KEY)) return } catch { /* storage unavailable */ }
    fetch('/api/reminders')
      .then(r => r.json())
      .then((data: Reminder[]) => {
        if (Array.isArray(data) && data.length > 0) { setReminders(data); setOpen(true) }
      })
      .catch(() => null)
  }, [])

  const visible = reminders.filter(r => !dismissed.has(r.id))
  if (!open || visible.length === 0 || pathname === '/') return null

  function close() {
    setOpen(false)
    try { sessionStorage.setItem(SEEN_KEY, '1') } catch { /* ignore */ }
  }

  return (
    <section
      aria-label="Reminders"
      className="fixed bottom-20 left-4 right-4 z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-panel dark:border-[#2A2B2E] dark:bg-[#1A1B1D] sm:left-auto sm:w-80 md:bottom-4"
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5 dark:border-[#2A2B2E]">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
          Needs attention <span className="font-normal tabular-nums text-slate-500">{visible.length}</span>
        </h2>
        <button onClick={close} aria-label="Dismiss all reminders" className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/5 dark:hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
      <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto dark:divide-[#26272A]">
        {visible.slice(0, 6).map(r => {
          const Icon = TYPE_ICON[r.type]
          return (
            <li key={r.id} className="flex items-start gap-3 px-4 py-2.5">
              <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', r.urgency === 'high' ? 'text-red-600 dark:text-red-400' : 'text-slate-500')} strokeWidth={1.75} />
              <div className="min-w-0 flex-1">
                <Link href={`/jobs?id=${r.jobId}`} onClick={close} className="block truncate text-[13px] font-medium text-slate-900 hover:underline dark:text-white">
                  {r.company}, {r.role}
                </Link>
                <p className="text-[12px] leading-snug text-slate-500">{r.message}</p>
              </div>
              <button onClick={() => setDismissed(p => new Set([...p, r.id]))} aria-label={`Dismiss reminder for ${r.company}`} className="mt-0.5 shrink-0 rounded p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          )
        })}
      </ul>
      <Link href="/tasks" onClick={close} className="block border-t border-slate-200 px-4 py-2 text-center text-[13px] text-slate-600 hover:bg-slate-50 dark:border-[#2A2B2E] dark:text-slate-300 dark:hover:bg-white/[0.03]">
        Open tasks
      </Link>
    </section>
  )
}
