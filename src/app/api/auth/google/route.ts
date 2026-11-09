import { NextRequest, NextResponse } from 'next/server'
import { GOOGLE_ENABLED, OAUTH_COOKIE, startGoogleAuth } from '@/lib/google-oauth'
import { safeNext } from '@/lib/safe-next'
import { IS_DEMO } from '@/lib/demo'

/** Step 1: send the browser to Google. */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin
  if (!GOOGLE_ENABLED || IS_DEMO) return NextResponse.redirect(`${origin}/login?error=google_off`)
  const next = safeNext(req.nextUrl.searchParams.get('next') ?? undefined)
  const { url, state, verifier } = startGoogleAuth(origin)
  const res = NextResponse.redirect(url)
  res.cookies.set(OAUTH_COOKIE, JSON.stringify({ state, verifier, next }), {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/api/auth/google', maxAge: 600,
  })
  return res
}
