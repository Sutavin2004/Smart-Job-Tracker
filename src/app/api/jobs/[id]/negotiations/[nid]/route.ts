import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; nid: string }> }) {
  const { nid } = await params
  const body = await req.json()
  const neg = await prisma.salaryNegotiation.update({
    where: { id: nid },
    data: {
      theirOffer: body.theirOffer ?? null,
      myCounter: body.myCounter ?? null,
      notes: body.notes ?? null,
      outcome: body.outcome ?? null,
    },
  })
  return NextResponse.json(neg)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; nid: string }> }) {
  const { nid } = await params
  await prisma.salaryNegotiation.delete({ where: { id: nid } })
  return NextResponse.json({ success: true })
}
