import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const jobs = await prisma.job.findMany({
    where: { agentSessionId: id },
    orderBy: { aiScore: 'desc' },
    select: {
      id: true,
      company: true,
      role: true,
      location: true,
      remote: true,
      hybrid: true,
      salary: true,
      salaryRaw: true,
      aiScore: true,
      aiSuggestion: true,
      source: true,
      jobUrl: true,
      industry: true,
      priority: true,
      status: true,
      createdAt: true,
    },
  })

  return NextResponse.json(jobs)
}
