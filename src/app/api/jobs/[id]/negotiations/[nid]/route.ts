import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type Auth } from '@/lib/api'

export const PUT = withAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string; nid: string }> }, { db }: Auth) => {
  const { nid } = await params
  const body = await req.json()
  const neg = await db.salaryNegotiation.update({
    where: { id: nid },
    data: {
      theirOffer: body.theirOffer ?? null,
      myCounter: body.myCounter ?? null,
      notes: body.notes ?? null,
      outcome: body.outcome ?? null,
    },
  })
  return NextResponse.json(neg)
})

export const DELETE = withAuth(async (_req: NextRequest, { params }: { params: Promise<{ id: string; nid: string }> }, { db }: Auth) => {
  const { nid } = await params
  await db.salaryNegotiation.delete({ where: { id: nid } })
  return NextResponse.json({ success: true })
})
