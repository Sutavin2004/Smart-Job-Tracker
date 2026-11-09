import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from './password'
import { safeEqual } from './auth-constants'
import { validEmail, passwordProblem, normalizeEmail } from './validation'

describe('passwords', () => {
  it('hashes with a random salt and verifies', async () => {
    const a = await hashPassword('correct horse battery')
    const b = await hashPassword('correct horse battery')
    expect(a).not.toBe(b)
    expect(a.startsWith('scrypt$')).toBe(true)
    expect(a).not.toContain('correct horse')
    expect(await verifyPassword('correct horse battery', a)).toBe(true)
    expect(await verifyPassword('wrong password', a)).toBe(false)
    expect(await verifyPassword('anything', 'garbage')).toBe(false)
  })
})

describe('input checks', () => {
  it('validates emails and passwords', () => {
    expect(normalizeEmail('  Me@Example.COM ')).toBe('me@example.com')
    expect(validEmail('me@example.com')).toBe(true)
    expect(validEmail('me@example')).toBe(false)
    expect(validEmail('not an email')).toBe(false)
    expect(passwordProblem('short')).toMatch(/8 characters/)
    expect(passwordProblem('long enough')).toBeNull()
  })
  it('compares strings safely', () => {
    expect(safeEqual('abc', 'abc')).toBe(true)
    expect(safeEqual('abc', 'abd')).toBe(false)
    expect(safeEqual('abc', 'abcd')).toBe(false)
  })
})
