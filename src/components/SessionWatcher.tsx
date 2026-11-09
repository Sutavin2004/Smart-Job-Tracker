'use client'

import { useEffect } from 'react'

/**
 * If the session expires or is revoked while a page is open, API calls start
 * returning 401. Send the person to the sign-in page instead of showing a
 * screen full of errors.
 */
export function SessionWatcher() {
  useEffect(() => {
    const original = window.fetch
    let redirecting = false
    window.fetch = async (...args) => {
      const res = await original(...args)
      if (res.status === 401 && !redirecting) {
        const input = args[0]
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
        const path = new URL(url, window.location.origin)
        if (path.origin === window.location.origin && path.pathname.startsWith('/api/') && !path.pathname.startsWith('/api/auth/')) {
          redirecting = true
          const next = window.location.pathname + window.location.search
          window.location.href = next === '/' ? '/login' : `/login?next=${encodeURIComponent(next)}`
        }
      }
      return res
    }
    return () => { window.fetch = original }
  }, [])
  return null
}
