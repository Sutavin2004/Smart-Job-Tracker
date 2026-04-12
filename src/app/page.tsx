import { prisma } from '@/lib/prisma'
import { formatRelative } from '@/lib/utils'
import { STATUS_CONFIG, JOB_STATUSES } from '@/lib/types'
import { DashboardClient } from './DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [jobs, activities] = await Promise.all([
    prisma.job.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
    prisma.activity.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { job: { select: { company: true, role: true } } },
    }),
  ])

  const counts = {
    total: await prisma.job.count(),
    ...Object.fromEntries(
      await Promise.all(
        JOB_STATUSES.map(async s => [s, await prisma.job.count({ where: { status: s } })])
      )
    ),
  } as Record<string, number>

  const upcomingInterviews = await prisma.interview.findMany({
    where: { scheduledAt: { gte: new Date() }, outcome: 'pending' },
    orderBy: { scheduledAt: 'asc' },
    take: 5,
    include: { job: { select: { company: true, role: true } } },
  })

  return (
    <DashboardClient
      counts={counts}
      recentJobs={jobs.map(j => ({ ...j, dateApplied: j.dateApplied.toISOString(), deadline: j.deadline?.toISOString() ?? null, createdAt: j.createdAt.toISOString(), updatedAt: j.updatedAt.toISOString() }))}
      activities={activities.map(a => ({ ...a, createdAt: a.createdAt.toISOString() }))}
      upcomingInterviews={upcomingInterviews.map(iv => ({ ...iv, scheduledAt: iv.scheduledAt.toISOString(), createdAt: iv.createdAt.toISOString() }))}
    />
  )
}
