import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const tasks = await prisma.task.findMany({
    orderBy: [{ completed: 'asc' }, { dueDate: 'asc' }],
    include: { job: { select: { company: true, role: true } } },
  })
  return NextResponse.json(tasks)
}
