import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'

export async function POST(_req: NextRequest) {
  const profile = await prisma.userProfile.findFirst()
  if (!profile || !profile.targetRoles) {
    return Response.json({ error: 'Set up your profile with target roles first' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 })
  }

  const session = await prisma.agentSession.create({ data: { status: 'running' } })

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch { /* stream may be closed */ }
      }

      const logLines: string[] = []
      const log = (msg: string, data?: object) => {
        logLines.push(msg)
        send({ type: 'log', message: msg, ...(data ?? {}) })
      }

      try {
        const anthropic = new Anthropic({ apiKey })

        log('🤖 Agent starting up...', { step: 1 })

        const roles = profile.targetRoles.split(',').map(r => r.trim()).filter(Boolean)
        const locations = profile.targetLocations ? profile.targetLocations.split(',').map(l => l.trim()).filter(Boolean) : ['Remote']
        const searchQueries: string[] = []

        for (const role of roles.slice(0, 3)) {
          for (const loc of locations.slice(0, 2)) {
            searchQueries.push(`"${role}" jobs ${loc} 2025 site:linkedin.com OR site:indeed.com OR site:glassdoor.com`)
          }
          if (profile.preferRemote) {
            searchQueries.push(`"${role}" remote jobs 2025`)
          }
        }

        log(`🔍 Searching for: ${roles.slice(0, 3).join(', ')}`, { step: 2 })
        log(`📍 Locations: ${locations.slice(0, 2).join(', ')}${profile.preferRemote ? ' + Remote' : ''}`, { step: 2 })

        await prisma.agentSession.update({
          where: { id: session.id },
          data: { searchQueries: JSON.stringify(searchQueries) },
        })

        const discoveryPrompt = `You are a job discovery agent. Search for real, current job postings that match this candidate profile.

CANDIDATE:
- Target roles: ${profile.targetRoles}
- Skills: ${profile.skills}
- Experience: ${profile.yearsExperience} years
- Locations: ${profile.targetLocations || 'Any'}
- Remote preference: ${profile.preferRemote ? 'Remote preferred' : profile.preferHybrid ? 'Hybrid OK' : 'On-site OK'}
- Salary: ${profile.currency} ${profile.targetSalaryMin}k-${profile.targetSalaryMax}k
- Exclude: ${profile.excludeKeywords || 'Nothing'}

Search for recent job postings (2024-2025) for these roles: ${roles.slice(0, 3).join(', ')}
Look in: ${locations.join(', ')}${profile.preferRemote ? ', Remote' : ''}

Find 8-12 specific, real job postings. For each posting include: company name, exact role title, location, salary if listed, job URL if available, brief description.`

        log('🧠 Searching job boards...', { step: 2 })

        let jobsText = ''
        try {
          const discoveryRes = await anthropic.messages.create({
            model: 'claude-opus-4-5',
            max_tokens: 3000,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tools: [{ type: 'web_search_20250305', name: 'web_search' } as any],
            messages: [{ role: 'user', content: discoveryPrompt }],
          })
          jobsText = discoveryRes.content
            .filter(b => b.type === 'text')
            .map(b => (b as { type: 'text'; text: string }).text)
            .join('\n')
        } catch {
          log('⚠️ Web search not available — using AI knowledge of recent job market', { step: 2 })
          const fallbackRes = await anthropic.messages.create({
            model: 'claude-opus-4-5',
            max_tokens: 2000,
            messages: [{
              role: 'user',
              content: `Based on the current job market (2024-2025), identify 8-10 realistic job opportunities for someone with this profile:
${discoveryPrompt}

List specific companies that are hiring for these roles, with realistic role titles, locations, and salary ranges. Be specific and realistic.`,
            }],
          })
          jobsText = fallbackRes.content
            .filter(b => b.type === 'text')
            .map(b => (b as { type: 'text'; text: string }).text)
            .join('\n')
        }

        log('🔬 Analyzing and scoring job matches...', { step: 3 })

        const parseRes = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 3000,
          messages: [{
            role: 'user',
            content: `Based on this job search research, extract and structure the top matching jobs.

Research findings:
${jobsText}

Candidate profile:
- Target roles: ${profile.targetRoles}
- Skills: ${profile.skills}
- Locations: ${profile.targetLocations}
- Salary: ${profile.currency} ${profile.targetSalaryMin}k-${profile.targetSalaryMax}k
- Remote: ${profile.preferRemote ? 'Yes' : profile.preferHybrid ? 'Hybrid' : 'On-site'}

Return ONLY a JSON array (no other text) where each object has:
{
  "company": "company name",
  "role": "exact job title",
  "location": "city or Remote",
  "remote": true/false,
  "hybrid": true/false,
  "salaryRaw": "salary as shown or null",
  "salaryMin": number or null,
  "salaryMax": number or null,
  "jobUrl": "url or null",
  "jobDescription": "2-3 sentence description",
  "source": "LinkedIn/Indeed/Company Website/etc",
  "fitScore": number 0-100,
  "fitReason": "1-2 sentences on why this matches",
  "industry": "industry name",
  "techStack": "comma-separated tech or null",
  "excitement": number 1-5
}

Include 5-10 jobs. Only include jobs genuinely matching the profile.`,
          }],
        })

        const parseText = parseRes.content
          .filter(b => b.type === 'text')
          .map(b => (b as { type: 'text'; text: string }).text)
          .join('')

        let jobs: Array<Record<string, unknown>> = []
        try {
          const match = parseText.match(/\[[\s\S]*\]/)
          if (match) jobs = JSON.parse(match[0])
        } catch {
          log('⚠️ Could not parse all results, continuing with partial data', { step: 3 })
        }

        log(`✅ Found ${jobs.length} matching jobs`, { step: 3 })
        send({ type: 'found', count: jobs.length })

        let added = 0
        let skipped = 0

        for (const job of jobs) {
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

          const fitScore = Number(job.fitScore ?? 50)
          await prisma.job.create({
            data: {
              company,
              role,
              status: 'saved',
              location: job.location ? String(job.location) : null,
              remote: Boolean(job.remote),
              hybrid: Boolean(job.hybrid),
              salaryRaw: job.salaryRaw ? String(job.salaryRaw) : null,
              salary: job.salaryRaw ? String(job.salaryRaw) : null,
              salaryMin: job.salaryMin ? Number(job.salaryMin) : null,
              salaryMax: job.salaryMax ? Number(job.salaryMax) : null,
              currency: profile.currency,
              jobUrl: job.jobUrl ? String(job.jobUrl) : null,
              jobDescription: job.jobDescription ? String(job.jobDescription) : null,
              source: job.source ? String(job.source) : null,
              industry: job.industry ? String(job.industry) : null,
              parsedTechStack: job.techStack ? String(job.techStack) : null,
              techStack: job.techStack ? String(job.techStack) : null,
              aiScore: fitScore,
              aiSuggestion: job.fitReason ? String(job.fitReason) : null,
              excitement: job.excitement ? Number(job.excitement) : null,
              discoveredBy: 'agent',
              agentSessionId: session.id,
              agentNotes: job.fitReason ? String(job.fitReason) : null,
              priority: fitScore >= 80 ? 'high' : fitScore >= 60 ? 'medium' : 'low',
              activities: {
                create: {
                  type: 'agent',
                  message: `🤖 Discovered by AI agent · Fit score: ${fitScore}/100 · ${job.fitReason ?? ''}`,
                },
              },
            },
          })

          added++
          log(`➕ Added: ${company} — ${role} (${fitScore}/100)`, {
            step: 4,
            type: 'job_added',
            job: { company, role, score: fitScore },
          })
        }

        await prisma.agentSession.update({
          where: { id: session.id },
          data: {
            status: 'completed',
            jobsFound: jobs.length,
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
