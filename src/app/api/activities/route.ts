import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const activities = await prisma.activity.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      job: {
        select: { company: true, role: true },
      },
    },
  })

  return NextResponse.json(activities)
}
