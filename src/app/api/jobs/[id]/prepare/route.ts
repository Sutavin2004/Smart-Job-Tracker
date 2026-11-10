import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type Auth } from '@/lib/api'
import { consumeQuota } from '@/lib/quota'
import { prepareApplication, KitUnavailableError } from '@/lib/apply/prepare'

export const maxDuration = 120

/** Generate a tailored résumé, cover letter and answers for one job. */
export const POST = withAuth(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }, { db, user }: Auth) => {
  const { id } = await params
  try {
    await consumeQuota(user.id, 'ai')
    const kit = await prepareApplication(db, id)
    return NextResponse.json(kit)
  } catch (e) {
    if (e instanceof KitUnavailableError) return NextResponse.json({ error: e.message }, { status: 422 })
    throw e
  }
})
