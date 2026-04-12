import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      interviews: { orderBy: { scheduledAt: 'asc' } },
      activities: { orderBy: { createdAt: 'desc' } },
      documents: { orderBy: { createdAt: 'desc' } },
    },
  })
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(job)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()

  const existing = await prisma.job.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { company, role, status, priority, jobUrl, location, salary, notes, deadline } = body

  // Track status change
  if (status && status !== existing.status) {
    await prisma.activity.create({
      data: {
        jobId: id,
        type: 'status_change',
        message: `Status changed from ${existing.status} to ${status}`,
      },
    })
  }

  const job = await prisma.job.update({
    where: { id },
    data: {
      ...(company !== undefined ? { company } : {}),
      ...(role !== undefined ? { role } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(priority !== undefined ? { priority } : {}),
      ...(jobUrl !== undefined ? { jobUrl: jobUrl || null } : {}),
      ...(location !== undefined ? { location: location || null } : {}),
      ...(salary !== undefined ? { salary: salary || null } : {}),
      ...(notes !== undefined ? { notes: notes || null } : {}),
      ...(deadline !== undefined ? { deadline: deadline ? new Date(deadline) : null } : {}),
    },
    include: {
      interviews: { orderBy: { scheduledAt: 'asc' } },
      activities: { orderBy: { createdAt: 'desc' } },
      documents: { orderBy: { createdAt: 'desc' } },
    },
  })

  return NextResponse.json(job)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = await prisma.job.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.job.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
