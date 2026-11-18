import { describe, it, expect } from 'vitest'
import { learn, outcomeOf, personalize, sourceGroup, roleFamily, MIN_RESOLVED, type OutcomeJob } from './learn'
import { outcomeStamps, interviewStamps } from './stamps'

const NOW = new Date('2026-11-18T12:00:00Z').getTime()
const daysAgo = (d: number) => new Date(NOW - d * 86400000)
let n = 0
function job(o: Partial<OutcomeJob> = {}): OutcomeJob {
  n++
  return { id: `j${n}`, company: `Company${n}`, role: 'Software Engineer', status: 'applied', source: 'Adzuna', jobUrl: `https://www.adzuna.ca/details/${n}`, remote: false, hybrid: false, aiScore: 70, dateApplied: daysAgo(30), ...o }
}
const replied = (o: Partial<OutcomeJob> = {}) => job({ status: 'rejected', respondedAt: daysAgo(25), ...o })
const ignored = (o: Partial<OutcomeJob> = {}) => job({ status: 'applied', ...o })
const companySite = (i: number) => ({ source: 'Company Website', jobUrl: `https://boards.greenhouse.io/acme${i}/jobs/1` })

describe('outcomeOf', () => {
  it('counts replies, interviews, ghosting and long silence; leaves fresh ones pending', () => {
    expect(outcomeOf(job({ status: 'interviewing' }), NOW)).toEqual({ outcome: 'replied', interview: true })
    expect(outcomeOf(job({ status: 'rejected', interviewAt: daysAgo(10) }), NOW)).toEqual({ outcome: 'replied', interview: true })
    expect(outcomeOf(job({ status: 'ghosted', dateApplied: daysAgo(5) }), NOW).outcome).toBe('no_reply')
    expect(outcomeOf(job({ dateApplied: daysAgo(30) }), NOW).outcome).toBe('no_reply')
    expect(outcomeOf(job({ dateApplied: daysAgo(5) }), NOW).outcome).toBe('pending')
    expect(outcomeOf(job({ status: 'saved' }), NOW).outcome).toBe('excluded')
    expect(outcomeOf(job({ status: 'withdrawn' }), NOW).outcome).toBe('excluded')
  })
})

describe('grouping', () => {
  it('sorts sources into groups people recognise', () => {
    expect(sourceGroup({ source: 'Adzuna', jobUrl: 'https://www.adzuna.ca/x', company: 'X' })).toBe('Job boards')
    expect(sourceGroup({ source: 'Web search', jobUrl: 'https://jobs.lever.co/acme/1', company: 'Acme' })).toBe('Company career pages')
    expect(sourceGroup({ source: null, jobUrl: 'https://careers.manulife.com/job/1', company: 'Manulife' })).toBe('Company career pages')
    expect(sourceGroup({ source: 'LinkedIn', jobUrl: null, company: 'X' })).toBe('LinkedIn')
    expect(sourceGroup({ source: 'Referral', jobUrl: null, company: 'X' })).toBe('Referrals')
    expect(sourceGroup({ source: null, jobUrl: null, company: 'X' })).toBeNull()
  })
  it('groups titles under the closest target role', () => {
    expect(roleFamily('Junior DevOps Engineer', 'DevOps Engineer, Software Engineer')).toBe('DevOps Engineer roles')
    expect(roleFamily('Product Designer', 'DevOps Engineer')).toBe('Other roles')
  })
})

describe('learn', () => {
  it('waits for enough outcomes before claiming anything', () => {
    const l = learn([replied(), ignored(), ignored(), job({ dateApplied: daysAgo(2) })], 'Software Engineer', NOW)
    expect(l).toMatchObject({ applied: 4, resolved: 3, pending: 1, ready: false, needed: MIN_RESOLVED - 3, insights: [], factors: {} })
  })

  it('finds that company career pages reply far more than job boards, and ranks accordingly', () => {
    const jobs = [
      ...[1, 2, 3, 4, 5, 6].map(i => replied(companySite(i))),
      ...[7, 8].map(i => ignored(companySite(i))),
      replied(), ...Array.from({ length: 7 }, () => ignored()),
    ]
    const l = learn(jobs, 'Software Engineer', NOW)
    expect(l.ready).toBe(true)
    const source = l.insights.find(i => i.dim === 'source')!
    expect(source).toMatchObject({ group: 'Company career pages', direction: 'better', replies: 6, n: 8 })
    expect(source.headline).toBe('Jobs from company career pages get replies 6× as often')
    expect(source.detail).toContain('6 of 8 applications got a reply (75%), compared with 13% for the rest.')
    expect(l.factors.source!['Company career pages']).toBeGreaterThan(1)
    expect(l.factors.source!['Job boards']).toBeLessThan(1)

    const up = personalize({ role: 'Software Engineer', source: 'Web search', jobUrl: 'https://jobs.lever.co/x/1', company: 'X', remote: false, hybrid: false }, 70, l, 'Software Engineer')
    const down = personalize({ role: 'Software Engineer', source: 'Adzuna', jobUrl: 'https://www.adzuna.ca/1', company: 'Y', remote: false, hybrid: false }, 70, l, 'Software Engineer')
    expect(up.score).toBeGreaterThan(70)
    expect(up.note).toMatch(/^Moved up from 70: Jobs from company career pages have replied to you more often\.$/)
    expect(down.score).toBeLessThan(70)
    expect(down.note).toMatch(/^Moved down from 70/)
  })

  it('reports tailoring and timing as advice, not ranking', () => {
    const tailored = { appliedWith: 'tailored' }
    const plain = { appliedWith: 'master' }
    const jobs = [
      ...Array.from({ length: 5 }, () => replied(tailored)), ignored(tailored),
      replied(plain), ...Array.from({ length: 7 }, () => ignored(plain)),
    ]
    const l = learn(jobs, '', NOW)
    const t = l.insights.find(i => i.dim === 'tailored')!
    expect(t).toMatchObject({ group: 'Tailored applications', direction: 'better' })
    expect(t.action).toMatch(/Ready to apply/)
    expect(l.factors.tailored).toBeUndefined()
  })

  it('stays quiet when groups are too small or too similar', () => {
    const jobs = [
      ...Array.from({ length: 6 }, (_, i) => (i < 2 ? replied : ignored)({ remote: true })),
      ...Array.from({ length: 6 }, (_, i) => (i < 2 ? replied : ignored)({ remote: false })),
      replied(companySite(99)), ignored(companySite(98)),
    ]
    const l = learn(jobs, '', NOW)
    expect(l.ready).toBe(true)
    expect(l.insights.find(i => i.dim === 'style')).toBeUndefined()
    expect(l.insights.find(i => i.dim === 'source')).toBeUndefined() // only 2 company-site applications
  })

  it('works out the typical wait for a reply', () => {
    const l = learn([replied({ dateApplied: daysAgo(30), respondedAt: daysAgo(26) }), replied({ dateApplied: daysAgo(30), respondedAt: daysAgo(20) }), replied({ dateApplied: daysAgo(30), respondedAt: daysAgo(24) })], '', NOW)
    expect(l.medianDaysToReply).toBe(6)
  })

  it('leaves scores alone until it has learned something', () => {
    const l = learn([replied()], '', NOW)
    expect(personalize({ role: 'x', source: 'Adzuna', jobUrl: null, company: 'x' }, 64, l, '')).toEqual({ score: 64, note: null })
  })
})

describe('outcome stamps', () => {
  it('records the first reply and interview once, and which résumé went out', () => {
    const now = new Date('2026-11-18')
    expect(outcomeStamps({ status: 'saved', applicationPreparedAt: now }, 'applied', now)).toEqual({ appliedWith: 'tailored' })
    expect(outcomeStamps({ status: 'saved' }, 'applied', now)).toEqual({ appliedWith: 'master' })
    expect(outcomeStamps({ status: 'applied', appliedWith: 'master' }, 'interviewing', now)).toEqual({ respondedAt: now, interviewAt: now })
    expect(outcomeStamps({ status: 'interviewing', respondedAt: now, interviewAt: now }, 'rejected', now)).toEqual({})
    expect(outcomeStamps({ status: 'applied' }, 'applied', now)).toEqual({})
    expect(interviewStamps({ status: 'applied', respondedAt: now }, now)).toEqual({ interviewAt: now })
  })
})
