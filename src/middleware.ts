import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE, authEnabled, safeEqual, sessionToken } from '@/lib/auth'

// The cron route authenticates itself (see api/cron/discover).
const PUBLIC_PATHS = ['/login', '/api/login', '/api/health', '/api/cron/discover']

export async function middleware(req: NextRequest) {
  // No APP_PASSWORD configured (e.g. local dev) → app stays open.
  if (!authEnabled()) return NextResponse.next()

  const { pathname, search } = req.nextUrl
  if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/opengraph-image') || pathname === '/manifest.webmanifest') {
    return NextResponse.next()
  }

  const cookie = req.cookies.get(AUTH_COOKIE)?.value
  if (cookie && safeEqual(cookie, await sessionToken())) return NextResponse.next()

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }
  const url = req.nextUrl.clone()
  url.pathname = '/login'
  url.search = `?next=${encodeURIComponent(pathname + search)}`
  return NextResponse.redirect(url)
}

export const config = {
  // Everything except Next.js internals and static files.
  matcher: ['/((?!_next/static|_next/image|_vercel|favicon.ico|icons/|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)'],
}
