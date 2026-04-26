'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, TrendingUp, Briefcase, Clock, Calendar, Bot, Flame, Trophy, MailCheck, Zap, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRelative } from '@/lib/utils'
import { type Job, type Activity, STATUS_CONFIG } from '@/lib/types'
import { StatusBadge } from '@/components/StatusBadge'
import { AddJobModal } from '@/components/AddJobModal'
import { useUIStore } from '@/lib/store'
import { useRouter } from 'next/navigation'

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

export default function DashboardPage() {
  const router = useRouter()
  const { setAddJobModalOpen } = useUIStore()
  const [showAdd, setShowAdd] = useState(false)
  const [recentJobs, setRecentJobs] = useState<Job[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [lastSession, setLastSession] = useState<AgentSession | null>(null)
  const [profile, setProfile] = useState<{ name?: string; weeklyGoal?: number } | null>(null)
  const [weeklyCount, setWeeklyCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

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

      setRecentJobs(Array.isArray(jobsData) ? jobsData.slice(0, 5) : [])
      setAnalytics(analyticsData)
      setActivities(Array.isArray(actsData) ? actsData : [])
      setLastSession(Array.isArray(sessionsData) && sessionsData.length > 0 ? sessionsData[0] : null)
      setProfile(profileData)

      // Count this week's applications
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const thisWeek = (Array.isArray(jobsData) ? jobsData : []).filter((j: Job) => new Date(j.dateApplied) >= weekAgo)
      setWeeklyCount(thisWeek.length)
    } finally {
      setLoading(false)
    }
  }

  const weeklyGoal = profile?.weeklyGoal ?? 5
  const goalPct = Math.min(100, Math.round((weeklyCount / weeklyGoal) * 100))
  const firstName = profile?.name?.split(' ')[0] || ''

  const KPI_CARDS = [
    { label: 'Total Applications', value: analytics?.total ?? 0, icon: Briefcase, color: 'text-brand-600', bg: 'bg-brand-50 dark:bg-brand-900/20' },
    { label: 'In Progress', value: (analytics?.statusCounts?.applied ?? 0) + (analytics?.statusCounts?.interviewing ?? 0), icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Interviews Upcoming', value: analytics?.upcomingInterviews ?? 0, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Response Rate', value: `${analytics?.responseRate ?? 0}%`, icon: MailCheck, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-900/20' },
    { label: 'Offer Rate', value: `${analytics?.offerRate ?? 0}%`, icon: Trophy, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'This Week', value: weeklyCount, icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  ]

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Greeting + Add button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {getGreeting()}{firstName ? `, ${firstName}` : ''}! 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {analytics?.total === 0
              ? "Let's start your job search journey 🚀"
              : analytics?.statusCounts?.offered
              ? "🎉 You have an active offer — congratulations!"
              : `You have ${(analytics?.statusCounts?.applied ?? 0) + (analytics?.statusCounts?.interviewing ?? 0)} applications in progress — keep going! 💪`}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Job
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-4 h-24 animate-pulse bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : (
        <>
          {/* Weekly goal */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Weekly Goal</p>
                <p className="text-xs text-slate-500">{weeklyCount} / {weeklyGoal} applications this week</p>
              </div>
              <span className={cn(
                'text-xs font-bold px-2.5 py-1 rounded-full',
                goalPct >= 100 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  : goalPct >= 60 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                  : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300'
              )}>
                {goalPct >= 100 ? '🔥 Goal hit!' : `${goalPct}%`}
              </span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-700',
                  goalPct >= 100 ? 'bg-green-500' : goalPct >= 60 ? 'bg-amber-500' : 'bg-brand-500'
                )}
                style={{ width: `${goalPct}%` }}
              />
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {KPI_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="card p-4 text-center">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2', bg)}>
                  <Icon className={cn('w-4.5 h-4.5', color)} />
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{value}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">{label}</p>
              </div>
            ))}
          </div>

          {/* Agent Spotlight */}
          <div className="rounded-2xl bg-gradient-brand p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)' }} />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 animate-float">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold">🤖 AI Job Discovery Agent</h2>
                <p className="text-white/80 text-sm mt-1">Let AI search job boards, score each posting, and add the best matches to your tracker — automatically.</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-white/60">
                  {lastSession
                    ? <>Last run {formatRelative(lastSession.startedAt)} · Added {lastSession.jobsAdded} jobs</>
                    : 'Never run yet — try it now!'
                  }
                </div>
              </div>
              <Link
                href="/agent"
                className="shrink-0 flex items-center gap-2 bg-white text-brand-700 font-semibold px-4 py-2.5 rounded-xl hover:bg-white/90 transition-all text-sm"
              >
                Run Agent
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Main content */}
          {analytics?.total === 0 ? (
            /* Empty state */
            <div className="card p-12 text-center">
              <div className="text-6xl mb-4">💼✨</div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Welcome to JobTrack!</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
                Your personal AI-powered career command center. Start by running the agent or adding a job manually.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/agent" className="btn-primary justify-center">
                  <Bot className="w-4 h-4" />
                  Find Jobs with AI
                </Link>
                <button onClick={() => setShowAdd(true)} className="btn-secondary justify-center">
                  <Plus className="w-4 h-4" />
                  Add a Job Manually
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Left: recent jobs + activity */}
              <div className="md:col-span-2 space-y-4">
                <div className="card shadow-sm">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
                    <h2 className="text-sm font-semibold">Recent Applications</h2>
                    <Link href="/jobs" className="text-xs text-brand-600 hover:underline">View all →</Link>
                  </div>
                  <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                    {recentJobs.map((job, i) => (
                      <Link key={job.id} href={`/jobs?id=${job.id}`}
                        className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {job.company[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{job.company}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{job.role}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {job.discoveredBy === 'agent' && (
                            <span className="text-[10px] bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 px-1.5 py-0.5 rounded font-medium">AI</span>
                          )}
                          <StatusBadge status={job.status} />
                          <span className="text-xs text-slate-400 hidden sm:block">{formatRelative(job.updatedAt)}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="card shadow-sm">
                  <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 dark:border-slate-700">
                    <Clock className="w-4 h-4 text-brand-500" />
                    <h2 className="text-sm font-semibold">Recent Activity</h2>
                  </div>
                  {activities.length === 0 ? (
                    <p className="px-5 py-6 text-xs text-slate-400">No activity yet.</p>
                  ) : (
                    <div className="px-5 py-3 space-y-3">
                      {activities.slice(0, 8).map(act => (
                        <div key={act.id} className="flex gap-2.5">
                          <div className={cn(
                            'w-2 h-2 rounded-full mt-1.5 shrink-0',
                            act.type === 'agent' ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-600'
                          )} />
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

              {/* Right: stats */}
              <div className="space-y-4">
                <div className="card p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-brand-500" />
                    <span className="text-sm font-semibold">Pipeline</span>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
                      const count = analytics?.statusCounts?.[status] ?? 0
                      if (count === 0) return null
                      return (
                        <div key={status} className="flex items-center gap-2">
                          <span className={cn('text-xs font-medium', cfg.color)}>{cfg.label}</span>
                          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full', cfg.dot)}
                              style={{ width: `${analytics?.total ? Math.round((count / analytics.total) * 100) : 0}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tabular-nums w-4 text-right">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="card p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-semibold">Quick Links</span>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { label: 'Kanban Board', href: '/jobs' },
                      { label: 'Analytics', href: '/analytics' },
                      { label: 'Resume Tools', href: '/resume' },
                      { label: 'Email Templates', href: '/templates' },
                    ].map(({ label, href }) => (
                      <Link key={href} href={href} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 text-sm text-slate-600 dark:text-slate-300 transition-colors">
                        {label}
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {showAdd && <AddJobModal onClose={() => setShowAdd(false)} onCreated={loadData} />}
    </div>
  )
}
