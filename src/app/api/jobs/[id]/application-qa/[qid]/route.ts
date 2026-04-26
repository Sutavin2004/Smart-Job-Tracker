import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; qid: string }> }) {
  const { qid } = await params
  const body = await req.json()
  const qa = await prisma.applicationQA.update({
    where: { id: qid },
    data: {
      answer: body.answer ?? undefined,
      approved: body.approved ?? undefined,
    },
  })
  return NextResponse.json(qa)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; qid: string }> }) {
  const { qid } = await params
  await prisma.applicationQA.delete({ where: { id: qid } })
  return NextResponse.json({ success: true })
}
