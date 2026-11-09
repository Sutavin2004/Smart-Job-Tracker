import { NextResponse, NextRequest } from 'next/server'
import { withAuth, type Auth } from '@/lib/api'
import { subDays, format } from 'date-fns'

export const GET = withAuth(async (_req: NextRequest, _ctx: unknown, { db }: Auth) => {
  try {
    const since = subDays(new Date(), 365)
    const jobs = await db.job.findMany({
      where: { dateApplied: { gte: since } },
      select: { dateApplied: true },
    })

    const counts: Record<string, number> = {}
    for (const job of jobs) {
      const day = format(new Date(job.dateApplied), 'yyyy-MM-dd')
      counts[day] = (counts[day] ?? 0) + 1
    }

    return NextResponse.json(counts)
  } catch {
    return NextResponse.json({})
  }
})
