import { describe, it, expect } from 'vitest'
import { adzunaCountry } from './adzuna'
import { mapRemotive, mapJobicy } from './remote-boards'

describe('adzunaCountry', () => {
  it.each([
    ['Toronto, ON', 'ca'], ['London, ON', 'ca'], ['Vancouver', 'ca'], ['Canada', 'ca'],
    ['London, UK', 'gb'], ['Manchester', 'gb'], ['Seattle, WA', 'us'], ['New York', 'us'],
    ['Sydney', 'au'], ['Somewhere unknown', 'ca'],
  ])('%s → %s', (loc, cc) => expect(adzunaCountry(loc)).toBe(cc))
})

describe('remote board mappers', () => {
  it('maps Remotive jobs and labels location restrictions', () => {
    const j = mapRemotive({ title: 'Frontend Dev', company_name: 'Acme', url: 'https://remotive.com/x', candidate_required_location: 'Canada', salary: '$90,000 - $110,000', description: '<p>React</p>', tags: ['react', 'ts'] })
    expect(j).toMatchObject({ role: 'Frontend Dev', location: 'Remote · Canada', remote: true, salaryMin: 90, salaryMax: 110, techStack: 'react, ts', source: 'Remotive' })
    expect(mapRemotive({ candidate_required_location: 'Worldwide', title: 'x', url: 'u' }).location).toBe('Remote')
  })
  it('maps Jobicy jobs', () => {
    const j = mapJobicy({ jobTitle: 'Data Engineer', companyName: 'Beta', url: 'https://jobicy.com/x', jobGeo: 'USA', annualSalaryMin: '120000', annualSalaryMax: '150000', salaryCurrency: 'USD', jobDescription: '<p>SQL &amp; Python</p>' })
    expect(j).toMatchObject({ role: 'Data Engineer', location: 'Remote · USA', salaryMin: 120, salaryMax: 150, jobDescription: 'SQL & Python', source: 'Jobicy' })
  })
})
