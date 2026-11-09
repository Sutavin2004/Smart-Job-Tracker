import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type Auth } from '@/lib/api'

export const GET = withAuth(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }, { db }: Auth) => {
  const { id } = await params
  const tasks = await db.task.findMany({ where: { jobId: id }, orderBy: { createdAt: 'asc' } })
  return NextResponse.json(tasks)
})

export const POST = withAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }, { db }: Auth) => {
  const { id } = await params
  const body = await req.json()
  const task = await db.task.create({
    data: {
      jobId: id,
      title: body.title,
      description: body.description ?? null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      priority: body.priority ?? 'medium',
    },
  })
  await db.activity.create({ data: { jobId: id, type: 'task_added', message: `Task added: ${body.title}` } })
  return NextResponse.json(task, { status: 201 })
})
