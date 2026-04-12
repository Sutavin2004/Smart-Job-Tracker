// All API calls go through here so NEXT_PUBLIC_API_URL is the single point of configuration.
// - Local dev:       NEXT_PUBLIC_API_URL is unset → relative URLs → Next.js API routes serve requests
// - GitHub Pages:    NEXT_PUBLIC_API_URL is unset → relative URLs → 404 (no server), app shows empty state
// - Railway (later): NEXT_PUBLIC_API_URL=https://your-app.railway.app → all calls go to Railway

const BASE = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as { error?: string }).error ?? `Request failed: ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const apiClient = {
  // Jobs
  getJobs: (params?: { search?: string; status?: string }) => {
    const q = new URLSearchParams()
    if (params?.search) q.set('search', params.search)
    if (params?.status && params.status !== 'all') q.set('status', params.status)
    const qs = q.toString()
    return request<unknown[]>(`/api/jobs${qs ? `?${qs}` : ''}`)
  },
  getJob: (id: string) => request<unknown>(`/api/jobs/${id}`),
  createJob: (data: Record<string, unknown>) =>
    request<unknown>('/api/jobs', { method: 'POST', body: JSON.stringify(data) }),
  updateJob: (id: string, data: Record<string, unknown>) =>
    request<unknown>(`/api/jobs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteJob: (id: string) =>
    request<{ success: boolean }>(`/api/jobs/${id}`, { method: 'DELETE' }),

  // AI
  analyzeJob: (id: string) =>
    request<unknown>(`/api/jobs/${id}/analyze`, { method: 'POST' }),
  generateCoverLetter: (id: string, background?: string) =>
    request<{ coverLetter: string }>(`/api/jobs/${id}/cover-letter`, {
      method: 'POST',
      body: JSON.stringify({ background }),
    }),
  generateInterviewPrep: (id: string, interviewType?: string) =>
    request<{ prep: string }>(`/api/jobs/${id}/interview-prep`, {
      method: 'POST',
      body: JSON.stringify({ interviewType }),
    }),

  // Interviews
  createInterview: (jobId: string, data: Record<string, unknown>) =>
    request<unknown>(`/api/jobs/${jobId}/interviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateInterview: (jobId: string, data: Record<string, unknown>) =>
    request<unknown>(`/api/jobs/${jobId}/interviews`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Stats & activities
  getStats: () => request<unknown>('/api/stats'),
  getActivities: () => request<unknown[]>('/api/activities'),
}
