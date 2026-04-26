import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { subDays, format } from 'date-fns'

export async function GET() {
  const since = subDays(new Date(), 365)
  const jobs = await prisma.job.findMany({
    where: { dateApplied: { gte: since } },
    select: { dateApplied: true },
  })

  const counts: Record<string, number> = {}
  for (const job of jobs) {
    const day = format(new Date(job.dateApplied), 'yyyy-MM-dd')
    counts[day] = (counts[day] ?? 0) + 1
  }

  return NextResponse.json(counts)
}
