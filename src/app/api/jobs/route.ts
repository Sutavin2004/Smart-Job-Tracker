import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search')

  const jobs = await prisma.job.findMany({
    where: {
      ...(status && status !== 'all' ? { status } : {}),
      ...(search ? {
        OR: [
          { company: { contains: search } },
          { role: { contains: search } },
          { location: { contains: search } },
        ],
      } : {}),
    },
    include: {
      interviews: { orderBy: { scheduledAt: 'asc' } },
      activities: { orderBy: { createdAt: 'desc' }, take: 5 },
      documents: { orderBy: { createdAt: 'desc' } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json(jobs)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { company, role, status, priority, jobUrl, location, salary, notes, deadline } = body

  if (!company || !role) {
    return NextResponse.json({ error: 'Company and role are required' }, { status: 400 })
  }

  const job = await prisma.job.create({
    data: {
      company,
      role,
      status: status || 'saved',
      priority: priority || 'medium',
      jobUrl: jobUrl || null,
      location: location || null,
      salary: salary || null,
      notes: notes || null,
      deadline: deadline ? new Date(deadline) : null,
    },
  })

  await prisma.activity.create({
    data: {
      jobId: job.id,
      type: 'created',
      message: `Application created for ${role} at ${company}`,
    },
  })

  return NextResponse.json(job, { status: 201 })
}
