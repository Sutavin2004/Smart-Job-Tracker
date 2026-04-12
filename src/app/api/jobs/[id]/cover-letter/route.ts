import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const job = await prisma.job.findUnique({ where: { id } })
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json().catch(() => ({}))
  const { background } = body as { background?: string }

  let coverLetter: string

  if (!client) {
    coverLetter = 'Add your ANTHROPIC_API_KEY to .env to generate cover letters.'
  } else {
    const prompt = `Write a professional, compelling cover letter for this job application.

Company: ${job.company}
Role: ${job.role}
Location: ${job.location || 'Not specified'}
Job URL: ${job.jobUrl || 'Not provided'}
Additional context about the applicant: ${background || 'Not provided'}
Notes: ${job.notes || 'None'}

Write a complete, ready-to-send cover letter (3-4 paragraphs). Use [Your Name] as placeholder. Make it specific to the company and role. Be enthusiastic but professional.`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    })

    coverLetter = (message.content[0] as { type: string; text: string }).text
  }

  const updated = await prisma.job.update({
    where: { id },
    data: { coverLetter },
  })

  await prisma.activity.create({
    data: {
      jobId: id,
      type: 'document_added',
      message: 'Cover letter generated',
    },
  })

  return NextResponse.json({ coverLetter: updated.coverLetter })
}
