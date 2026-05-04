import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'
import { fetchRealJobs } from '@/lib/job-boards'
import { scoreAndRankJobs } from '@/lib/scoring'

export async function POST(_req: NextRequest) {
  const profile = await prisma.userProfile.findFirst()
  if (!profile || !profile.targetRoles) {
    return Response.json({ error: 'Set up your profile with target roles first' }, { status: 400 })
  }

  const session = await prisma.agentSession.create({ data: { status: 'running' } })

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch { /* stream closed */ }
      }

      const logLines: string[] = []
      const log = (msg: string, data?: object) => {
        logLines.push(msg)
        send({ type: 'log', message: msg, ...(data ?? {}) })
      }

      try {
        const roles = profile.targetRoles.split(',').map(r => r.trim()).filter(Boolean)
        const locations = profile.targetLocations
          ? profile.targetLocations.split(',').map(l => l.trim()).filter(Boolean)
          : ['Remote']

        const hasRapidApi = !!process.env.RAPIDAPI_KEY
        const hasAnthropic = !!process.env.ANTHROPIC_API_KEY

        log('🤖 Agent starting up...', { step: 1 })
        log(`🔍 Searching for: ${roles.slice(0, 3).join(', ')}`, { step: 2 })
        log(`📍 Locations: ${locations.join(', ')}${profile.preferRemote ? ' + Remote' : ''}`, { step: 2 })

        const boardLabels: string[] = []
        if (hasRapidApi) boardLabels.push('LinkedIn · Indeed · Glassdoor (JSearch)')
        if (profile.preferRemote) boardLabels.push('RemoteOK')
        if (hasAnthropic) boardLabels.push('AI-augmented search')
        log(`🌐 Sources: ${boardLabels.join(', ')}`, { step: 2 })

        await prisma.agentSession.update({
          where: { id: session.id },
          data: { searchQueries: JSON.stringify(roles.slice(0, 3)) },
        })

        // ── Step 1: Real job board APIs ──────────────────────────────────────
        log('🔌 Connecting to live job boards...', { step: 2 })

        const { jobs: realJobs, sources } = await fetchRealJobs({
          roles: roles.slice(0, 3),
          locations: locations.slice(0, 3),
          preferRemote: profile.preferRemote,
        })

        if (realJobs.length > 0) {
          log(`✅ Live boards: ${realJobs.length} listings from ${sources.join(', ')}`, { step: 2 })
        } else {
          log('ℹ️ Live boards returned 0 results — running AI discovery', { step: 2 })
        }

        // ── Step 2: AI-powered discovery (always runs if Anthropic key set) ──
        let aiJobs: typeof realJobs = []

        if (hasAnthropic) {
          const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
          const needed = Math.max(0, 12 - realJobs.length)

          if (needed > 0) {
            log(`🧠 AI searching for ${needed} more matches...`, { step: 2 })

            // Step 2a: Discovery — try web search, fall back to knowledge
            let rawJobsText = ''
            const searchPrompt = `Find ${needed} real, current (2024–2025) job postings matching this candidate profile.

Target roles: ${profile.targetRoles}
Skills: ${profile.skills}
Experience: ${profile.yearsExperience} years
Locations: ${profile.targetLocations || 'Any'}
Remote preference: ${profile.preferRemote ? 'Remote preferred' : profile.preferHybrid ? 'Hybrid OK' : 'On-site OK'}
Target salary: ${profile.currency} ${profile.targetSalaryMin}k–${profile.targetSalaryMax}k
Exclude keywords: ${profile.excludeKeywords || 'None'}

Search LinkedIn, Indeed, Glassdoor, and company career pages.
For each job include: company name, role title, location, salary if shown, job URL, and a brief description.`

            try {
              const res = await anthropic.messages.create({
                model: 'claude-opus-4-5',
                max_tokens: 3000,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                tools: [{ type: 'web_search_20250305', name: 'web_search' } as any],
                messages: [{ role: 'user', content: searchPrompt }],
              })
              rawJobsText = res.content
                .filter(b => b.type === 'text')
                .map(b => (b as { type: 'text'; text: string }).text)
                .join('\n')
              log('🌐 Web search complete', { step: 2 })
            } catch {
              log('ℹ️ Web search unavailable — using AI market knowledge', { step: 2 })
              const res = await anthropic.messages.create({
                model: 'claude-opus-4-5',
                max_tokens: 2000,
                messages: [{
                  role: 'user',
                  content: `Based on your knowledge of the 2024–2025 job market, list ${needed} realistic job opportunities for this candidate:\n\n${searchPrompt}\n\nBe specific: real company names, realistic titles, actual salary ranges for these markets.`,
                }],
              })
              rawJobsText = res.content
                .filter(b => b.type === 'text')
                .map(b => (b as { type: 'text'; text: string }).text)
                .join('\n')
            }

            // Step 2b: Parse into structured JSON using Haiku (fast + reliable)
            log('🔬 Structuring AI results...', { step: 3 })
            try {
              const parseRes = await anthropic.messages.create({
                model: 'claude-haiku-4-5-20251001',
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
  "jobUrl": "URL or null",
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
                aiJobs = parsed
                log(`🤖 AI found ${aiJobs.length} additional listings`, { step: 3 })
              } else {
                log('⚠️ Could not parse AI results', { step: 3 })
              }
            } catch (parseErr) {
              log(`⚠️ AI parsing error: ${parseErr instanceof Error ? parseErr.message : 'unknown'}`, { step: 3 })
            }
          }
        }

        // ── Step 3: Merge, score, rank ────────────────────────────────────────
        const allRaw = [...realJobs, ...aiJobs]
        log(`📊 Scoring ${allRaw.length} total listings...`, { step: 3 })

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

        // Lower threshold — keep anything with a meaningful score
        const qualified = scored.filter(j => j.fitScore >= 15)
        log(`✅ ${qualified.length} jobs matched your profile`, { step: 3 })
        send({ type: 'found', count: qualified.length })

        // ── Step 4: Save to database ─────────────────────────────────────────
        let added = 0
        let skipped = 0

        for (const job of qualified) {
          const company = String(job.company ?? 'Unknown')
          const role = String(job.role ?? 'Unknown')

          const existing = await prisma.job.findFirst({
            where: { company: { equals: company }, role: { equals: role } },
          })

          if (existing) {
            skipped++
            log(`⏭️ Skipped (already tracked): ${company} — ${role}`, { step: 4 })
            continue
          }

          await prisma.job.create({
            data: {
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
                  message: `🤖 Discovered via ${job.source ?? 'AI'} · Fit: ${job.fitScore}/100 · ${job.fitReason}`,
                },
              },
            },
          })

          added++
          log(`➕ Added: ${company} — ${role} (${job.fitScore}/100 · ${job.source ?? 'AI'})`, {
            step: 4,
            type: 'job_added',
            job: { company, role, score: job.fitScore, source: job.source },
          })
        }

        await prisma.agentSession.update({
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

        send({
          type: 'complete',
          added,
          skipped,
          sessionId: session.id,
          message: `🎉 Done! Added ${added} new jobs, skipped ${skipped} duplicates.`,
        })
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error'
        await prisma.agentSession.update({
          where: { id: session.id },
          data: { status: 'failed', error: msg },
        })
        send({ type: 'error', message: `❌ Agent error: ${msg}` })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
