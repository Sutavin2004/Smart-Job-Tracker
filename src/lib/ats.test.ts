import { describe, it, expect } from 'vitest'
import { detectAts, apiUrl, mapAts } from './ats'

describe('detectAts', () => {
  it('recognizes Greenhouse (old, new and embed URLs)', () => {
    expect(detectAts('https://boards.greenhouse.io/shopify/jobs/4522878005')).toEqual({ kind: 'greenhouse', board: 'shopify', id: '4522878005' })
    expect(detectAts('https://job-boards.greenhouse.io/greenhouse/jobs/7091352?gh_src=x')).toEqual({ kind: 'greenhouse', board: 'greenhouse', id: '7091352' })
    expect(detectAts('https://boards.greenhouse.io/embed/job_app?for=acme&token=123')).toEqual({ kind: 'greenhouse', board: 'acme', id: '123' })
  })
  it('recognizes Lever (incl. EU) and Ashby', () => {
    const id = '0f6a1c2e-1234-4abc-9def-1234567890ab'
    expect(detectAts(`https://jobs.lever.co/wealthsimple/${id}/apply`)).toEqual({ kind: 'lever', site: 'wealthsimple', id, eu: false })
    expect(detectAts(`https://jobs.eu.lever.co/acme/${id}`)).toMatchObject({ kind: 'lever', eu: true })
    expect(detectAts(`https://jobs.ashbyhq.com/Cohere/${id}`)).toEqual({ kind: 'ashby', org: 'Cohere', id })
  })
  it('ignores everything else', () => {
    expect(detectAts('https://www.linkedin.com/jobs/view/123')).toBeNull()
    expect(detectAts('https://evil.com/greenhouse.io/x/jobs/1')).toBeNull()
    expect(detectAts('not a url')).toBeNull()
  })
  it('builds the public API URL', () => {
    expect(apiUrl({ kind: 'lever', site: 'acme', id: 'x', eu: true })).toBe('https://api.eu.lever.co/v0/postings/acme/x')
  })
})

describe('mapAts', () => {
  it('maps a Greenhouse job (escaped HTML content, pay range in cents)', () => {
    const job = mapAts({ kind: 'greenhouse', board: 'greenhouse', id: '1' }, {
      title: 'Software Engineer, Governance', company_name: 'Greenhouse', location: { name: 'Ontario' },
      content: '&lt;p&gt;Build &amp;amp; ship.&lt;/p&gt;&lt;ul&gt;&lt;li&gt;Ruby&lt;/li&gt;&lt;/ul&gt;',
      pay_input_ranges: [{ min_cents: 10600000, max_cents: 13200000, currency_type: 'CAD' }],
      absolute_url: 'https://job-boards.greenhouse.io/greenhouse/jobs/1',
    })!
    expect(job).toMatchObject({ company: 'Greenhouse', role: 'Software Engineer, Governance', location: 'Ontario', salaryMin: 106, salaryMax: 132, currency: 'CAD', remote: false })
    expect(job.salaryRaw).toBe('CAD 106,000–132,000')
    expect(job.jobDescription).toBe('Build & ship.\n\n• Ruby')
  })

  it('maps a Lever posting with hourly pay and lists', () => {
    const job = mapAts({ kind: 'lever', site: 'wealth-simple', id: 'x', eu: false }, {
      text: 'Data Intern', categories: { location: 'Toronto', commitment: 'Intern' }, workplaceType: 'hybrid',
      descriptionPlain: 'About the role', lists: [{ text: 'What you bring', content: '<li>SQL</li>' }],
      salaryRange: { currency: 'CAD', interval: 'per-hour-wage', min: 25, max: 30 }, hostedUrl: 'https://jobs.lever.co/x',
    })!
    expect(job).toMatchObject({ company: 'Wealth Simple', role: 'Data Intern', location: 'Toronto', salaryMin: 52, salaryMax: 62, employmentType: 'Intern' })
    expect(job.jobDescription).toContain('What you bring\n• SQL')
  })

  it('finds the right job on an Ashby board', () => {
    const job = mapAts({ kind: 'ashby', org: 'cohere', id: 'b' }, {
      jobs: [
        { id: 'a', title: 'Other' },
        { id: 'b', title: 'ML Engineer', location: 'Toronto', isRemote: true, descriptionPlain: 'Train models',
          compensation: { compensationTierSummary: 'CA$150K – CA$200K', summaryComponents: [{ compensationType: 'Salary', interval: '1 YEAR', currencyCode: 'CAD', minValue: 150000, maxValue: 200000 }] } },
      ],
    })!
    expect(job).toMatchObject({ company: 'Cohere', role: 'ML Engineer', remote: true, salaryMin: 150, salaryMax: 200, salaryRaw: 'CA$150K – CA$200K' })
    expect(mapAts({ kind: 'ashby', org: 'cohere', id: 'zzz' }, { jobs: [] })).toBeNull()
  })
})
