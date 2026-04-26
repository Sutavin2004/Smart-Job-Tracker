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
      contacts: { orderBy: { createdAt: 'asc' } },
      tasks: { orderBy: [{ completed: 'asc' }, { createdAt: 'asc' }] },
      salaryNegotiations: { orderBy: { round: 'asc' } },
      applicationQAs: { orderBy: { createdAt: 'asc' } },
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

  if (body.status && body.status !== existing.status) {
    await prisma.activity.create({
      data: {
        jobId: id,
        type: 'status_change',
        message: `Status changed from ${existing.status} to ${body.status}`,
      },
    })
  }

  const data: Record<string, unknown> = {}
  const fields = [
    'company', 'role', 'status', 'priority', 'excitement', 'pinned', 'archived', 'color', 'tags',
    'jobUrl', 'jobDescription', 'parsedKeywords', 'parsedTechStack',
    'location', 'remote', 'hybrid',
    'salary', 'salaryRaw', 'salaryMin', 'salaryMax', 'currency',
    'companySize', 'companyStage', 'industry', 'benefits', 'visaSponsorship',
    'source', 'referralContact', 'resumeVersion',
    'recruiterName', 'recruiterEmail', 'recruiterPhone',
    'offerAmount', 'rejectionReason', 'notes', 'techStack',
    'aiScore', 'aiSuggestion', 'aiStrengths', 'aiRisks', 'aiNextSteps',
    'aiKeySkills', 'aiSalaryInsight', 'aiCultureFit', 'coverLetter',
    'discoveredBy', 'agentSessionId', 'agentNotes',
  ]
  const dateFields = ['dateApplied', 'deadline', 'followUpDate', 'lastContactDate', 'offerDeadline', 'aiLastAnalyzed']

  for (const f of fields) {
    if (f in body) data[f] = body[f] ?? null
  }
  for (const f of dateFields) {
    if (f in body) data[f] = body[f] ? new Date(body[f]) : null
  }

  const job = await prisma.job.update({
    where: { id },
    data,
    include: {
      interviews: { orderBy: { scheduledAt: 'asc' } },
      activities: { orderBy: { createdAt: 'desc' } },
      documents: { orderBy: { createdAt: 'desc' } },
      contacts: { orderBy: { createdAt: 'asc' } },
      tasks: { orderBy: [{ completed: 'asc' }, { createdAt: 'asc' }] },
      salaryNegotiations: { orderBy: { round: 'asc' } },
      applicationQAs: { orderBy: { createdAt: 'asc' } },
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
