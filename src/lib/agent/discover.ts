import { AI_MODELS } from '@/lib/ai-models'
import Anthropic from '@anthropic-ai/sdk'
import type { ScopedDb } from '@/lib/scoped-db'
import { fetchRealJobs } from '@/lib/job-boards'
import { scoreAndRankJobs } from '@/lib/scoring'
import { normalizeUrl } from '@/lib/url'

export type DiscoveryEvent = { type: string; message?: string; [k: string]: unknown }

export interface DiscoveryResult {
  sessionId: string | null
  added: number
  skipped: number
  error?: string
}

/**
 * Run the Job Agent once: search job boards (+ verified web search when an
 * Anthropic key is set), score against the profile, and save new matches.
 * `emit` receives live progress events (the UI streams them; cron ignores them).
 */
export async function runDiscovery({ db, userId, trigger = 'manual', emit = () => {} }: {
  db: ScopedDb
  userId: string
  trigger?: 'manual' | 'scheduled'
  emit?: (e: DiscoveryEvent) => void
}): Promise<DiscoveryResult> {
  const profile = await db.userProfile.findFirst()
  if (!profile || !profile.targetRoles) {
    return { sessionId: null, added: 0, skipped: 0, error: 'Set up your profile with target roles first' }
  }

  const session = await db.agentSession.create({ data: { userId, status: 'running', trigger } })
  let result: DiscoveryResult = { sessionId: session.id, added: 0, skipped: 0 }

  const logLines: string[] = []
  const log = (msg: string, data?: object) => {
    logLines.push(msg)
    emit({ type: 'log', message: msg, ...(data ?? {}) })
  }

  try {
    const roles = profile.targetRoles.split(',').map(r => r.trim()).filter(Boolean)
    const locations = profile.targetLocations
      ? profile.targetLocations.split(',').map(l => l.trim()).filter(Boolean)
      : ['Remote']

    const hasRapidApi = !!process.env.RAPIDAPI_KEY
    const hasAnthropic = !!process.env.ANTHROPIC_API_KEY

    log('Starting', { step: 1 })
    log(`Searching for: ${roles.slice(0, 3).join(', ')}`, { step: 2 })
    log(`Locations: ${locations.join(', ')}${profile.preferRemote ? ' + Remote' : ''}`, { step: 2 })

    const boardLabels: string[] = []
    if (hasRapidApi) boardLabels.push('LinkedIn · Indeed · Glassdoor (JSearch)')
    if (process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY) boardLabels.push('Adzuna')
    if (profile.preferRemote || locations.some(l => /remote/i.test(l))) boardLabels.push('RemoteOK · Remotive · Jobicy')
    if (hasAnthropic) boardLabels.push('AI-augmented search')
    log(boardLabels.length
      ? `Sources: ${boardLabels.join(', ')}`
      : 'No job sources match these settings. Add "Remote" as a location, or set Adzuna / JSearch keys for local searches.', { step: 2 })

    await db.agentSession.update({
      where: { id: session.id },
      data: { searchQueries: JSON.stringify(roles.slice(0, 3)) },
    })

    // ── Step 1: Real job board APIs ──────────────────────────────────────
    log('Connecting to live job boards...', { step: 2 })

    const { jobs: realJobs, sources } = await fetchRealJobs({
      roles: roles.slice(0, 3),
      locations: locations.slice(0, 3),
      preferRemote: profile.preferRemote,
    })

    if (realJobs.length > 0) {
      log(`Live boards: ${realJobs.length} listings from ${sources.join(', ')}`, { step: 2 })
    } else {
      log('Live boards returned no results, so trying AI search', { step: 2 })
    }

    // ── Step 2: AI-powered discovery (always runs if Anthropic key set) ──
    let aiJobs: typeof realJobs = []
    const searchedUrls = new Set<string>()

    if (hasAnthropic) {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      const needed = Math.max(0, 12 - realJobs.length)

      if (needed > 0) {
        log(`AI searching for ${needed} more matches...`, { step: 2 })

        // Step 2a: Discovery via live web search only.
        // Every AI-sourced listing must link to a page the search actually
        // returned, so the agent never saves postings invented from memory.
        let rawJobsText = ''
        const today = new Date().toISOString().slice(0, 10)
        const searchPrompt = `Today is ${today}. Use web search to find up to ${needed} job postings that are currently open and match this candidate profile.

Target roles: ${profile.targetRoles}
Skills: ${profile.skills}
Experience: ${profile.yearsExperience} years
Locations: ${profile.targetLocations || 'Any'}
Remote preference: ${profile.preferRemote ? 'Remote preferred' : profile.preferHybrid ? 'Hybrid OK' : 'On-site OK'}
Target salary: ${profile.currency} ${profile.targetSalaryMin}k–${profile.targetSalaryMax}k
Exclude keywords: ${profile.excludeKeywords || 'None'}

Search LinkedIn, Indeed, Glassdoor, and company career pages.
Only include postings you found in the search results. For each one give: company name, role title, location, salary if shown, the exact URL of the posting from the search results, and a brief description. If you find fewer than ${needed}, list only what you found.`

        try {
          const res = await anthropic.messages.create({
            model: AI_MODELS.search,
            max_tokens: 3000,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 } as any],
            messages: [{ role: 'user', content: searchPrompt }],
          })
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const blocks = res.content as any[]
          for (const b of blocks) {
            if (b.type === 'web_search_tool_result' && Array.isArray(b.content)) {
              for (const r of b.content) if (r?.url) searchedUrls.add(normalizeUrl(r.url))
            }
            if (b.type === 'text' && Array.isArray(b.citations)) {
              for (const c of b.citations) if (c?.url) searchedUrls.add(normalizeUrl(c.url))
            }
          }
          rawJobsText = blocks
            .filter(b => b.type === 'text')
            .map(b => b.text as string)
            .join('\n')
          log(`Web search complete (${searchedUrls.size} pages checked)`, { step: 2 })
        } catch (err) {
          log(`ℹ️ Web search unavailable (${err instanceof Error ? err.message : 'unknown error'}) — skipping AI discovery`, { step: 2 })
        }

        // Step 2b: Parse into structured JSON
        if (rawJobsText.trim()) try {
          log('Structuring AI results...', { step: 3 })
          const parseRes = await anthropic.messages.create({
            model: AI_MODELS.fast,
            max_tokens: 3000,
            messages: [{
              role: 'user',
              content: `Convert the following job search results into a JSON array. Return ONLY the JSON array, nothing else — no markdown, no explanation.

Each element must have exactly these fields:
{
  "company": "company name",
  "role": "exact job title",
  "location": "city name or Remote",
  "remote": true or false,
  "hybrid": true or false,
  "salaryRaw": "salary string or null",
  "salaryMin": salary minimum in thousands as number or null,
  "salaryMax": salary maximum in thousands as number or null,
  "jobUrl": "the exact posting URL from the results (omit the job if there is none)",
  "jobDescription": "1-2 sentence description",
  "source": "LinkedIn or Indeed or Company Website or Glassdoor",
  "industry": "industry name or null",
  "techStack": "comma-separated technologies or null"
}

Job search results to convert:
${rawJobsText}`,
            }],
          })

          const parseText = parseRes.content
            .filter(b => b.type === 'text')
            .map(b => (b as { type: 'text'; text: string }).text)
            .join('')

          // Try multiple extraction strategies
          let parsed: typeof realJobs | null = null

          // Strategy 1: direct parse
          try { parsed = JSON.parse(parseText.trim()); } catch { /* try next */ }

          // Strategy 2: extract array from text
          if (!parsed) {
            const match = parseText.match(/\[[\s\S]*\]/)
            if (match) {
              try { parsed = JSON.parse(match[0]); } catch { /* try next */ }
            }
          }

          // Strategy 3: strip markdown fences
          if (!parsed) {
            const stripped = parseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
            const match = stripped.match(/\[[\s\S]*\]/)
            if (match) {
              try { parsed = JSON.parse(match[0]); } catch { /* give up */ }
            }
          }

          if (parsed && Array.isArray(parsed)) {
            const verified = parsed.filter(j =>
              typeof j?.jobUrl === 'string' && searchedUrls.has(normalizeUrl(j.jobUrl)))
            aiJobs = verified.map(j => ({ ...j, source: j.source || 'Web search' }))
            const dropped = parsed.length - verified.length
            log(`AI found ${aiJobs.length} verified listings` +
              (dropped ? ` (dropped ${dropped} without a confirmed posting URL)` : ''), { step: 3 })
          } else {
            log('Could not parse AI results', { step: 3 })
          }
        } catch (parseErr) {
          log(`AI parsing error: ${parseErr instanceof Error ? parseErr.message : 'unknown'}`, { step: 3 })
        }
      }
    }

    // ── Step 3: Merge, score, rank ────────────────────────────────────────
    const allRaw = [...realJobs, ...aiJobs]
    log(`Scoring ${allRaw.length} total listings...`, { step: 3 })

    const scored = scoreAndRankJobs(allRaw, {
      targetRoles: profile.targetRoles,
      skills: profile.skills,
      yearsExperience: profile.yearsExperience,
      targetLocations: profile.targetLocations,
      preferRemote: profile.preferRemote,
      preferHybrid: profile.preferHybrid,
      targetSalaryMin: profile.targetSalaryMin,
      targetSalaryMax: profile.targetSalaryMax,
      excludeKeywords: profile.excludeKeywords,
    })

    // Keep reasonable matches; irrelevant titles were already scored 0.
    const qualified = scored.filter(j => j.fitScore >= 30)
    log(`${qualified.length} jobs matched your profile`, { step: 3 })
    emit({ type: 'found', count: qualified.length })

    // ── Step 4: Save to database ─────────────────────────────────────────
    let added = 0
    let skipped = 0

    for (const job of qualified) {
      const company = String(job.company ?? 'Unknown')
      const role = String(job.role ?? 'Unknown')

      const existing = await db.job.findFirst({
        where: {
          OR: [
            { company: { equals: company, mode: 'insensitive' }, role: { equals: role, mode: 'insensitive' } },
            ...(job.jobUrl ? [{ jobUrl: job.jobUrl }] : []),
          ],
        },
      })

      if (existing) {
        skipped++
        log(`⏭️ Skipped (already tracked): ${company} — ${role}`, { step: 4 })
        continue
      }

      await db.job.create({
        data: {
          userId,
          company,
          role,
          status: 'saved',
          location: job.location ?? null,
          remote: Boolean(job.remote),
          hybrid: Boolean(job.hybrid),
          salaryRaw: job.salaryRaw ?? null,
          salary: job.salaryRaw ?? null,
          salaryMin: job.salaryMin ? Number(job.salaryMin) : null,
          salaryMax: job.salaryMax ? Number(job.salaryMax) : null,
          currency: profile.currency,
          jobUrl: job.jobUrl ?? null,
          jobDescription: job.jobDescription ?? null,
          source: job.source ?? null,
          industry: job.industry ?? null,
          parsedTechStack: job.techStack ?? null,
          techStack: job.techStack ?? null,
          aiScore: job.fitScore,
          aiSuggestion: job.fitReason,
          excitement: job.excitement,
          discoveredBy: 'agent',
          agentSessionId: session.id,
          agentNotes: job.fitReason,
          priority: job.fitScore >= 80 ? 'high' : job.fitScore >= 55 ? 'medium' : 'low',
          activities: {
            create: {
              type: 'agent',
              message: `Discovered via ${job.source ?? 'AI'} · Fit: ${job.fitScore}/100 · ${job.fitReason}`,
            },
          },
        },
      })

      added++
      log(`Added: ${company} — ${role} (${job.fitScore}/100 · ${job.source ?? 'AI'})`, {
        step: 4,
        type: 'job_added',
        job: { company, role, score: job.fitScore, source: job.source },
      })
    }

    await db.agentSession.update({
      where: { id: session.id },
      data: {
        status: 'completed',
        jobsFound: qualified.length,
        jobsAdded: added,
        jobsFiltered: skipped,
        log: logLines.join('\n'),
        completedAt: new Date(),
      },
    })

    result = { sessionId: session.id, added, skipped }
    emit({
      type: 'complete',
      added,
      skipped,
      sessionId: session.id,
      message: `Done. Added ${added} new ${added === 1 ? 'job' : 'jobs'}, skipped ${skipped} already on your board.`,
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    await db.agentSession.update({
      where: { id: session.id },
      data: { status: 'failed', error: msg, log: logLines.join('\n'), completedAt: new Date() },
    })
    result = { sessionId: session.id, added: 0, skipped: 0, error: msg }
    emit({ type: 'error', message: `Agent error: ${msg}` })
  }
  return result
}
