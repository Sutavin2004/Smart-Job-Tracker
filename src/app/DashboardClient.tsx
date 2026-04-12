'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, TrendingUp, Calendar, Clock, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRelative, formatDateTime, formatDate } from '@/lib/utils'
import { STATUS_CONFIG } from '@/lib/types'
import { StatusBadge } from '@/components/StatusBadge'
import { AddJobModal } from '@/components/AddJobModal'
import { useRouter } from 'next/navigation'

interface Props {
  counts: Record<string, number>
  recentJobs: {
    id: string; company: string; role: string; status: string
    priority: string; dateApplied: string; updatedAt: string
    deadline: string | null; createdAt: string
  }[]
  activities: {
    id: string; message: string; createdAt: string; type: string
    job: { company: string; role: string } | null
  }[]
  upcomingInterviews: {
    id: string; type: string; scheduledAt: string; notes: string | null
    job: { company: string; role: string }
  }[]
}

export function DashboardClient({ counts, recentJobs, activities, upcomingInterviews }: Props) {
  const router = useRouter()
  const [showAdd, setShowAdd] = useState(false)

  const STAT_CARDS = [
    { label: 'Total', value: counts.total ?? 0, color: 'text-slate-900 dark:text-white' },
    { label: 'Applied', value: counts.applied ?? 0, color: 'text-blue-600' },
    { label: 'Interviewing', value: counts.interviewing ?? 0, color: 'text-amber-600' },
    { label: 'Offered', value: counts.offered ?? 0, color: 'text-green-600' },
    { label: 'Rejected', value: counts.rejected ?? 0, color: 'text-red-600' },
  ]

  const total = counts.total ?? 0
  const responded = (counts.applied ?? 0) + (counts.interviewing ?? 0) + (counts.offered ?? 0) + (counts.rejected ?? 0)
  const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0
  const interviewRate = responded > 0 ? Math.round(((counts.interviewing ?? 0) + (counts.offered ?? 0)) / responded * 100) : 0

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Track your job search progress</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Application
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {STAT_CARDS.map(({ label, value, color }) => (
          <div key={label} className="card p-4 text-center shadow-sm">
            <p className={cn('text-3xl font-bold tabular-nums', color)}>{value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Rates */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-brand-500" />
            <span className="text-sm font-medium">Response Rate</span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${responseRate}%` }} />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{responseRate}% of applications received a response</p>
        </div>
        <div className="card p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium">Interview Rate</span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${interviewRate}%` }} />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{interviewRate}% of responses led to interviews</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Recent Applications */}
        <div className="md:col-span-2 card shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-sm font-semibold">Recent Applications</h2>
            <Link href="/jobs" className="text-xs text-brand-600 hover:underline">View all →</Link>
          </div>
          {recentJobs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No applications yet.{' '}
              <button onClick={() => setShowAdd(true)} className="text-brand-600 hover:underline">Add your first →</button>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {recentJobs.map(job => (
                <Link key={job.id} href={`/jobs?id=${job.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{job.company}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{job.role}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={job.status} />
                    <span className="text-xs text-slate-400 hidden sm:block">{formatRelative(job.updatedAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Upcoming Interviews */}
          <div className="card shadow-sm">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <Calendar className="w-4 h-4 text-brand-500" />
              <h2 className="text-sm font-semibold">Upcoming Interviews</h2>
            </div>
            {upcomingInterviews.length === 0 ? (
              <p className="px-4 py-4 text-xs text-slate-400">No upcoming interviews.</p>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {upcomingInterviews.map(iv => (
                  <div key={iv.id} className="px-4 py-3">
                    <p className="text-sm font-medium capitalize">{iv.type} — {iv.job.company}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{formatDateTime(iv.scheduledAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div className="card shadow-sm">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <Clock className="w-4 h-4 text-brand-500" />
              <h2 className="text-sm font-semibold">Recent Activity</h2>
            </div>
            {activities.length === 0 ? (
              <p className="px-4 py-4 text-xs text-slate-400">No activity yet.</p>
            ) : (
              <div className="px-4 py-3 space-y-3">
                {activities.slice(0, 6).map(act => (
                  <div key={act.id} className="flex gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                        {act.message}
                        {act.job && <span className="text-slate-400"> · {act.job.company}</span>}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{formatRelative(act.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showAdd && <AddJobModal onClose={() => setShowAdd(false)} onCreated={() => router.refresh()} />}
    </div>
  )
}
