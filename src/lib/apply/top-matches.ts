import type { ScopedDb } from '@/lib/scoped-db'
import { consumeQuota, QuotaError } from '@/lib/quota'
import { prepareApplication } from './prepare'

export const AUTO_PREPARE_COUNT = 3

/** The best saved jobs that don't have an application prepared yet. */
export function unpreparedTopMatches(db: ScopedDb, limit = AUTO_PREPARE_COUNT) {
  return db.job.findMany({
    where: { status: 'saved', archived: false, applicationPreparedAt: null, aiScore: { gte: 60 } },
    orderBy: [{ aiScore: 'desc' }, { createdAt: 'desc' }],
    take: limit,
    select: { id: true, company: true, role: true },
  })
}

/** Prepare applications for the top few matches, in parallel, stopping at the daily AI limit. */
export async function prepareTopMatches(db: ScopedDb, userId: string, limit = AUTO_PREPARE_COUNT) {
  // Check up front so no AI quota is spent when a kit can't be made.
  const profile = await db.userProfile.findFirst({ select: { masterResume: true } })
  if (!process.env.ANTHROPIC_API_KEY || (profile?.masterResume?.trim().length ?? 0) < 200) {
    return { prepared: [] as { id: string; company: string; role: string }[], limitReached: false }
  }
  const jobs = await unpreparedTopMatches(db, limit)
  const results = await Promise.allSettled(jobs.map(async job => {
    await consumeQuota(userId, 'ai')
    await prepareApplication(db, job.id)
    return job
  }))
  return {
    prepared: results.flatMap(r => (r.status === 'fulfilled' ? [r.value] : [])),
    limitReached: results.some(r => r.status === 'rejected' && r.reason instanceof QuotaError),
  }
}
