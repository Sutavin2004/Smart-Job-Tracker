const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export type JobStatus = 'saved' | 'applied' | 'interviewing' | 'offered' | 'rejected'

export interface Job {
  id: number
  company: string
  role: string
  status: JobStatus
  date_applied: string
  job_url?: string | null
  notes?: string | null
  ai_suggestion?: string | null
}

export interface CreateJobInput {
  company: string
  role: string
  status: string
  job_url?: string
  notes?: string
}

export interface UpdateJobInput {
  company?: string
  role?: string
  status?: string
  job_url?: string
  notes?: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(text || `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  getJobs: () => request<Job[]>('/jobs'),

  createJob: (data: CreateJobInput) =>
    request<Job>('/jobs', { method: 'POST', body: JSON.stringify(data) }),

  updateJob: (id: number, data: UpdateJobInput) =>
    request<Job>(`/jobs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteJob: (id: number) =>
    request<void>(`/jobs/${id}`, { method: 'DELETE' }),

  analyzeJob: (id: number) =>
    request<Job>(`/jobs/${id}/analyze`, { method: 'POST' }),
}
