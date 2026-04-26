import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tasks = await prisma.task.findMany({ where: { jobId: id }, orderBy: { createdAt: 'asc' } })
  return NextResponse.json(tasks)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const task = await prisma.task.create({
    data: {
      jobId: id,
      title: body.title,
      description: body.description ?? null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      priority: body.priority ?? 'medium',
    },
  })
  await prisma.activity.create({ data: { jobId: id, type: 'task_added', message: `Task added: ${body.title}` } })
  return NextResponse.json(task, { status: 201 })
}
