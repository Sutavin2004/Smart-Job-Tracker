import type { PrismaClient } from '@prisma/client'
import { hashPassword } from './password'
import { defaultTemplatesFor } from './default-templates'

/** Credentials for the shared demo account (only created by the seed: demo + CI, never production). */
import { DEMO_EMAIL, DEMO_PASSWORD } from './demo-credentials'
import { DEMO_RESUME, DEMO_KIT } from './demo-kit'
export { DEMO_EMAIL, DEMO_PASSWORD }

/**
 * Sample data: a student job-hunting in Toronto with ~10 applications across
 * every stage. Used by `npm run db:seed` locally and in CI, and to reset the
 * public demo each day. Wipes ALL users and data first: never run against a
 * database with real accounts.
 */
export async function seedDemoData(prisma: PrismaClient) {
  await prisma.user.deleteMany() // cascades to every user-owned row
  await prisma.authAttempt.deleteMany()

  const user = await prisma.user.create({
    data: { email: DEMO_EMAIL, name: 'Alex Chen', passwordHash: await hashPassword(DEMO_PASSWORD) },
  })

  await prisma.userProfile.create({
    data: {
      userId: user.id,
      name: 'Alex Chen',
      email: 'alex.chen@example.com',
      phone: '+1 (416) 555-0198',
      linkedin: 'https://linkedin.com/in/alexchen',
      github: 'https://github.com/alexchen',
      portfolio: 'https://alexchen.dev',
      currentTitle: 'Software Engineering Student',
      yearsExperience: 1,
      targetRoles: 'Software Engineer, Frontend Developer, Full Stack Developer, Junior Developer',
      skills: 'TypeScript, React, Next.js, Python, SQL, Git, Node.js, TailwindCSS',
      education: 'B.Sc. Computer Science, University of Toronto, 2025',
      bio: 'Computer Science student with strong frontend skills and growing backend experience. Built multiple full-stack projects. Passionate about clean UI and developer tooling.',
      jobSearchGoals: 'Looking for a challenging full-stack or frontend role at a growth-stage startup where I can own features end-to-end and ship fast.',
      targetLocations: 'Toronto, Vancouver, Remote',
      preferRemote: true,
      preferHybrid: true,
      targetSalaryMin: 65, // thousands
      targetSalaryMax: 95,
      currency: 'CAD',
      weeklyGoal: 5,
      defaultSource: 'LinkedIn',
      masterResume: DEMO_RESUME,
    },
  })

  const agentSession = await prisma.agentSession.create({
    data: {
      userId: user.id,
      status: 'completed',
      jobsFound: 8,
      jobsAdded: 3,
      jobsFiltered: 2,
      log: 'Starting\nSearching for: Software Engineer, Frontend Developer\nFound 8 jobs\nAdded Shopify, Frontend Engineer\nAdded Wealthsimple, Software Engineer\nAdded Notion, Full Stack Developer\nDone',
      completedAt: new Date(Date.now() - 2 * 3600 * 1000),
    },
  })

  const jobs = [
    {
      company: 'Shopify',
      role: 'Frontend Engineer',
      status: 'interviewing',
      priority: 'high',
      location: 'Toronto, ON',
      remote: true,
      hybrid: true,
      salary: '$80k - $105k CAD',
      salaryMin: 80,
      salaryMax: 105,
      source: 'LinkedIn',
      industry: 'E-commerce',
      techStack: 'React, TypeScript, Ruby on Rails, GraphQL',
      jobDescription: 'Join our frontend platform team building the next generation of merchant experiences. You will work on high-impact projects used by millions of merchants worldwide.',
      aiScore: 91,
      aiSuggestion: 'Excellent match — your TypeScript and React experience directly aligns. Emphasize your e-commerce project experience.',
      aiStrengths: JSON.stringify(['Strong React/TypeScript skills match', 'Remote-first culture fits your preference', 'High growth trajectory']),
      aiRisks: JSON.stringify(['Ruby experience not listed in your skills', 'Competitive candidate pool']),
      aiNextSteps: JSON.stringify(['Tailor resume to emphasize React performance optimization', 'Research Shopify merchant pain points', 'Practice system design for e-commerce scale']),
      excitement: 5,
      discoveredBy: 'agent',
      agentSessionId: agentSession.id,
      agentNotes: 'Excellent fit: React + TypeScript expertise, remote preference matches, fast growth trajectory',
      dateApplied: new Date(Date.now() - 8 * 24 * 3600 * 1000),
      followUpDate: new Date(Date.now() + 2 * 24 * 3600 * 1000),
    },
    {
      company: 'Wealthsimple',
      role: 'Software Engineer (New Grad)',
      status: 'applied',
      priority: 'high',
      location: 'Toronto, ON',
      remote: true,
      salary: '$70k - $90k CAD',
      salaryMin: 70,
      salaryMax: 90,
      source: 'LinkedIn',
      industry: 'Fintech',
      techStack: 'React, TypeScript, Python, PostgreSQL',
      jobDescription: "Work on Wealthsimple's core trading and investing platform. Build features that help Canadians grow their wealth.",
      aiScore: 84,
      aiSuggestion: 'Strong match for the new grad role. Highlight any personal finance or data-driven projects.',
      excitement: 4,
      discoveredBy: 'agent',
      agentSessionId: agentSession.id,
      agentNotes: 'New grad friendly, good tech stack match',
      dateApplied: new Date(Date.now() - 3 * 24 * 3600 * 1000),
      followUpDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
    },
    {
      company: 'Notion',
      role: 'Full Stack Developer',
      status: 'saved',
      priority: 'medium',
      location: 'Remote',
      remote: true,
      salary: '$85k - $120k USD',
      salaryMin: 85,
      salaryMax: 120,
      currency: 'USD',
      source: 'Indeed',
      industry: 'Productivity',
      techStack: 'React, TypeScript, Node.js, PostgreSQL, Redis',
      jobDescription: "Build features for Notion's collaborative workspace used by millions of teams. Work on real-time sync, performance, and new product areas. You have experience with React, TypeScript, Node.js and PostgreSQL; Redis is a plus.",
      aiScore: 78,
      aiSuggestion: 'Good match — strong on frontend. Brush up on real-time/collab systems before applying.',
      excitement: 5,
      discoveredBy: 'agent',
      agentSessionId: agentSession.id,
      dateApplied: new Date(Date.now() - 15 * 24 * 3600 * 1000),
    },
    {
      company: 'RBC',
      role: 'Software Developer (Co-op/New Grad)',
      status: 'applied',
      priority: 'medium',
      location: 'Toronto, ON',
      remote: false,
      hybrid: true,
      salary: '$65k - $75k CAD',
      salaryMin: 65,
      salaryMax: 75,
      source: 'Company Site',
      industry: 'Banking',
      techStack: 'Java, React, SQL, Spring Boot',
      jobDescription: 'Join RBC\'s digital banking team. Build and maintain customer-facing banking applications.',
      dateApplied: new Date(Date.now() - 12 * 24 * 3600 * 1000),
      followUpDate: new Date(Date.now() - 1 * 24 * 3600 * 1000),
    },
    {
      company: 'Ada',
      role: 'Junior Software Engineer',
      status: 'interviewing',
      priority: 'high',
      location: 'Toronto, ON',
      remote: true,
      salary: '$72k - $88k CAD',
      salaryMin: 72,
      salaryMax: 88,
      source: 'LinkedIn',
      industry: 'AI/SaaS',
      techStack: 'Python, React, TypeScript, AWS',
      jobDescription: 'Ada builds AI-powered customer service automation. Join the product engineering team to build chatbot experiences.',
      aiScore: 82,
      aiSuggestion: 'Great match for your Python and React combo. Their AI-first culture will accelerate your growth.',
      excitement: 4,
      dateApplied: new Date(Date.now() - 18 * 24 * 3600 * 1000),
    },
    {
      company: 'Airbnb',
      role: 'Software Engineer',
      status: 'rejected',
      priority: 'high',
      location: 'Remote',
      remote: true,
      salary: '$130k - $180k USD',
      salaryMin: 130,
      salaryMax: 180,
      currency: 'USD',
      source: 'LinkedIn',
      industry: 'Travel/Tech',
      techStack: 'React, Ruby, Java, MySQL',
      rejectionReason: 'Did not pass technical phone screen',
      dateApplied: new Date(Date.now() - 30 * 24 * 3600 * 1000),
    },
    {
      company: 'Stripe',
      role: 'Frontend Engineer',
      status: 'ghosted',
      priority: 'high',
      location: 'Remote',
      remote: true,
      salary: '$150k - $200k USD',
      salaryMin: 150,
      salaryMax: 200,
      currency: 'USD',
      source: 'Company Site',
      industry: 'Fintech',
      techStack: 'TypeScript, React, Node.js',
      dateApplied: new Date(Date.now() - 45 * 24 * 3600 * 1000),
      followUpDate: new Date(Date.now() - 20 * 24 * 3600 * 1000),
    },
    {
      company: 'Cohere',
      role: 'Software Engineer Intern → New Grad',
      status: 'offered',
      priority: 'high',
      location: 'Toronto, ON',
      remote: true,
      hybrid: true,
      salary: '$95k CAD',
      salaryMin: 95,
      salaryMax: 95,
      source: 'Referral',
      industry: 'AI/ML',
      techStack: 'Python, TypeScript, React, Kubernetes',
      jobDescription: 'Join Cohere to build the infrastructure and tooling powering next-generation AI models.',
      aiScore: 89,
      aiSuggestion: 'This is an exceptional opportunity. Cohere is one of the top AI companies — accept or negotiate strongly.',
      excitement: 5,
      offerAmount: '$95,000 CAD + equity',
      offerDeadline: new Date(Date.now() + 5 * 24 * 3600 * 1000),
      dateApplied: new Date(Date.now() - 35 * 24 * 3600 * 1000),
    },
    {
      company: 'Loblaws Digital',
      role: 'Junior Full Stack Developer',
      status: 'saved',
      priority: 'low',
      location: 'Toronto, ON',
      hybrid: true,
      salary: '$62k - $78k CAD',
      salaryMin: 62,
      salaryMax: 78,
      source: 'Indeed',
      industry: 'Retail/Tech',
      techStack: 'React, Java, Spring Boot',
      dateApplied: new Date(Date.now() - 5 * 24 * 3600 * 1000),
    },
    {
      company: 'Points.com',
      role: 'Software Developer',
      status: 'withdrawn',
      priority: 'low',
      location: 'Toronto, ON',
      source: 'LinkedIn',
      industry: 'Loyalty/Travel',
      dateApplied: new Date(Date.now() - 40 * 24 * 3600 * 1000),
    },
  ]

  for (const jobData of jobs) {
    const { dateApplied, followUpDate, offerDeadline, ...rest } = jobData as Record<string, unknown>
    const job = await prisma.job.create({
      data: {
        ...rest,
        userId: user.id,
        currency: (rest.currency as string) ?? 'CAD',
        dateApplied: new Date(dateApplied as string | Date),
        followUpDate: followUpDate ? new Date(followUpDate as string | Date) : null,
        offerDeadline: offerDeadline ? new Date(offerDeadline as string | Date) : null,
        activities: {
          create: {
            type: 'created',
            message: `Application created for ${rest.role} at ${rest.company}`,
          },
        },
      } as Parameters<typeof prisma.job.create>[0]['data'],
    })

    if (job.status === 'interviewing') {
      await prisma.interview.create({
        data: {
          jobId: job.id,
          type: 'phone',
          round: 1,
          scheduledAt: new Date(Date.now() + 3 * 24 * 3600 * 1000),
          duration: 30,
          platform: 'Zoom',
          outcome: 'scheduled',
          notes: 'Initial screening with HR',
        },
      })
      await prisma.activity.create({
        data: { jobId: job.id, type: 'interview_scheduled', message: 'Phone screen scheduled for next week' },
      })
    }

    if (job.status === 'offered') {
      await prisma.salaryNegotiation.create({
        data: {
          jobId: job.id,
          round: 1,
          theirOffer: '$95,000 CAD',
          myCounter: '$100,000 CAD',
          notes: 'Countered based on market data',
          outcome: 'pending',
        },
      })
      await prisma.activity.create({
        data: { jobId: job.id, type: 'status_change', message: 'Offer received: $95,000 CAD' },
      })
    }

    if (job.aiScore) {
      await prisma.activity.create({
        data: { jobId: job.id, type: 'ai_analyzed', message: `AI analysis: ${job.aiScore}/100 fit score` },
      })
    }

    // One prepared application, so the Ready to apply page has something to show.
    if (job.company === 'Notion') {
      await prisma.document.createMany({
        data: [
          { jobId: job.id, type: 'resume', name: 'Résumé for Notion', content: DEMO_KIT.resume, version: 'kit-demo', isActive: true },
          { jobId: job.id, type: 'cover_letter', name: 'Cover letter for Notion', content: DEMO_KIT.coverLetter, version: 'kit-demo', isActive: true },
          { jobId: job.id, type: 'kit_notes', name: 'Application notes', content: JSON.stringify({ notes: DEMO_KIT.notes, matchedKeywords: DEMO_KIT.matchedKeywords, missingKeywords: DEMO_KIT.missingKeywords }), version: 'kit-demo', isActive: true },
        ],
      })
      await prisma.applicationQA.createMany({ data: DEMO_KIT.answers.map(a => ({ jobId: job.id, ...a })) })
      await prisma.job.update({ where: { id: job.id }, data: { applicationPreparedAt: new Date(), coverLetter: DEMO_KIT.coverLetter } })
    }

    await prisma.task.create({
      data: {
        jobId: job.id,
        title: 'Tailor resume',
        priority: 'high',
        dueDate: new Date(Date.now() + 2 * 24 * 3600 * 1000),
      },
    })
  }

  await prisma.emailTemplate.createMany({ data: defaultTemplatesFor(user.id) })

}
