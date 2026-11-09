import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type Auth } from '@/lib/api'

export const GET = withAuth(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }, { db }: Auth) => {
  const { id } = await params
  const contacts = await db.contact.findMany({ where: { jobId: id }, orderBy: { createdAt: 'asc' } })
  return NextResponse.json(contacts)
})

export const POST = withAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }, { db }: Auth) => {
  const { id } = await params
  const body = await req.json()
  const contact = await db.contact.create({
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
  await db.activity.create({ data: { jobId: id, type: 'contact_added', message: `Contact added: ${body.name}` } })
  return NextResponse.json(contact, { status: 201 })
})
