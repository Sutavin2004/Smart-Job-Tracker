import { describe, it, expect, afterEach } from 'vitest'
import { safeEqual, sessionToken, authEnabled } from './auth'

describe('auth', () => {
  afterEach(() => { delete process.env.APP_PASSWORD })

  it('is off when no password is configured', () => {
    expect(authEnabled()).toBe(false)
  })
  it('derives a stable token that changes with the password', async () => {
    process.env.APP_PASSWORD = 'one'
    const a = await sessionToken()
    expect(await sessionToken()).toBe(a)
    expect(a).not.toContain('one')
    process.env.APP_PASSWORD = 'two'
    expect(await sessionToken()).not.toBe(a)
  })
  it('compares strings safely', () => {
    expect(safeEqual('abc', 'abc')).toBe(true)
    expect(safeEqual('abc', 'abd')).toBe(false)
    expect(safeEqual('abc', 'abcd')).toBe(false)
    expect(safeEqual('', '')).toBe(true)
  })
})
