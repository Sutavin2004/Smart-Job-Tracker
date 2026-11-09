import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/auth', () => ({ getUserByToken: vi.fn(), SESSION_COOKIE: 'sjt_session' }))
vi.mock('next/headers', () => ({ cookies: vi.fn() }))
vi.mock('next/navigation', () => ({ redirect: vi.fn() }))

const { safeNext } = await import('./auth-page')

describe('safeNext', () => {
  it('keeps same-site paths', () => {
    expect(safeNext('/jobs?id=1')).toBe('/jobs?id=1')
    expect(safeNext(['/agent'])).toBe('/agent')
  })
  it('rejects anything that could leave the site', () => {
    for (const bad of ['https://evil.test', '//evil.test', '/\\evil.test', 'javascript:alert(1)', '', undefined]) {
      expect(safeNext(bad)).toBe('/')
    }
  })
})
