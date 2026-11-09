import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { runDiscovery } from '@/lib/agent/discover'
import { safeEqual } from '@/lib/auth'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

/**
 * Daily Job Agent run, triggered by Vercel Cron (see vercel.json).
 *
 * Auth: if CRON_SECRET is set, Vercel sends it as a Bearer token and we require
 * it. Without it we accept Vercel's cron user agent, which can be spoofed, so
 * the run is also limited to once every 20 hours: the most a forged request can
 * do is trigger the same single daily run the schedule would.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization') ?? ''
  const fromCron = secret ? safeEqual(auth, `Bearer ${secret}`) : (req.headers.get('user-agent') ?? '').includes('vercel-cron')
  if (!fromCron) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await prisma.userProfile.findFirst()
  if (!profile?.autoDiscover) return NextResponse.json({ skipped: 'Daily discovery is turned off' })

  const since = new Date(Date.now() - 20 * 60 * 60 * 1000)
  const recent = await prisma.agentSession.findFirst({ where: { trigger: 'scheduled', startedAt: { gte: since } } })
  if (recent) return NextResponse.json({ skipped: 'Already ran in the last 20 hours' })

  const result = await runDiscovery({ trigger: 'scheduled' })
  return NextResponse.json(result, { status: result.error ? 500 : 200 })
}
