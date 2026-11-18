'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type { InsightsData } from './types'

const CHOICES = [
  { status: 'interviewing', label: 'Interview', done: 'Moved to Interviewing' },
  { status: 'rejected', label: 'Rejected', done: 'Marked as rejected' },
  { status: 'ghosted', label: 'No reply', done: 'Marked as no reply' },
] as const

function daysSince(iso: string) {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 86400000))
}

/** One-click outcomes for applications that have gone quiet. This is what the learning runs on. */
export function CheckIns({ items, onChange }: { items: InsightsData['checkIns']; onChange: () => void }) {
  const [busy, setBusy] = useState<string | null>(null)
  const [done, setDone] = useState<string[]>([])
  const open = items.filter(i => !done.includes(i.id))
  if (open.length === 0) return null

  async function record(id: string, status: string, message: string) {
    setBusy(id)
    const res = await fetch(`/api/jobs/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    setBusy(null)
    if (!res.ok) return toast.error('Could not save that. Try again.')
    setDone(d => [...d, id])
    toast.success(message)
    onChange()
  }

  return (
    <section aria-labelledby="checkins-heading" className="card p-5">
      <h2 id="checkins-heading" className="text-sm font-semibold text-slate-900 dark:text-white">Any replies?</h2>
      <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
        You sent these over two weeks ago. Telling JobTrack what happened is how it learns what works for you.
      </p>
      <ul className="mt-3 divide-y divide-slate-200 dark:divide-[#2A2B2E]">
        {open.map(job => (
          <li key={job.id} className="py-3 last:pb-0">
            <p className="text-sm font-medium text-slate-900 dark:text-white">{job.company}</p>
            <p className="text-[13px] text-slate-500">{job.role}, applied {daysSince(job.dateApplied)} days ago</p>
            <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label={`What happened with ${job.company}?`}>
              {CHOICES.map(c => (
                <button
                  key={c.status}
                  onClick={() => record(job.id, c.status, c.done)}
                  disabled={busy === job.id}
                  className="rounded-md border border-slate-200 px-2.5 py-1 text-[13px] text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 dark:border-[#2A2B2E] dark:text-slate-300 dark:hover:bg-white/5"
                >
                  {c.label}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
