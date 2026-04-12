import { prisma } from '@/lib/prisma'
import { JOB_STATUSES, STATUS_CONFIG } from '@/lib/types'
import { AnalyticsClient } from './AnalyticsClient'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const jobs = await prisma.job.findMany({ orderBy: { dateApplied: 'asc' } })

  const counts = Object.fromEntries(
    JOB_STATUSES.map(s => [s, jobs.filter(j => j.status === s).length])
  ) as Record<string, number>
  counts.total = jobs.length

  // Monthly data (last 6 months)
  const now = new Date()
  const monthly: { month: string; count: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    const count = jobs.filter(j => {
      const jd = new Date(j.dateApplied)
      return jd.getFullYear() === d.getFullYear() && jd.getMonth() === d.getMonth()
    }).length
    monthly.push({ month: label, count })
  }

  // Priority breakdown
  const priorityBreakdown = ['high', 'medium', 'low'].map(p => ({
    priority: p,
    count: jobs.filter(j => j.priority === p).length,
  }))

  const total = jobs.length
  const responded = (counts.applied ?? 0) + (counts.interviewing ?? 0) + (counts.offered ?? 0) + (counts.rejected ?? 0)

  return (
    <AnalyticsClient
      counts={counts}
      monthly={monthly}
      priorityBreakdown={priorityBreakdown}
      responseRate={total > 0 ? Math.round((responded / total) * 100) : 0}
      interviewRate={responded > 0 ? Math.round(((counts.interviewing ?? 0) + (counts.offered ?? 0)) / responded * 100) : 0}
      offerRate={responded > 0 ? Math.round((counts.offered ?? 0) / responded * 100) : 0}
    />
  )
}
