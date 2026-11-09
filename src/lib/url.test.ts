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
