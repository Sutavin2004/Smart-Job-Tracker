import { prisma } from '@/lib/prisma'
import { CalendarClient } from './CalendarClient'

export const dynamic = 'force-dynamic'

export default async function CalendarPage() {
  const [interviews, deadlines] = await Promise.all([
    prisma.interview.findMany({
      orderBy: { scheduledAt: 'asc' },
      include: { job: { select: { company: true, role: true, id: true } } },
    }),
    prisma.job.findMany({
      where: { deadline: { not: null } },
      select: { id: true, company: true, role: true, deadline: true, status: true },
    }),
  ])

  return (
    <CalendarClient
      interviews={interviews.map(iv => ({
        ...iv,
        scheduledAt: iv.scheduledAt.toISOString(),
        createdAt: iv.createdAt.toISOString(),
      }))}
      deadlines={deadlines.map(d => ({
        ...d,
        deadline: d.deadline!.toISOString(),
      }))}
    />
  )
}
