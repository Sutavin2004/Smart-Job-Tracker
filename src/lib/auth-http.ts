import { NextRequest, NextResponse } from 'next/server'
import { createSession, sessionCookie } from './auth'

export const clientIp = (req: NextRequest) =>
  req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'

export { normalizeEmail, validEmail, passwordProblem } from './validation'

/** Start a session for the user and return a response that sets the cookie. */
export async function signedIn(user: { id: string; name: string; email: string }, status = 200) {
  const { token, expiresAt } = await createSession(user.id)
  const res = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } }, { status })
  res.cookies.set(sessionCookie(token, expiresAt))
  return res
}

export const jsonError = (error: string, status: number) => NextResponse.json({ error }, { status })
