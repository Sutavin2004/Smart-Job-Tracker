import { NextResponse, NextRequest } from 'next/server'
import { withAuth, type Auth } from '@/lib/api'

export const GET = withAuth(async (_req: NextRequest, _ctx: unknown, { db }: Auth) => {
  const tasks = await db.task.findMany({
    orderBy: [{ completed: 'asc' }, { dueDate: 'asc' }],
    include: { job: { select: { company: true, role: true } } },
  })
  return NextResponse.json(tasks)
})
