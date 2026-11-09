'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { STATUS_CONFIG } from '@/lib/types'

interface Analytics {
  total: number
  applied: number
  responded: number
  offered: number
  offerRate: number
  responseRate: number
  upcomingInterviews: number
  agentDiscoveredCount: number
  manuallyAddedCount: number
  avgAiScore: number
  statusCounts: Record<string, number>
  sourceCounts: Record<string, number>
  weeklyApplications: { week: string; count: number }[]
  monthlyApplications: { month: string; count: number }[]
}

const STATUS_COLORS: Record<string, string> = {
  saved: '#A1A1AA', applied: '#0284C7', interviewing: '#F59E0B',
  offered: '#22775F', rejected: '#EF4444', ghosted: '#A8A29E', withdrawn: '#D1D1D6',
}


export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null)
  const [heatmap, setHeatmap] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/analytics').then(r => r.json()),
      fetch('/api/analytics/heatmap').then(r => r.json()),
    ]).then(([analytics, hm]) => {
      setData(analytics)
      setHeatmap(hm)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card h-32 animate-pulse bg-slate-100 dark:bg-[#1A1B1D]" />
        ))}
      </div>
    )
  }

  if (!data) return null

  const statusPie = Object.entries(data.statusCounts)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      name: STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label ?? status,
      value: count,
      color: STATUS_COLORS[status] ?? '#A1A1AA',
    }))


  // Funnel data
  const funnelStages = [
    { label: 'Saved', count: data.statusCounts?.saved ?? 0, color: '#A1A1AA' },
    { label: 'Applied', count: data.statusCounts?.applied ?? 0, color: '#0284C7' },
    { label: 'Interviewing', count: data.statusCounts?.interviewing ?? 0, color: '#D97706' },
    { label: 'Offered', count: data.statusCounts?.offered ?? 0, color: '#1D6B57' },
  ]
  const maxFunnel = Math.max(...funnelStages.map(s => s.count), 1)

  // Heatmap grid (52 weeks × 7 days)
  const today = new Date()
  const heatDays: Array<{ date: string; count: number }> = []
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    heatDays.push({ date: key, count: heatmap[key] ?? 0 })
  }
  const maxHeat = Math.max(...heatDays.map(d => d.count), 1)

  const STATS = [
    { label: 'Tracked', value: data.total },
    { label: 'Applied', value: data.applied },
    { label: 'Heard back', value: data.responded },
    { label: 'Offers', value: data.offered },
    { label: 'Response rate', value: `${data.responseRate}%` },
    { label: 'Offer rate', value: `${data.offerRate}%` },
  ]

  const sources = Object.entries(data.sourceCounts ?? {}).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1])
  const maxSource = Math.max(...sources.map(([, c]) => c), 1)
  const statuses = statusPie.slice().sort((a, b) => b.value - a.value)
  const maxStatus = Math.max(...statuses.map(s => s.value), 1)

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-5 py-8 sm:px-8 sm:py-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-[-0.01em] text-slate-900 dark:text-white">Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">How your applications are moving. Rates count only jobs you have applied to.</p>
      </header>

      <section aria-label="Summary" className="card grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 lg:divide-x lg:divide-slate-200 dark:lg:divide-[#2A2B2E]">
        {STATS.map(({ label, value }) => (
          <div key={label} className="px-5 py-4">
            <p className="text-[13px] text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-white">{value}</p>
          </div>
        ))}
      </section>

      <section className="card p-5" aria-labelledby="weekly-heading">
        <div className="flex items-baseline justify-between">
          <h2 id="weekly-heading" className="text-sm font-semibold text-slate-900 dark:text-white">Applications per week</h2>
          <span className="text-[13px] text-slate-500">Last {data.weeklyApplications.length} weeks</span>
        </div>
        <div className="mt-4" aria-hidden="true">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.weeklyApplications} margin={{ top: 4, right: 0, left: -12, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="currentColor" className="text-slate-200 dark:text-[#2A2B2E]" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#63636B' }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#63636B' }} tickLine={false} axisLine={false} width={32} />
              <Tooltip cursor={{ fill: 'rgba(99,99,107,0.08)' }} contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #E4E4E7', boxShadow: 'none' }} />
              <Bar dataKey="count" name="Applications" fill="#1D6B57" radius={[3, 3, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="card p-5" aria-labelledby="funnel-heading">
          <h2 id="funnel-heading" className="text-sm font-semibold text-slate-900 dark:text-white">From saved to offer</h2>
          <p className="mt-1 text-[13px] text-slate-500">Percentages show how many moved on from the stage before.</p>
          <ol className="mt-4 space-y-3">
            {funnelStages.map((stage, i) => {
              const prev = i > 0 ? funnelStages[i - 1].count : null
              const rate = prev && prev > 0 ? Math.round((stage.count / prev) * 100) : null
              return (
                <li key={stage.label}>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-slate-700 dark:text-slate-300">{stage.label}</span>
                    <span className="tabular-nums text-slate-500">
                      {stage.count}{rate !== null && <span className="ml-2 text-slate-400">{rate}%</span>}
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-sm bg-slate-100 dark:bg-[#26272A]">
                    <div className="h-full rounded-sm" style={{ width: `${(stage.count / maxFunnel) * 100}%`, background: stage.color }} />
                  </div>
                </li>
              )
            })}
          </ol>
        </section>

        <section className="card p-5" aria-labelledby="status-heading">
          <h2 id="status-heading" className="text-sm font-semibold text-slate-900 dark:text-white">By stage</h2>
          <ul className="mt-4 space-y-3">
            {statuses.map(e => (
              <li key={e.name}>
                <div className="flex justify-between text-[13px]">
                  <span className="text-slate-700 dark:text-slate-300">{e.name}</span>
                  <span className="tabular-nums text-slate-500">{e.value}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-sm bg-slate-100 dark:bg-[#26272A]">
                  <div className="h-full rounded-sm" style={{ width: `${(e.value / maxStatus) * 100}%`, background: e.color }} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        {sources.length > 0 && (
          <section className="card p-5" aria-labelledby="source-heading">
            <h2 id="source-heading" className="text-sm font-semibold text-slate-900 dark:text-white">Where jobs came from</h2>
            <ul className="mt-4 space-y-3">
              {sources.map(([name, count]) => (
                <li key={name}>
                  <div className="flex justify-between text-[13px]">
                    <span className="truncate text-slate-700 dark:text-slate-300">{name}</span>
                    <span className="tabular-nums text-slate-500">{count}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-sm bg-slate-100 dark:bg-[#26272A]">
                    <div className="h-full rounded-sm bg-slate-400 dark:bg-slate-500" style={{ width: `${(count / maxSource) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="card p-5" aria-labelledby="agent-heading">
          <h2 id="agent-heading" className="text-sm font-semibold text-slate-900 dark:text-white">Job agent</h2>
          <dl className="mt-4 grid grid-cols-3 gap-4">
            <div>
              <dt className="text-[13px] text-slate-500">Found by agent</dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums text-slate-900 dark:text-white">{data.agentDiscoveredCount}</dd>
            </div>
            <div>
              <dt className="text-[13px] text-slate-500">Added by you</dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums text-slate-900 dark:text-white">{data.manuallyAddedCount}</dd>
            </div>
            <div>
              <dt className="text-[13px] text-slate-500">Average fit</dt>
              <dd className="mt-1 text-xl font-semibold tabular-nums text-slate-900 dark:text-white">{data.avgAiScore ? `${data.avgAiScore}/100` : '–'}</dd>
            </div>
          </dl>
          <p className="mt-4 text-[13px] text-slate-500">{data.upcomingInterviews} {data.upcomingInterviews === 1 ? 'interview' : 'interviews'} coming up.</p>
        </section>
      </div>

      <section className="card overflow-x-auto p-5" aria-labelledby="heat-heading">
        <h2 id="heat-heading" className="text-sm font-semibold text-slate-900 dark:text-white">Activity over the past year</h2>
        <div className="mt-4 flex gap-[3px]" aria-hidden="true">
          {Array.from({ length: 53 }).map((_, w) => (
            <div key={w} className="flex flex-col gap-[3px]">
              {Array.from({ length: 7 }).map((_, d) => {
                const day = heatDays[w * 7 + d]
                if (!day) return <div key={d} className="h-[11px] w-[11px]" />
                const intensity = day.count / maxHeat
                return (
                  <div
                    key={d}
                    title={`${day.date}: ${day.count} ${day.count === 1 ? 'application' : 'applications'}`}
                    className="h-[11px] w-[11px] rounded-[2px]"
                    style={{ background: day.count === 0 ? 'rgba(99,99,107,0.12)' : `rgba(29,107,87,${0.3 + intensity * 0.7})` }}
                  />
                )
              })}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[12px] text-slate-500">
          <span>Fewer</span>
          {[0.12, 0.4, 0.6, 0.8, 1].map((a, i) => (
            <div key={a} className="h-[11px] w-[11px] rounded-[2px]" style={{ background: i === 0 ? 'rgba(99,99,107,0.12)' : `rgba(29,107,87,${a})` }} />
          ))}
          <span>More</span>
        </div>
      </section>
    </div>
  )
}
