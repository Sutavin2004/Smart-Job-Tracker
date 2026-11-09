import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, rateLimited } from '@/lib/auth'
import { clientIp, normalizeEmail, signedIn, jsonError } from '@/lib/auth-http'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const email = normalizeEmail(body.email)
  const password = typeof body.password === 'string' ? body.password : ''
  if (!email || !password) return jsonError('Enter your email and password.', 400)

  if (await rateLimited([`login:ip:${clientIp(req)}`, `login:email:${email}`], 10)) {
    return jsonError('Too many attempts. Wait 15 minutes and try again.', 429)
  }
  const user = await prisma.user.findUnique({ where: { email } })
  // Same message whether the email or the password is wrong.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return jsonError('Email or password is incorrect.', 401)
  }
  return signedIn(user)
}
