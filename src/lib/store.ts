/**
 * Browser-local store — uses localStorage as the database.
 * This runs when no NEXT_PUBLIC_API_URL is configured (i.e. GitHub Pages).
 * When the Railway backend is added, api-client.ts routes calls there instead.
 */

import type { Job, Interview, Activity, Document } from './types'

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
}

// ── activity helper ──────────────────────────────────────────────────────────

function addActivity(jobId: string, type: Activity['type'], message: string) {
  const acts = db.activities.all()
  acts.unshift({ id: uid(), jobId, type, message, createdAt: now() })
  db.activities.set(acts.slice(0, 200)) // cap at 200
}

// ── jobs ─────────────────────────────────────────────────────────────────────

function hydrateJob(job: Job): Job {
  const interviews = db.interviews.all().filter(iv => iv.jobId === job.id)
  const activities = db.activities.all().filter(a => a.jobId === job.id).slice(0, 20)
  const documents = db.documents.all().filter(d => d.jobId === job.id)
  return { ...job, interviews, activities, documents }
}

export const store = {
  getJobs(params?: { search?: string; status?: string }): Job[] {
    let jobs = db.jobs.all()
    if (params?.status && params.status !== 'all') {
      jobs = jobs.filter(j => j.status === params.status)
    }
    if (params?.search) {
      const q = params.search.toLowerCase()
      jobs = jobs.filter(j =>
        j.company.toLowerCase().includes(q) ||
        j.role.toLowerCase().includes(q) ||
        (j.location ?? '').toLowerCase().includes(q)
      )
    }
    return jobs
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
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
      status: (data.status as Job['status']) ?? 'saved',
      priority: (data.priority as Job['priority']) ?? 'medium',
      jobUrl: data.jobUrl ?? null,
      location: data.location ?? null,
      salary: data.salary ?? null,
      notes: data.notes ?? null,
      aiSuggestion: null,
      coverLetter: null,
      dateApplied: t,
      deadline: data.deadline ?? null,
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

    jobs[idx] = { ...prev, ...data, id, updatedAt: now() }
    db.jobs.set(jobs)
    return hydrateJob(jobs[idx])
  },

  deleteJob(id: string): void {
    db.jobs.set(db.jobs.all().filter(j => j.id !== id))
    db.interviews.set(db.interviews.all().filter(iv => iv.jobId !== id))
    db.activities.set(db.activities.all().filter(a => a.jobId !== id))
    db.documents.set(db.documents.all().filter(d => d.jobId !== id))
  },

  // ── stats ─────────────────────────────────────────────────────────────────

  getStats() {
    const jobs = db.jobs.all()
    const counts = {
      total: jobs.length,
      saved: jobs.filter(j => j.status === 'saved').length,
      applied: jobs.filter(j => j.status === 'applied').length,
      interviewing: jobs.filter(j => j.status === 'interviewing').length,
      offered: jobs.filter(j => j.status === 'offered').length,
      rejected: jobs.filter(j => j.status === 'rejected').length,
    }

    // Monthly (last 6 months)
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

  // ── activities ────────────────────────────────────────────────────────────

  getActivities() {
    const jobs = db.jobs.all()
    return db.activities.all()
      .slice(0, 20)
      .map(a => ({
        ...a,
        job: jobs.find(j => j.id === a.jobId) ? { company: jobs.find(j => j.id === a.jobId)!.company, role: jobs.find(j => j.id === a.jobId)!.role } : null,
      }))
  },

  // ── interviews ────────────────────────────────────────────────────────────

  createInterview(jobId: string, data: { type: string; scheduledAt: string; notes?: string }): Interview {
    const iv: Interview = {
      id: uid(),
      jobId,
      type: data.type as Interview['type'],
      scheduledAt: data.scheduledAt,
      notes: data.notes ?? null,
      outcome: 'pending',
      createdAt: now(),
    }
    const interviews = db.interviews.all()
    interviews.push(iv)
    db.interviews.set(interviews)
    addActivity(jobId, 'interview_scheduled', `${data.type.charAt(0).toUpperCase() + data.type.slice(1)} interview scheduled`)

    // Auto-advance status
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

  // ── AI (no backend — returns placeholder) ────────────────────────────────

  analyzeJob(id: string): Job {
    const job = store.updateJob(id, {
      aiSuggestion: 'Connect a Railway backend with your ANTHROPIC_API_KEY to get real AI suggestions. For now, consider: (1) Following up with the recruiter if it has been more than a week since applying. (2) Researching the company culture and recent news before any interview. (3) Preparing 2–3 specific examples that demonstrate your impact in past roles.',
    })
    addActivity(id, 'ai_analyzed', 'AI analysis generated')
    return job
  },

  generateCoverLetter(id: string): { coverLetter: string } {
    const job = store.getJob(id)
    const text = job
      ? `[Sample cover letter for ${job.role} at ${job.company}]\n\nDear Hiring Manager,\n\nI am writing to express my strong interest in the ${job.role} position at ${job.company}. Connect a Railway backend with your ANTHROPIC_API_KEY to generate a personalised cover letter tailored to this specific role.\n\nIn the meantime, you can edit this placeholder and save it as your draft.\n\nSincerely,\n[Your Name]`
      : 'Add your Railway backend + ANTHROPIC_API_KEY to generate AI cover letters.'
    if (job) {
      store.updateJob(id, { coverLetter: text })
      addActivity(id, 'document_added', 'Cover letter draft created')
    }
    return { coverLetter: text }
  },

  generateInterviewPrep(_id: string, interviewType?: string): { prep: string } {
    return {
      prep: `[${(interviewType ?? 'General').charAt(0).toUpperCase() + (interviewType ?? 'General').slice(1)} Interview Prep]\n\nConnect a Railway backend with your ANTHROPIC_API_KEY to get AI-generated interview questions and tips tailored to this specific role and company.\n\nGeneral tips in the meantime:\n1. Research the company's mission, products, and recent news.\n2. Prepare STAR-format answers (Situation, Task, Action, Result).\n3. Have 2–3 questions ready for the interviewer.\n4. Review the job description and match your experience to key requirements.\n5. Practice your "tell me about yourself" answer — keep it to 2 minutes.`,
    }
  },

  // ── bulk ─────────────────────────────────────────────────────────────────

  clearAll(): void {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k))
  },

  exportAll(): unknown {
    return store.getJobs()
  },
}
