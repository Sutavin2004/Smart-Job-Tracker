import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')
  const search = searchParams.get('search')
  const remote = searchParams.get('remote')
  const source = searchParams.get('source')
  const discoveredBy = searchParams.get('discoveredBy')
  const pinned = searchParams.get('pinned')
  const archived = searchParams.get('archived')
  const tags = searchParams.get('tags')
  const sortBy = searchParams.get('sortBy') ?? 'updatedAt'
  const sortDir = (searchParams.get('sortDir') ?? 'desc') as 'asc' | 'desc'

  const where: Record<string, unknown> = {}

  if (status && status !== 'all') {
    const statuses = status.split(',').map(s => s.trim()).filter(Boolean)
    where.status = statuses.length === 1 ? statuses[0] : { in: statuses }
  }
  if (priority && priority !== 'all') where.priority = priority
  if (remote === 'true') where.remote = true
  if (remote === 'hybrid') where.hybrid = true
  if (source) where.source = source
  if (discoveredBy) where.discoveredBy = discoveredBy
  if (pinned === 'true') where.pinned = true
  if (archived === 'true') where.archived = true
  else if (archived !== 'true') where.archived = false
  if (tags) where.tags = { contains: tags }
  if (search) {
    where.OR = [
      { company: { contains: search } },
      { role: { contains: search } },
      { location: { contains: search } },
      { notes: { contains: search } },
      { tags: { contains: search } },
    ]
  }

  const validSortFields = ['updatedAt', 'createdAt', 'dateApplied', 'company', 'role', 'aiScore', 'priority']
  const orderField = validSortFields.includes(sortBy) ? sortBy : 'updatedAt'

  const jobs = await prisma.job.findMany({
    where,
    include: {
      interviews: { orderBy: { scheduledAt: 'asc' } },
      activities: { orderBy: { createdAt: 'desc' }, take: 5 },
      documents: { orderBy: { createdAt: 'desc' } },
      contacts: { orderBy: { createdAt: 'asc' } },
      tasks: { orderBy: { createdAt: 'asc' } },
    },
    orderBy: [{ pinned: 'desc' }, { [orderField]: sortDir }],
  })

  return NextResponse.json(jobs)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { company, role } = body

  if (!company || !role) {
    return NextResponse.json({ error: 'Company and role are required' }, { status: 400 })
  }

  const job = await prisma.job.create({
    data: {
      company,
      role,
      status: body.status ?? 'saved',
      priority: body.priority ?? 'medium',
      excitement: body.excitement ?? null,
      jobUrl: body.jobUrl ?? null,
      jobDescription: body.jobDescription ?? null,
      location: body.location ?? null,
      remote: Boolean(body.remote),
      hybrid: Boolean(body.hybrid),
      salary: body.salary ?? body.salaryRaw ?? null,
      salaryRaw: body.salaryRaw ?? body.salary ?? null,
      salaryMin: body.salaryMin ? Number(body.salaryMin) : null,
      salaryMax: body.salaryMax ? Number(body.salaryMax) : null,
      currency: body.currency ?? 'CAD',
      source: body.source ?? null,
      industry: body.industry ?? null,
      techStack: body.techStack ?? body.parsedTechStack ?? null,
      parsedTechStack: body.parsedTechStack ?? body.techStack ?? null,
      notes: body.notes ?? null,
      deadline: body.deadline ? new Date(body.deadline) : null,
      followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
      recruiterName: body.recruiterName ?? null,
      recruiterEmail: body.recruiterEmail ?? null,
      tags: body.tags ?? null,
      discoveredBy: body.discoveredBy ?? null,
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
