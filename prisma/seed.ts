import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Clear existing data
  await prisma.salaryNegotiation.deleteMany()
  await prisma.task.deleteMany()
  await prisma.contact.deleteMany()
  await prisma.activity.deleteMany()
  await prisma.document.deleteMany()
  await prisma.interview.deleteMany()
  await prisma.job.deleteMany()
  await prisma.userProfile.deleteMany()
  await prisma.emailTemplate.deleteMany()

  // ── User Profile ─────────────────────────────────────────────────────────────
  await prisma.userProfile.create({
    data: {
      name: 'Alex Johnson',
      email: 'alex@example.com',
      phone: '+1 (555) 123-4567',
      linkedin: 'https://linkedin.com/in/alexjohnson',
      github: 'https://github.com/alexjohnson',
      portfolio: 'https://alexjohnson.dev',
      currentTitle: 'Senior Frontend Engineer',
      yearsExperience: 5,
      targetRoles: 'Staff Engineer, Senior Software Engineer, Tech Lead',
      targetSalaryMin: 150000,
      targetSalaryMax: 220000,
      currency: 'CAD',
      skills: 'TypeScript, React, Next.js, Node.js, PostgreSQL, AWS, System Design',
      bio: 'Experienced full-stack engineer passionate about developer tools and infrastructure.',
      weeklyGoal: 5,
      defaultSource: 'LinkedIn',
      timezone: 'America/Toronto',
    },
  })

  // ── Email Templates ───────────────────────────────────────────────────────────
  await prisma.emailTemplate.createMany({
    data: [
      {
        name: 'Follow Up',
        subject: 'Following up on my application for {{role}} at {{company}}',
        body: `Hi {{recruiterName}},\n\nI wanted to follow up on my application for the {{role}} position at {{company}} that I submitted on {{dateApplied}}. I remain very excited about this opportunity.\n\nPlease let me know if you need any additional information.\n\nBest regards,\nAlex Johnson`,
        type: 'follow_up',
        isDefault: true,
        useCount: 3,
      },
      {
        name: 'Thank You',
        subject: 'Thank you — {{role}} interview at {{company}}',
        body: `Hi {{recruiterName}},\n\nThank you so much for taking the time to speak with me today about the {{role}} position at {{company}}. I really enjoyed learning more about the team's vision.\n\nI'm very excited about the opportunity and look forward to next steps.\n\nBest,\nAlex Johnson`,
        type: 'thank_you',
        isDefault: true,
        useCount: 1,
      },
      {
        name: 'Withdraw Application',
        subject: 'Withdrawing my application — {{role}} at {{company}}',
        body: `Hi {{recruiterName}},\n\nI'm writing to let you know that I'd like to withdraw my application for the {{role}} position at {{company}}. I've decided to pursue a different opportunity.\n\nThank you for your time and consideration.\n\nBest regards,\nAlex Johnson`,
        type: 'withdraw',
        isDefault: true,
        useCount: 0,
      },
      {
        name: 'Counter Offer',
        subject: 'Re: Offer for {{role}} at {{company}}',
        body: 'Hi {{recruiterName}},\n\nThank you so much for the offer to join {{company}} as {{role}}. I\'m genuinely excited about this opportunity.\n\nAfter careful consideration, I was hoping we could discuss the compensation. I was expecting something closer to {{targetSalary}}. Is there any flexibility?\n\nBest regards,\nAlex Johnson',
        type: 'counter_offer',
        isDefault: true,
        useCount: 0,
      },
      {
        name: 'Networking',
        subject: 'Quick question about {{company}}',
        body: `Hi {{contactName}},\n\nI came across your profile while researching {{company}} and was impressed by your work. I'm exploring senior engineering roles and would love to hear about your experience at {{company}}.\n\nWould you be open to a quick 15-minute chat?\n\nBest,\nAlex Johnson`,
        type: 'networking',
        isDefault: true,
        useCount: 2,
      },
    ],
  })

  // ── Jobs ──────────────────────────────────────────────────────────────────────
  const jobs = await Promise.all([
    // 0: Stripe — interviewing (high priority)
    prisma.job.create({
      data: {
        company: 'Stripe',
        role: 'Senior Software Engineer',
        status: 'interviewing',
        priority: 'high',
        excitement: 5,
        jobUrl: 'https://stripe.com/jobs',
        location: 'Remote (US)',
        remote: true,
        salary: '$180k–$240k',
        salaryMin: 180000,
        salaryMax: 240000,
        currency: 'USD',
        source: 'Referral',
        recruiterName: 'Sarah Chen',
        recruiterEmail: 'sarah.chen@stripe.com',
        techStack: 'Ruby, Go, TypeScript, React',
        industry: 'FinTech',
        companySize: 'Large (1000-5000)',
        notes: 'Referred by John Smith. Focus on payments infrastructure. System design round next week.',
        tags: 'fintech,payments,remote',
        dateApplied: new Date('2026-03-15'),
        pinned: true,
      },
    }),
    // 1: Vercel — applied (high priority)
    prisma.job.create({
      data: {
        company: 'Vercel',
        role: 'Frontend Engineer',
        status: 'applied',
        priority: 'high',
        excitement: 5,
        jobUrl: 'https://vercel.com/careers',
        location: 'Remote',
        remote: true,
        salary: '$140k–$180k',
        salaryMin: 140000,
        salaryMax: 180000,
        currency: 'USD',
        source: 'LinkedIn',
        techStack: 'Next.js, React, TypeScript, Edge Runtime',
        industry: 'Developer Tools',
        companySize: 'Small (50-200)',
        notes: "Next.js core team. Strong emphasis on DX and performance. Waiting for recruiter response.",
        tags: 'nextjs,frontend,remote,devtools',
        dateApplied: new Date('2026-03-28'),
        deadline: new Date('2026-04-30'),
        followUpDate: new Date('2026-04-14'),
      },
    }),
    // 2: Linear — offered (high priority)
    prisma.job.create({
      data: {
        company: 'Linear',
        role: 'Full Stack Engineer',
        status: 'offered',
        priority: 'high',
        excitement: 4,
        location: 'Remote',
        remote: true,
        salary: '$160k–$200k',
        salaryMin: 160000,
        salaryMax: 200000,
        currency: 'USD',
        source: 'Company Site',
        techStack: 'TypeScript, React, Node.js, PostgreSQL',
        industry: 'Productivity',
        companySize: 'Startup (<50)',
        notes: 'Received offer on April 5. Evaluating vs Stripe.',
        offerAmount: '$185k base + equity',
        offerDeadline: new Date('2026-04-20'),
        tags: 'productivity,saas,remote',
        dateApplied: new Date('2026-03-01'),
        pinned: true,
      },
    }),
    // 3: Figma — rejected (medium priority)
    prisma.job.create({
      data: {
        company: 'Figma',
        role: 'Software Engineer, Editor',
        status: 'rejected',
        priority: 'medium',
        excitement: 4,
        location: 'San Francisco, CA',
        salary: '$160k–$220k',
        salaryMin: 160000,
        salaryMax: 220000,
        currency: 'USD',
        source: 'LinkedIn',
        techStack: 'C++, TypeScript, WebAssembly',
        industry: 'Design Tools',
        companySize: 'Medium (200-1000)',
        notes: 'Rejected after technical screen. Feedback: strong fundamentals but needed more graphics/rendering experience.',
        rejectionReason: 'Missing graphics rendering experience',
        tags: 'design,graphics,frontend',
        dateApplied: new Date('2026-02-20'),
      },
    }),
    // 4: Planetscale — saved (medium priority)
    prisma.job.create({
      data: {
        company: 'PlanetScale',
        role: 'Developer Advocate',
        status: 'saved',
        priority: 'medium',
        excitement: 3,
        jobUrl: 'https://planetscale.com/careers',
        location: 'Remote',
        remote: true,
        salary: '$120k–$150k',
        salaryMin: 120000,
        salaryMax: 150000,
        currency: 'USD',
        source: 'Company Site',
        techStack: 'MySQL, Go, TypeScript',
        industry: 'Developer Tools',
        companySize: 'Startup (<50)',
        notes: 'Interesting role combining engineering and DevRel. Need to review their branching database product.',
        tags: 'devrel,database,remote',
        dateApplied: new Date('2026-04-10'),
      },
    }),
    // 5: Anthropic — applied (high priority)
    prisma.job.create({
      data: {
        company: 'Anthropic',
        role: 'Software Engineer, Product',
        status: 'applied',
        priority: 'high',
        excitement: 5,
        location: 'San Francisco, CA',
        salary: '$200k–$280k',
        salaryMin: 200000,
        salaryMax: 280000,
        currency: 'USD',
        source: 'Referral',
        techStack: 'Python, TypeScript, React, AWS',
        industry: 'AI / ML',
        companySize: 'Medium (200-1000)',
        notes: 'Dream company. Applied through referral from former colleague. Focus on Claude product features.',
        tags: 'ai,llm,python,dream',
        dateApplied: new Date('2026-04-01'),
        deadline: new Date('2026-04-20'),
        pinned: true,
      },
    }),
    // 6: Notion — interviewing (medium priority)
    prisma.job.create({
      data: {
        company: 'Notion',
        role: 'React Engineer',
        status: 'interviewing',
        priority: 'medium',
        excitement: 4,
        location: 'New York, NY',
        salary: '$150k–$190k',
        salaryMin: 150000,
        salaryMax: 190000,
        currency: 'USD',
        source: 'LinkedIn',
        techStack: 'React, TypeScript, Node.js, PostgreSQL',
        industry: 'Productivity',
        companySize: 'Medium (200-1000)',
        notes: 'Second round interview scheduled. Good culture fit. Strong React focus.',
        tags: 'productivity,react,newyork',
        dateApplied: new Date('2026-03-10'),
      },
    }),
    // 7: Loom — saved (low priority)
    prisma.job.create({
      data: {
        company: 'Loom',
        role: 'Senior Frontend Engineer',
        status: 'saved',
        priority: 'low',
        excitement: 2,
        location: 'Remote',
        remote: true,
        salary: '$130k–$160k',
        salaryMin: 130000,
        salaryMax: 160000,
        currency: 'USD',
        source: 'LinkedIn',
        techStack: 'React, TypeScript, WebRTC',
        industry: 'Video / Communication',
        companySize: 'Small (50-200)',
        notes: 'Interesting video tech stack. Lower priority for now.',
        tags: 'video,frontend,remote',
        dateApplied: new Date('2026-04-08'),
      },
    }),
    // 8: Shopify — ghosted (medium priority)
    prisma.job.create({
      data: {
        company: 'Shopify',
        role: 'Staff Engineer, Commerce',
        status: 'ghosted',
        priority: 'medium',
        excitement: 3,
        location: 'Remote (Canada)',
        remote: true,
        salary: '$170k–$210k CAD',
        salaryMin: 170000,
        salaryMax: 210000,
        currency: 'CAD',
        source: 'LinkedIn',
        techStack: 'Ruby on Rails, React, GraphQL',
        industry: 'E-Commerce',
        companySize: 'Enterprise (5000+)',
        notes: 'Applied 6 weeks ago. No response after initial application. Following up.',
        lastContactDate: new Date('2026-03-01'),
        tags: 'ecommerce,ruby,canada,remote',
        dateApplied: new Date('2026-03-01'),
      },
    }),
    // 9: GitHub — applied (high priority)
    prisma.job.create({
      data: {
        company: 'GitHub',
        role: 'Senior Software Engineer, Copilot',
        status: 'applied',
        priority: 'high',
        excitement: 5,
        location: 'Remote',
        remote: true,
        salary: '$175k–$225k',
        salaryMin: 175000,
        salaryMax: 225000,
        currency: 'USD',
        source: 'Company Site',
        techStack: 'TypeScript, Python, Go, LLMs',
        industry: 'Developer Tools',
        companySize: 'Enterprise (5000+)',
        notes: 'Copilot team building AI coding assistant. Perfect overlap with my skills.',
        tags: 'ai,developer-tools,microsoft,remote',
        dateApplied: new Date('2026-04-05'),
        followUpDate: new Date('2026-04-19'),
      },
    }),
    // 10: Supabase — saved (medium priority)
    prisma.job.create({
      data: {
        company: 'Supabase',
        role: 'TypeScript Engineer',
        status: 'saved',
        priority: 'medium',
        excitement: 4,
        jobUrl: 'https://supabase.com/careers',
        location: 'Remote',
        remote: true,
        salary: '$130k–$170k',
        salaryMin: 130000,
        salaryMax: 170000,
        currency: 'USD',
        source: 'GitHub Jobs',
        techStack: 'TypeScript, PostgreSQL, React, Deno',
        industry: 'Developer Tools',
        companySize: 'Startup (<50)',
        notes: 'Open source Firebase alternative. Love their product and culture.',
        tags: 'open-source,typescript,postgres,remote',
        dateApplied: new Date('2026-04-09'),
      },
    }),
    // 11: Cloudflare — applied (medium priority)
    prisma.job.create({
      data: {
        company: 'Cloudflare',
        role: 'Software Engineer, Workers',
        status: 'applied',
        priority: 'medium',
        excitement: 3,
        location: 'Remote (US)',
        remote: true,
        salary: '$155k–$195k',
        salaryMin: 155000,
        salaryMax: 195000,
        currency: 'USD',
        source: 'LinkedIn',
        techStack: 'Rust, TypeScript, V8, Edge Computing',
        industry: 'Infrastructure / CDN',
        companySize: 'Large (1000-5000)',
        notes: 'Serverless edge computing team. Need to brush up on Rust.',
        tags: 'edge,serverless,rust,infrastructure',
        dateApplied: new Date('2026-04-03'),
      },
    }),
    // 12: Discord — withdrawn (low priority)
    prisma.job.create({
      data: {
        company: 'Discord',
        role: 'Senior Frontend Engineer',
        status: 'withdrawn',
        priority: 'low',
        excitement: 2,
        location: 'San Francisco, CA',
        salary: '$150k–$190k',
        currency: 'USD',
        source: 'Glassdoor',
        techStack: 'React, TypeScript, Electron',
        industry: 'Communication',
        companySize: 'Large (1000-5000)',
        notes: 'Withdrew after receiving Linear offer. Not the right time.',
        tags: 'frontend,gaming,electron',
        dateApplied: new Date('2026-02-15'),
      },
    }),
    // 13: Tailscale — saved (medium priority)
    prisma.job.create({
      data: {
        company: 'Tailscale',
        role: 'Software Engineer',
        status: 'saved',
        priority: 'medium',
        excitement: 3,
        location: 'Remote (Canada)',
        remote: true,
        salary: '$140k–$175k CAD',
        salaryMin: 140000,
        salaryMax: 175000,
        currency: 'CAD',
        source: 'Company Site',
        techStack: 'Go, TypeScript, Networking',
        industry: 'Security / Networking',
        companySize: 'Startup (<50)',
        notes: 'Cool networking product. Canadian company. Need to look more into the role.',
        visaSponsorship: false,
        tags: 'networking,go,canada,remote',
        dateApplied: new Date('2026-04-11'),
      },
    }),
    // 14: Datadog — interviewing (medium priority)
    prisma.job.create({
      data: {
        company: 'Datadog',
        role: 'Frontend Engineer, Dashboards',
        status: 'interviewing',
        priority: 'medium',
        excitement: 3,
        location: 'New York, NY / Remote',
        hybrid: true,
        salary: '$145k–$185k',
        salaryMin: 145000,
        salaryMax: 185000,
        currency: 'USD',
        source: 'Recruiter',
        recruiterName: 'Mike Torres',
        recruiterEmail: 'mike.t@datadog.com',
        techStack: 'React, TypeScript, D3.js, Go',
        industry: 'Observability / Monitoring',
        companySize: 'Large (1000-5000)',
        notes: 'Recruiter reached out on LinkedIn. Data visualization focus. Phone screen went well.',
        tags: 'monitoring,dataviz,react,hybrid',
        dateApplied: new Date('2026-03-20'),
      },
    }),
  ])

  // ── Interviews ────────────────────────────────────────────────────────────────
  await prisma.interview.createMany({
    data: [
      {
        jobId: jobs[0].id, // Stripe
        round: 1,
        type: 'phone',
        scheduledAt: new Date('2026-03-25T14:00:00'),
        duration: 30,
        interviewers: 'Sarah Chen (Recruiter)',
        notes: 'Recruiter screen. Discussed background, salary expectations.',
        outcome: 'passed',
      },
      {
        jobId: jobs[0].id, // Stripe
        round: 2,
        type: 'technical',
        scheduledAt: new Date('2026-04-02T10:00:00'),
        duration: 60,
        interviewers: 'David Kim, Priya Patel',
        platform: 'CoderPad',
        notes: 'Data structures + algorithms. Solved 2/2 problems.',
        outcome: 'passed',
      },
      {
        jobId: jobs[0].id, // Stripe
        round: 3,
        type: 'system-design',
        scheduledAt: new Date('2026-04-18T15:00:00'),
        duration: 60,
        interviewers: 'Senior Eng + EM',
        platform: 'Zoom',
        notes: 'Design a payment processing system. Prep: distributed systems, consistency.',
        outcome: 'pending',
        prepNotes: 'Review: CAP theorem, Saga pattern, idempotency keys, event sourcing',
      },
      {
        jobId: jobs[6].id, // Notion
        round: 1,
        type: 'hr',
        scheduledAt: new Date('2026-03-18T11:00:00'),
        duration: 30,
        outcome: 'passed',
        notes: 'HR intro call. Culture fit discussion.',
      },
      {
        jobId: jobs[6].id, // Notion
        round: 2,
        type: 'behavioral',
        scheduledAt: new Date('2026-04-18T15:30:00'),
        duration: 45,
        interviewers: 'Engineering Manager',
        platform: 'Zoom',
        notes: 'STAR format answers. Focus on past projects and team collaboration.',
        outcome: 'pending',
        prepNotes: 'Prepare 3 STAR stories: leadership, conflict resolution, technical decision',
      },
      {
        jobId: jobs[14].id, // Datadog
        round: 1,
        type: 'phone',
        scheduledAt: new Date('2026-03-28T13:00:00'),
        duration: 30,
        interviewers: 'Mike Torres (Recruiter)',
        notes: 'Initial phone screen. Positive call.',
        outcome: 'passed',
      },
      {
        jobId: jobs[14].id, // Datadog
        round: 2,
        type: 'technical',
        scheduledAt: new Date('2026-04-10T14:00:00'),
        duration: 75,
        interviewers: 'Frontend Tech Lead',
        platform: 'CodeSandbox',
        notes: 'Built a mini dashboard with React + D3. Went well.',
        outcome: 'passed',
      },
    ],
  })

  // ── Contacts ──────────────────────────────────────────────────────────────────
  await prisma.contact.createMany({
    data: [
      {
        jobId: jobs[0].id,
        name: 'Sarah Chen',
        title: 'Technical Recruiter',
        email: 'sarah.chen@stripe.com',
        linkedin: 'https://linkedin.com/in/sarahchen',
        relationship: 'recruiter',
        notes: 'Very responsive. Reached out within 2 days.',
        lastContact: new Date('2026-04-02'),
      },
      {
        jobId: jobs[2].id,
        name: 'Marcus Williams',
        title: 'Engineering Manager',
        email: 'marcus@linear.app',
        relationship: 'hiring-manager',
        notes: 'Made the offer. Negotiation-friendly.',
        lastContact: new Date('2026-04-05'),
      },
      {
        jobId: jobs[5].id,
        name: 'Jordan Lee',
        title: 'Senior Engineer',
        email: 'jordan@anthropic.com',
        linkedin: 'https://linkedin.com/in/jordanlee',
        relationship: 'referral',
        notes: 'Former colleague who referred me.',
        lastContact: new Date('2026-04-01'),
      },
      {
        jobId: jobs[14].id,
        name: 'Mike Torres',
        title: 'Technical Recruiter',
        email: 'mike.t@datadog.com',
        phone: '+1 (415) 555-0198',
        relationship: 'recruiter',
        notes: 'Proactively reached out on LinkedIn.',
        lastContact: new Date('2026-04-10'),
      },
    ],
  })

  // ── Tasks ─────────────────────────────────────────────────────────────────────
  await prisma.task.createMany({
    data: [
      {
        jobId: jobs[0].id,
        title: 'Prepare system design presentation',
        description: 'Design a scalable payment processing system. Cover idempotency, retry logic, distributed tracing.',
        dueDate: new Date('2026-04-17'),
        priority: 'high',
        completed: false,
      },
      {
        jobId: jobs[0].id,
        title: 'Review Stripe API documentation',
        description: 'Understand their existing payment APIs before the system design interview.',
        priority: 'medium',
        completed: true,
        completedAt: new Date('2026-04-08'),
      },
      {
        jobId: jobs[1].id,
        title: 'Follow up with Vercel recruiter',
        description: 'No response after 2 weeks. Send a polite follow-up email.',
        dueDate: new Date('2026-04-14'),
        priority: 'medium',
        completed: false,
      },
      {
        jobId: jobs[2].id,
        title: 'Review Linear offer letter',
        description: 'Go through compensation, equity vesting, benefits. Compare with market rates.',
        dueDate: new Date('2026-04-18'),
        priority: 'high',
        completed: false,
      },
      {
        jobId: jobs[2].id,
        title: 'Research Linear equity terms',
        description: 'Understand cliff, vesting schedule, 409A valuation.',
        priority: 'high',
        completed: false,
      },
      {
        jobId: jobs[5].id,
        title: 'Prepare writing sample',
        description: 'Anthropic often asks for a technical writing sample. Write about a past architecture decision.',
        dueDate: new Date('2026-04-18'),
        priority: 'high',
        completed: false,
      },
      {
        jobId: jobs[6].id,
        title: 'Prepare STAR stories for Notion',
        description: 'Three stories: leading a project, resolving conflict, making a technical decision under pressure.',
        dueDate: new Date('2026-04-17'),
        priority: 'medium',
        completed: false,
      },
      {
        jobId: jobs[9].id,
        title: 'Follow up with GitHub application',
        description: 'Application submitted April 5. Follow up if no response by April 19.',
        dueDate: new Date('2026-04-19'),
        priority: 'medium',
        completed: false,
      },
    ],
  })

  // ── Activities ────────────────────────────────────────────────────────────────
  const activityData = [
    { jobId: jobs[0].id, type: 'created', message: 'Application created for Senior Software Engineer at Stripe' },
    { jobId: jobs[0].id, type: 'status_change', message: 'Status changed from applied to interviewing' },
    { jobId: jobs[0].id, type: 'interview_scheduled', message: 'Phone interview scheduled for round 1' },
    { jobId: jobs[0].id, type: 'interview_scheduled', message: 'Technical interview scheduled for round 2' },
    { jobId: jobs[0].id, type: 'interview_scheduled', message: 'System design interview scheduled for round 3' },
    { jobId: jobs[0].id, type: 'contact_added', message: 'Contact "Sarah Chen" added' },
    { jobId: jobs[1].id, type: 'created', message: 'Application created for Frontend Engineer at Vercel' },
    { jobId: jobs[2].id, type: 'created', message: 'Application created for Full Stack Engineer at Linear' },
    { jobId: jobs[2].id, type: 'status_change', message: 'Status changed from interviewing to offered' },
    { jobId: jobs[2].id, type: 'contact_added', message: 'Contact "Marcus Williams" added' },
    { jobId: jobs[3].id, type: 'status_change', message: 'Status changed from interviewing to rejected' },
    { jobId: jobs[3].id, type: 'note_added', message: 'Rejection feedback noted: needs more graphics/rendering experience' },
    { jobId: jobs[5].id, type: 'created', message: 'Application created for Software Engineer, Product at Anthropic' },
    { jobId: jobs[5].id, type: 'contact_added', message: 'Referral contact "Jordan Lee" added' },
    { jobId: jobs[6].id, type: 'status_change', message: 'Status changed from applied to interviewing' },
    { jobId: jobs[8].id, type: 'note_added', message: 'Marked as ghosted after 6 weeks with no response' },
    { jobId: jobs[12].id, type: 'status_change', message: 'Application withdrawn — pursuing other opportunities' },
    { jobId: jobs[14].id, type: 'interview_scheduled', message: 'Phone screen scheduled for round 1' },
    { jobId: jobs[14].id, type: 'interview_scheduled', message: 'Technical interview scheduled for round 2' },
  ]

  for (const act of activityData) {
    await prisma.activity.create({ data: act })
  }

  // ── Salary Negotiation (Linear offer) ─────────────────────────────────────────
  await prisma.salaryNegotiation.create({
    data: {
      jobId: jobs[2].id,
      round: 1,
      theirOffer: '$185,000 base + 0.05% equity',
      myCounter: '$200,000 base + 0.07% equity',
      notes: 'Citing competing offers from Stripe (interviewing) and GitHub (applied).',
      outcome: null,
      date: new Date('2026-04-07'),
    },
  })

  console.log(`✅ Seed complete: ${jobs.length} jobs, contacts, tasks, and activities created`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
