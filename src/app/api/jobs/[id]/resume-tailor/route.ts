import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [job, profile] = await Promise.all([
    prisma.job.findUnique({ where: { id } }),
    prisma.userProfile.findFirst(),
  ])
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (!anthropic) {
    return NextResponse.json({ error: 'No API key' }, { status: 503 })
  }

  const prompt = `You are a resume optimization expert. Tailor this resume for the job description.

JOB DESCRIPTION:
${job.jobDescription ?? 'Not provided'}

CURRENT RESUME:
${profile?.masterResume ?? 'No resume provided'}

Return ONLY a valid JSON object with these exact keys:
{
  "topKeywords": ["list of top 10 keywords from JD"],
  "presentKeywords": ["keywords already in resume"],
  "missingKeywords": ["important keywords missing from resume"],
  "skillsToEmphasize": ["list of 5 skills to highlight"],
  "rewrittenBullets": [{"original": "...", "improved": "..."}],
  "tailoredSummary": "a 2-3 sentence summary tailored to this role",
  "atsScoreBefore": number (0-100),
  "atsScoreAfter": number (0-100)
}`

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = msg.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('')
  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return NextResponse.json(JSON.parse(match[0]))
  } catch { /* fall through */ }

  return NextResponse.json({ topKeywords: [], presentKeywords: [], missingKeywords: [], skillsToEmphasize: [], rewrittenBullets: [], tailoredSummary: text, atsScoreBefore: 0, atsScoreAfter: 0 })
}
