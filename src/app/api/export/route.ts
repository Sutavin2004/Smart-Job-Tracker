import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'

export async function GET() {
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      interviews: { orderBy: { scheduledAt: 'asc' } },
      tasks: { where: { completed: false }, orderBy: { dueDate: 'asc' }, take: 1 },
      contacts: { take: 1, orderBy: { createdAt: 'desc' } },
    },
  })

  const headers = [
    'Company',
    'Role',
    'Status',
    'Priority',
    'Location',
    'Remote',
    'Salary',
    'Salary Min (k)',
    'Salary Max (k)',
    'Source',
    'Discovered By',
    'Date Applied',
    'Deadline',
    'Follow Up Date',
    'Last Contact',
    'AI Score',
    'AI Strengths',
    'AI Risks',
    'AI Next Steps',
    'Interview Count',
    'Next Interview',
    'Recruiter Name',
    'Recruiter Email',
    'Next Action',
    'Notes',
    'Tags',
    'Job URL',
    'Industry',
    'Tech Stack',
    'Cover Letter Generated',
    'Resume Version',
  ]

  function safe(v: unknown): string {
    if (v === null || v === undefined) return ''
    return String(v).replace(/,/g, ';').replace(/\n/g, ' ').replace(/"/g, "'")
  }

  const rows = jobs.map(j => {
    const nextInterview = j.interviews.find(iv => new Date(iv.scheduledAt) > new Date() && iv.outcome === 'scheduled')
    const nextTask = j.tasks[0]
    const primaryContact = j.contacts[0]

    const nextAction = nextInterview
      ? `Interview on ${format(new Date(nextInterview.scheduledAt), 'yyyy-MM-dd')}`
      : nextTask
      ? `Task: ${nextTask.title}${nextTask.dueDate ? ` (by ${format(new Date(nextTask.dueDate), 'yyyy-MM-dd')})` : ''}`
      : j.followUpDate && new Date(j.followUpDate) > new Date()
      ? `Follow up on ${format(new Date(j.followUpDate), 'yyyy-MM-dd')}`
      : ''

    return [
      safe(j.company),
      safe(j.role),
      safe(j.status),
      safe(j.priority),
      safe(j.location),
      j.remote ? 'Yes' : j.hybrid ? 'Hybrid' : 'No',
      safe(j.salary ?? j.salaryRaw),
      safe(j.salaryMin),
      safe(j.salaryMax),
      safe(j.source),
      safe(j.discoveredBy),
      j.dateApplied ? format(new Date(j.dateApplied), 'yyyy-MM-dd') : '',
      j.deadline ? format(new Date(j.deadline), 'yyyy-MM-dd') : '',
      j.followUpDate ? format(new Date(j.followUpDate), 'yyyy-MM-dd') : '',
      j.lastContactDate ? format(new Date(j.lastContactDate), 'yyyy-MM-dd') : '',
      safe(j.aiScore),
      safe(j.aiStrengths),
      safe(j.aiRisks),
      safe(j.aiNextSteps),
      String(j.interviews.length),
      nextInterview ? format(new Date(nextInterview.scheduledAt), 'yyyy-MM-dd HH:mm') : '',
      safe(j.recruiterName ?? primaryContact?.name),
      safe(j.recruiterEmail ?? primaryContact?.email),
      safe(nextAction),
      safe(j.notes),
      safe(j.tags),
      safe(j.jobUrl),
      safe(j.industry),
      safe(j.techStack ?? j.parsedTechStack),
      j.coverLetter ? 'Yes' : 'No',
      safe(j.resumeVersion),
    ]
  })

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="jobtrack-export-${format(new Date(), 'yyyy-MM-dd')}.csv"`,
    },
  })
}

export async function POST() {
  // JSON export of everything
  const [jobs, profile, templates] = await Promise.all([
    prisma.job.findMany({
      include: { interviews: true, activities: true, documents: true, contacts: true, tasks: true, salaryNegotiations: true, applicationQAs: true },
    }),
    prisma.userProfile.findFirst(),
    prisma.emailTemplate.findMany(),
  ])

  return NextResponse.json({ jobs, profile, templates, exportedAt: new Date().toISOString() })
}
