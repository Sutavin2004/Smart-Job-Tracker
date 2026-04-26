import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const negotiations = await prisma.salaryNegotiation.findMany({ where: { jobId: id }, orderBy: { date: 'asc' } })
  return NextResponse.json(negotiations)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const count = await prisma.salaryNegotiation.count({ where: { jobId: id } })
  const neg = await prisma.salaryNegotiation.create({
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
}
