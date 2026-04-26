import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { subDays, subMonths, subWeeks, startOfDay, format } from 'date-fns'

export async function GET() {
  const [jobs, interviews, tasks] = await Promise.all([
    prisma.job.findMany({ include: { interviews: true } }),
    prisma.interview.findMany({ orderBy: { scheduledAt: 'asc' } }),
    prisma.task.findMany(),
  ])

  const now = new Date()
  const statusCounts: Record<string, number> = {}
  const priorityCounts: Record<string, number> = {}
  const sourceCounts: Record<string, number> = {}

  for (const job of jobs) {
    statusCounts[job.status] = (statusCounts[job.status] ?? 0) + 1
    priorityCounts[job.priority] = (priorityCounts[job.priority] ?? 0) + 1
    if (job.source) sourceCounts[job.source] = (sourceCounts[job.source] ?? 0) + 1
  }

  const applied = jobs.filter(j => j.status !== 'saved')
  const responded = jobs.filter(j => ['interviewing', 'offered', 'rejected', 'ghosted'].includes(j.status))
  const offered = jobs.filter(j => j.status === 'offered')

  // Weekly applications (last 8 weeks)
  const weeklyApplications = Array.from({ length: 8 }, (_, i) => {
    const weekStart = subWeeks(now, 7 - i)
    const weekEnd = subWeeks(now, 6 - i)
    const count = applied.filter(j => {
      const d = new Date(j.dateApplied)
      return d >= weekStart && d < weekEnd
    }).length
    return { week: format(weekStart, 'MMM d'), count }
  })

  // Monthly applications (last 6 months)
  const monthlyApplications = Array.from({ length: 6 }, (_, i) => {
    const monthStart = subMonths(now, 5 - i)
    const month = format(monthStart, 'MMM yy')
    const count = applied.filter(j => {
      const d = new Date(j.dateApplied)
      return format(d, 'MMM yy') === month
    }).length
    return { month, count }
  })

  // Upcoming interviews (next 14 days)
  const upcoming14 = interviews.filter(iv => {
    const d = new Date(iv.scheduledAt)
    return d >= now && d <= subDays(now, -14)
  })

  // Follow-ups due (followUpDate <= today)
  const followUpsDue = jobs.filter(j => j.followUpDate && new Date(j.followUpDate) <= now && !['rejected', 'withdrawn', 'offered'].includes(j.status))

  // Tasks due soon (next 3 days)
  const tasksDueSoon = tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) <= subDays(now, -3))

  // Agent stats
  const agentJobs = jobs.filter(j => j.discoveredBy === 'agent')
  const manualJobs = jobs.filter(j => j.discoveredBy !== 'agent')
  const aiScores = jobs.filter(j => j.aiScore !== null).map(j => j.aiScore as number)
  const avgAiScore = aiScores.length ? Math.round(aiScores.reduce((a, b) => a + b, 0) / aiScores.length) : 0

  return NextResponse.json({
    statusCounts,
    priorityCounts,
    sourceCounts,
    total: jobs.length,
    applied: applied.length,
    responded: responded.length,
    offered: offered.length,
    offerRate: applied.length > 0 ? Math.round((offered.length / applied.length) * 100) : 0,
    responseRate: applied.length > 0 ? Math.round((responded.length / applied.length) * 100) : 0,
    weeklyApplications,
    monthlyApplications,
    upcomingInterviews: upcoming14.length,
    followUpsDue: followUpsDue.length,
    tasksDueSoon: tasksDueSoon.length,
    agentDiscoveredCount: agentJobs.length,
    manuallyAddedCount: manualJobs.length,
    avgAiScore,
  })
}
