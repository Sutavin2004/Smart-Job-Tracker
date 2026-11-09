import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { consumeToken } from '@/lib/auth-tokens'

/** Target of the link in the confirmation email. */
export async function GET(req: NextRequest) {
  const userId = await consumeToken(req.nextUrl.searchParams.get('token'), 'verify')
  const url = req.nextUrl.clone()
  url.search = ''
  if (!userId) {
    url.pathname = '/settings'
    url.searchParams.set('verify', 'expired')
    return NextResponse.redirect(url)
  }
  await prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } })
  url.pathname = '/'
  url.searchParams.set('verified', '1')
  return NextResponse.redirect(url)
}
