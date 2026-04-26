import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const sessions = await prisma.agentSession.findMany({
    orderBy: { startedAt: 'desc' },
    take: 10,
  })
  return NextResponse.json(sessions)
}
