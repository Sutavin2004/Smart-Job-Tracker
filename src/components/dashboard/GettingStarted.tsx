'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  hasResume: boolean
  hasRunAgent: boolean
  hasApplied: boolean
  onAddJob: () => void
  /** Brand-new accounts: the main content of the dashboard, not dismissible. */
  prominent?: boolean
}

/**
 * The three steps from sign-up to a first application. Each step names one action and
 * links straight to it. Hides itself once everything is done or the user dismisses it.
 */
export function GettingStarted({ hasResume, hasRunAgent, hasApplied, onAddJob, prominent }: Props) {
  const [dismissed, setDismissed] = useState(true)
  useEffect(() => {
    try { setDismissed(localStorage.getItem('onboarding-dismissed') === '1') } catch { setDismissed(false) }
  }, [])

  const steps = [
    {
      done: hasResume,
      title: 'Add your résumé',
      body: 'Your details, skills and the roles that suit you are filled in from it. Takes a minute.',
      cta: 'Add résumé',
      href: '/profile',
    },
    {
      done: hasRunAgent,
      title: 'Find your first matches',
      body: 'The job agent searches job boards and company sites, then adds the jobs that fit you best to your board.',
      cta: 'Find jobs',
      href: '/agent?run=1',
      locked: !hasResume,
    },
    {
      done: hasApplied,
      title: 'Send your first application',
      body: 'Your best matches get a résumé and cover letter written for that job. Open one, apply, and mark it applied.',
      cta: 'See my matches',
      href: '/apply',
      locked: !hasRunAgent,
    },
  ]
  const doneCount = steps.filter(s => s.done).length
  const next = steps.findIndex(s => !s.done)
  if (doneCount === steps.length || (dismissed && !prominent)) return null

  function dismiss() {
    setDismissed(true)
    try { localStorage.setItem('onboarding-dismissed', '1') } catch { /* ignore */ }
  }

  return (
    <section aria-labelledby="getting-started" className={cn('card', prominent ? 'p-6 sm:p-8' : 'p-5')}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="getting-started" className={cn('font-semibold text-slate-900 dark:text-white', prominent ? 'text-lg' : 'text-sm')}>
            {prominent ? 'Get set up in three steps' : 'Finish setting up'}
          </h2>
          <p className="mt-0.5 text-[13px] text-slate-500">{doneCount} of {steps.length} done</p>
        </div>
        {!prominent && (
          <button onClick={dismiss} aria-label="Hide setup steps" className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-white/5 dark:hover:text-white">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <ol className={cn('mt-5 divide-y divide-slate-200 dark:divide-[#2A2B2E]', !prominent && 'mt-3')}>
        {steps.map((step, i) => {
          const current = i === next
          return (
            <li key={step.title} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
              <span
                aria-hidden="true"
                className={cn(
                  'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums',
                  step.done ? 'bg-brand-600 text-white dark:bg-brand-500'
                    : current ? 'border-2 border-brand-600 text-brand-700 dark:border-brand-400 dark:text-brand-300'
                    : 'border border-slate-300 text-slate-400 dark:border-[#3A3B3F]'
                )}
              >
                {step.done ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm font-medium', step.done ? 'text-slate-500' : 'text-slate-900 dark:text-white')}>
                  {step.title}{step.done && <span className="sr-only"> (done)</span>}
                </p>
                {!step.done && <p className="mt-0.5 max-w-xl text-[13px] leading-relaxed text-slate-500">{step.body}</p>}
              </div>
              {!step.done && (
                step.locked
                  ? <span className="shrink-0 pt-1 text-[13px] text-slate-400">After step {i}</span>
                  : <Link href={step.href} className={cn('shrink-0', current ? 'btn-primary' : 'btn-secondary')}>{step.cta}</Link>
              )}
            </li>
          )
        })}
      </ol>

      {prominent && (
        <p className="mt-6 border-t border-slate-200 pt-4 text-[13px] text-slate-500 dark:border-[#2A2B2E]">
          Already applied somewhere?{' '}
          <button onClick={onAddJob} className="font-medium text-brand-700 underline underline-offset-4 hover:text-brand-800 dark:text-brand-400">Add a job you have sent</button>{' '}
          to start tracking it.
        </p>
      )}
    </section>
  )
}
