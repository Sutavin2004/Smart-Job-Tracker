import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type Auth } from '@/lib/api'

export const GET = withAuth(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }, { db }: Auth) => {
  const { id } = await params
  const negotiations = await db.salaryNegotiation.findMany({ where: { jobId: id }, orderBy: { date: 'asc' } })
  return NextResponse.json(negotiations)
})

export const POST = withAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }, { db }: Auth) => {
  const { id } = await params
  const body = await req.json()
  const count = await db.salaryNegotiation.count({ where: { jobId: id } })
  const neg = await db.salaryNegotiation.create({
    data: {
      jobId: id,
      round: count + 1,
      theirOffer: body.theirOffer ?? null,
      myCounter: body.myCounter ?? null,
      notes: body.notes ?? null,
      outcome: body.outcome ?? null,
    },
  })
  return NextResponse.json(neg, { status: 201 })
})
