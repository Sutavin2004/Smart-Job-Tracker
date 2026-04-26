import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { resumeText, jobDescription } = body as { resumeText: string; jobDescription?: string }
  if (!resumeText) return NextResponse.json({ error: 'resumeText required' }, { status: 400 })

  if (!anthropic) {
    return NextResponse.json({ error: 'No API key' }, { status: 503 })
  }

  const prompt = `Perform a comprehensive ATS resume analysis.

RESUME:
${resumeText.slice(0, 4000)}

${jobDescription ? `JOB DESCRIPTION:\n${jobDescription.slice(0, 2000)}` : ''}

Return ONLY a valid JSON object:
{
  "overallScore": number (0-100),
  "atsScore": number (0-100),
  "readabilityScore": number (0-100),
  "keywordMatchScore": number (0-100),
  "missingKeywords": ["keyword1", "keyword2"],
  "presentKeywords": ["keyword1", "keyword2"],
  "strongPoints": ["strength1", "strength2"],
  "improvements": ["improvement1 (numbered priority)", "improvement2"],
  "atsWarnings": ["warning1", "warning2"],
  "rewrittenBullets": [{"original": "...", "improved": "..."}],
  "summary": "2-3 sentence overall assessment"
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

  return NextResponse.json({ overallScore: 0, atsScore: 0, readabilityScore: 0, keywordMatchScore: 0, missingKeywords: [], presentKeywords: [], strongPoints: [], improvements: [text], atsWarnings: [], rewrittenBullets: [], summary: '' })
}
