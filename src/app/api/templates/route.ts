import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const templates = await prisma.emailTemplate.findMany({ orderBy: { createdAt: 'asc' } })
  return NextResponse.json(templates)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const template = await prisma.emailTemplate.create({
    data: {
      name: body.name,
      subject: body.subject,
      body: body.body,
      type: body.type,
      isDefault: body.isDefault ?? false,
    },
  })
  return NextResponse.json(template, { status: 201 })
}
