import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type Auth } from '@/lib/api'
import { prisma } from '@/lib/prisma'
import { verifyPassword, clearedSessionCookie } from '@/lib/auth'
import { jsonError } from '@/lib/auth-http'
import { IS_DEMO } from '@/lib/demo'

/** Permanently delete the account and everything in it (requires the password). */
export const DELETE = withAuth(async (req: NextRequest, _ctx: unknown, { user }: Auth) => {
  if (IS_DEMO) return jsonError('The demo account cannot be deleted.', 403)
  const { password } = await req.json().catch(() => ({}))
  if (!(await verifyPassword(String(password ?? ''), user.passwordHash))) {
    return jsonError('Password is incorrect.', 400)
  }
  await prisma.user.delete({ where: { id: user.id } }) // cascades to all of their data
  const res = NextResponse.json({ ok: true })
  res.cookies.set(clearedSessionCookie)
  return res
})
