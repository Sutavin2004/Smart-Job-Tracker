import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/auth-constants'
import { IS_DEMO, DEMO_BLOCKED_API } from '@/lib/demo'

// Reachable without signing in. Real session checks happen in API routes
// (withAuth) and in the app layout; this only redirects early.
const PUBLIC_PAGES = ['/login', '/signup', '/forgot-password', '/reset-password']
const PUBLIC_API = /^\/api\/(health|auth\/(login|signup|demo|logout|forgot|reset|verify|google)|cron\/)/

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  if (IS_DEMO && DEMO_BLOCKED_API.some(re => re.test(pathname))) {
    return NextResponse.json({ error: 'That feature is turned off in the public demo.' }, { status: 403 })
  }
  if (pathname.startsWith('/opengraph-image') || pathname === '/manifest.webmanifest') return NextResponse.next()

  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value)
  if (pathname.startsWith('/api/')) {
    if (PUBLIC_API.test(pathname) || hasSession) return NextResponse.next()
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }
  if (PUBLIC_PAGES.includes(pathname)) return NextResponse.next()
  if (!hasSession) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.search = pathname === '/' ? '' : `?next=${encodeURIComponent(pathname + search)}`
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|_vercel|favicon.ico|icons/|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)'],
}
