import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { consumeToken } from '@/lib/auth-tokens'
import { passwordProblem, signedIn, jsonError } from '@/lib/auth-http'

/** Set a new password from an emailed link, sign out everywhere else, and sign in here. */
export async function POST(req: NextRequest) {
  const { token, password } = await req.json().catch(() => ({}))
  const problem = passwordProblem(password)
  if (problem) return jsonError(problem, 400)
  const userId = await consumeToken(token, 'reset')
  if (!userId) return jsonError('This reset link has expired or was already used. Ask for a new one.', 400)
  const user = await prisma.user.update({
    where: { id: userId },
    // Following the emailed link also proves the address.
    data: { passwordHash: await hashPassword(password), emailVerifiedAt: new Date() },
  })
  await prisma.session.deleteMany({ where: { userId } })
  return signedIn(user)
}
