import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE, AUTH_MAX_AGE, authEnabled, safeEqual, sessionToken } from '@/lib/auth'

/** Lets the UI know whether to show the Sign out button. */
export async function GET() {
  return NextResponse.json({ enabled: authEnabled() })
}

export async function POST(req: NextRequest) {
  if (!authEnabled()) return NextResponse.json({ ok: true })

  const { password } = await req.json().catch(() => ({ password: '' }))
  if (typeof password !== 'string' || !safeEqual(password, process.env.APP_PASSWORD ?? '')) {
    // Small delay to slow down guessing.
    await new Promise(r => setTimeout(r, 800))
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(AUTH_COOKIE, await sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: AUTH_MAX_AGE,
  })
  return res
}
