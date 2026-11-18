/**
 * Learns from a user's own application outcomes: which kinds of jobs and applications get
 * replies, and how to rank future jobs because of it. Pure functions, no AI, no I/O.
 *
 * Method, in short:
 * - An application is "resolved" once it has a reply (interview, offer or rejection), was
 *   marked ghosted, or has sat at Applied for NO_REPLY_DAYS. Fresh ones are left out, so a job
 *   applied to yesterday never counts as "ignored".
 * - Each application is described along a few dimensions (where the job came from, the kind
 *   of role, remote or not, whether the résumé was tailored, how soon after posting, the fit
 *   score). Reply rates are compared between groups.
 * - Rates are smoothed toward the user's overall rate, so 2 of 2 doesn't look like 100%.
 *   Nothing is reported until there are MIN_RESOLVED outcomes and each group has MIN_GROUP.
 */
import { roleMatch } from '@/lib/scoring'

export const NO_REPLY_DAYS = 21
export const MIN_RESOLVED = 12
export const MIN_GROUP = 4
const PRIOR = 3 // weight of the overall rate when smoothing a group's rate
const DAY = 86400000

export interface OutcomeJob {
  id: string
  company: string
  role: string
  status: string
  source?: string | null
  jobUrl?: string | null
  remote?: boolean
  hybrid?: boolean
  aiScore?: number | null
  dateApplied: Date | string
  postedAt?: Date | string | null
  respondedAt?: Date | string | null
  interviewAt?: Date | string | null
  appliedWith?: string | null
  applicationPreparedAt?: Date | string | null
}

export type Outcome = 'replied' | 'no_reply' | 'pending' | 'excluded'

const time = (d: Date | string | null | undefined) => (d ? new Date(d).getTime() : NaN)

export function outcomeOf(job: OutcomeJob, now = Date.now()): { outcome: Outcome; interview: boolean } {
  const interview = Boolean(job.interviewAt) || job.status === 'interviewing' || job.status === 'offered'
  const replied = interview || Boolean(job.respondedAt) || job.status === 'rejected'
  if (job.status === 'saved') return { outcome: 'excluded', interview: false }
  if (replied) return { outcome: 'replied', interview }
  if (job.status === 'withdrawn') return { outcome: 'excluded', interview: false }
  if (job.status === 'ghosted') return { outcome: 'no_reply', interview: false }
  const age = now - time(job.dateApplied)
  return { outcome: age >= NO_REPLY_DAYS * DAY ? 'no_reply' : 'pending', interview: false }
}

// ── Dimensions ───────────────────────────────────────────────────────────────

const ATS = /(greenhouse\.io|lever\.co|myworkdayjobs\.com|workday\.com|ashbyhq\.com|smartrecruiters\.com|icims\.com|jobvite\.com|bamboohr\.com|recruitee\.com|workable\.com|taleo\.net|successfactors|careers?\.|jobs\.)/i

export function sourceGroup(job: Pick<OutcomeJob, 'source' | 'jobUrl' | 'company'>): string | null {
  const src = (job.source ?? '').toLowerCase()
  let host = ''
  try { host = job.jobUrl ? new URL(job.jobUrl).hostname.toLowerCase() : '' } catch { /* ignore */ }
  const companyWord = job.company.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12)
  if (/referr/.test(src)) return 'Referrals'
  if (/linkedin/.test(src) || host.includes('linkedin.')) return 'LinkedIn'
  if (/indeed/.test(src) || host.includes('indeed.')) return 'Indeed'
  if (/company|career/.test(src) || ATS.test(host) || (companyWord.length > 3 && host.replace(/[^a-z0-9]/g, '').includes(companyWord))) return 'Company career pages'
  if (src || host) return 'Job boards'
  return null
}

export function workStyle(job: Pick<OutcomeJob, 'remote' | 'hybrid'>): string {
  return job.remote ? 'Remote jobs' : job.hybrid ? 'Hybrid jobs' : 'On-site jobs'
}

/** The user's closest target role, so "DevOps Engineer II" and "Junior DevOps Engineer" group together. */
export function roleFamily(role: string, targetRoles: string): string {
  const targets = targetRoles.split(',').map(t => t.trim()).filter(Boolean)
  let best = { name: '', score: 0 }
  for (const t of targets) {
    const s = roleMatch(role, t)
    if (s > best.score) best = { name: t, score: s }
  }
  return best.score >= 0.5 ? `${best.name} roles` : 'Other roles'
}

function tailoring(job: OutcomeJob): string | null {
  if (job.appliedWith === 'tailored') return 'Tailored applications'
  if (job.appliedWith === 'master') return 'Applications that weren’t tailored'
  const prepared = time(job.applicationPreparedAt)
  if (Number.isFinite(prepared)) return prepared <= time(job.dateApplied) ? 'Tailored applications' : 'Applications that weren’t tailored'
  return null
}

function postingAge(job: OutcomeJob): string | null {
  const posted = time(job.postedAt)
  if (!Number.isFinite(posted)) return null
  const days = (time(job.dateApplied) - posted) / DAY
  if (days < -1) return null
  return days <= 3 ? 'Applied within 3 days of posting' : days <= 10 ? 'Applied 4–10 days after posting' : 'Applied 11+ days after posting'
}

function fitBand(job: OutcomeJob): string | null {
  if (job.aiScore === null || job.aiScore === undefined) return null
  return job.aiScore >= 75 ? 'Fit 75 and up' : job.aiScore >= 60 ? 'Fit 60–74' : 'Fit under 60'
}

export type Dimension = 'source' | 'role' | 'style' | 'tailored' | 'timing' | 'fit'

export const DIMENSIONS: { key: Dimension; title: string; rankable: boolean }[] = [
  { key: 'source', title: 'Where the job came from', rankable: true },
  { key: 'role', title: 'Kind of role', rankable: true },
  { key: 'style', title: 'Remote, hybrid or on-site', rankable: true },
  { key: 'tailored', title: 'Tailored or not', rankable: false },
  { key: 'timing', title: 'How soon you applied', rankable: false },
  { key: 'fit', title: 'Fit score', rankable: false },
]

export function groupOf(job: OutcomeJob, dim: Dimension, targetRoles: string): string | null {
  switch (dim) {
    case 'source': return sourceGroup(job)
    case 'role': return roleFamily(job.role, targetRoles)
    case 'style': return workStyle(job)
    case 'tailored': return tailoring(job)
    case 'timing': return postingAge(job)
    case 'fit': return fitBand(job)
  }
}

// ── Learning ─────────────────────────────────────────────────────────────────

export interface GroupStat { label: string; n: number; replies: number; interviews: number; rate: number; smoothed: number }
export interface Comparison { dim: Dimension; title: string; groups: GroupStat[] }
export interface Insight {
  dim: Dimension
  group: string
  direction: 'better' | 'worse'
  rate: number
  otherRate: number
  n: number
  replies: number
  interviews: number
  headline: string
  detail: string
  action: string
}

export interface Learnings {
  applied: number
  resolved: number
  pending: number
  replies: number
  interviews: number
  replyRate: number
  interviewRate: number
  medianDaysToReply: number | null
  needed: number
  ready: boolean
  comparisons: Comparison[]
  insights: Insight[]
  /** group label → ranking factor, per rankable dimension */
  factors: Partial<Record<Dimension, Record<string, number>>>
}

const pct = (r: number) => `${Math.round(r * 100)}%`

function headline(subject: string, better: boolean, rate: number, rest: number): string {
  if (!better) return rate === 0 ? `${subject} haven’t had a reply yet` : `${subject} rarely get replies`
  if (rest === 0) return `${subject} are the only ones getting replies`
  const times = Math.round((rate / rest) * 10) / 10
  return times >= 1.9 ? `${subject} get replies ${String(times).replace(/\.0$/, '')}× as often` : `${subject} get replies more often`
}
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

function phrase(dim: Dimension, group: string): string {
  // Turn a group label into the subject of a sentence.
  switch (dim) {
    case 'source': return group === 'Referrals' ? 'Referrals' : `Jobs from ${group === 'Job boards' ? 'job boards' : group === 'Company career pages' ? 'company career pages' : group}`
    case 'role': return group === 'Other roles' ? 'Roles outside your targets' : group
    case 'timing': return group.replace(/^Applied /, 'Applications sent ')
    case 'fit': return group === 'Fit under 60' ? 'Jobs with a fit under 60' : `Jobs with a fit of ${group.replace(/^Fit /, '')}`
    default: return group
  }
}

function actionFor(dim: Dimension, group: string, better: boolean): string {
  switch (dim) {
    case 'source':
    case 'role':
    case 'style':
      return better ? 'These now rank higher in your matches.' : 'These now rank a little lower in your matches.'
    case 'tailored':
      return group === 'Tailored applications' === better
        ? 'Prepare an application in Ready to apply before you send one.'
        : 'Tailoring hasn’t made a difference yet. Keep an eye on this as more replies come in.'
    case 'timing':
      return group.includes('within 3 days') === better
        ? 'Apply soon after a job is posted when you can. New matches are listed newest first.'
        : 'Timing hasn’t mattered much for you so far.'
    case 'fit':
      return better ? 'Don’t skip jobs in this range.' : 'Jobs in this range have been a weaker use of your time.'
  }
}

export function learn(jobs: OutcomeJob[], targetRoles = '', now = Date.now()): Learnings {
  const scored = jobs.map(j => ({ job: j, ...outcomeOf(j, now) })).filter(x => x.outcome !== 'excluded')
  const resolved = scored.filter(x => x.outcome !== 'pending')
  const replies = resolved.filter(x => x.outcome === 'replied').length
  const interviews = resolved.filter(x => x.interview).length
  const base = resolved.length ? replies / resolved.length : 0

  const days = scored
    .filter(x => x.job.respondedAt)
    .map(x => (time(x.job.respondedAt) - time(x.job.dateApplied)) / DAY)
    .filter(d => d >= 0)
    .sort((a, b) => a - b)
  const medianDaysToReply = days.length ? Math.round(days[Math.floor(days.length / 2)]) : null

  const comparisons: Comparison[] = []
  const insights: Insight[] = []
  const factors: Learnings['factors'] = {}
  const ready = resolved.length >= MIN_RESOLVED && replies > 0

  for (const { key, title, rankable } of DIMENSIONS) {
    const byGroup = new Map<string, { n: number; replies: number; interviews: number }>()
    for (const x of resolved) {
      const g = groupOf(x.job, key, targetRoles)
      if (!g) continue
      const s = byGroup.get(g) ?? { n: 0, replies: 0, interviews: 0 }
      s.n++
      if (x.outcome === 'replied') s.replies++
      if (x.interview) s.interviews++
      byGroup.set(g, s)
    }
    const groups: GroupStat[] = [...byGroup.entries()]
      .map(([label, s]) => ({ label, ...s, rate: s.replies / s.n, smoothed: (s.replies + PRIOR * base) / (s.n + PRIOR) }))
      .sort((a, b) => b.n - a.n)
    if (groups.length < 2) continue
    comparisons.push({ dim: key, title, groups })
    if (!ready) continue

    // The strongest difference in this dimension, if it's big enough to trust.
    const dimTotal = groups.reduce((a, g) => a + g.n, 0)
    const dimReplies = groups.reduce((a, g) => a + g.replies, 0)
    let best: Insight | null = null
    let bestGap = 0
    for (const g of groups) {
      const restN = dimTotal - g.n
      if (g.n < MIN_GROUP || restN < MIN_GROUP) continue
      const restRate = (dimReplies - g.replies) / restN
      const restSmoothed = (dimReplies - g.replies + PRIOR * base) / (restN + PRIOR)
      const gap = g.smoothed - restSmoothed
      const ratio = restRate === 0 ? (g.rate > 0 ? Infinity : 1) : g.rate / restRate
      const strong = Math.abs(gap) >= 0.12 && (ratio >= 1.5 || ratio <= 1 / 1.5)
      if (!strong) continue
      // Prefer reporting what works over what doesn't, when both are similar in size.
      const positiveOverNegative = gap > 0 && bestGap < 0 && gap * 1.3 >= -bestGap
      const negativeUnderPositive = gap < 0 && bestGap > 0 && -gap < bestGap * 1.3
      if (negativeUnderPositive || (!positiveOverNegative && Math.abs(gap) <= Math.abs(bestGap))) continue
      bestGap = gap
      const better = gap > 0
      const subject = phrase(key, g.label)
      best = {
        dim: key,
        group: g.label,
        direction: better ? 'better' : 'worse',
        rate: g.rate,
        otherRate: restRate,
        n: g.n,
        replies: g.replies,
        interviews: g.interviews,
        headline: headline(subject, better, g.rate, restRate),
        detail: `${g.replies} of ${plural(g.n, 'application')} got a reply (${pct(g.rate)}), compared with ${pct(restRate)} for the rest.`
          + (g.interviews ? ` ${g.interviews === 1 ? 'One' : g.interviews} of them led to ${g.interviews === 1 ? 'an interview' : 'interviews'}.` : ''),
        action: actionFor(key, g.label, better),
      }
    }
    if (best) insights.push(best)

    if (rankable) {
      const f: Record<string, number> = {}
      for (const g of groups) {
        if (g.n < MIN_GROUP || base === 0) continue
        const factor = Math.min(1.25, Math.max(0.8, g.smoothed / base))
        if (Math.abs(factor - 1) >= 0.05) f[g.label] = Math.round(factor * 100) / 100
      }
      if (Object.keys(f).length) factors[key] = f
    }
  }

  // What works first, then what doesn't; biggest differences first within each.
  insights.sort((a, b) =>
    (a.direction === b.direction ? 0 : a.direction === 'better' ? -1 : 1)
    || Math.abs(b.rate - b.otherRate) - Math.abs(a.rate - a.otherRate))

  return {
    applied: scored.length,
    resolved: resolved.length,
    pending: scored.length - resolved.length,
    replies,
    interviews,
    replyRate: base,
    interviewRate: resolved.length ? interviews / resolved.length : 0,
    medianDaysToReply,
    needed: Math.max(0, MIN_RESOLVED - resolved.length),
    ready,
    comparisons,
    insights,
    factors: ready ? factors : {},
  }
}

// ── Ranking ──────────────────────────────────────────────────────────────────

const REASON: Record<string, (group: string, up: boolean) => string> = {
  source: (g, up) => `${phrase('source', g)} have ${up ? 'replied to you more often' : 'rarely replied to you'}`,
  role: (g, up) => `${phrase('role', g)} have ${up ? 'replied to you more often' : 'rarely replied to you'}`,
  style: (g, up) => `${g} have ${up ? 'replied to you more often' : 'rarely replied to you'}`,
}

/**
 * Adjust a fit score using what has worked for this user. Returns the score unchanged when
 * there isn't enough evidence. The note says why, in one sentence, for the job's fit reason.
 */
export function personalize(
  job: Pick<OutcomeJob, 'role' | 'source' | 'jobUrl' | 'company' | 'remote' | 'hybrid'>,
  fitScore: number,
  learnings: Pick<Learnings, 'ready' | 'factors'>,
  targetRoles: string,
): { score: number; note: string | null } {
  if (!learnings.ready || fitScore <= 0) return { score: fitScore, note: null }
  let product = 1
  let strongest: { dim: Dimension; group: string; factor: number } | null = null
  for (const dim of ['source', 'role', 'style'] as const) {
    const table = learnings.factors[dim]
    if (!table) continue
    const group = groupOf({ ...job, id: '', status: 'saved', dateApplied: new Date() }, dim, targetRoles)
    const factor = group ? table[group] : undefined
    if (!factor) continue
    product *= factor
    if (!strongest || Math.abs(factor - 1) > Math.abs(strongest.factor - 1)) strongest = { dim, group: group!, factor }
  }
  product = Math.min(1.3, Math.max(0.75, product))
  const score = Math.min(100, Math.round(fitScore * product))
  if (!strongest || score === fitScore) return { score: fitScore, note: null }
  const up = score > fitScore
  return { score, note: `${up ? 'Moved up' : 'Moved down'} from ${fitScore}: ${REASON[strongest.dim](strongest.group, up)}.` }
}
