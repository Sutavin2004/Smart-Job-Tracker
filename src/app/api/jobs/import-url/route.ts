import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { AI_MODELS } from '@/lib/ai-models'
import { htmlToText } from '@/lib/html'
import { extractJob, type ImportedJob } from '@/lib/job-import'
import { fetchPublicHtml, fetchPublicJson, UnsafeUrlError } from '@/lib/safe-fetch'
import { detectAts, apiUrl, mapAts } from '@/lib/ats'

export const maxDuration = 60

const FIELDS = ['company', 'role', 'location', 'remote', 'salaryRaw', 'salaryMin', 'salaryMax', 'currency', 'jobDescription', 'deadline', 'employmentType'] as const

/** Ask Claude to read the page text when the site has no structured job data. */
async function aiExtract(text: string): Promise<Partial<ImportedJob> | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const res = await anthropic.messages.create({
    model: AI_MODELS.fast,
    max_tokens: 2500,
    messages: [{
      role: 'user',
      content: `Below is the text of a job posting web page. Extract the posting's details as a JSON object with exactly these keys:
company, role, location, remote (boolean), salaryRaw (as written, or null), salaryMin and salaryMax (annual, in thousands, numbers or null), currency (ISO code or null), jobDescription (the responsibilities and requirements, plain text, up to ~3000 characters), deadline (YYYY-MM-DD or null), employmentType (or null).
Use only information present in the text. Use null for anything missing. Return ONLY the JSON object.

PAGE TEXT:
${text.slice(0, 20000)}`,
    }],
  })
  const out = res.content.filter(b => b.type === 'text').map(b => (b as { text: string }).text).join('')
  const json = out.match(/\{[\s\S]*\}/)?.[0]
  if (!json) return null
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>
    return Object.fromEntries(FIELDS.filter(k => k in parsed).map(k => [k, parsed[k]])) as Partial<ImportedJob>
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const { url } = await req.json().catch(() => ({ url: '' }))
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url.trim())) {
    return NextResponse.json({ error: 'Paste a full link starting with https://' }, { status: 400 })
  }

  // Greenhouse, Lever and Ashby pages are rendered client-side; use their public JSON APIs.
  const ats = detectAts(url.trim())
  if (ats) {
    try {
      const job = mapAts(ats, await fetchPublicJson(apiUrl(ats)))
      if (job?.role) {
        return NextResponse.json({ job: { ...job, jobUrl: job.jobUrl || url.trim() }, source: ats.kind, usedAi: false })
      }
    } catch { /* fall through to reading the page */ }
  }

  let html: string
  let finalUrl: string
  try {
    ({ html, finalUrl } = await fetchPublicHtml(url.trim()))
  } catch (err) {
    const msg = err instanceof UnsafeUrlError ? err.message
      : err instanceof Error && err.name === 'TimeoutError' ? 'The site took too long to respond'
      : err instanceof Error ? err.message : 'Could not open that link'
    return NextResponse.json({ error: `${msg}. You can still fill in the details by hand.` }, { status: 422 })
  }

  let { job, source } = extractJob(html) as { job: ImportedJob; source: string }
  let usedAi = false

  // Structured data is reliable. Otherwise let Claude read the page, if a key is set.
  if (source !== 'json-ld') {
    const ai = await aiExtract(htmlToText(html)).catch(() => null)
    if (ai && (ai.company || ai.role)) {
      job = { ...job, ...Object.fromEntries(Object.entries(ai).filter(([, v]) => v !== null && v !== '')) }
      source = 'ai'
      usedAi = true
    }
  }

  if (!job.company && !job.role) {
    return NextResponse.json({
      error: "Couldn't read job details from that page (it may need a login). You can still fill them in by hand.",
    }, { status: 422 })
  }

  return NextResponse.json({ job: { ...job, jobUrl: finalUrl }, source, usedAi })
}
