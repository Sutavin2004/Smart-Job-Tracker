'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, ChevronRight, X, Rocket } from 'lucide-react'
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
    { done: hasRunAgent, title: 'Run the AI Job Agent', body: 'It searches live job boards and saves your best matches.', href: '/agent' },
    { done: hasApplied, title: 'Track your first application', body: 'Move a job to Applied, or add one you already sent.', action: onAddJob },
  ]
  const doneCount = steps.filter(s => s.done).length
  if (dismissed || doneCount === steps.length) return null

  function dismiss() {
    setDismissed(true)
    try { localStorage.setItem('onboarding-dismissed', '1') } catch { /* ignore */ }
  }

  return (
    <section aria-labelledby="getting-started" className="card p-5 border-brand-200 dark:border-brand-800">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand text-white">
            <Rocket className="h-4 w-4" />
          </div>
          <div>
            <h2 id="getting-started" className="text-sm font-semibold text-slate-900 dark:text-white">Get started</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{doneCount} of {steps.length} done</p>
          </div>
        </div>
        <button onClick={dismiss} aria-label="Dismiss getting started" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <div className="h-full bg-gradient-brand transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
      </div>
      <ol className="mt-4 space-y-2">
        {steps.map((step, i) => {
          const inner = (
            <>
              <span className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                step.done ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'
              )}>
                {step.done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className={cn('block text-sm font-medium', step.done ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white')}>{step.title}</span>
                {!step.done && <span className="block text-xs text-slate-500 dark:text-slate-400">{step.body}</span>}
              </span>
              {!step.done && <ChevronRight className="h-4 w-4 text-slate-400" />}
            </>
          )
          const cls = 'flex w-full items-center gap-3 rounded-xl p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors'
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
