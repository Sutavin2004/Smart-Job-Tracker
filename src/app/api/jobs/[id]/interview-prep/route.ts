import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [job, profile] = await Promise.all([
    prisma.job.findUnique({ where: { id } }),
    prisma.userProfile.findFirst(),
  ])
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json().catch(() => ({}))
  const { interviewType } = body as { interviewType?: string }

  let prep: string

  if (!client) {
    prep = 'Add your ANTHROPIC_API_KEY to .env to generate interview prep.'
  } else {
    const prompt = `Generate comprehensive interview preparation materials for this job application.

Company: ${job.company}
Role: ${job.role}
Interview Type: ${interviewType || 'general'}
Job Description: ${job.jobDescription || 'Not provided'}
Candidate Skills: ${profile?.skills || 'Not provided'}
Notes: ${job.notes || 'None'}

Provide:
1. 5 likely interview questions with detailed answer frameworks (use STAR method for behavioural)
2. 3 smart questions to ask the interviewer
3. 2-3 key things to research about the company before the interview
4. Top 3 skills/experiences to emphasise for this specific role
5. One potential red flag to address proactively

Format clearly with headers and bullet points.`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    prep = (message.content[0] as { type: string; text: string }).text
  }

  // Save interview prep as a Document record
  await prisma.document.create({
    data: {
      jobId: id,
      name: `Interview Prep — ${job.company} ${job.role} (${interviewType || 'General'})`,
      type: 'other',
      content: prep,
      isActive: true,
    },
  })

  await prisma.activity.create({
    data: {
      jobId: id,
      type: 'note',
      message: `Interview prep generated for ${interviewType || 'general'} interview at ${job.company}`,
    },
  })

  return NextResponse.json({ prep })
}
