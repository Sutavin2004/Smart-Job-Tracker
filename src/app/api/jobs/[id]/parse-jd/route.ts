import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { jobDescription } = body as { jobDescription: string }
  if (!jobDescription) return NextResponse.json({ error: 'jobDescription required' }, { status: 400 })

  if (!anthropic) {
    return NextResponse.json({ error: 'No API key' }, { status: 503 })
  }

  const prompt = `Extract structured information from this job description. Return ONLY a valid JSON object with these exact keys (use null for unknown fields):

{
  "company": string or null,
  "role": string or null,
  "location": string or null,
  "remote": boolean,
  "hybrid": boolean,
  "salaryRaw": string or null,
  "salaryMin": number or null,
  "salaryMax": number or null,
  "techStack": string or null,
  "benefits": string or null,
  "companySize": string or null,
  "industry": string or null,
  "visaSponsorship": boolean,
  "yearsRequired": number or null,
  "requirements": string or null,
  "parsedKeywords": string or null
}

Job Description:
${jobDescription.slice(0, 4000)}`

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

  return NextResponse.json({})
}
