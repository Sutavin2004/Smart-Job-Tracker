import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const contacts = await prisma.contact.findMany({ where: { jobId: id }, orderBy: { createdAt: 'asc' } })
  return NextResponse.json(contacts)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const contact = await prisma.contact.create({
    data: {
      jobId: id,
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
  await prisma.activity.create({ data: { jobId: id, type: 'contact_added', message: `Contact added: ${body.name}` } })
  return NextResponse.json(contact, { status: 201 })
}
