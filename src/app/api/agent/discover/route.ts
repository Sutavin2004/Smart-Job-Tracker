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

        log('🤖 Agent starting up...', { step: 1 })
        log(`🔍 Searching for: ${roles.slice(0, 3).join(', ')}`, { step: 2 })
        log(`📍 Locations: ${locations.join(', ')}${profile.preferRemote ? ' + Remote' : ''}`, { step: 2 })

        const hasRapidApi = !!process.env.RAPIDAPI_KEY
        const hasAdzuna = !!(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY)
        const hasAnthropic = !!process.env.ANTHROPIC_API_KEY

        const boardLabels: string[] = []
        if (hasRapidApi) boardLabels.push('LinkedIn/Indeed/Glassdoor (JSearch)')
        if (hasAdzuna) boardLabels.push('Adzuna')
        if (profile.preferRemote) boardLabels.push('RemoteOK')
        if (hasAnthropic) boardLabels.push('AI-augmented search')

        log(`🌐 Job boards: ${boardLabels.length > 0 ? boardLabels.join(', ') : 'AI knowledge (add API keys for live boards)'}`, { step: 2 })

        await prisma.agentSession.update({
          where: { id: session.id },
          data: { searchQueries: JSON.stringify(roles.slice(0, 3)) },
        })

        // ── Step 1: Fetch from real job boards ──────────────────────────────
        log('🔌 Fetching from live job boards...', { step: 2 })
        const { jobs: realJobs, sources } = await fetchRealJobs({
          roles: roles.slice(0, 3),
          locations: locations.slice(0, 2),
          preferRemote: profile.preferRemote,
        })

        if (realJobs.length > 0) {
          log(`✅ Live boards returned ${realJobs.length} listings from: ${sources.join(', ')}`, { step: 2 })
        } else {
          log('⚠️ No live board API keys configured — falling back to AI-powered discovery', { step: 2 })
        }

        // ── Step 2: AI-augmented discovery (fills gaps or supplements) ──────
        let aiJobs: typeof realJobs = []

        if (hasAnthropic && realJobs.length < 8) {
          const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
          log('🧠 AI searching for additional matches...', { step: 2 })

          const discoveryPrompt = `You are a job discovery agent. Find real, current job postings for this candidate.

CANDIDATE:
- Target roles: ${profile.targetRoles}
- Skills: ${profile.skills}
- Experience: ${profile.yearsExperience} years
- Locations: ${profile.targetLocations || 'Any'}
- Remote: ${profile.preferRemote ? 'Remote preferred' : profile.preferHybrid ? 'Hybrid OK' : 'On-site OK'}
- Salary: ${profile.currency} ${profile.targetSalaryMin}k–${profile.targetSalaryMax}k
- Exclude: ${profile.excludeKeywords || 'Nothing'}

Find ${10 - realJobs.length} specific job postings (2024-2025) for: ${roles.slice(0, 3).join(', ')}
Locations: ${locations.join(', ')}

Return ONLY a JSON array. Each object:
{
  "company": "name",
  "role": "title",
  "location": "city or Remote",
  "remote": true/false,
  "hybrid": true/false,
  "salaryRaw": "range or null",
  "salaryMin": number_or_null,
  "salaryMax": number_or_null,
  "jobUrl": "url or null",
  "jobDescription": "2-3 sentence description",
  "source": "LinkedIn/Indeed/Company Website",
  "industry": "industry or null",
  "techStack": "comma-separated tech or null"
}`

          let jobsText = ''
          try {
            const res = await anthropic.messages.create({
              model: 'claude-opus-4-5',
              max_tokens: 3000,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              tools: [{ type: 'web_search_20250305', name: 'web_search' } as any],
              messages: [{ role: 'user', content: discoveryPrompt }],
            })
            jobsText = res.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('\n')
          } catch {
            log('ℹ️ Web search unavailable — using AI market knowledge', { step: 2 })
            const res = await anthropic.messages.create({
              model: 'claude-opus-4-5',
              max_tokens: 2000,
              messages: [{ role: 'user', content: discoveryPrompt }],
            })
            jobsText = res.content.filter(b => b.type === 'text').map(b => (b as { type: 'text'; text: string }).text).join('\n')
          }

          try {
            const match = jobsText.match(/\[[\s\S]*\]/)
            if (match) aiJobs = JSON.parse(match[0])
          } catch { /* ignore parse error */ }

          log(`🤖 AI found ${aiJobs.length} additional listings`, { step: 2 })
        }

        const allRaw = [...realJobs, ...aiJobs]

        // ── Step 3: Score and rank ───────────────────────────────────────────
        log('🔬 Scoring and ranking all matches...', { step: 3 })

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

        // Only keep jobs scoring above 25 (removes bad matches)
        const qualified = scored.filter(j => j.fitScore >= 25)

        log(`✅ ${qualified.length} jobs passed quality filter (from ${allRaw.length} total)`, { step: 3 })
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
            log(`⏭️ Skipped (duplicate): ${company} — ${role}`, { step: 4 })
            continue
          }

          await prisma.job.create({
            data: {
              company,
              role,
              status: 'saved',
              location: job.location ?? null,
              remote: job.remote,
              hybrid: job.hybrid,
              salaryRaw: job.salaryRaw ?? null,
              salary: job.salaryRaw ?? null,
              salaryMin: job.salaryMin ?? null,
              salaryMax: job.salaryMax ?? null,
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
              priority: job.fitScore >= 80 ? 'high' : job.fitScore >= 60 ? 'medium' : 'low',
              activities: {
                create: {
                  type: 'agent',
                  message: `🤖 Discovered via ${job.source ?? 'AI agent'} · Fit score: ${job.fitScore}/100 · ${job.fitReason}`,
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
