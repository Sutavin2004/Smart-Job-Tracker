'use client'

import { pct, type InsightsData } from './types'

/** Reply rate for every group the learning looked at, so nothing is a black box. */
export function Breakdown({ data }: { data: InsightsData }) {
  const comparisons = data.comparisons.filter(c => c.groups.length > 1)
  if (!comparisons.length) return null
  return (
    <section aria-labelledby="breakdown-heading" className="card p-5">
      <h2 id="breakdown-heading" className="text-sm font-semibold text-slate-900 dark:text-white">Reply rate by group</h2>
      <p className="mt-1 text-[13px] text-slate-500">Only applications with an outcome are counted. Groups with fewer than 4 applications are too small to read much into.</p>
      <div className="mt-4 grid gap-x-10 gap-y-6 md:grid-cols-2">
        {comparisons.map(c => (
          <div key={c.dim}>
            <h3 className="text-[13px] font-medium text-slate-700 dark:text-slate-300">{c.title}</h3>
            <ul className="mt-2 space-y-2.5">
              {c.groups.map(g => (
                <li key={g.label}>
                  <div className="flex justify-between gap-3 text-[13px]">
                    <span className="truncate text-slate-700 dark:text-slate-300">{g.label}</span>
                    <span className="shrink-0 tabular-nums text-slate-500">
                      {g.replies} of {g.n} replied{g.n >= 4 ? `, ${pct(g.rate)}` : ''}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-[#26272A]">
                    <div className={g.n >= 4 ? 'h-full rounded-full bg-brand-600 dark:bg-brand-400' : 'h-full rounded-full bg-slate-300 dark:bg-slate-600'} style={{ width: `${Math.max(2, g.rate * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
