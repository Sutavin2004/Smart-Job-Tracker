import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type Auth } from '@/lib/api'
import { prepareTopMatches, unpreparedTopMatches } from '@/lib/apply/top-matches'
import { IS_DEMO } from '@/lib/demo'

export const maxDuration = 180

/** GET: how many top matches still need preparing. POST: prepare them (if the user has auto-prepare on). */
export const GET = withAuth(async (_req: NextRequest, _ctx: unknown, { db }: Auth) => {
  const [profile, pending] = await Promise.all([
    db.userProfile.findFirst({ select: { autoPrepare: true, masterResume: true } }),
    unpreparedTopMatches(db),
  ])
  return NextResponse.json({
    autoPrepare: Boolean(profile?.autoPrepare),
    hasResume: (profile?.masterResume?.trim().length ?? 0) >= 200,
    aiEnabled: Boolean(process.env.ANTHROPIC_API_KEY) && !IS_DEMO,
    demo: IS_DEMO,
    pending: pending.length,
  })
})

export const POST = withAuth(async (_req: NextRequest, _ctx: unknown, { db, user }: Auth) => {
  const r = await prepareTopMatches(db, user.id)
  return NextResponse.json({ prepared: r.prepared.length, limitReached: r.limitReached })
})
