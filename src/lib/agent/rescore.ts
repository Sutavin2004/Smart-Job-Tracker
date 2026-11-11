import type { ScopedDb } from '@/lib/scoped-db'
import { scoreJob } from '@/lib/scoring'

/**
 * Re-score saved jobs against the current profile. No AI involved, so it's cheap
 * enough to run whenever the profile changes. Jobs scored by hand (no aiScore) are left alone.
 */
export async function rescoreSaved(db: ScopedDb): Promise<number> {
  const profile = await db.userProfile.findFirst()
  if (!profile) return 0
  const jobs = await db.job.findMany({ where: { status: 'saved', archived: false, aiScore: { not: null } } })
  let changed = 0
  for (const j of jobs) {
    const s = scoreJob({
      company: j.company, role: j.role, location: j.location ?? '', remote: j.remote, hybrid: j.hybrid,
      salaryRaw: j.salaryRaw, salaryMin: j.salaryMin, salaryMax: j.salaryMax, jobUrl: j.jobUrl,
      jobDescription: j.jobDescription ?? '', source: j.source ?? '', industry: null, techStack: j.techStack,
    }, profile)
    if (s.fitScore !== j.aiScore || s.fitReason !== j.aiSuggestion) {
      await db.job.update({ where: { id: j.id }, data: { aiScore: s.fitScore, aiSuggestion: s.fitReason } })
      changed++
    }
  }
  return changed
}
