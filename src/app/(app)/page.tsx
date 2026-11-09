'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { cn, formatRelative, stripEmoji } from '@/lib/utils'
import { type Job, type Activity, STATUS_CONFIG } from '@/lib/types'
import { StatusBadge } from '@/components/StatusBadge'
import { AddJobModal } from '@/components/AddJobModal'
import { RemindersWidget } from '@/components/RemindersWidget'
import { GettingStarted } from '@/components/dashboard/GettingStarted'

interface Analytics {
  total: number
  applied: number
  responded: number
  offered: number
  offerRate: number
  responseRate: number
  upcomingInterviews: number
  agentDiscoveredCount: number
  statusCounts: Record<string, number>
}

interface AgentSession {
  id: string
  status: string
  jobsAdded: number
  startedAt: string
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

export default function DashboardPage() {
  const [showAdd, setShowAdd] = useState(false)
  const [recentJobs, setRecentJobs] = useState<Job[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [lastSession, setLastSession] = useState<AgentSession | null>(null)
  const [profile, setProfile] = useState<{ name?: string; weeklyGoal?: number; targetRoles?: string; skills?: string } | null>(null)
  const [weeklyCount, setWeeklyCount] = useState(0)
  const [loading, setLoading] = useState(true)
  // Depends on the viewer's clock and timezone, so compute it in the browser only;
  // rendering it on the server caused a hydration mismatch (React #418).
  const [greeting, setGreeting] = useState('Hello')

  useEffect(() => { setGreeting(getGreeting()); loadData() }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [jobsData, analyticsData, actsData, sessionsData, profileData] = await Promise.all([
        fetch('/api/jobs').then(r => r.json()),
        fetch('/api/analytics').then(r => r.json()),
        fetch('/api/activities').then(r => r.json()),
        fetch('/api/agent/sessions').then(r => r.json()),
        fetch('/api/profile').then(r => r.json()),
      ])

      setRecentJobs(Array.isArray(jobsData) ? jobsData.slice(0, 6) : [])
      setAnalytics(analyticsData)
      setActivities(Array.isArray(actsData) ? actsData : [])
      setLastSession(Array.isArray(sessionsData) && sessionsData.length > 0 ? sessionsData[0] : null)
      setProfile(profileData)

      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const thisWeek = (Array.isArray(jobsData) ? jobsData : []).filter((j: Job) => j.status !== 'saved' && new Date(j.dateApplied) >= weekAgo)
      setWeeklyCount(thisWeek.length)
    } finally {
      setLoading(false)
    }
  }

  const weeklyGoal = profile?.weeklyGoal || 5
  const goalPct = Math.min(100, Math.round((weeklyCount / weeklyGoal) * 100))
  const firstName = profile?.name?.split(' ')[0] || ''
  const inProgress = (analytics?.statusCounts?.applied ?? 0) + (analytics?.statusCounts?.interviewing ?? 0)

  let summary = 'Add a job you have applied to, or let the agent find some for you.'
  if (analytics && analytics.total > 0) {
    const parts = [`${plural(inProgress, 'application')} in progress`]
    if (analytics.upcomingInterviews) parts.push(`${plural(analytics.upcomingInterviews, 'interview')} coming up`)
    if (analytics.statusCounts?.offered) parts.push(`${plural(analytics.statusCounts.offered, 'offer')} to consider`)
    summary = parts.join(', ') + '.'
  }

  const STATS = [
    { label: 'Applications', value: analytics?.total ?? 0 },
    { label: 'In progress', value: inProgress },
    { label: 'Interviews coming up', value: analytics?.upcomingInterviews ?? 0 },
    { label: 'Response rate', value: `${analytics?.responseRate ?? 0}%` },
    { label: 'Offer rate', value: `${analytics?.offerRate ?? 0}%` },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-5 py-8 sm:px-8 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-[-0.01em] text-slate-900 dark:text-white">
            {greeting}{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{loading ? ' ' : summary}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/agent" className="btn-secondary">Run the agent</Link>
          <button onClick={() => setShowAdd(true)} className="btn-primary">
            <Plus className="h-4 w-4" aria-hidden="true" /> Add job
          </button>
        </div>
      </header>

      {!loading && (
        <GettingStarted
          hasProfile={Boolean(profile?.targetRoles?.trim() && profile?.skills?.trim())}
          hasRunAgent={Boolean(lastSession)}
          hasApplied={(analytics?.applied ?? 0) > 0}
          onAddJob={() => setShowAdd(true)}
        />
      )}

      {/* Stats: one strip, divided, rather than a row of separate tiles */}
      <section aria-label="Summary" className="card grid grid-cols-2 divide-slate-200 dark:divide-[#2A2B2E] sm:grid-cols-3 lg:grid-cols-6 lg:divide-x">
        {STATS.map(({ label, value }) => (
          <div key={label} className="px-5 py-4">
            <p className="text-[13px] text-slate-500">{label}</p>
            <p className={cn('mt-1 text-2xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-white', loading && 'text-slate-300 dark:text-slate-600')}>
              {loading ? '–' : value}
            </p>
          </div>
        ))}
        <div className="px-5 py-4">
          <p className="text-[13px] text-slate-500">This week</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-white">
            {loading ? '–' : weeklyCount}
            <span className="text-sm font-normal text-slate-500"> / {weeklyGoal}</span>
          </p>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-[#26272A]" role="progressbar" aria-label="Weekly application goal" aria-valuenow={weeklyCount} aria-valuemin={0} aria-valuemax={weeklyGoal}>
            <div className="h-full rounded-full bg-brand-600 transition-[width] duration-500 dark:bg-brand-400" style={{ width: `${goalPct}%` }} />
          </div>
        </div>
      </section>

      {!loading && analytics?.total === 0 ? (
        <section className="card px-6 py-14 text-center">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Your board is empty</h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-500">
            Add a job you are tracking, or tell the agent what you are looking for and it will search job boards for you.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <button onClick={() => setShowAdd(true)} className="btn-primary justify-center"><Plus className="h-4 w-4" aria-hidden="true" /> Add job</button>
            <Link href="/agent" className="btn-secondary justify-center">Set up the agent</Link>
          </div>
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="card overflow-hidden" aria-labelledby="recent-heading">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-[#2A2B2E]">
                <h2 id="recent-heading" className="text-sm font-semibold text-slate-900 dark:text-white">Recently updated</h2>
                <Link href="/jobs" className="text-[13px] text-slate-500 hover:text-slate-900 dark:hover:text-white">Open board</Link>
              </div>
              {loading ? (
                <div className="space-y-px p-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-11 animate-pulse rounded bg-slate-100 dark:bg-[#222326]" />)}</div>
              ) : (
                <table className="w-full table-fixed text-left text-sm">
                  <thead className="sr-only sm:not-sr-only">
                    <tr className="text-[13px] text-slate-500">
                      <th scope="col" className="w-[38%] px-5 pb-1.5 pt-3 font-normal md:w-[28%]">Company</th>
                      <th scope="col" className="hidden px-3 pb-1.5 pt-3 font-normal md:table-cell">Role</th>
                      <th scope="col" className="w-[120px] px-3 pb-1.5 pt-3 font-normal">Stage</th>
                      <th scope="col" className="hidden w-[130px] px-5 pb-1.5 pt-3 text-right font-normal sm:table-cell">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#26272A]">
                    {recentJobs.map(job => (
                      <tr key={job.id} className="group relative hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                        <td className="px-5 py-3">
                          <Link href={`/jobs?id=${job.id}`} className="block truncate font-medium text-slate-900 after:absolute after:inset-0 dark:text-white">
                            {job.company}
                          </Link>
                          <span className="block truncate text-[13px] text-slate-500 md:hidden">{job.role}</span>
                        </td>
                        <td className="hidden truncate px-3 py-3 text-slate-600 dark:text-slate-400 md:table-cell">
                          {job.role}
                          {job.discoveredBy === 'agent' && <span className="ml-2 text-[12px] text-brand-700 dark:text-brand-400">found by agent</span>}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3"><StatusBadge status={job.status} /></td>
                        <td className="hidden whitespace-nowrap px-5 py-3 text-right text-[13px] tabular-nums text-slate-500 sm:table-cell">{formatRelative(job.updatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className="card" aria-labelledby="activity-heading">
              <h2 id="activity-heading" className="border-b border-slate-200 px-5 py-3.5 text-sm font-semibold text-slate-900 dark:border-[#2A2B2E] dark:text-white">Activity</h2>
              {activities.length === 0 ? (
                <p className="px-5 py-6 text-sm text-slate-500">Changes to your jobs will show up here.</p>
              ) : (
                <ol className="divide-y divide-slate-100 dark:divide-[#26272A]">
                  {activities.slice(0, 8).map(act => (
                    <li key={act.id} className="flex items-baseline justify-between gap-4 px-5 py-2.5">
                      <p className="min-w-0 text-[13px] leading-snug text-slate-700 dark:text-slate-300">
                        {act.job && <span className="font-medium text-slate-900 dark:text-white">{act.job.company}: </span>}
                        {stripEmoji(act.message)}
                      </p>
                      <time dateTime={act.createdAt} className="shrink-0 text-[12px] tabular-nums text-slate-500">{formatRelative(act.createdAt)}</time>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>

          <div className="space-y-6">
            <section className="card p-5" aria-labelledby="agent-heading">
              <h2 id="agent-heading" className="text-sm font-semibold text-slate-900 dark:text-white">Job agent</h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
                Searches public job boards, scores each listing against your profile and adds the strong matches to your board.
              </p>
              <p className="mt-3 text-[13px] text-slate-700 dark:text-slate-300">
                {lastSession
                  ? <>Last run {formatRelative(lastSession.startedAt)}, added {plural(lastSession.jobsAdded, 'job')}.</>
                  : 'Not run yet.'}
              </p>
              <Link href="/agent" className="btn-secondary mt-4 w-full justify-center">Open the agent</Link>
            </section>

            <RemindersWidget />

            {!loading && (analytics?.total ?? 0) > 0 && (
              <section className="card p-5" aria-labelledby="pipeline-heading">
                <h2 id="pipeline-heading" className="text-sm font-semibold text-slate-900 dark:text-white">By stage</h2>
                <ul className="mt-3 space-y-2.5">
                  {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
                    const count = analytics?.statusCounts?.[status] ?? 0
                    if (count === 0) return null
                    const pct = analytics?.total ? Math.round((count / analytics.total) * 100) : 0
                    return (
                      <li key={status}>
                        <div className="flex justify-between text-[13px]">
                          <span className="text-slate-700 dark:text-slate-300">{cfg.label}</span>
                          <span className="tabular-nums text-slate-500">{count}</span>
                        </div>
                        <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-[#26272A]">
                          <div className={cn('h-full rounded-full', cfg.dot)} style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )}
          </div>
        </div>
      )}

      {showAdd && <AddJobModal onClose={() => setShowAdd(false)} onCreated={loadData} />}
    </div>
  )
}
