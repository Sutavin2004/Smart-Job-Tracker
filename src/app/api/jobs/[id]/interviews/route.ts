import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const job = await prisma.job.findUnique({ where: { id } })
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  const { type, scheduledAt, notes } = body

  if (!type || !scheduledAt) {
    return NextResponse.json({ error: 'type and scheduledAt are required' }, { status: 400 })
  }

  const interview = await prisma.interview.create({
    data: {
      jobId: id,
      type,
      scheduledAt: new Date(scheduledAt),
      notes: notes || null,
      outcome: 'pending',
    },
  })

  await prisma.activity.create({
    data: {
      jobId: id,
      type: 'interview_scheduled',
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} interview scheduled`,
    },
  })

  // Auto-update status to interviewing if still applied/saved
  if (job.status === 'applied' || job.status === 'saved') {
    await prisma.job.update({
      where: { id },
      data: { status: 'interviewing' },
    })
  }

  return NextResponse.json(interview, { status: 201 })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const { interviewId, outcome, notes } = body

  const interview = await prisma.interview.update({
    where: { id: interviewId },
    data: {
      ...(outcome !== undefined ? { outcome } : {}),
      ...(notes !== undefined ? { notes } : {}),
    },
  })

  return NextResponse.json(interview)
}
