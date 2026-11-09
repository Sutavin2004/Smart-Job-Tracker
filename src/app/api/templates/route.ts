import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type Auth } from '@/lib/api'

export const GET = withAuth(async (_req: NextRequest, _ctx: unknown, { db }: Auth) => {
  const templates = await db.emailTemplate.findMany({ orderBy: { createdAt: 'asc' } })
  return NextResponse.json(templates)
})

export const POST = withAuth(async (req: NextRequest, _ctx: unknown, { db, user }: Auth) => {
  const body = await req.json()
  const template = await db.emailTemplate.create({
    data: {
      userId: user.id,
      name: body.name,
      subject: body.subject,
      body: body.body,
      type: body.type,
      isDefault: body.isDefault ?? false,
    },
  })
  return NextResponse.json(template, { status: 201 })
})
