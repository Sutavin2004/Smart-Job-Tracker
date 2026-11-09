import { describe, it, expect } from 'vitest'
import { extractJob, findJobPosting } from './job-import'

const ld = (obj: unknown) => `<html><head><script type="application/ld+json">${JSON.stringify(obj)}</script></head><body></body></html>`

describe('extractJob — schema.org JobPosting', () => {
  it('reads a typical ATS posting (Greenhouse/Lever style)', () => {
    const html = ld({
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: 'Junior Software Engineer',
      hiringOrganization: { '@type': 'Organization', name: 'Shopify' },
      jobLocation: { '@type': 'Place', address: { addressLocality: 'Toronto', addressRegion: 'ON', addressCountry: 'CA' } },
      baseSalary: { '@type': 'MonetaryAmount', currency: 'CAD', value: { '@type': 'QuantitativeValue', minValue: 85000, maxValue: 105000, unitText: 'YEAR' } },
      description: '<p>Build things.</p><ul><li>TypeScript</li><li>React &amp; Node</li></ul>',
      validThrough: '2026-12-31T23:59:59Z',
      employmentType: 'FULL_TIME',
    })
    const { job, source } = extractJob(html)
    expect(source).toBe('json-ld')
    expect(job.company).toBe('Shopify')
    expect(job.role).toBe('Junior Software Engineer')
    expect(job.location).toBe('Toronto, ON, CA')
    expect(job.remote).toBe(false)
    expect(job.salaryMin).toBe(85)
    expect(job.salaryMax).toBe(105)
    expect(job.currency).toBe('CAD')
    expect(job.salaryRaw).toBe('CAD 85,000–105,000')
    expect(job.deadline).toBe('2026-12-31')
    expect(job.jobDescription).toContain('• React & Node')
  })

  it('finds postings inside @graph and with array @type', () => {
    const html = ld({ '@graph': [{ '@type': 'WebPage' }, { '@type': ['JobPosting'], title: 'Data Analyst', hiringOrganization: 'RBC' }] })
    expect(findJobPosting(html)?.title).toBe('Data Analyst')
    expect(extractJob(html).job.company).toBe('RBC')
  })

  it('annualizes hourly pay and flags remote roles', () => {
    const html = ld({
      '@type': 'JobPosting', title: 'Support Engineer', hiringOrganization: { name: 'Acme' },
      jobLocationType: 'TELECOMMUTE',
      baseSalary: { currency: 'USD', value: { value: 40, unitText: 'HOUR' } },
    })
    const { job } = extractJob(html)
    expect(job.remote).toBe(true)
    expect(job.location).toBe('Remote')
    expect(job.salaryMin).toBe(83) // 40 * 2080 / 1000
    expect(job.salaryRaw).toBe('USD 40 / hour')
  })

  it('skips malformed JSON-LD blocks and keeps looking', () => {
    const html = `<script type="application/ld+json">{not json</script>${ld({ '@type': 'JobPosting', title: 'QA Tester', hiringOrganization: { name: 'TD' } })}`
    expect(extractJob(html).job.role).toBe('QA Tester')
  })
})

describe('extractJob — meta-tag fallback', () => {
  it('splits "Role at Company" titles', () => {
    const html = '<meta property="og:title" content="Backend Developer at Wealthsimple | Careers"><meta name="description" content="Join us">'
    const { job, source } = extractJob(html)
    expect(source).toBe('meta')
    expect(job.role).toBe('Backend Developer')
    expect(job.company).toBe('Wealthsimple')
    expect(job.jobDescription).toBe('Join us')
  })

  it('splits "Role - Company" <title> tags', () => {
    const { job } = extractJob('<title>Cloud Engineer - Telus</title>')
    expect(job.role).toBe('Cloud Engineer')
    expect(job.company).toBe('Telus')
  })
})

describe('extractJob — robustness', () => {
  it('survives null fields in JobPosting data', () => {
    const html = ld({ '@type': 'JobPosting', title: 'Dev', hiringOrganization: null, jobLocation: [null, { address: { addressLocality: 'Toronto', addressCountry: null } }], baseSalary: null })
    const { job } = extractJob(html)
    expect(job.role).toBe('Dev')
    expect(job.location).toBe('Toronto')
  })

  it('detects "Company - Role" titles from the URL (Lever style)', () => {
    const { job } = extractJob('<title>Emburse - Senior Software Engineer</title>', 'https://jobs.lever.co/emburse/abc')
    expect(job.company).toBe('Emburse')
    expect(job.role).toBe('Senior Software Engineer')
  })
})
