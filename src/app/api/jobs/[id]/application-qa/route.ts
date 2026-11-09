import { consumeQuota } from '@/lib/quota'
import { NextRequest, NextResponse } from 'next/server'
import { AI_MODELS } from '@/lib/ai-models'
import { withAuth, type Auth } from '@/lib/api'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null

export const GET = withAuth(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }, { db }: Auth) => {
  const { id } = await params
  const qas = await db.applicationQA.findMany({ where: { jobId: id }, orderBy: { createdAt: 'asc' } })
  return NextResponse.json(qas)
})

export const POST = withAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }, { db, user }: Auth) => {
  const { id } = await params
  const body = await req.json()
  const questions: string[] = body.questions ?? []
  if (!questions.length) return NextResponse.json({ error: 'No questions provided' }, { status: 400 })

  const [job, profile] = await Promise.all([
    db.job.findUnique({ where: { id } }),
    db.userProfile.findFirst(),
  ])
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const results: Array<{ question: string; answer: string }> = []

  if (!anthropic) {
    for (const q of questions) {
      await db.applicationQA.create({ data: { jobId: id, question: q, answer: 'Add ANTHROPIC_API_KEY to generate AI answers.' } })
      results.push({ question: q, answer: 'Add ANTHROPIC_API_KEY to generate AI answers.' })
    }
    return NextResponse.json(results)
  }

  const profileCtx = profile ? `
Name: ${profile.name}
Current title: ${profile.currentTitle}
Experience: ${profile.yearsExperience} years
Skills: ${profile.skills}
Bio: ${profile.bio}
Job search goals: ${profile.jobSearchGoals}` : 'No profile available'

  const prompt = `You are answering job application questions for a candidate.

CANDIDATE PROFILE:
${profileCtx}

TARGET JOB:
Company: ${job.company}
Role: ${job.role}
Description: ${job.jobDescription ?? 'Not provided'}

APPLICATION QUESTIONS:
${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Answer each question in the candidate's voice. Be specific, genuine, and professional.
Return a JSON array: [{"question": "...", "answer": "..."}]
Only return the JSON array, no other text.`

  await consumeQuota(user.id, 'ai')
  const msg = await anthropic.messages.create({
    model: AI_MODELS.fast,
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = msg.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('')
  let parsed: Array<{ question: string; answer: string }> = []
  try {
    const match = text.match(/\[[\s\S]*\]/)
    if (match) parsed = JSON.parse(match[0])
  } catch { parsed = questions.map(q => ({ question: q, answer: text })) }

  for (const qa of parsed) {
    await db.applicationQA.create({ data: { jobId: id, question: qa.question, answer: qa.answer } })
    results.push(qa)
  }

  return NextResponse.json(results)
})
