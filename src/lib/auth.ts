/**
 * Single-password gate. The password lives only in the APP_PASSWORD env var;
 * the session cookie holds an HMAC derived from it, so changing the password
 * signs everyone out. Uses Web Crypto so it runs in middleware (edge) too.
 */
export const AUTH_COOKIE = 'sjt_session'
export const AUTH_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export function authEnabled(): boolean {
  return Boolean(process.env.APP_PASSWORD)
}

export async function sessionToken(): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(process.env.APP_PASSWORD ?? ''),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode('smart-job-tracker-session-v1'))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Constant-time string comparison. */
export function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder()
  const x = enc.encode(a), y = enc.encode(b)
  let diff = x.length ^ y.length
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0)
  return diff === 0
}
