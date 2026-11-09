import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type Auth } from '@/lib/api'

export const PUT = withAuth(async (req: NextRequest, { params }: { params: Promise<{ id: string; tid: string }> }, { db }: Auth) => {
  const { tid } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (body.title !== undefined) data.title = body.title
  if (body.description !== undefined) data.description = body.description ?? null
  if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null
  if (body.priority !== undefined) data.priority = body.priority
  if (body.completed !== undefined) {
    data.completed = body.completed
    data.completedAt = body.completed ? new Date() : null
  }
  const task = await db.task.update({ where: { id: tid }, data })
  return NextResponse.json(task)
})

export const DELETE = withAuth(async (_req: NextRequest, { params }: { params: Promise<{ id: string; tid: string }> }, { db }: Auth) => {
  const { tid } = await params
  await db.task.delete({ where: { id: tid } })
  return NextResponse.json({ success: true })
})
