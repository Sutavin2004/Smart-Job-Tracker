import type { ScopedDb } from '@/lib/scoped-db'
import { learn, type Learnings } from './learn'

/** Everything the user has applied to, archived included: old outcomes are still evidence. */
export async function loadLearnings(db: ScopedDb, targetRoles: string): Promise<Learnings> {
  const jobs = await db.job.findMany({
    where: { status: { not: 'saved' } },
    select: {
      id: true, company: true, role: true, status: true, source: true, jobUrl: true, remote: true, hybrid: true,
      aiScore: true, dateApplied: true, postedAt: true, respondedAt: true, interviewAt: true, appliedWith: true,
      applicationPreparedAt: true,
    },
  })
  return learn(jobs, targetRoles)
}
