import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type Auth } from '@/lib/api'
import { outcomeStamps } from '@/lib/insights/stamps'

export const POST = withAuth(async (req: NextRequest, _ctx: unknown, { db }: Auth) => {
  const body = await req.json()
  const { action, ids, value } = body as { action: string; ids: string[]; value?: string }

  if (!ids?.length) return NextResponse.json({ error: 'No ids provided' }, { status: 400 })

  if (action === 'delete') {
    await db.job.deleteMany({ where: { id: { in: ids } } })
  } else if (action === 'archive') {
    await db.job.updateMany({ where: { id: { in: ids } }, data: { archived: true } })
  } else if (action === 'status' && value) {
    // One at a time, so each job's outcome is stamped from its own previous state.
    const jobs = await db.job.findMany({ where: { id: { in: ids } } })
    for (const job of jobs) {
      await db.job.update({
        where: { id: job.id },
        data: {
          status: value,
          ...outcomeStamps(job, value),
          // Jobs leaving "saved" get their real application date.
          ...(job.status === 'saved' && value !== 'saved' ? { dateApplied: new Date() } : {}),
        },
      })
    }
  } else if (action === 'priority' && value) {
    await db.job.updateMany({ where: { id: { in: ids } }, data: { priority: value } })
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  return NextResponse.json({ success: true, count: ids.length })
})
