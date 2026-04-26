import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { emailType, recipientName, context } = body as { emailType: string; recipientName?: string; context?: string }

  const [job, profile] = await Promise.all([
    prisma.job.findUnique({ where: { id } }),
    prisma.userProfile.findFirst(),
  ])
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (!anthropic) {
    return NextResponse.json({
      subject: 'Add ANTHROPIC_API_KEY to generate emails',
      body: 'Add your ANTHROPIC_API_KEY to .env to generate professional emails.',
      explanation: '',
    })
  }

  const typeDescriptions: Record<string, string> = {
    follow_up: 'a polite follow-up email after applying with no response',
    thank_you: 'a thank-you email after an interview',
    withdraw: 'a professional email withdrawing from the application process',
    counter_offer: 'a salary counter-offer email',
    networking: 'a networking email to connect with someone at the company',
    cold_outreach: 'a cold outreach email to a hiring manager',
  }

  const prompt = `Write ${typeDescriptions[emailType] ?? 'a professional email'} for this job application.

Company: ${job.company}
Role: ${job.role}
Recipient name: ${recipientName ?? 'Hiring Manager'}
Sender name: ${profile?.name ?? '[Your Name]'}
Additional context: ${context ?? 'None'}

Return JSON with these exact keys:
{
  "subject": "email subject line",
  "body": "full email body (plain text, use \\n for line breaks)",
  "explanation": "1-2 sentences on why this approach works"
}
Only return the JSON object, no other text.`

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = msg.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('')
  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return NextResponse.json(JSON.parse(match[0]))
  } catch { /* fall through */ }

  return NextResponse.json({ subject: 'Follow-up', body: text, explanation: '' })
}
