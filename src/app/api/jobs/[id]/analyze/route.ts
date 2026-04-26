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
    const fallback = 'Add your ANTHROPIC_API_KEY to .env to enable AI analysis.'
    const updated = await prisma.job.update({
      where: { id },
      data: { aiSuggestion: fallback, aiScore: 0, aiLastAnalyzed: new Date() },
    })
    return NextResponse.json(updated)
  }

  const profileCtx = profile ? `
Candidate: ${profile.name || 'Unknown'}
Title: ${profile.currentTitle}
Experience: ${profile.yearsExperience} years
Skills: ${profile.skills}
Education: ${profile.education}
Goals: ${profile.jobSearchGoals}
Target salary: ${profile.currency} ${profile.targetSalaryMin}k-${profile.targetSalaryMax}k
Resume: ${profile.masterResume ? profile.masterResume.slice(0, 1000) : 'Not provided'}` : 'No profile available'

  const prompt = `Analyze this job application and provide a comprehensive fit assessment.

JOB:
Company: ${job.company}
Role: ${job.role}
Status: ${job.status}
Location: ${job.location ?? 'Unknown'}
Salary: ${job.salary ?? job.salaryRaw ?? 'Not specified'}
Description: ${job.jobDescription ?? 'Not provided'}
Tech stack: ${job.techStack ?? job.parsedTechStack ?? 'Not specified'}

CANDIDATE:
${profileCtx}

Return ONLY a valid JSON object:
{
  "score": number 0-100,
  "suggestion": "main recommendation in 1-2 sentences",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "risks": ["risk 1", "risk 2"],
  "nextSteps": ["next step 1", "next step 2", "next step 3"],
  "keySkills": {"have": ["skill1"], "missing": ["skill2"]},
  "salaryInsight": "salary market context for this role",
  "cultureFit": "culture fit assessment",
  "applicationTips": ["tip 1", "tip 2", "tip 3"]
}`

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = msg.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('')

  let parsed: Record<string, unknown> = {}
  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) parsed = JSON.parse(match[0])
  } catch { /* fall through */ }

  const updated = await prisma.job.update({
    where: { id },
    data: {
      aiScore: typeof parsed.score === 'number' ? parsed.score : null,
      aiSuggestion: typeof parsed.suggestion === 'string' ? parsed.suggestion : text.slice(0, 500),
      aiStrengths: Array.isArray(parsed.strengths) ? JSON.stringify(parsed.strengths) : null,
      aiRisks: Array.isArray(parsed.risks) ? JSON.stringify(parsed.risks) : null,
      aiNextSteps: Array.isArray(parsed.nextSteps) ? JSON.stringify(parsed.nextSteps) : null,
      aiKeySkills: parsed.keySkills ? JSON.stringify(parsed.keySkills) : null,
      aiSalaryInsight: typeof parsed.salaryInsight === 'string' ? parsed.salaryInsight : null,
      aiCultureFit: typeof parsed.cultureFit === 'string' ? parsed.cultureFit : null,
      aiLastAnalyzed: new Date(),
    },
    include: {
      interviews: true,
      activities: { orderBy: { createdAt: 'desc' } },
      documents: true,
      contacts: true,
      tasks: true,
    },
  })

  await prisma.activity.create({
    data: { jobId: id, type: 'ai_analyzed', message: `AI analysis completed — fit score: ${typeof parsed.score === 'number' ? parsed.score : 'N/A'}/100` },
  })

  return NextResponse.json(updated)
}
