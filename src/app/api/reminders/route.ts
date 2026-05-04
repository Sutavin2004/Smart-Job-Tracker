import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export interface Reminder {
  id: string
  jobId: string
  company: string
  role: string
  type: 'follow_up_overdue' | 'follow_up_date' | 'interview_soon' | 'deadline_soon' | 'stale_application'
  message: string
  urgency: 'high' | 'medium' | 'low'
  daysAgo?: number
  dueDate?: string
}

export async function GET() {
  const now = new Date()
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000)
  const in3days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const days7ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const days14ago = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  const reminders: Reminder[] = []

  // ── 1. Jobs applied 7+ days ago with no response (still 'applied') ──────
  const staleApplied = await prisma.job.findMany({
    where: {
      status: 'applied',
      archived: false,
      dateApplied: { lte: days7ago },
    },
    select: { id: true, company: true, role: true, dateApplied: true, followUpDate: true },
  })

  for (const job of staleApplied) {
    const daysAgo = Math.floor((now.getTime() - new Date(job.dateApplied).getTime()) / (24 * 60 * 60 * 1000))
    const alreadyFollowedUp = job.followUpDate && new Date(job.followUpDate) > days14ago

    if (!alreadyFollowedUp) {
      reminders.push({
        id: `stale-${job.id}`,
        jobId: job.id,
        company: job.company,
        role: job.role,
        type: 'stale_application',
        message: `Applied ${daysAgo} days ago with no update — consider following up`,
        urgency: daysAgo >= 14 ? 'high' : 'medium',
        daysAgo,
      })
    }
  }

  // ── 2. Passed follow-up dates ────────────────────────────────────────────
  const overdueFollowUps = await prisma.job.findMany({
    where: {
      followUpDate: { lte: now },
      status: { in: ['saved', 'applied'] },
      archived: false,
    },
    select: { id: true, company: true, role: true, followUpDate: true },
  })

  for (const job of overdueFollowUps) {
    const daysAgo = Math.floor((now.getTime() - new Date(job.followUpDate!).getTime()) / (24 * 60 * 60 * 1000))
    reminders.push({
      id: `followup-${job.id}`,
      jobId: job.id,
      company: job.company,
      role: job.role,
      type: 'follow_up_date',
      message: `Follow-up date passed ${daysAgo > 0 ? `${daysAgo} day${daysAgo !== 1 ? 's' : ''}` : 'today'} ago`,
      urgency: daysAgo >= 3 ? 'high' : 'medium',
      daysAgo,
    })
  }

  // ── 3. Upcoming interviews (within 48 hours) ─────────────────────────────
  const upcomingInterviews = await prisma.interview.findMany({
    where: {
      scheduledAt: { gte: now, lte: in48h },
      outcome: { in: ['scheduled', 'pending'] },
    },
    include: { job: { select: { company: true, role: true } } },
  })

  for (const iv of upcomingInterviews) {
    const hoursUntil = Math.round((new Date(iv.scheduledAt).getTime() - now.getTime()) / (60 * 60 * 1000))
    reminders.push({
      id: `interview-${iv.id}`,
      jobId: iv.jobId,
      company: iv.job.company,
      role: iv.job.role,
      type: 'interview_soon',
      message: `${iv.type.charAt(0).toUpperCase() + iv.type.slice(1)} interview in ${hoursUntil}h — make sure you're prepared`,
      urgency: hoursUntil <= 12 ? 'high' : 'medium',
      dueDate: new Date(iv.scheduledAt).toISOString(),
    })
  }

  // ── 4. Upcoming application deadlines (within 3 days) ───────────────────
  const upcomingDeadlines = await prisma.job.findMany({
    where: {
      deadline: { gte: now, lte: in3days },
      status: { in: ['saved', 'applied'] },
      archived: false,
    },
    select: { id: true, company: true, role: true, deadline: true },
  })

  for (const job of upcomingDeadlines) {
    const daysUntil = Math.ceil((new Date(job.deadline!).getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
    reminders.push({
      id: `deadline-${job.id}`,
      jobId: job.id,
      company: job.company,
      role: job.role,
      type: 'deadline_soon',
      message: `Application deadline in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
      urgency: daysUntil <= 1 ? 'high' : 'medium',
      dueDate: new Date(job.deadline!).toISOString(),
    })
  }

  // Auto-create tasks for high-urgency follow-ups that don't have a pending task
  for (const reminder of reminders.filter(r => r.urgency === 'high' && r.type === 'stale_application')) {
    const existingTask = await prisma.task.findFirst({
      where: {
        jobId: reminder.jobId,
        completed: false,
        title: { contains: 'Follow up' },
      },
    })

    if (!existingTask) {
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 1)
      await prisma.task.create({
        data: {
          jobId: reminder.jobId,
          title: `Follow up with ${reminder.company}`,
          description: `It's been ${reminder.daysAgo} days since applying — send a polite follow-up email`,
          dueDate,
          priority: 'high',
        },
      })
    }
  }

  // Sort: high urgency first, then by type priority
  const typePriority: Record<string, number> = {
    interview_soon: 0,
    deadline_soon: 1,
    follow_up_date: 2,
    stale_application: 3,
    follow_up_overdue: 4,
  }
  reminders.sort((a, b) => {
    if (a.urgency !== b.urgency) return a.urgency === 'high' ? -1 : b.urgency === 'high' ? 1 : 0
    return (typePriority[a.type] ?? 5) - (typePriority[b.type] ?? 5)
  })

  return NextResponse.json(reminders)
}
