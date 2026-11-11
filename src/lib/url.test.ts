import { describe, it, expect } from 'vitest'
import { normalizeUrl } from './url'

describe('normalizeUrl', () => {
  it('ignores protocol, www, trailing slash, hash and tracking params', () => {
    expect(normalizeUrl('https://www.Example.com/jobs/123/?utm_source=x&ref=abc#apply'))
      .toBe(normalizeUrl('http://example.com/jobs/123'))
  })
  it('keeps meaningful query params', () => {
    expect(normalizeUrl('https://jobs.lever.co/acme?id=1')).not.toBe(normalizeUrl('https://jobs.lever.co/acme?id=2'))
  })
})

import { isAggregator } from './url'
describe('isAggregator', () => {
  it('spots job-listing sites but not employers or ATS pages', () => {
    expect(isAggregator('https://www.canadajobs.works/job/x')).toBe(true)
    expect(isAggregator('https://www.speedyapply.com/jobs/at/yelp/x')).toBe(true)
    expect(isAggregator('https://jobs.scotiabank.com/job/Toronto/1')).toBe(false)
    expect(isAggregator('https://boards.greenhouse.io/policyme/jobs/1')).toBe(false)
    expect(isAggregator(null)).toBe(false)
  })
})
