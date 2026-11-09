import { randomBytes, createHash } from 'node:crypto'
import { prisma } from './prisma'

export type TokenKind = 'reset' | 'verify'
const TTL: Record<TokenKind, number> = { reset: 60 * 60 * 1000, verify: 7 * 24 * 60 * 60 * 1000 }
const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')

/** Issue a one-time token, replacing any earlier one of the same kind. Returns the raw token for the link. */
export async function issueToken(userId: string, kind: TokenKind) {
  const token = randomBytes(32).toString('base64url')
  await prisma.$transaction([
    prisma.authToken.deleteMany({ where: { userId, kind } }),
    prisma.authToken.create({ data: { id: sha256(token), userId, kind, expiresAt: new Date(Date.now() + TTL[kind]) } }),
  ])
  return token
}

/** Use up a token: returns its user id if valid, and deletes it either way. */
export async function consumeToken(token: unknown, kind: TokenKind): Promise<string | null> {
  if (typeof token !== 'string' || token.length < 20 || token.length > 100) return null
  const row = await prisma.authToken.findUnique({ where: { id: sha256(token) } })
  if (!row || row.kind !== kind) return null
  await prisma.authToken.delete({ where: { id: row.id } }).catch(() => {})
  return row.expiresAt > new Date() ? row.userId : null
}
