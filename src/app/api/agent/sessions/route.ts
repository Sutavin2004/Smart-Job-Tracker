import { NextResponse, NextRequest } from 'next/server'
import { withAuth, type Auth } from '@/lib/api'

export const GET = withAuth(async (_req: NextRequest, _ctx: unknown, { db }: Auth) => {
  const sessions = await db.agentSession.findMany({
    orderBy: { startedAt: 'desc' },
    take: 10,
  })
  return NextResponse.json(sessions)
})
