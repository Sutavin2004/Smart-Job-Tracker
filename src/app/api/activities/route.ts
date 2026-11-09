import { NextResponse, NextRequest } from 'next/server'
import { withAuth, type Auth } from '@/lib/api'

export const GET = withAuth(async (_req: NextRequest, _ctx: unknown, { db }: Auth) => {
  const activities = await db.activity.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      job: {
        select: { company: true, role: true },
      },
    },
  })

  return NextResponse.json(activities)
})
