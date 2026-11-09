import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSession, sessionCookie, safeEqual } from '@/lib/auth'
import { GOOGLE_ENABLED, OAUTH_COOKIE, finishGoogleAuth } from '@/lib/google-oauth'
import { DEFAULT_TEMPLATES } from '@/lib/default-templates'
import { normalizeEmail } from '@/lib/validation'
import { IS_DEMO } from '@/lib/demo'

/** Step 2: Google sends the browser back here with a code. */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin
  const fail = (reason: string) => {
    const res = NextResponse.redirect(`${origin}/login?error=${reason}`)
    res.cookies.set(OAUTH_COOKIE, '', { path: '/api/auth/google', maxAge: 0 })
    return res
  }
  if (!GOOGLE_ENABLED || IS_DEMO) return fail('google_off')

  let saved: { state?: string; verifier?: string; next?: string } = {}
  try { saved = JSON.parse(req.cookies.get(OAUTH_COOKIE)?.value ?? '{}') } catch { /* fall through */ }
  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state') ?? ''
  if (req.nextUrl.searchParams.get('error')) return fail('google_cancelled')
  if (!code || !saved.state || !saved.verifier || !safeEqual(state, saved.state)) return fail('google_failed')

  let profile
  try {
    profile = await finishGoogleAuth(origin, code, saved.verifier)
  } catch (e) {
    console.error('google sign-in', e)
    return fail('google_failed')
  }
  const email = normalizeEmail(profile.email)
  if (!profile.sub || !email || !profile.email_verified) return fail('google_unverified')

  // Match by Google id, then by email (Google has verified it, so linking is safe), else create.
  let user = await prisma.user.findUnique({ where: { googleId: profile.sub } })
  if (!user) {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      user = await prisma.user.update({
        where: { id: existing.id },
        data: { googleId: profile.sub, emailVerifiedAt: existing.emailVerifiedAt ?? new Date() },
      })
    } else {
      const name = (profile.name ?? '').trim().slice(0, 100)
      user = await prisma.user.create({
        data: {
          email, name, googleId: profile.sub, emailVerifiedAt: new Date(),
          profile: { create: { name, email } },
          emailTemplates: { createMany: { data: DEFAULT_TEMPLATES } },
        },
      })
    }
  }

  const { token, expiresAt } = await createSession(user.id)
  const res = NextResponse.redirect(`${origin}${saved.next ?? '/'}`)
  res.cookies.set(sessionCookie(token, expiresAt))
  res.cookies.set(OAUTH_COOKIE, '', { path: '/api/auth/google', maxAge: 0 })
  return res
}
