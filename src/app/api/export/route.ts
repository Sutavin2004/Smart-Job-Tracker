import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'

export async function GET() {
  const jobs = await prisma.job.findMany({ orderBy: { createdAt: 'desc' } })

  const headers = ['Company', 'Role', 'Status', 'Priority', 'Location', 'Remote', 'Salary', 'Source', 'Date Applied', 'Follow Up', 'AI Score', 'Notes']
  const rows = jobs.map(j => [
    j.company,
    j.role,
    j.status,
    j.priority,
    j.location ?? '',
    j.remote ? 'Yes' : j.hybrid ? 'Hybrid' : 'No',
    j.salary ?? j.salaryRaw ?? '',
    j.source ?? '',
    j.dateApplied ? format(new Date(j.dateApplied), 'yyyy-MM-dd') : '',
    j.followUpDate ? format(new Date(j.followUpDate), 'yyyy-MM-dd') : '',
    j.aiScore?.toString() ?? '',
    (j.notes ?? '').replace(/,/g, ';').replace(/\n/g, ' '),
  ])

  const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="jobtrack-export-${format(new Date(), 'yyyy-MM-dd')}.csv"`,
    },
  })
}
