'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { pct, type InsightsData } from './types'

const GOAL = 12

/** What the user's own results show. Stays modest until there is enough to go on. */
export function WhatsWorking({ data, limit = 3, showLink = true }: { data: InsightsData | null; limit?: number; showLink?: boolean }) {
  if (!data || data.applied === 0) return null
  const progress = Math.min(GOAL, data.resolved)

  return (
    <section id="whats-working" aria-labelledby="working-heading" className="card p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="working-heading" className="text-sm font-semibold text-slate-900 dark:text-white">What’s working</h2>
        {data.ready && showLink && (
          <Link href="/analytics#whats-working" className="text-[13px] text-slate-500 hover:text-slate-900 hover:underline dark:hover:text-white">Full breakdown</Link>
        )}
      </div>

      {!data.ready ? (
        <>
          <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-slate-500">
            JobTrack learns from your results: which jobs reply to you and why. Once {GOAL} applications have an outcome, it shows you what’s working and ranks new matches with it.
          </p>
          <div className="mt-4">
            <div className="flex justify-between text-[13px]">
              <span className="text-slate-700 dark:text-slate-300">{progress} of {GOAL} applications with an outcome</span>
              {data.pending > 0 && <span className="text-slate-500">{data.pending} still waiting</span>}
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-[#26272A]" role="progressbar" aria-label="Applications with an outcome" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={GOAL}>
              <div className="h-full rounded-full bg-brand-600 transition-[width] duration-500 dark:bg-brand-400" style={{ width: `${(progress / GOAL) * 100}%` }} />
            </div>
            <p className="mt-2 text-[12px] text-slate-500">An application has an outcome once you hear back, mark it as no reply, or three weeks pass.</p>
          </div>
        </>
      ) : data.insights.length === 0 ? (
        <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
          No clear pattern yet. {pct(data.replyRate)} of your {data.resolved} applications with an outcome got a reply, and that’s about the same across sources, roles and timing. Patterns show up as more replies come in.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-200 dark:divide-[#2A2B2E]">
          {data.insights.slice(0, limit).map(i => (
            <li key={i.dim} className="py-3 first:pt-1 last:pb-0">
              <p className="flex items-start gap-2 text-sm font-medium text-slate-900 dark:text-white">
                <span aria-hidden="true" className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', i.direction === 'better' ? 'bg-brand-600 dark:bg-brand-400' : 'bg-amber-500')} />
                {i.headline}
              </p>
              <p className="ml-4 mt-0.5 text-[13px] leading-relaxed text-slate-500">{i.detail}</p>
              <p className="ml-4 mt-0.5 text-[13px] leading-relaxed text-slate-700 dark:text-slate-300">{i.action}</p>
            </li>
          ))}
        </ul>
      )}

      {data.ready && (
        <p className="mt-4 border-t border-slate-200 pt-3 text-[12px] text-slate-500 dark:border-[#2A2B2E]">
          Based on {data.resolved} applications with an outcome. {pct(data.replyRate)} got a reply
          {data.medianDaysToReply !== null ? `, usually within ${data.medianDaysToReply} ${data.medianDaysToReply === 1 ? 'day' : 'days'}` : ''}.
        </p>
      )}
    </section>
  )
}
