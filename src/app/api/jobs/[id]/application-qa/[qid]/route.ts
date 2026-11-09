import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type Auth } from '@/lib/api'

export const PUT = withAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string; qid: string }> }, { db }: Auth) => {
  const { qid } = await params
  const body = await req.json()
  const qa = await db.applicationQA.update({
    where: { id: qid },
    data: {
      answer: body.answer ?? undefined,
      approved: body.approved ?? undefined,
    },
  })
  return NextResponse.json(qa)
})

export const DELETE = withAuth(async (_req: NextRequest, { params }: { params: Promise<{ id: string; qid: string }> }, { db }: Auth) => {
  const { qid } = await params
  await db.applicationQA.delete({ where: { id: qid } })
  return NextResponse.json({ success: true })
})
