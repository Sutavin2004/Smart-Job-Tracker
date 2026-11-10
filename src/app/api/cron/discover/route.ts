import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { runDiscovery } from '@/lib/agent/discover'
import { safeEqual } from '@/lib/auth'
import { scopedDb } from '@/lib/scoped-db'
import { consumeQuota, QuotaError } from '@/lib/quota'
import { sendDigest } from '@/lib/digest'
import { prepareTopMatches } from '@/lib/apply/top-matches'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

/**
 * Daily Job Agent run for every user who turned on "Run every morning",
 * triggered by Vercel Cron (see vercel.json).
 *
 * Auth: if CRON_SECRET is set, Vercel sends it as a Bearer token and we require
 * it. Without it we accept Vercel's cron user agent, which can be spoofed, so
 * each user's run is also limited to once every 20 hours: the most a forged
 * request can do is trigger the same daily runs the schedule would.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization') ?? ''
  const fromCron = secret ? safeEqual(auth, `Bearer ${secret}`) : (req.headers.get('user-agent') ?? '').includes('vercel-cron')
  if (!fromCron) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const started = Date.now()
  const since = new Date(started - 20 * 60 * 60 * 1000)
  const profiles = await prisma.userProfile.findMany({
    where: {
      autoDiscover: true,
      targetRoles: { not: '' },
      user: { agentSessions: { none: { trigger: 'scheduled', startedAt: { gte: since } } } },
    },
    select: { userId: true },
    orderBy: { updatedAt: 'asc' },
  })

  const results: Record<string, unknown>[] = []
  for (const { userId } of profiles) {
    // Leave headroom under the 300s function limit; anyone skipped runs tomorrow.
    if (Date.now() - started > 220_000) break
    try {
      await consumeQuota(userId, 'agent')
      const db = scopedDb(userId)
      const r = await runDiscovery({ db, userId, trigger: 'scheduled' })
      // Prepare applications for the best new matches while there is time left in this run.
      let prepared = 0
      if (r.added > 0 && Date.now() - started < 150_000) {
        const profile = await db.userProfile.findFirst({ select: { autoPrepare: true } })
        if (profile?.autoPrepare) prepared = (await prepareTopMatches(db, userId).catch(() => ({ prepared: [] }))).prepared.length
      }
      const emailed = r.added > 0 && r.sessionId ? await sendDigest(userId, r.sessionId).catch(() => false) : false
      results.push({ userId, added: r.added, prepared, emailed, error: r.error })
    } catch (err) {
      results.push({ userId, error: err instanceof QuotaError ? 'daily limit reached' : String(err) })
    }
  }
  return NextResponse.json({ eligible: profiles.length, ran: results.length, results })
}
