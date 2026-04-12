'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { cn } from '@/lib/utils'
import { STATUS_CONFIG, JOB_STATUSES } from '@/lib/types'
import { apiClient } from '@/lib/api-client'

interface StatsData {
  total: number
  saved: number
  applied: number
  interviewing: number
  offered: number
  rejected: number
  monthly: { month: string; count: number }[]
}

const PIE_COLORS = ['#6366f1', '#3b82f6', '#f59e0b', '#22c55e', '#ef4444']
const PRIORITY_COLORS: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#94a3b8',
}

export default function AnalyticsPage() {
  const [data, setData] = useState<StatsData | null>(null)
  const [priorityBreakdown, setPriorityBreakdown] = useState<{ priority: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [statsData, jobsData] = await Promise.all([
          apiClient.getStats() as Promise<StatsData>,
          apiClient.getJobs() as Promise<{ priority: string }[]>,
        ])
        setData(statsData)

        const pb = ['high', 'medium', 'low'].map(p => ({
          priority: p,
          count: jobsData.filter((j) => j.priority === p).length,
        }))
        setPriorityBreakdown(pb)
      } catch {
        // leave data null — UI shows empty state
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div className="p-6 text-center text-slate-400 text-sm animate-pulse">Loading…</div>
  if (!data) return <div className="p-6 text-center text-slate-400 text-sm">Could not load analytics data.</div>

  const counts = data as unknown as Record<string, number>
  const monthly = data.monthly ?? []

  const statusData = JOB_STATUSES.map(s => ({
    name: STATUS_CONFIG[s].label,
    value: counts[s] ?? 0,
  })).filter(d => d.value > 0)

  const responded = (counts.applied ?? 0) + (counts.interviewing ?? 0) + (counts.offered ?? 0) + (counts.rejected ?? 0)
  const responseRate = counts.total > 0 ? Math.round((responded / counts.total) * 100) : 0
  const interviewRate = responded > 0 ? Math.round(((counts.interviewing ?? 0) + (counts.offered ?? 0)) / responded * 100) : 0
  const offerRate = responded > 0 ? Math.round((counts.offered ?? 0) / responded * 100) : 0

  const RATES = [
    { label: 'Response Rate', value: responseRate, color: 'bg-brand-500', desc: 'Applications that got a reply' },
    { label: 'Interview Rate', value: interviewRate, color: 'bg-amber-500', desc: 'Responses that led to interviews' },
    { label: 'Offer Rate', value: offerRate, color: 'bg-green-500', desc: 'Responses that led to offers' },
  ]

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Insights into your job search</p>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {JOB_STATUSES.map(s => {
          const cfg = STATUS_CONFIG[s]
          return (
            <div key={s} className={cn('card p-4 text-center shadow-sm', cfg.bg, cfg.border)}>
              <p className={cn('text-3xl font-bold tabular-nums', cfg.color)}>{counts[s] ?? 0}</p>
              <p className={cn('text-xs font-medium mt-1', cfg.color)}>{cfg.label}</p>
            </div>
          )
        })}
      </div>

      {/* Conversion Rates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {RATES.map(({ label, value, color, desc }) => (
          <div key={label} className="card p-5 shadow-sm">
            <p className="text-sm font-semibold mb-1">{label}</p>
            <p className="text-3xl font-bold tabular-nums mb-2">{value}%</p>
            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${value}%` }} />
            </div>
            <p className="text-xs text-slate-400 mt-1.5">{desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Monthly Applications */}
        <div className="card p-5 shadow-sm">
          <h2 className="text-sm font-semibold mb-4">Applications per Month</h2>
          {monthly.every(m => m.count === 0) ? (
            <p className="text-xs text-slate-400 text-center py-8">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Applications" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status breakdown pie */}
        <div className="card p-5 shadow-sm">
          <h2 className="text-sm font-semibold mb-4">Status Breakdown</h2>
          {statusData.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name" paddingAngle={2}>
                  {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Priority breakdown */}
        <div className="card p-5 shadow-sm">
          <h2 className="text-sm font-semibold mb-4">Priority Breakdown</h2>
          <div className="space-y-3">
            {priorityBreakdown.map(({ priority, count }) => (
              <div key={priority}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="capitalize font-medium">{priority}</span>
                  <span className="text-slate-500">{count}</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: counts.total > 0 ? `${(count / counts.total) * 100}%` : '0%',
                      backgroundColor: PRIORITY_COLORS[priority],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick stats */}
        <div className="card p-5 shadow-sm">
          <h2 className="text-sm font-semibold mb-4">Summary</h2>
          <div className="space-y-2.5 text-sm">
            {[
              { label: 'Total Applications', value: counts.total ?? 0 },
              { label: 'Active (not rejected)', value: (counts.total ?? 0) - (counts.rejected ?? 0) },
              { label: 'Awaiting response', value: counts.applied ?? 0 },
              { label: 'In interview process', value: counts.interviewing ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-slate-500">{label}</span>
                <span className="font-semibold">{value}</span>
              </div>
            ))}
            <div className="flex justify-between">
              <span className="text-slate-500">Offers received</span>
              <span className="font-semibold text-green-600">{counts.offered ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
