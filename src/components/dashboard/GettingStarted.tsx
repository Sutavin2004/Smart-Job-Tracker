'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  hasProfile: boolean
  hasRunAgent: boolean
  hasApplied: boolean
  onAddJob: () => void
}

/** First-run checklist. Hides itself once every step is done or the user dismisses it. */
export function GettingStarted({ hasProfile, hasRunAgent, hasApplied, onAddJob }: Props) {
  const [dismissed, setDismissed] = useState(true)
  useEffect(() => {
    try { setDismissed(localStorage.getItem('onboarding-dismissed') === '1') } catch { setDismissed(false) }
  }, [])

  const steps = [
    { done: hasProfile, title: 'Tell the agent what you want', body: 'Add your target roles, skills and locations.', href: '/agent' },
    { done: hasRunAgent, title: 'Run the job agent', body: 'It searches live job boards and saves your best matches.', href: '/agent' },
    { done: hasApplied, title: 'Track your first application', body: 'Move a job to Applied, or add one you already sent.', action: onAddJob },
  ]
  const doneCount = steps.filter(s => s.done).length
  if (dismissed || doneCount === steps.length) return null

  function dismiss() {
    setDismissed(true)
    try { localStorage.setItem('onboarding-dismissed', '1') } catch { /* ignore */ }
  }

  return (
    <section aria-labelledby="getting-started" className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="getting-started" className="text-sm font-semibold text-slate-900 dark:text-white">Set up your search</h2>
          <p className="mt-0.5 text-[13px] text-slate-500">{doneCount} of {steps.length} done</p>
        </div>
        <button onClick={dismiss} aria-label="Hide setup steps" className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/5 dark:hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
      <ol className="mt-3 grid gap-1 md:grid-cols-3 md:gap-3">
        {steps.map((step, i) => {
          const inner = (
            <>
              <span className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums',
                step.done ? 'bg-brand-600 text-white' : 'border border-slate-300 text-slate-500 dark:border-[#34353A] dark:text-slate-400'
              )}>
                {step.done ? <Check className="h-3 w-3" strokeWidth={2.5} /> : i + 1}
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className={cn('block text-sm font-medium', step.done ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-900 dark:text-white')}>{step.title}</span>
                {!step.done && <span className="mt-0.5 block text-[13px] leading-snug text-slate-500">{step.body}</span>}
              </span>
              {!step.done && <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 md:hidden" />}
            </>
          )
          const cls = 'flex h-full w-full items-start gap-3 rounded-lg border border-transparent p-2.5 transition-colors hover:border-slate-200 hover:bg-slate-50 dark:hover:border-[#2A2B2E] dark:hover:bg-white/[0.03]'
          return (
            <li key={step.title}>
              {step.done ? <div className={cls}>{inner}</div>
                : step.href ? <Link href={step.href} className={cls}>{inner}</Link>
                : <button onClick={step.action} className={cls}>{inner}</button>}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
