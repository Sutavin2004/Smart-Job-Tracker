import { randomBytes, createHash } from 'node:crypto'

export const GOOGLE_ENABLED = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
export const OAUTH_COOKIE = 'sjt_oauth'

export const redirectUri = (origin: string) => `${origin}/api/auth/google/callback`

/** Build the Google consent URL plus the values to remember in a short-lived cookie. */
export function startGoogleAuth(origin: string) {
  const state = randomBytes(24).toString('base64url')
  const verifier = randomBytes(32).toString('base64url')
  const challenge = createHash('sha256').update(verifier).digest('base64url')
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(origin),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  }).toString()
  return { url: url.toString(), state, verifier }
}

export interface GoogleProfile { sub: string; email: string; email_verified: boolean; name?: string }

export async function finishGoogleAuth(origin: string, code: string, verifier: string): Promise<GoogleProfile> {
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri(origin),
      grant_type: 'authorization_code',
      code_verifier: verifier,
    }),
  })
  if (!tokenRes.ok) throw new Error(`token exchange failed: ${tokenRes.status}`)
  const { access_token } = await tokenRes.json()
  const infoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${access_token}` } })
  if (!infoRes.ok) throw new Error(`userinfo failed: ${infoRes.status}`)
  return infoRes.json()
}
