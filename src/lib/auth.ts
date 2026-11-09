import { randomBytes, createHash } from 'node:crypto'
import { prisma } from './prisma'
import { SESSION_COOKIE, SESSION_DAYS } from './auth-constants'

export { SESSION_COOKIE, safeEqual } from './auth-constants'
export { hashPassword, verifyPassword } from './password'

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')

/** Create a session; returns the raw token for the cookie (only its hash is stored). */
export async function createSession(userId: string) {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  await prisma.session.create({ data: { id: sha256(token), userId, expiresAt } })
  return { token, expiresAt }
}

export async function getUserByToken(token: string | undefined | null) {
  if (!token) return null
  const session = await prisma.session.findUnique({ where: { id: sha256(token) }, include: { user: true } })
  if (!session || session.expiresAt < new Date()) return null
  return session.user
}

export async function deleteSession(token: string | undefined | null) {
  if (token) await prisma.session.deleteMany({ where: { id: sha256(token) } })
}

export function sessionCookie(token: string, expiresAt: Date) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    expires: expiresAt,
  }
}

export const clearedSessionCookie = { name: SESSION_COOKIE, value: '', path: '/', maxAge: 0 }

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getUserByToken>>>

/** Simple DB-backed rate limit: at most `max` attempts per key in the window. */
export async function rateLimited(keys: string[], max = 10, windowMs = 15 * 60 * 1000): Promise<boolean> {
  const since = new Date(Date.now() - windowMs)
  const counts = await Promise.all(keys.map(key => prisma.authAttempt.count({ where: { key, createdAt: { gte: since } } })))
  await prisma.authAttempt.createMany({ data: keys.map(key => ({ key })) })
  // Opportunistic cleanup of old attempts.
  if (Math.random() < 0.05) await prisma.authAttempt.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } })
  return counts.some(c => c >= max)
}
