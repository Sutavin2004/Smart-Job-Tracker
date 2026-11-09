import { describe, it, expect } from 'vitest'
import { scoreJob, scoreAndRankJobs, containsPhrase, skillsMatch } from './scoring'
import type { RawJob } from './job-boards'

const profile = {
  targetRoles: 'Software Engineer, Frontend Developer',
  skills: 'TypeScript, React, Next.js, SQL, Node.js',
  yearsExperience: 1,
  targetLocations: 'Toronto, Remote',
  preferRemote: false,
  preferHybrid: true,
  targetSalaryMin: 70,
  targetSalaryMax: 100,
  excludeKeywords: 'senior, java',
}

const job = (over: Partial<RawJob> = {}): RawJob => ({
  company: 'Acme', role: 'Software Engineer', location: 'Toronto, ON', remote: false, hybrid: false,
  salaryRaw: null, salaryMin: 80, salaryMax: 95, jobUrl: 'https://acme.com/jobs/1',
  jobDescription: 'We use TypeScript, React and Next.js with a SQL database. 1+ years of experience.',
  source: 'Test', industry: null, techStack: null, ...over,
})

describe('containsPhrase', () => {
  it('matches whole words only', () => {
    expect(containsPhrase('we write javascript', 'java')).toBe(false)
    expect(containsPhrase('java and kotlin', 'java')).toBe(true)
    expect(containsPhrase('Next.js apps', 'next.js')).toBe(true)
    expect(containsPhrase('C++ and C#', 'c++')).toBe(true)
  })
})

describe('skillsMatch', () => {
  it('is the share of listed skills found in the posting', () => {
    expect(skillsMatch('TypeScript, React, Go', 'typescript and react')).toBeCloseTo(2 / 3)
    expect(skillsMatch('', 'anything')).toBe(0.5)
  })
})

describe('scoreJob', () => {
  it('scores a well-matched posting highly', () => {
    const s = scoreJob(job(), profile)
    expect(s.fitScore).toBeGreaterThanOrEqual(80)
    expect(s.fitReason).toMatch(/skills/)
  })

  it('excludes by whole word: "java" does not exclude JavaScript roles', () => {
    expect(scoreJob(job({ jobDescription: 'JavaScript and React' }), profile).fitScore).toBeGreaterThan(0)
    expect(scoreJob(job({ jobDescription: 'Java Spring services' }), profile).fitScore).toBe(0)
    expect(scoreJob(job({ role: 'Senior Software Engineer' }), profile).fitScore).toBe(0)
  })

  it('does not treat a missing location as a perfect match', () => {
    const a = scoreJob(job({ location: '' }), profile).fitScore
    const b = scoreJob(job({ location: 'Toronto, ON' }), profile).fitScore
    expect(a).toBeLessThan(b)
  })

  it("doesn't penalize listed pay when no target salary is set", () => {
    const p = { ...profile, targetSalaryMin: 0, targetSalaryMax: 0 }
    const withPay = scoreJob(job(), p).fitScore
    const noPay = scoreJob(job({ salaryMin: null, salaryMax: null }), p).fitScore
    expect(withPay).toBeGreaterThanOrEqual(noPay)
  })

  it('reads the lower bound of experience ranges', () => {
    const p = { ...profile, yearsExperience: 2 }
    const range = scoreJob(job({ jobDescription: 'TypeScript React. 2-4 years of professional experience' }), p)
    const tooSenior = scoreJob(job({ jobDescription: 'TypeScript React. 7+ years experience' }), p)
    expect(range.fitScore).toBeGreaterThan(tooSenior.fitScore)
  })
})

describe('scoreAndRankJobs', () => {
  it('drops excluded jobs and sorts best first', () => {
    const ranked = scoreAndRankJobs([
      job({ company: 'Weak', jobDescription: 'Excel', location: 'Calgary, AB', role: 'Analyst' }),
      job({ company: 'Strong' }),
      job({ company: 'Excluded', role: 'Senior Engineer' }),
    ], profile)
    expect(ranked.map(j => j.company)).toEqual(['Strong', 'Weak'])
  })
})
