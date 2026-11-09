import { consumeQuota } from '@/lib/quota'
import { NextRequest, NextResponse } from 'next/server'
import { AI_MODELS } from '@/lib/ai-models'
import { withAuth, type Auth } from '@/lib/api'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null

export const POST = withAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }, { db, user }: Auth) => {
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const { interviewType = 'general', round = 1 } = body as { interviewType?: string; round?: number }

  const job = await db.job.findUnique({ where: { id } })
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (!anthropic) {
    return NextResponse.json({ prep: 'Add ANTHROPIC_API_KEY to generate interview prep.' })
  }

  const prompt = `Generate comprehensive interview prep for:
Company: ${job.company}
Role: ${job.role}
Interview type: ${interviewType}
Round: ${round}
Job description: ${job.jobDescription ?? 'Not provided'}

Return ONLY a valid JSON object:
{
  "overview": "brief overview of what to expect",
  "companyResearch": "key things to know about the company",
  "roleExpectations": "what they'll likely assess",
  "behavioralQuestions": [{"question": "...", "framework": "STAR", "sampleAnswer": "..."}],
  "technicalQuestions": [{"question": "...", "approach": "...", "sampleAnswer": "..."}],
  "questionsToAsk": ["smart question 1", "smart question 2", "smart question 3"],
  "redFlags": ["red flag to watch for"],
  "logisticsChecklist": ["checklist item"],
  "starStories": [{"situation": "...", "task": "...", "action": "...", "result": "...", "usedFor": "..."}]
}`

  await consumeQuota(user.id, 'ai')
  const msg = await anthropic.messages.create({
    model: AI_MODELS.fast,
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = msg.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('')
  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return NextResponse.json(JSON.parse(match[0]))
  } catch { /* fall through */ }

  return NextResponse.json({ prep: text })
})
