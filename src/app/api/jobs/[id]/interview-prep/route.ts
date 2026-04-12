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
  const { interviewType } = body as { interviewType?: string }

  let prep: string

  if (!client) {
    prep = 'Add your ANTHROPIC_API_KEY to .env to generate interview prep.'
  } else {
    const prompt = `Generate interview preparation materials for this job application.

Company: ${job.company}
Role: ${job.role}
Interview Type: ${interviewType || 'general'}
Notes: ${job.notes || 'None'}

Provide:
1. 5 likely interview questions with brief answer frameworks
2. 3 smart questions to ask the interviewer
3. 2-3 key things to research about the company before the interview

Format clearly with headers.`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    prep = (message.content[0] as { type: string; text: string }).text
  }

  return NextResponse.json({ prep })
}
