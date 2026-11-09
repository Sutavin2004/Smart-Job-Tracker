import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type Auth } from '@/lib/api'
import { rateLimited } from '@/lib/auth'
import { jsonError } from '@/lib/auth-http'
import { sendVerification } from '@/lib/auth-emails'
import { EMAIL_ENABLED } from '@/lib/email'

export const POST = withAuth(async (_req: NextRequest, _ctx: unknown, { user }: Auth) => {
  if (user.emailVerifiedAt) return NextResponse.json({ ok: true, alreadyVerified: true })
  if (!EMAIL_ENABLED) return jsonError('Email is not set up on this site yet.', 503)
  if (await rateLimited([`verify:${user.id}`], 3, 60 * 60 * 1000)) return jsonError('Wait a bit before asking again.', 429)
  const sent = await sendVerification(user)
  return sent ? NextResponse.json({ ok: true }) : jsonError('The email could not be sent. Try again later.', 502)
})
