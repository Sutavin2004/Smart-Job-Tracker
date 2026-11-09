import { consumeQuota } from '@/lib/quota'
import { NextRequest, NextResponse } from 'next/server'
import { AI_MODELS } from '@/lib/ai-models'
import { withAuth, type Auth } from '@/lib/api'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null

export const POST = withAuth(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }, { db, user }: Auth) => {
  const { id } = await params
  const [job, profile] = await Promise.all([
    db.job.findUnique({ where: { id } }),
    db.userProfile.findFirst(),
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
  "tailoredResume": "full tailored resume text incorporating all improvements",
  "atsScoreBefore": number (0-100),
  "atsScoreAfter": number (0-100)
}`

  await consumeQuota(user.id, 'ai')
  const msg = await anthropic.messages.create({
    model: AI_MODELS.fast,
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = msg.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('')

  let result = { topKeywords: [], presentKeywords: [], missingKeywords: [], skillsToEmphasize: [], rewrittenBullets: [], tailoredSummary: text, tailoredResume: '', atsScoreBefore: 0, atsScoreAfter: 0 }
  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) result = { ...result, ...JSON.parse(match[0]) }
  } catch { /* keep defaults */ }

  // Save tailored resume as a Document record
  if (result.tailoredResume) {
    const version = `v${Date.now()}`
    await db.document.create({
      data: {
        jobId: id,
        name: `Tailored Resume — ${job.company} ${job.role}`,
        type: 'resume',
        content: result.tailoredResume,
        version,
        isActive: true,
      },
    })

    await db.job.update({
      where: { id },
      data: { resumeVersion: version },
    })

    await db.activity.create({
      data: {
        jobId: id,
        type: 'document_added',
        message: `Resume tailored for ${job.role} at ${job.company} (ATS: ${result.atsScoreBefore}% → ${result.atsScoreAfter}%)`,
      },
    })
  }

  return NextResponse.json(result)
})
