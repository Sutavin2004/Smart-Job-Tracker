import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type Auth } from '@/lib/api'
import { interviewStamps } from '@/lib/insights/stamps'

export const POST = withAuth(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }, { db }: Auth) => {
  const { id } = await params
  const job = await db.job.findUnique({ where: { id } })
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const { type, scheduledAt, notes } = body

  if (!type || !scheduledAt) {
    return NextResponse.json({ error: 'type and scheduledAt are required' }, { status: 400 })
  }

  const interview = await db.interview.create({
    data: {
      jobId: id,
      type,
      scheduledAt: new Date(scheduledAt),
      notes: notes || null,
      outcome: 'pending',
    },
  })

  // An interview is the clearest outcome there is; record it even if the stage wasn't moved.
  const stamps = interviewStamps(job)
  if (Object.keys(stamps).length) await db.job.update({ where: { id }, data: stamps })

  await db.activity.create({
    data: {
      jobId: id,
      type: 'interview_scheduled',
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} interview scheduled`,
    },
  })

  // Auto-update status to interviewing if still applied/saved
  if (job.status === 'applied' || job.status === 'saved') {
    await db.job.update({
      where: { id },
      data: { status: 'interviewing' },
    })
  }

  return NextResponse.json(interview, { status: 201 })
})

export const PUT = withAuth(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }, { db }: Auth) => {
  const { id } = await params
  const body = await request.json()
  const { interviewId, outcome, notes } = body

  // Make sure the interview belongs to this job before updating it.
  const existing = await db.interview.findFirst({ where: { id: interviewId, jobId: id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const interview = await db.interview.update({
    where: { id: interviewId },
    data: {
      ...(outcome !== undefined ? { outcome } : {}),
      ...(notes !== undefined ? { notes } : {}),
    },
  })

  return NextResponse.json(interview)
})
