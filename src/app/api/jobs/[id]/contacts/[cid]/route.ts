import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; cid: string }> }) {
  const { cid } = await params
  const body = await req.json()
  const contact = await prisma.contact.update({
    where: { id: cid },
    data: {
      name: body.name,
      title: body.title ?? null,
      email: body.email ?? null,
      phone: body.phone ?? null,
      linkedin: body.linkedin ?? null,
      relationship: body.relationship ?? 'other',
      notes: body.notes ?? null,
      lastContact: body.lastContact ? new Date(body.lastContact) : null,
    },
  })
  return NextResponse.json(contact)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; cid: string }> }) {
  const { cid } = await params
  await prisma.contact.delete({ where: { id: cid } })
  return NextResponse.json({ success: true })
}
