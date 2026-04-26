import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { offerAmount, context } = body as { offerAmount: string; context?: string }

  const [job, profile] = await Promise.all([
    prisma.job.findUnique({ where: { id } }),
    prisma.userProfile.findFirst(),
  ])
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (!anthropic) {
    return NextResponse.json({ strategy: 'counter', advice: 'Add ANTHROPIC_API_KEY to get negotiation advice.', script: '', dos: [], donts: [] })
  }

  const prompt = `You are a salary negotiation expert. Give advice for this situation.

Job: ${job.role} at ${job.company}
Their offer: ${offerAmount}
Candidate target: ${profile?.currency ?? 'CAD'} ${profile?.targetSalaryMin ?? 0}k - ${profile?.targetSalaryMax ?? 0}k
Additional context: ${context ?? 'None'}

Return JSON with these exact keys:
{
  "strategy": "accept" | "counter" | "decline",
  "counterAmount": "suggested counter amount or null",
  "reasoning": "2-3 sentences explaining the strategy",
  "script": "exact word-for-word script to say or email",
  "dos": ["list of 3-4 things to do"],
  "donts": ["list of 3-4 things to avoid"],
  "marketInsight": "brief market rate context for this role"
}
Only return the JSON object.`

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = msg.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('')
  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return NextResponse.json(JSON.parse(match[0]))
  } catch { /* fall through */ }

  return NextResponse.json({ strategy: 'counter', reasoning: text, script: '', dos: [], donts: [], marketInsight: '' })
}
