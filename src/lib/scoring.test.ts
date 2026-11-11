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
      job({ company: 'Weak', jobDescription: 'Excel', location: 'Calgary, AB', role: 'Software Developer' }),
      job({ company: 'Irrelevant', role: 'Data Analyst' }),
      job({ company: 'Strong' }),
      job({ company: 'Excluded', role: 'Senior Engineer' }),
    ], profile)
    expect(ranked.map(j => j.company)).toEqual(['Strong', 'Weak'])
  })
})

import { titleRelevant, homeCountry, remoteEligible } from './scoring'

describe('agent relevance filters', () => {
  const roles = 'Software Engineer, Frontend Developer'
  it('drops postings whose title shares nothing with the target roles', () => {
    expect(titleRelevant('Content Reviewer - United States', roles)).toBe(false)
    expect(titleRelevant('US Remote Patient Care Advocate', roles)).toBe(false)
    expect(titleRelevant('Software Engineer, AI Coding Tasks', roles)).toBe(true)
    expect(titleRelevant('Front-End Developer (React)', roles)).toBe(true)
    expect(titleRelevant('Senior Engineering Manager', roles)).toBe(true) // 'engineering' ~ 'engineer'; exclusions handle seniority
  })
  it('works out the home country from non-remote locations', () => {
    expect(homeCountry('Remote, Toronto')).toBe('ca')
    expect(homeCountry('Seattle, WA')).toBe('us')
    expect(homeCountry('Remote')).toBeNull()
  })
  it('checks remote eligibility labels', () => {
    expect(remoteEligible('Remote · USA', 'ca')).toBe(false)
    expect(remoteEligible('Remote · USA, Canada', 'ca')).toBe(true)
    expect(remoteEligible('Remote · Americas', 'ca')).toBe(true)
    expect(remoteEligible('Remote · Worldwide', 'ca')).toBe(true)
    expect(remoteEligible('Remote', 'ca')).toBe(true)
    expect(remoteEligible('Remote · USA', null)).toBe(true)
  })
  it('scores US-only remote jobs low for a Toronto candidate', () => {
    const p = { ...profile, targetLocations: 'Remote, Toronto', preferRemote: true }
    const usOnly = scoreJob(job({ remote: true, location: 'Remote · USA' }), p)
    const open = scoreJob(job({ remote: true, location: 'Remote · Canada' }), p)
    expect(open.fitScore - usOnly.fitScore).toBeGreaterThanOrEqual(15)
    expect(usOnly.fitReason).toMatch(/another country/)
  })
})

import { skillTerms, roleMatch, requiredYears, experienceScore } from './scoring'

describe('scoring for early-career candidates', () => {
  it('splits compound skills into terms a posting would use', () => {
    expect(skillTerms('Linux system administration (RHEL)')).toEqual(expect.arrayContaining(['rhel', 'linux']))
    expect(skillTerms('RAG systems')).toContain('rag')
    expect(skillTerms('CI/CD')).toContain('continuous integration')
  })
  it('scores the closest target role, not the whole list', () => {
    expect(roleMatch('Full Stack Developer (React + Next.js)', 'DevOps Engineer, Full-Stack Developer')).toBe(1)
    expect(roleMatch('Junior Software Engineer', 'Software Engineer')).toBe(1)
    expect(roleMatch('Product Designer', 'Software Engineer')).toBe(0)
  })
  it('reads years asked for in different phrasings', () => {
    expect(requiredYears('You have 2+ years of professional software engineering')).toBe(2)
    expect(requiredYears('3-5 years of experience with AWS')).toBe(3)
    expect(requiredYears('We were founded 10 years ago')).toBeNull()
  })
  it('rewards entry-level postings and penalizes experience gaps', () => {
    expect(experienceScore('Build things.', 1, 'Junior Software Engineer')).toBe(1)
    expect(experienceScore('Requires 2+ years of professional engineering', 1, 'Software Engineer')).toBe(0.5)
    expect(experienceScore('Requires 5+ years of experience', 1, 'Software Engineer')).toBe(0.1)
  })
})
