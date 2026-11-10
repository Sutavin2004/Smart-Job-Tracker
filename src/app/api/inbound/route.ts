import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type Auth } from '@/lib/api'
import { inboundAddress, INBOUND_ENABLED } from '@/lib/inbound/handle'

/** The user's forwarding address and what recent emails did. */
export const GET = withAuth(async (_req: NextRequest, _ctx: unknown, { db, user }: Auth) => {
  if (!INBOUND_ENABLED) return NextResponse.json({ enabled: false, address: null, recent: [] })
  const [address, recent] = await Promise.all([
    inboundAddress(user.id),
    db.inboundEmail.findMany({ orderBy: { receivedAt: 'desc' }, take: 15, select: { id: true, subject: true, outcome: true, link: true, jobId: true, receivedAt: true } }),
  ])
  return NextResponse.json({ enabled: true, address, recent })
})
