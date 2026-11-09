import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, rateLimited } from '@/lib/auth'
import { clientIp, normalizeEmail, validEmail, passwordProblem, signedIn, jsonError } from '@/lib/auth-http'
import { DEFAULT_TEMPLATES } from '@/lib/default-templates'
import { IS_DEMO } from '@/lib/demo'
import { sendVerification } from '@/lib/auth-emails'

export async function POST(req: NextRequest) {
  if (IS_DEMO) return jsonError('Sign-up is turned off in the demo. Use the demo account instead.', 403)
  const body = await req.json().catch(() => ({}))
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 100) : ''
  const email = normalizeEmail(body.email)
  if (!name) return jsonError('Enter your name.', 400)
  if (!validEmail(email)) return jsonError('Enter a valid email address.', 400)
  const pwProblem = passwordProblem(body.password)
  if (pwProblem) return jsonError(pwProblem, 400)

  if (await rateLimited([`signup:${clientIp(req)}`], Number(process.env.SIGNUP_LIMIT_PER_HOUR ?? 5), 60 * 60 * 1000)) {
    return jsonError('Too many sign-up attempts. Try again in an hour.', 429)
  }
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    return jsonError('An account with that email already exists. Try logging in.', 409)
  }

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: await hashPassword(body.password),
      profile: { create: { name, email } },
      emailTemplates: { createMany: { data: DEFAULT_TEMPLATES } },
    },
  })
  // Best effort: the account works without confirming the address.
  await sendVerification(user).catch(e => console.error('verification email', e))
  return signedIn(user, 201)
}
