'use client'

import { useEffect, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { BarChart2, Bot, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
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
  saved: '#94a3b8', applied: '#3b82f6', interviewing: '#f59e0b',
  offered: '#10b981', rejected: '#ef4444', ghosted: '#8b5cf6', withdrawn: '#6b7280',
}

const PIE_COLORS = ['#8448ff', '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#6b7280']

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
          <div key={i} className="card h-32 animate-pulse bg-slate-100 dark:bg-slate-800" />
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
      color: STATUS_COLORS[status] ?? '#94a3b8',
    }))

  const sourcePie = Object.entries(data.sourceCounts ?? {})
    .filter(([, count]) => count > 0)
    .map(([source, count], i) => ({ name: source, value: count, color: PIE_COLORS[i % PIE_COLORS.length] }))

  // Funnel data
  const funnelStages = [
    { label: 'Saved', count: data.statusCounts?.saved ?? 0, color: '#94a3b8' },
    { label: 'Applied', count: data.statusCounts?.applied ?? 0, color: '#3b82f6' },
    { label: 'Interviewing', count: data.statusCounts?.interviewing ?? 0, color: '#f59e0b' },
    { label: 'Offered', count: data.statusCounts?.offered ?? 0, color: '#10b981' },
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

  const KPI = [
    { label: 'Total', value: data.total, sub: 'all time' },
    { label: 'Applied', value: data.applied, sub: 'excluding saved' },
    { label: 'Responded', value: data.responded, sub: 'any response' },
    { label: 'Offers', value: data.offered, sub: 'received' },
    { label: 'Response Rate', value: `${data.responseRate}%`, sub: 'of applications' },
    { label: 'Offer Rate', value: `${data.offerRate}%`, sub: 'of applications' },
    { label: 'Upcoming', value: data.upcomingInterviews, sub: 'interviews' },
    { label: 'AI Score Avg', value: data.avgAiScore ? `${data.avgAiScore}/100` : '—', sub: 'of analyzed jobs' },
  ]

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2">
        <BarChart2 className="w-6 h-6 text-brand-500" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {KPI.map(({ label, value, sub }) => (
          <div key={label} className="card p-3 text-center">
            <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">{value}</p>
            <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{label}</p>
            <p className="text-[9px] text-slate-400">{sub}</p>
          </div>
        ))}
      </div>

      {/* Weekly activity chart */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold mb-4">Application Activity</h2>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data.weeklyApplications}>
            <defs>
              <linearGradient id="brand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8448ff" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#8448ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="week" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={24} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 10, border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
            />
            <Area type="monotone" dataKey="count" name="Applications" stroke="#8448ff" strokeWidth={2} fill="url(#brand)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Funnel */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold mb-5">Conversion Funnel</h2>
        <div className="space-y-3">
          {funnelStages.map((stage, i) => {
            const prev = i > 0 ? funnelStages[i - 1].count : null
            const rate = prev && prev > 0 ? Math.round((stage.count / prev) * 100) : null
            return (
              <div key={stage.label} className="flex items-center gap-4">
                <div className="w-24 text-right text-xs font-medium text-slate-600 dark:text-slate-300 shrink-0">{stage.label}</div>
                <div className="flex-1 flex items-center gap-3">
                  <div
                    className="h-8 rounded-lg flex items-center px-3 text-xs font-bold text-white transition-all"
                    style={{ width: `${Math.max(4, (stage.count / maxFunnel) * 100)}%`, background: stage.color }}
                  >
                    {stage.count}
                  </div>
                </div>
                {rate !== null && (
                  <div className="text-xs text-slate-400 w-12 shrink-0">{rate}% →</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Pie charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {statusPie.length > 0 && (
          <div className="card p-5">
            <h2 className="text-sm font-semibold mb-4">By Status</h2>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={130} height={130}>
                <PieChart>
                  <Pie data={statusPie} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value">
                    {statusPie.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 flex-1">
                {statusPie.map(e => (
                  <div key={e.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: e.color }} />
                    <span className="text-slate-600 dark:text-slate-300">{e.name}</span>
                    <span className="ml-auto font-bold text-slate-900 dark:text-white">{e.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {sourcePie.length > 0 && (
          <div className="card p-5">
            <h2 className="text-sm font-semibold mb-4">By Source</h2>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={130} height={130}>
                <PieChart>
                  <Pie data={sourcePie} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value">
                    {sourcePie.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 flex-1">
                {sourcePie.map(e => (
                  <div key={e.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: e.color }} />
                    <span className="text-slate-600 dark:text-slate-300 truncate">{e.name}</span>
                    <span className="ml-auto font-bold text-slate-900 dark:text-white">{e.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Agent stats */}
      {(data.agentDiscoveredCount > 0 || data.manuallyAddedCount > 0) && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2"><Bot className="w-4 h-4 text-brand-500" /> Agent vs Manual</h2>
          <div className="flex gap-6">
            <div>
              <p className="text-2xl font-bold text-brand-600">{data.agentDiscoveredCount}</p>
              <p className="text-xs text-slate-500">AI discovered</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-700 dark:text-slate-200">{data.manuallyAddedCount}</p>
              <p className="text-xs text-slate-500">Manually added</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{data.avgAiScore}/100</p>
              <p className="text-xs text-slate-500">Avg AI fit score</p>
            </div>
          </div>
        </div>
      )}

      {/* Activity heatmap */}
      <div className="card p-5 overflow-x-auto">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-brand-500" /> Activity Heatmap (last year)</h2>
        <div className="flex gap-1">
          {Array.from({ length: 52 }).map((_, w) => (
            <div key={w} className="flex flex-col gap-1">
              {Array.from({ length: 7 }).map((_, d) => {
                const dayIndex = w * 7 + d
                const day = heatDays[dayIndex]
                if (!day) return <div key={d} className="w-3 h-3" />
                const intensity = day.count / maxHeat
                return (
                  <div
                    key={d}
                    title={`${day.date}: ${day.count} application${day.count !== 1 ? 's' : ''}`}
                    className="w-3 h-3 rounded-sm transition-colors"
                    style={{
                      background: day.count === 0 ? 'rgba(148,163,184,0.1)' : `rgba(132,72,255,${0.2 + intensity * 0.8})`
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 text-[10px] text-slate-400">
          <span>Less</span>
          {[0.1, 0.3, 0.5, 0.7, 1].map(i => (
            <div key={i} className="w-3 h-3 rounded-sm" style={{ background: `rgba(132,72,255,${i})` }} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  )
}
