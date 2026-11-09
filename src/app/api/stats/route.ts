import { NextResponse, NextRequest } from 'next/server'
import { withAuth, type Auth } from '@/lib/api'

export const GET = withAuth(async (_req: NextRequest, _ctx: unknown, { db }: Auth) => {
  const jobs = await db.job.findMany()

  const counts = {
    total: jobs.length,
    saved: jobs.filter(j => j.status === 'saved').length,
    applied: jobs.filter(j => j.status === 'applied').length,
    interviewing: jobs.filter(j => j.status === 'interviewing').length,
    offered: jobs.filter(j => j.status === 'offered').length,
    rejected: jobs.filter(j => j.status === 'rejected').length,
  }

  const responded = counts.applied + counts.interviewing + counts.offered + counts.rejected
  const responseRate = counts.applied > 0 ? Math.round((responded / counts.applied) * 100) : 0
  const interviewRate = responded > 0 ? Math.round(((counts.interviewing + counts.offered) / responded) * 100) : 0

  // Monthly applications for the last 6 months
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const recentJobs = jobs.filter(j => new Date(j.dateApplied) >= sixMonthsAgo)

  const monthlyMap: Record<string, number> = {}
  recentJobs.forEach(job => {
    const month = new Date(job.dateApplied).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    monthlyMap[month] = (monthlyMap[month] || 0) + 1
  })

  const monthly = Object.entries(monthlyMap).map(([month, count]) => ({ month, count }))

  return NextResponse.json({
    ...counts,
    responseRate,
    interviewRate,
    monthly,
  })
})
