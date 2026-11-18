import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type Auth } from '@/lib/api'
import { loadLearnings } from '@/lib/insights/load'

/** Applications this old with no recorded reply get a quick "any replies?" prompt. */
const CHECK_IN_DAYS = 14

/** What the user's own results show, plus applications that need an outcome recorded. */
export const GET = withAuth(async (_req: NextRequest, _ctx: unknown, { db }: Auth) => {
  const profile = await db.userProfile.findFirst({ select: { targetRoles: true } })
  const learnings = await loadLearnings(db, profile?.targetRoles ?? '')
  const checkIns = await db.job.findMany({
    where: {
      status: 'applied',
      archived: false,
      respondedAt: null,
      dateApplied: { lte: new Date(Date.now() - CHECK_IN_DAYS * 86400000) },
    },
    select: { id: true, company: true, role: true, dateApplied: true },
    orderBy: { dateApplied: 'asc' },
    take: 5,
  })
  // Ranking factors are internal; the page only needs the plain findings.
  const { factors, ...rest } = learnings
  void factors
  return NextResponse.json({ ...rest, checkIns })
})
