import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { IS_DEMO } from '@/lib/demo'
import { seedDemoData } from '@/lib/demo-seed'
import { safeEqual } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/** Daily reset of the public demo's data (no-op outside demo mode). */
export async function GET(req: NextRequest) {
  if (!IS_DEMO) return NextResponse.json({ skipped: 'Not a demo deployment' })
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization') ?? ''
  const fromCron = secret ? safeEqual(auth, `Bearer ${secret}`) : (req.headers.get('user-agent') ?? '').includes('vercel-cron')
  if (!fromCron) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await seedDemoData(prisma)
  return NextResponse.json({ reset: true, at: new Date().toISOString() })
}
