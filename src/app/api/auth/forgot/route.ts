import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimited } from '@/lib/auth'
import { clientIp, normalizeEmail, validEmail, jsonError } from '@/lib/auth-http'
import { sendPasswordReset } from '@/lib/auth-emails'
import { EMAIL_ENABLED } from '@/lib/email'
import { IS_DEMO } from '@/lib/demo'

/** Email a reset link. Always answers the same way so it can't be used to find out who has an account. */
export async function POST(req: NextRequest) {
  if (IS_DEMO) return jsonError('Password reset is turned off in the demo.', 403)
  if (!EMAIL_ENABLED) return jsonError('Password reset by email is not set up on this site yet.', 503)
  const email = normalizeEmail((await req.json().catch(() => ({}))).email)
  if (!validEmail(email)) return jsonError('Enter a valid email address.', 400)
  if (await rateLimited([`forgot:ip:${clientIp(req)}`, `forgot:email:${email}`], 5, 60 * 60 * 1000)) {
    return jsonError('Too many requests. Try again in an hour.', 429)
  }
  const user = await prisma.user.findUnique({ where: { email } })
  if (user) await sendPasswordReset(user)
  return NextResponse.json({ ok: true })
}
