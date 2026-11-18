/**
 * What a status change tells us about an application's outcome. Recorded once, at the
 * moment it happens, so later edits (an interview that ends in a rejection) don't erase it.
 */
export interface OutcomeState {
  status: string
  respondedAt?: Date | null
  interviewAt?: Date | null
  appliedWith?: string | null
  applicationPreparedAt?: Date | null
}

const INTERVIEW = new Set(['interviewing', 'offered'])
const REPLY = new Set(['interviewing', 'offered', 'rejected'])

export function outcomeStamps(prev: OutcomeState, next: string, now = new Date()) {
  const data: { respondedAt?: Date; interviewAt?: Date; appliedWith?: string } = {}
  if (next === prev.status) return data
  if (REPLY.has(next) && !prev.respondedAt) data.respondedAt = now
  if (INTERVIEW.has(next) && !prev.interviewAt) data.interviewAt = now
  // Leaving "saved" means it was sent: remember whether it went out tailored.
  if (prev.status === 'saved' && next !== 'saved' && next !== 'withdrawn' && !prev.appliedWith) {
    data.appliedWith = prev.applicationPreparedAt ? 'tailored' : 'master'
  }
  return data
}

/** An interview was scheduled: that's both a reply and an interview. */
export function interviewStamps(prev: OutcomeState, now = new Date()) {
  return {
    ...(prev.respondedAt ? {} : { respondedAt: now }),
    ...(prev.interviewAt ? {} : { interviewAt: now }),
  }
}
