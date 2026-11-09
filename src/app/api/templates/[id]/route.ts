import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type Auth } from '@/lib/api'

export const PUT = withAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }, { db }: Auth) => {
  const { id } = await params
  const body = await req.json()
  const template = await db.emailTemplate.update({
    where: { id },
    data: {
      name: body.name,
      subject: body.subject,
      body: body.body,
      type: body.type,
      isDefault: body.isDefault ?? false,
    },
  })
  return NextResponse.json(template)
})

export const DELETE = withAuth(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }, { db }: Auth) => {
  const { id } = await params
  await db.emailTemplate.delete({ where: { id } })
  return NextResponse.json({ success: true })
})
