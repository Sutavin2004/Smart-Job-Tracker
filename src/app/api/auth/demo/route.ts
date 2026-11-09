import { prisma } from '@/lib/prisma'
import { IS_DEMO } from '@/lib/demo'
import { DEMO_EMAIL } from '@/lib/demo-credentials'
import { signedIn, jsonError } from '@/lib/auth-http'

/** Public demo only: sign in to the shared sample account without a password. */
export async function POST() {
  if (!IS_DEMO) return jsonError('Not available', 404)
  const user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } })
  if (!user) return jsonError('The demo is being reset. Try again in a minute.', 503)
  return signedIn(user)
}
