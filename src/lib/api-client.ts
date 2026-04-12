/**
 * Unified API client.
 *
 * - NEXT_PUBLIC_API_URL set (e.g. Railway) → HTTP requests to that URL
 * - Not set (GitHub Pages / local static)  → localStorage store (no backend needed)
 *
 * When switching to Railway later, set NEXT_PUBLIC_API_URL in GitHub secrets
 * and trigger a redeploy — no code changes required.
 */

import { store } from './store'

const REMOTE_URL = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')

// True when running in a browser with no backend configured.
// `typeof window` check keeps this safe during SSR/build.
function useLocal(): boolean {
  return typeof window !== 'undefined' && REMOTE_URL === ''
}

async function remoteRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${REMOTE_URL}${path}`, {
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
  getJobs(params?: { search?: string; status?: string }) {
    if (useLocal()) return Promise.resolve(store.getJobs(params))
    const q = new URLSearchParams()
    if (params?.search) q.set('search', params.search)
    if (params?.status && params.status !== 'all') q.set('status', params.status)
    const qs = q.toString()
    return remoteRequest<unknown[]>(`/api/jobs${qs ? `?${qs}` : ''}`)
  },

  getJob(id: string) {
    if (useLocal()) return Promise.resolve(store.getJob(id))
    return remoteRequest<unknown>(`/api/jobs/${id}`)
  },

  createJob(data: Record<string, unknown>) {
    if (useLocal()) return Promise.resolve(store.createJob(data))
    return remoteRequest<unknown>('/api/jobs', { method: 'POST', body: JSON.stringify(data) })
  },

  updateJob(id: string, data: Record<string, unknown>) {
    if (useLocal()) return Promise.resolve(store.updateJob(id, data))
    return remoteRequest<unknown>(`/api/jobs/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  },

  deleteJob(id: string) {
    if (useLocal()) { store.deleteJob(id); return Promise.resolve({ success: true }) }
    return remoteRequest<{ success: boolean }>(`/api/jobs/${id}`, { method: 'DELETE' })
  },

  analyzeJob(id: string) {
    if (useLocal()) return Promise.resolve(store.analyzeJob(id))
    return remoteRequest<unknown>(`/api/jobs/${id}/analyze`, { method: 'POST' })
  },

  generateCoverLetter(id: string, background?: string) {
    if (useLocal()) return Promise.resolve(store.generateCoverLetter(id))
    return remoteRequest<{ coverLetter: string }>(`/api/jobs/${id}/cover-letter`, {
      method: 'POST',
      body: JSON.stringify({ background }),
    })
  },

  generateInterviewPrep(id: string, interviewType?: string) {
    if (useLocal()) return Promise.resolve(store.generateInterviewPrep(id, interviewType))
    return remoteRequest<{ prep: string }>(`/api/jobs/${id}/interview-prep`, {
      method: 'POST',
      body: JSON.stringify({ interviewType }),
    })
  },

  createInterview(jobId: string, data: Record<string, unknown>) {
    if (useLocal()) return Promise.resolve(store.createInterview(jobId, data as Parameters<typeof store.createInterview>[1]))
    return remoteRequest<unknown>(`/api/jobs/${jobId}/interviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  updateInterview(jobId: string, data: Record<string, unknown>) {
    if (useLocal()) {
      const { interviewId, ...rest } = data as { interviewId: string } & Record<string, unknown>
      return Promise.resolve(store.updateInterview(interviewId, rest))
    }
    return remoteRequest<unknown>(`/api/jobs/${jobId}/interviews`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  getStats() {
    if (useLocal()) return Promise.resolve(store.getStats())
    return remoteRequest<unknown>('/api/stats')
  },

  getActivities() {
    if (useLocal()) return Promise.resolve(store.getActivities())
    return remoteRequest<unknown[]>('/api/activities')
  },
}
