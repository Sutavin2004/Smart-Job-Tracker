import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { withAuth, type Auth } from '@/lib/api'
import { consumeQuota, QuotaError } from '@/lib/quota'
import { AI_MODELS } from '@/lib/ai-models'
import { IS_DEMO } from '@/lib/demo'
import { rescoreSaved } from '@/lib/agent/rescore'
import { basicFields, parseAutofill, mergeAutofill, searchDefaults, AUTOFILL_PROMPT, AUTOFILL_TOOL, type Autofill } from '@/lib/resume/autofill'
import { homeCountry } from '@/lib/scoring'

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
  const filled = mergeAutofill(profile as unknown as Record<string, unknown>, found, Boolean(overwrite))
  // Then starting search settings the résumé can't state (salary, skip words, daily run).
  const merged = { ...profile, ...filled } as typeof profile
  const defaults = searchDefaults(merged, Number(merged.yearsExperience) || 0, homeCountry(String(merged.targetLocations ?? '')))
  const patch: Record<string, string | number | boolean> = { ...filled, ...defaults }
  const updated = Object.keys(patch).length ? await db.userProfile.update({ where: { id: profile.id }, data: patch }) : profile
  if (Object.keys(patch).length) await rescoreSaved(db).catch(e => console.error('rescore', e))
  return NextResponse.json({ filled: Object.keys(filled), suggested: Object.keys(defaults), usedAi, note, profile: updated })
})
