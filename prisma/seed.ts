import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Clear existing data
  await prisma.activity.deleteMany()
  await prisma.interview.deleteMany()
  await prisma.document.deleteMany()
  await prisma.job.deleteMany()

  const jobs = await Promise.all([
    prisma.job.create({
      data: {
        company: 'Stripe',
        role: 'Senior Software Engineer',
        status: 'interviewing',
        priority: 'high',
        jobUrl: 'https://stripe.com/jobs',
        location: 'Remote (US)',
        salary: '$180k–$240k',
        notes: 'Referred by John Smith. Focus on payments infrastructure.',
        dateApplied: new Date('2026-03-15'),
      },
    }),
    prisma.job.create({
      data: {
        company: 'Vercel',
        role: 'Frontend Engineer',
        status: 'applied',
        priority: 'high',
        jobUrl: 'https://vercel.com/careers',
        location: 'Remote',
        salary: '$140k–$180k',
        notes: 'Next.js team. Strong emphasis on DX.',
        dateApplied: new Date('2026-03-28'),
        deadline: new Date('2026-04-30'),
      },
    }),
    prisma.job.create({
      data: {
        company: 'Linear',
        role: 'Full Stack Engineer',
        status: 'offered',
        priority: 'high',
        location: 'Remote',
        salary: '$160k–$200k',
        notes: 'Received offer on April 5. Evaluating.',
        dateApplied: new Date('2026-03-01'),
      },
    }),
    prisma.job.create({
      data: {
        company: 'Figma',
        role: 'Software Engineer, Editor',
        status: 'rejected',
        priority: 'medium',
        location: 'San Francisco, CA',
        salary: '$160k–$220k',
        notes: 'Rejected after technical screen. Feedback: strong fundamentals but needed more graphics/rendering experience.',
        dateApplied: new Date('2026-02-20'),
      },
    }),
    prisma.job.create({
      data: {
        company: 'Planetscale',
        role: 'Developer Advocate',
        status: 'saved',
        priority: 'medium',
        jobUrl: 'https://planetscale.com/careers',
        location: 'Remote',
        salary: '$120k–$150k',
        notes: 'Interesting role. Need to research more about their database product.',
        dateApplied: new Date('2026-04-10'),
      },
    }),
    prisma.job.create({
      data: {
        company: 'Anthropic',
        role: 'Software Engineer, Product',
        status: 'applied',
        priority: 'high',
        location: 'San Francisco, CA',
        salary: '$200k–$280k',
        notes: 'Dream job. Applied through referral from former colleague.',
        dateApplied: new Date('2026-04-01'),
        deadline: new Date('2026-04-20'),
      },
    }),
    prisma.job.create({
      data: {
        company: 'Notion',
        role: 'React Engineer',
        status: 'interviewing',
        priority: 'medium',
        location: 'New York, NY',
        salary: '$150k–$190k',
        notes: 'Second round interview scheduled. Good culture fit.',
        dateApplied: new Date('2026-03-10'),
      },
    }),
    prisma.job.create({
      data: {
        company: 'Loom',
        role: 'Senior Frontend Engineer',
        status: 'saved',
        priority: 'low',
        location: 'Remote',
        salary: '$130k–$160k',
        dateApplied: new Date('2026-04-08'),
      },
    }),
  ])

  // Add interviews
  await prisma.interview.create({
    data: {
      jobId: jobs[0].id, // Stripe
      type: 'phone',
      scheduledAt: new Date('2026-03-25T14:00:00'),
      notes: 'Recruiter screen with Sarah',
      outcome: 'passed',
    },
  })
  await prisma.interview.create({
    data: {
      jobId: jobs[0].id, // Stripe
      type: 'technical',
      scheduledAt: new Date('2026-04-15T10:00:00'),
      notes: 'System design + coding round',
      outcome: 'pending',
    },
  })
  await prisma.interview.create({
    data: {
      jobId: jobs[6].id, // Notion
      type: 'behavioral',
      scheduledAt: new Date('2026-04-18T15:30:00'),
      notes: 'With engineering manager',
      outcome: 'pending',
    },
  })

  // Add activities
  const activityData = [
    { jobId: jobs[0].id, type: 'created', message: 'Application created for Senior Software Engineer at Stripe' },
    { jobId: jobs[0].id, type: 'status_change', message: 'Status changed from applied to interviewing' },
    { jobId: jobs[0].id, type: 'interview_scheduled', message: 'Phone interview scheduled' },
    { jobId: jobs[2].id, type: 'created', message: 'Application created for Full Stack Engineer at Linear' },
    { jobId: jobs[2].id, type: 'status_change', message: 'Status changed from interviewing to offered' },
    { jobId: jobs[3].id, type: 'status_change', message: 'Status changed from interviewing to rejected' },
  ]

  for (const act of activityData) {
    await prisma.activity.create({ data: act })
  }

  console.log('✅ Seed complete:', jobs.length, 'jobs created')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
