import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type Auth } from '@/lib/api'
import { usageToday } from '@/lib/quota'
import { IS_DEMO } from '@/lib/demo'

export const GET = withAuth(async (_req: NextRequest, _ctx: unknown, { user }: Auth) => {
  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
    usage: await usageToday(user.id),
    demo: IS_DEMO,
  })
})
