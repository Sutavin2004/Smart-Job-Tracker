import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action, ids, value } = body as { action: string; ids: string[]; value?: string }

  if (!ids?.length) return NextResponse.json({ error: 'No ids provided' }, { status: 400 })

  if (action === 'delete') {
    await prisma.job.deleteMany({ where: { id: { in: ids } } })
  } else if (action === 'archive') {
    await prisma.job.updateMany({ where: { id: { in: ids } }, data: { archived: true } })
  } else if (action === 'status' && value) {
    await prisma.job.updateMany({ where: { id: { in: ids } }, data: { status: value } })
  } else if (action === 'priority' && value) {
    await prisma.job.updateMany({ where: { id: { in: ids } }, data: { priority: value } })
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  return NextResponse.json({ success: true, count: ids.length })
}
