import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const job = await prisma.job.findUnique({ where: { id } })
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let suggestion: string

  if (!client) {
    suggestion = 'Add your ANTHROPIC_API_KEY to .env to enable AI suggestions.'
  } else {
    const prompt = `You are a job search coach. Analyze this job application and give specific, actionable next steps.

Company: ${job.company}
Role: ${job.role}
Status: ${job.status}
Location: ${job.location || 'Not specified'}
Notes: ${job.notes || 'None'}

Provide 2-3 specific, actionable recommendations in 2-3 sentences. Be direct and practical.`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    })

    suggestion = (message.content[0] as { type: string; text: string }).text
  }

  const updated = await prisma.job.update({
    where: { id },
    data: { aiSuggestion: suggestion },
    include: {
      interviews: true,
      activities: { orderBy: { createdAt: 'desc' } },
      documents: true,
    },
  })

  await prisma.activity.create({
    data: {
      jobId: id,
      type: 'ai_analyzed',
      message: 'AI analysis generated',
    },
  })

  return NextResponse.json(updated)
}
