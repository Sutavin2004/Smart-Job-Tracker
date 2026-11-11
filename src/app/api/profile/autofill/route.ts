import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { withAuth, type Auth } from '@/lib/api'
import { consumeQuota, QuotaError } from '@/lib/quota'
import { AI_MODELS } from '@/lib/ai-models'
import { IS_DEMO } from '@/lib/demo'
import { basicFields, parseAutofill, mergeAutofill, AUTOFILL_PROMPT, AUTOFILL_TOOL, type Autofill } from '@/lib/resume/autofill'

export const maxDuration = 60

/**
 * Fill in the profile and job-agent settings from the saved résumé.
 * Body: { overwrite?: boolean } — by default only empty fields are filled.
 */
export const POST = withAuth(async (req: NextRequest, _ctx: unknown, { db, user }: Auth) => {
  const { overwrite = false } = await req.json().catch(() => ({}))
  const profile = await db.userProfile.findFirst()
  const resume = profile?.masterResume?.trim() ?? ''
  if (!profile || resume.length < 100) {
    return NextResponse.json({ error: 'Save your résumé first.' }, { status: 422 })
  }

  let ai: Autofill = {}
  let usedAi = false
  let note: string | null = null
  if (process.env.ANTHROPIC_API_KEY && !IS_DEMO) {
    try {
      await consumeQuota(user.id, 'ai')
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const res = await anthropic.messages.create({
        model: AI_MODELS.fast,
        max_tokens: 2000,
        tools: [AUTOFILL_TOOL],
        tool_choice: { type: 'tool', name: AUTOFILL_TOOL.name },
        messages: [{ role: 'user', content: AUTOFILL_PROMPT(resume) }],
      })
      const call = res.content.find(b => b.type === 'tool_use')
      const text = res.content.filter(b => b.type === 'text').map(b => (b as { text: string }).text).join('')
      ai = parseAutofill(call ? JSON.stringify((call as { input: unknown }).input) : text)
      if (!Object.keys(ai).length) {
        console.error('autofill: empty reply', res.stop_reason, text.slice(0, 300))
        note = 'The AI step returned nothing usable, so only contact details and links were filled in.'
      }
      usedAi = true
    } catch (e) {
      note = e instanceof QuotaError ? e.message : 'The AI step failed, so only contact details and links were filled in.'
      if (!(e instanceof QuotaError)) console.error('autofill', e)
    }
  }

  // Contact details and links come from exact matches; the AI fills in the rest.
  const found = { ...ai, ...basicFields(resume) }
  const patch = mergeAutofill(profile as unknown as Record<string, unknown>, found, Boolean(overwrite))
  const updated = Object.keys(patch).length ? await db.userProfile.update({ where: { id: profile.id }, data: patch as Record<string, string | number> }) : profile
  return NextResponse.json({ filled: Object.keys(patch), usedAi, note, profile: updated })
})
