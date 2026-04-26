/**
 * Browser-local store — uses localStorage as the database.
 * This runs when no NEXT_PUBLIC_API_URL is configured (i.e. GitHub Pages).
 * When the Railway backend is added, api-client.ts routes calls there instead.
 */

import type {
  Job, Interview, Activity, Document, Contact, Task,
  SalaryNegotiation, UserProfile, EmailTemplate,
} from './types'

// ── helpers ──────────────────────────────────────────────────────────────────

function uid(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function now(): string {
  return new Date().toISOString()
}

// ── raw storage accessors ────────────────────────────────────────────────────

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function save<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(value))
}

const KEYS = {
  jobs: 'sjt_jobs',
  interviews: 'sjt_interviews',
  activities: 'sjt_activities',
  documents: 'sjt_documents',
  contacts: 'sjt_contacts',
  tasks: 'sjt_tasks',
  salaryNegotiations: 'sjt_salary_negotiations',
  userProfile: 'sjt_user_profile',
  emailTemplates: 'sjt_email_templates',
}

// ── typed accessors ──────────────────────────────────────────────────────────

const db = {
  jobs: {
    all: () => load<Job[]>(KEYS.jobs, []),
    set: (rows: Job[]) => save(KEYS.jobs, rows),
  },
  interviews: {
    all: () => load<Interview[]>(KEYS.interviews, []),
    set: (rows: Interview[]) => save(KEYS.interviews, rows),
  },
  activities: {
    all: () => load<Activity[]>(KEYS.activities, []),
    set: (rows: Activity[]) => save(KEYS.activities, rows),
  },
  documents: {
    all: () => load<Document[]>(KEYS.documents, []),
    set: (rows: Document[]) => save(KEYS.documents, rows),
  },
  contacts: {
    all: () => load<Contact[]>(KEYS.contacts, []),
    set: (rows: Contact[]) => save(KEYS.contacts, rows),
  },
  tasks: {
    all: () => load<Task[]>(KEYS.tasks, []),
    set: (rows: Task[]) => save(KEYS.tasks, rows),
  },
  salaryNegotiations: {
    all: () => load<SalaryNegotiation[]>(KEYS.salaryNegotiations, []),
    set: (rows: SalaryNegotiation[]) => save(KEYS.salaryNegotiations, rows),
  },
  userProfile: {
    get: () => load<UserProfile | null>(KEYS.userProfile, null),
    set: (profile: UserProfile) => save(KEYS.userProfile, profile),
  },
  emailTemplates: {
    all: () => load<EmailTemplate[]>(KEYS.emailTemplates, []),
    set: (rows: EmailTemplate[]) => save(KEYS.emailTemplates, rows),
  },
}

// ── activity helper ──────────────────────────────────────────────────────────

function addActivity(jobId: string, type: string, message: string, metadata?: string) {
  const acts = db.activities.all()
  acts.unshift({ id: uid(), jobId, type, message, metadata: metadata ?? null, createdAt: now() })
  db.activities.set(acts.slice(0, 500))
}

// ── default email templates ──────────────────────────────────────────────────

const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tpl_followup',
    name: 'Follow Up',
    subject: 'Following up on my application for {{role}} at {{company}}',
    body: `Hi {{recruiterName}},\n\nI wanted to follow up on my application for the {{role}} position at {{company}} that I submitted on {{dateApplied}}. I remain very excited about this opportunity and would love to discuss how my experience aligns with your team's needs.\n\nPlease let me know if you need any additional information from my end.\n\nBest regards,\n{{yourName}}`,
    type: 'follow_up',
    isDefault: true,
    useCount: 0,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'tpl_thankyou',
    name: 'Thank You',
    subject: 'Thank you — {{role}} interview at {{company}}',
    body: `Hi {{interviewerName}},\n\nThank you so much for taking the time to speak with me today about the {{role}} position at {{company}}. I really enjoyed our conversation and learning more about the team's vision.\n\nI'm very excited about the opportunity and believe my background in {{skills}} would be a great fit.\n\nLooking forward to hearing about the next steps.\n\nBest,\n{{yourName}}`,
    type: 'thank_you',
    isDefault: true,
    useCount: 0,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'tpl_withdraw',
    name: 'Withdraw Application',
    subject: 'Withdrawing my application — {{role}} at {{company}}',
    body: `Hi {{recruiterName}},\n\nI hope this message finds you well. I'm writing to let you know that I'd like to withdraw my application for the {{role}} position at {{company}}.\n\nThis was a difficult decision, as I have great respect for {{company}} and the team. However, I've decided to pursue a different direction at this time.\n\nThank you for the time and consideration you've given my application. I hope our paths cross again in the future.\n\nBest regards,\n{{yourName}}`,
    type: 'withdraw',
    isDefault: true,
    useCount: 0,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'tpl_counter',
    name: 'Counter Offer',
    subject: 'Re: Offer for {{role}} at {{company}}',
    body: `Hi {{recruiterName}},\n\nThank you so much for the offer to join {{company}} as {{role}}. I'm genuinely excited about this opportunity and the team.\n\nAfter careful consideration of my experience and market research, I was hoping we could discuss the compensation package. I was expecting something closer to {{targetSalary}}. Is there flexibility to meet somewhere in between?\n\nI'm eager to make this work and join the team. Please let me know your thoughts.\n\nBest regards,\n{{yourName}}`,
    type: 'counter_offer',
    isDefault: true,
    useCount: 0,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'tpl_networking',
    name: 'Networking Outreach',
    subject: 'Quick question about {{company}}',
    body: `Hi {{contactName}},\n\nI hope you don't mind the outreach — I came across your profile while researching {{company}} and was really impressed by your work in {{theirArea}}.\n\nI'm currently exploring opportunities in {{myField}} and would love to learn more about your experience at {{company}}. Would you be open to a quick 15-minute chat sometime?\n\nNo worries if you're too busy — I appreciate your time regardless.\n\nBest,\n{{yourName}}`,
    type: 'networking',
    isDefault: true,
    useCount: 0,
    createdAt: now(),
    updatedAt: now(),
  },
]

// ── hydration ─────────────────────────────────────────────────────────────────

function hydrateJob(job: Job): Job {
  const interviews = db.interviews.all().filter(iv => iv.jobId === job.id)
  const activities = db.activities.all().filter(a => a.jobId === job.id).slice(0, 20)
  const documents = db.documents.all().filter(d => d.jobId === job.id)
  const contacts = db.contacts.all().filter(c => c.jobId === job.id)
  const tasks = db.tasks.all().filter(t => t.jobId === job.id)
  const salaryNegotiations = db.salaryNegotiations.all().filter(s => s.jobId === job.id)
  return { ...job, interviews, activities, documents, contacts, tasks, salaryNegotiations }
}

// ── localStore ────────────────────────────────────────────────────────────────

export const localStore = {
  // ── jobs ────────────────────────────────────────────────────────────────────

  getJobs(params?: {
    search?: string
    status?: string
    priority?: string
    pinned?: boolean
    archived?: boolean
    tags?: string
  }): Job[] {
    let jobs = db.jobs.all()

    if (!params?.archived) jobs = jobs.filter(j => !j.archived)
    if (params?.pinned) jobs = jobs.filter(j => j.pinned)
    if (params?.status && params.status !== 'all') {
      jobs = jobs.filter(j => j.status === params.status)
    }
    if (params?.priority && params.priority !== 'all') {
      jobs = jobs.filter(j => j.priority === params.priority)
    }
    if (params?.tags) {
      const tag = params.tags.toLowerCase()
      jobs = jobs.filter(j => (j.tags ?? '').toLowerCase().includes(tag))
    }
    if (params?.search) {
      const q = params.search.toLowerCase()
      jobs = jobs.filter(j =>
        j.company.toLowerCase().includes(q) ||
        j.role.toLowerCase().includes(q) ||
        (j.location ?? '').toLowerCase().includes(q) ||
        (j.tags ?? '').toLowerCase().includes(q)
      )
    }

    return jobs
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })
      .map(hydrateJob)
  },

  getJob(id: string): Job | null {
    const job = db.jobs.all().find(j => j.id === id)
    return job ? hydrateJob(job) : null
  },

  createJob(data: Partial<Job>): Job {
    const t = now()
    const job: Job = {
      id: uid(),
      company: data.company ?? '',
      role: data.role ?? '',
      status: data.status ?? 'saved',
      priority: data.priority ?? 'medium',
      excitement: data.excitement ?? null,
      jobUrl: data.jobUrl ?? null,
      jobDescription: data.jobDescription ?? null,
      salary: data.salary ?? null,
      salaryMin: data.salaryMin ?? null,
      salaryMax: data.salaryMax ?? null,
      currency: data.currency ?? 'CAD',
      location: data.location ?? null,
      remote: data.remote ?? false,
      hybrid: data.hybrid ?? false,
      notes: data.notes ?? null,
      aiSuggestion: null,
      aiScore: null,
      aiStrengths: null,
      aiRisks: null,
      aiNextSteps: null,
      aiKeySkills: null,
      aiSalaryInsight: null,
      aiCultureFit: null,
      aiLastAnalyzed: null,
      coverLetter: data.coverLetter ?? null,
      resumeVersion: data.resumeVersion ?? null,
      source: data.source ?? null,
      referralContact: data.referralContact ?? null,
      recruiterName: data.recruiterName ?? null,
      recruiterEmail: data.recruiterEmail ?? null,
      recruiterPhone: data.recruiterPhone ?? null,
      companySize: data.companySize ?? null,
      companyStage: data.companyStage ?? null,
      industry: data.industry ?? null,
      techStack: data.techStack ?? null,
      parsedKeywords: data.parsedKeywords ?? null,
      parsedTechStack: data.parsedTechStack ?? null,
      benefits: data.benefits ?? null,
      visaSponsorship: data.visaSponsorship ?? false,
      color: data.color ?? null,
      salaryRaw: data.salaryRaw ?? null,
      discoveredBy: data.discoveredBy ?? null,
      agentSessionId: data.agentSessionId ?? null,
      agentNotes: data.agentNotes ?? null,
      dateApplied: data.dateApplied ?? t,
      deadline: data.deadline ?? null,
      followUpDate: data.followUpDate ?? null,
      lastContactDate: data.lastContactDate ?? null,
      offerDeadline: data.offerDeadline ?? null,
      offerAmount: data.offerAmount ?? null,
      rejectionReason: data.rejectionReason ?? null,
      pinned: data.pinned ?? false,
      archived: data.archived ?? false,
      tags: data.tags ?? null,
      createdAt: t,
      updatedAt: t,
    }
    const jobs = db.jobs.all()
    jobs.unshift(job)
    db.jobs.set(jobs)
    addActivity(job.id, 'created', `Application created for ${job.role} at ${job.company}`)
    return hydrateJob(job)
  },

  updateJob(id: string, data: Partial<Job>): Job {
    const jobs = db.jobs.all()
    const idx = jobs.findIndex(j => j.id === id)
    if (idx === -1) throw new Error('Job not found')

    const prev = jobs[idx]
    if (data.status && data.status !== prev.status) {
      addActivity(id, 'status_change', `Status changed from ${prev.status} to ${data.status}`)
    }
    if (data.notes && data.notes !== prev.notes) {
      addActivity(id, 'note_added', 'Notes updated')
    }

    jobs[idx] = { ...prev, ...data, id, updatedAt: now() }
    db.jobs.set(jobs)
    return hydrateJob(jobs[idx])
  },

  deleteJob(id: string): void {
    db.jobs.set(db.jobs.all().filter(j => j.id !== id))
    db.interviews.set(db.interviews.all().filter(iv => iv.jobId !== id))
    db.activities.set(db.activities.all().filter(a => a.jobId !== id))
    db.documents.set(db.documents.all().filter(d => d.jobId !== id))
    db.contacts.set(db.contacts.all().filter(c => c.jobId !== id))
    db.tasks.set(db.tasks.all().filter(t => t.jobId !== id))
    db.salaryNegotiations.set(db.salaryNegotiations.all().filter(s => s.jobId !== id))
  },

  togglePin(id: string): Job {
    const job = db.jobs.all().find(j => j.id === id)
    if (!job) throw new Error('Job not found')
    return localStore.updateJob(id, { pinned: !job.pinned })
  },

  toggleArchive(id: string): Job {
    const job = db.jobs.all().find(j => j.id === id)
    if (!job) throw new Error('Job not found')
    return localStore.updateJob(id, { archived: !job.archived })
  },

  bulkUpdateStatus(ids: string[], status: Job['status']): void {
    const jobs = db.jobs.all()
    const t = now()
    ids.forEach(id => {
      const idx = jobs.findIndex(j => j.id === id)
      if (idx !== -1) {
        const prev = jobs[idx]
        if (prev.status !== status) {
          addActivity(id, 'status_change', `Status changed from ${prev.status} to ${status}`)
          jobs[idx] = { ...prev, status, updatedAt: t }
        }
      }
    })
    db.jobs.set(jobs)
  },

  bulkDelete(ids: string[]): void {
    ids.forEach(id => localStore.deleteJob(id))
  },

  // ── stats ──────────────────────────────────────────────────────────────────

  getStats(): Record<string, unknown> {
    const jobs = db.jobs.all().filter(j => !j.archived)
    const counts = {
      total: jobs.length,
      saved: jobs.filter(j => j.status === 'saved').length,
      applied: jobs.filter(j => j.status === 'applied').length,
      interviewing: jobs.filter(j => j.status === 'interviewing').length,
      offered: jobs.filter(j => j.status === 'offered').length,
      rejected: jobs.filter(j => j.status === 'rejected').length,
      ghosted: jobs.filter(j => j.status === 'ghosted').length,
      withdrawn: jobs.filter(j => j.status === 'withdrawn').length,
    }

    const monthly: { month: string; count: number }[] = []
    const today = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      const count = jobs.filter(j => {
        const jd = new Date(j.dateApplied)
        return jd.getFullYear() === d.getFullYear() && jd.getMonth() === d.getMonth()
      }).length
      monthly.push({ month: label, count })
    }

    const responded = counts.applied + counts.interviewing + counts.offered + counts.rejected
    return {
      ...counts,
      responseRate: counts.total > 0 ? Math.round((responded / counts.total) * 100) : 0,
      interviewRate: responded > 0 ? Math.round(((counts.interviewing + counts.offered) / responded) * 100) : 0,
      monthly,
    }
  },

  // ── activities ─────────────────────────────────────────────────────────────

  getActivities(limit = 20): Activity[] {
    const jobs = db.jobs.all()
    return db.activities.all()
      .slice(0, limit)
      .map(a => ({
        ...a,
        job: jobs.find(j => j.id === a.jobId)
          ? { company: jobs.find(j => j.id === a.jobId)!.company, role: jobs.find(j => j.id === a.jobId)!.role }
          : null,
      }))
  },

  addNote(jobId: string, note: string): Activity {
    const act: Activity = { id: uid(), jobId, type: 'note_added', message: note, metadata: null, createdAt: now() }
    const acts = db.activities.all()
    acts.unshift(act)
    db.activities.set(acts)
    return act
  },

  // ── interviews ─────────────────────────────────────────────────────────────

  createInterview(jobId: string, data: Partial<Interview>): Interview {
    const t = now()
    const iv: Interview = {
      id: uid(),
      jobId,
      round: data.round ?? 1,
      type: data.type ?? 'phone',
      scheduledAt: data.scheduledAt ?? t,
      duration: data.duration ?? null,
      interviewers: data.interviewers ?? null,
      platform: data.platform ?? null,
      location: data.location ?? null,
      notes: data.notes ?? null,
      prepNotes: data.prepNotes ?? null,
      questionsAsked: data.questionsAsked ?? null,
      myQuestions: data.myQuestions ?? null,
      outcome: data.outcome ?? 'scheduled',
      feedbackReceived: data.feedbackReceived ?? null,
      createdAt: t,
    }
    const interviews = db.interviews.all()
    interviews.push(iv)
    db.interviews.set(interviews)
    addActivity(jobId, 'interview_scheduled', `${iv.type.charAt(0).toUpperCase() + iv.type.slice(1)} interview scheduled for round ${iv.round}`)

    const jobs = db.jobs.all()
    const jobIdx = jobs.findIndex(j => j.id === jobId)
    if (jobIdx !== -1 && (jobs[jobIdx].status === 'applied' || jobs[jobIdx].status === 'saved')) {
      jobs[jobIdx] = { ...jobs[jobIdx], status: 'interviewing', updatedAt: now() }
      db.jobs.set(jobs)
    }
    return iv
  },

  updateInterview(interviewId: string, data: Partial<Interview>): Interview {
    const interviews = db.interviews.all()
    const idx = interviews.findIndex(iv => iv.id === interviewId)
    if (idx === -1) throw new Error('Interview not found')
    interviews[idx] = { ...interviews[idx], ...data }
    db.interviews.set(interviews)
    return interviews[idx]
  },

  deleteInterview(interviewId: string): void {
    db.interviews.set(db.interviews.all().filter(iv => iv.id !== interviewId))
  },

  // ── documents ──────────────────────────────────────────────────────────────

  createDocument(jobId: string, data: { name: string; type: string; content: string; version?: string }): Document {
    const doc: Document = {
      id: uid(),
      jobId,
      name: data.name,
      type: data.type,
      content: data.content,
      version: data.version ?? null,
      isActive: true,
      createdAt: now(),
    }
    const docs = db.documents.all()
    docs.unshift(doc)
    db.documents.set(docs)
    addActivity(jobId, 'document_added', `Document "${data.name}" added`)
    return doc
  },

  updateDocument(docId: string, data: Partial<Document>): Document {
    const docs = db.documents.all()
    const idx = docs.findIndex(d => d.id === docId)
    if (idx === -1) throw new Error('Document not found')
    docs[idx] = { ...docs[idx], ...data }
    db.documents.set(docs)
    return docs[idx]
  },

  deleteDocument(docId: string): void {
    db.documents.set(db.documents.all().filter(d => d.id !== docId))
  },

  // ── contacts ───────────────────────────────────────────────────────────────

  createContact(jobId: string, data: Partial<Contact>): Contact {
    const contact: Contact = {
      id: uid(),
      jobId,
      name: data.name ?? '',
      title: data.title ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      linkedin: data.linkedin ?? null,
      relationship: data.relationship ?? 'other',
      notes: data.notes ?? null,
      lastContact: data.lastContact ?? null,
      createdAt: now(),
    }
    const contacts = db.contacts.all()
    contacts.push(contact)
    db.contacts.set(contacts)
    addActivity(jobId, 'contact_added', `Contact "${contact.name}" added`)
    return contact
  },

  updateContact(contactId: string, data: Partial<Contact>): Contact {
    const contacts = db.contacts.all()
    const idx = contacts.findIndex(c => c.id === contactId)
    if (idx === -1) throw new Error('Contact not found')
    contacts[idx] = { ...contacts[idx], ...data }
    db.contacts.set(contacts)
    return contacts[idx]
  },

  deleteContact(contactId: string): void {
    db.contacts.set(db.contacts.all().filter(c => c.id !== contactId))
  },

  // ── tasks ──────────────────────────────────────────────────────────────────

  getAllTasks(): Task[] {
    const jobs = db.jobs.all()
    return db.tasks.all().map(t => ({
      ...t,
      job: jobs.find(j => j.id === t.jobId)
        ? { company: jobs.find(j => j.id === t.jobId)!.company, role: jobs.find(j => j.id === t.jobId)!.role }
        : undefined,
    }))
  },

  createTask(jobId: string, data: Partial<Task>): Task {
    const task: Task = {
      id: uid(),
      jobId,
      title: data.title ?? '',
      description: data.description ?? null,
      dueDate: data.dueDate ?? null,
      completed: false,
      completedAt: null,
      priority: data.priority ?? 'medium',
      createdAt: now(),
    }
    const tasks = db.tasks.all()
    tasks.push(task)
    db.tasks.set(tasks)
    addActivity(jobId, 'task_added', `Task "${task.title}" added`)
    return task
  },

  updateTask(taskId: string, data: Partial<Task>): Task {
    const tasks = db.tasks.all()
    const idx = tasks.findIndex(t => t.id === taskId)
    if (idx === -1) throw new Error('Task not found')
    const wasCompleted = tasks[idx].completed
    tasks[idx] = {
      ...tasks[idx],
      ...data,
      completedAt: data.completed && !wasCompleted ? now() : (data.completed === false ? null : tasks[idx].completedAt),
    }
    db.tasks.set(tasks)
    return tasks[idx]
  },

  deleteTask(taskId: string): void {
    db.tasks.set(db.tasks.all().filter(t => t.id !== taskId))
  },

  // ── salary negotiations ────────────────────────────────────────────────────

  createSalaryNegotiation(jobId: string, data: Partial<SalaryNegotiation>): SalaryNegotiation {
    const existing = db.salaryNegotiations.all().filter(s => s.jobId === jobId)
    const neg: SalaryNegotiation = {
      id: uid(),
      jobId,
      round: existing.length + 1,
      theirOffer: data.theirOffer ?? null,
      myCounter: data.myCounter ?? null,
      notes: data.notes ?? null,
      outcome: data.outcome ?? null,
      date: data.date ?? now(),
    }
    const negs = db.salaryNegotiations.all()
    negs.push(neg)
    db.salaryNegotiations.set(negs)
    return neg
  },

  updateSalaryNegotiation(negId: string, data: Partial<SalaryNegotiation>): SalaryNegotiation {
    const negs = db.salaryNegotiations.all()
    const idx = negs.findIndex(n => n.id === negId)
    if (idx === -1) throw new Error('Negotiation not found')
    negs[idx] = { ...negs[idx], ...data }
    db.salaryNegotiations.set(negs)
    return negs[idx]
  },

  deleteSalaryNegotiation(negId: string): void {
    db.salaryNegotiations.set(db.salaryNegotiations.all().filter(n => n.id !== negId))
  },

  // ── user profile ───────────────────────────────────────────────────────────

  getUserProfile(): UserProfile {
    return db.userProfile.get() ?? {
      id: 'profile',
      name: '',
      email: '',
      phone: '',
      linkedin: '',
      github: '',
      portfolio: '',
      currentTitle: '',
      yearsExperience: 0,
      targetRoles: '',
      targetSalaryMin: 0,
      targetSalaryMax: 0,
      currency: 'CAD',
      skills: '',
      education: '',
      bio: '',
      masterResume: '',
      jobSearchGoals: '',
      preferRemote: false,
      preferHybrid: true,
      targetLocations: '',
      excludeKeywords: '',
      weeklyGoal: 5,
      defaultSource: 'LinkedIn',
      timezone: 'America/Toronto',
    }
  },

  updateUserProfile(data: Partial<UserProfile>): UserProfile {
    const existing = localStore.getUserProfile()
    const updated: UserProfile = { ...existing, ...data }
    db.userProfile.set(updated)
    return updated
  },

  // ── email templates ────────────────────────────────────────────────────────

  getEmailTemplates(): EmailTemplate[] {
    const stored = db.emailTemplates.all()
    if (stored.length === 0) {
      db.emailTemplates.set(DEFAULT_TEMPLATES)
      return DEFAULT_TEMPLATES
    }
    return stored
  },

  createEmailTemplate(data: Partial<EmailTemplate>): EmailTemplate {
    const tpl: EmailTemplate = {
      id: uid(),
      name: data.name ?? 'New Template',
      subject: data.subject ?? '',
      body: data.body ?? '',
      type: data.type ?? 'follow_up',
      isDefault: false,
      useCount: 0,
      createdAt: now(),
      updatedAt: now(),
    }
    const templates = localStore.getEmailTemplates()
    templates.push(tpl)
    db.emailTemplates.set(templates)
    return tpl
  },

  updateEmailTemplate(tplId: string, data: Partial<EmailTemplate>): EmailTemplate {
    const templates = localStore.getEmailTemplates()
    const idx = templates.findIndex(t => t.id === tplId)
    if (idx === -1) throw new Error('Template not found')
    templates[idx] = { ...templates[idx], ...data, updatedAt: now() }
    db.emailTemplates.set(templates)
    return templates[idx]
  },

  deleteEmailTemplate(tplId: string): void {
    const templates = localStore.getEmailTemplates()
    db.emailTemplates.set(templates.filter(t => t.id !== tplId))
  },

  incrementTemplateUseCount(tplId: string): void {
    const templates = localStore.getEmailTemplates()
    const idx = templates.findIndex(t => t.id === tplId)
    if (idx !== -1) {
      templates[idx] = { ...templates[idx], useCount: templates[idx].useCount + 1, updatedAt: now() }
      db.emailTemplates.set(templates)
    }
  },

  // ── AI placeholders ────────────────────────────────────────────────────────

  analyzeJob(id: string): Job {
    const job = localStore.updateJob(id, {
      aiScore: 72,
      aiStrengths: 'Strong technical match • Good company culture fit • Location aligned',
      aiRisks: 'Competitive role • May require relocation',
      aiNextSteps: 'Follow up in 1 week • Prepare system design examples • Research company tech stack',
      aiSuggestion: 'Connect a Railway backend with your ANTHROPIC_API_KEY for real AI analysis. This is a placeholder showing what you\'ll get: a fit score, strengths, risks, and personalized next steps based on the job description and your profile.',
    })
    addActivity(id, 'ai_analyzed', 'AI analysis generated')
    return job
  },

  generateCoverLetter(id: string): { coverLetter: string } {
    const job = localStore.getJob(id)
    const text = job
      ? `Dear Hiring Manager,\n\nI am writing to express my strong interest in the ${job.role} position at ${job.company}.\n\n[Connect a Railway backend with your ANTHROPIC_API_KEY to generate a personalised cover letter tailored to this specific role and your profile.]\n\nIn the meantime, you can edit this placeholder and save it as your draft.\n\nSincerely,\n[Your Name]`
      : 'Add your Railway backend + ANTHROPIC_API_KEY to generate AI cover letters.'
    if (job) {
      localStore.updateJob(id, { coverLetter: text })
      addActivity(id, 'document_added', 'Cover letter draft created')
    }
    return { coverLetter: text }
  },

  generateInterviewPrep(_id: string, interviewType?: string): { prep: string } {
    const type = (interviewType ?? 'General').charAt(0).toUpperCase() + (interviewType ?? 'General').slice(1)
    return {
      prep: `## ${type} Interview Prep\n\n_Connect a Railway backend with ANTHROPIC_API_KEY for AI-generated questions tailored to this role._\n\n### General Tips\n1. Research the company mission, products, and recent news\n2. Prepare STAR-format answers (Situation, Task, Action, Result)\n3. Have 2–3 thoughtful questions ready for the interviewer\n4. Review the job description and map your experience to key requirements\n5. Practice your "tell me about yourself" (aim for ~2 minutes)`,
    }
  },

  generateEmail(jobId: string, templateId: string): { subject: string; body: string } {
    const job = localStore.getJob(jobId)
    const templates = localStore.getEmailTemplates()
    const template = templates.find(t => t.id === templateId)

    if (!template || !job) {
      return { subject: 'Follow up on my application', body: 'Connect a backend + ANTHROPIC_API_KEY for AI email drafting.' }
    }

    localStore.incrementTemplateUseCount(templateId)
    addActivity(jobId, 'email', `Email drafted using template "${template.name}"`)

    const replace = (text: string) =>
      text
        .replace(/\{\{role\}\}/g, job.role)
        .replace(/\{\{company\}\}/g, job.company)
        .replace(/\{\{recruiterName\}\}/g, job.recruiterName ?? 'Hiring Team')
        .replace(/\{\{dateApplied\}\}/g, new Date(job.dateApplied).toLocaleDateString())

    return { subject: replace(template.subject), body: replace(template.body) }
  },

  generateSalaryAdvice(id: string): { advice: string } {
    const job = localStore.getJob(id)
    return {
      advice: job
        ? `## Salary Negotiation Advice for ${job.role} at ${job.company}\n\n_Connect a Railway backend with ANTHROPIC_API_KEY for AI-powered salary advice._\n\n### General Tips\n1. Research market rates on Glassdoor, Levels.fyi, and LinkedIn Salary\n2. Know your BATNA (Best Alternative to a Negotiated Agreement)\n3. Let them make the first offer if possible\n4. Negotiate the full package: base, bonus, equity, PTO, remote\n5. Always negotiate — 85% of employers expect it`
        : 'Job not found.',
    }
  },

  // ── analytics ─────────────────────────────────────────────────────────────

  getActivityHeatmap(): { date: string; count: number }[] {
    const jobs = db.jobs.all()
    const counts: Record<string, number> = {}
    const today = new Date()

    for (let i = 364; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const key = d.toISOString().split('T')[0]
      counts[key] = 0
    }

    jobs.forEach(job => {
      const key = job.dateApplied.split('T')[0]
      if (key in counts) counts[key]++
    })

    return Object.entries(counts).map(([date, count]) => ({ date, count }))
  },

  search(query: string): { jobs: Job[]; tasks: Task[] } {
    const q = query.toLowerCase()
    const jobs = db.jobs.all().filter(j =>
      j.company.toLowerCase().includes(q) ||
      j.role.toLowerCase().includes(q) ||
      (j.notes ?? '').toLowerCase().includes(q) ||
      (j.tags ?? '').toLowerCase().includes(q)
    ).map(hydrateJob)

    const allTasks = localStore.getAllTasks()
    const tasks = allTasks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.description ?? '').toLowerCase().includes(q)
    )

    return { jobs, tasks }
  },

  // ── data management ────────────────────────────────────────────────────────

  clearAll(): void {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k))
  },

  exportAll(): object {
    return {
      jobs: db.jobs.all(),
      interviews: db.interviews.all(),
      activities: db.activities.all(),
      documents: db.documents.all(),
      contacts: db.contacts.all(),
      tasks: db.tasks.all(),
      salaryNegotiations: db.salaryNegotiations.all(),
      userProfile: db.userProfile.get(),
      emailTemplates: db.emailTemplates.all(),
      exportedAt: now(),
    }
  },

  importAll(data: Record<string, unknown>): void {
    if (Array.isArray(data.jobs)) db.jobs.set(data.jobs as Job[])
    if (Array.isArray(data.interviews)) db.interviews.set(data.interviews as Interview[])
    if (Array.isArray(data.activities)) db.activities.set(data.activities as Activity[])
    if (Array.isArray(data.documents)) db.documents.set(data.documents as Document[])
    if (Array.isArray(data.contacts)) db.contacts.set(data.contacts as Contact[])
    if (Array.isArray(data.tasks)) db.tasks.set(data.tasks as Task[])
    if (Array.isArray(data.salaryNegotiations)) db.salaryNegotiations.set(data.salaryNegotiations as SalaryNegotiation[])
    if (data.userProfile) db.userProfile.set(data.userProfile as UserProfile)
    if (Array.isArray(data.emailTemplates)) db.emailTemplates.set(data.emailTemplates as EmailTemplate[])
  },
}

// Legacy alias for backward compat
export const store = localStore
