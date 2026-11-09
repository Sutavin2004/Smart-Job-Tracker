import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type Auth } from '@/lib/api'
import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword, SESSION_COOKIE } from '@/lib/auth'
import { passwordProblem, jsonError } from '@/lib/auth-http'
import { IS_DEMO } from '@/lib/demo'

export const PUT = withAuth(async (req: NextRequest, _ctx: unknown, { user }: Auth) => {
  if (IS_DEMO) return jsonError('Password changes are turned off in the demo.', 403)
  const { currentPassword, newPassword } = await req.json()
  // Accounts created with Google can set a first password without a current one.
  if (user.passwordHash && !(await verifyPassword(String(currentPassword ?? ''), user.passwordHash))) {
    return jsonError('Your current password is incorrect.', 400)
  }
  const problem = passwordProblem(newPassword)
  if (problem) return jsonError(problem, 400)
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(newPassword) } })
  // Sign out other devices.
  const current = req.cookies.get(SESSION_COOKIE)?.value
  const { createHash } = await import('node:crypto')
  const keep = current ? createHash('sha256').update(current).digest('hex') : ''
  await prisma.session.deleteMany({ where: { userId: user.id, NOT: { id: keep } } })
  return NextResponse.json({ ok: true })
})
