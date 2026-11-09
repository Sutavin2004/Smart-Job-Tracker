import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE, authEnabled, safeEqual, sessionToken } from '@/lib/auth'
import { IS_DEMO, DEMO_BLOCKED_API } from '@/lib/demo'

// The cron route authenticates itself (see api/cron/discover).
const PUBLIC_PATHS = ['/login', '/api/login', '/api/health', '/api/cron/discover', '/api/cron/reset-demo']

export async function middleware(req: NextRequest) {
  if (IS_DEMO && DEMO_BLOCKED_API.some(re => re.test(req.nextUrl.pathname))) {
    return NextResponse.json({ error: "That feature is turned off in the public demo." }, { status: 403 })
  }

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
