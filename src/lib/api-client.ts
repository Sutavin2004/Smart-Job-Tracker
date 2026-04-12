/**
 * Unified API client.
 *
 * - NEXT_PUBLIC_API_URL set (e.g. Railway) → HTTP requests to that URL
 * - Not set (GitHub Pages / local static)  → localStorage store (no backend needed)
 *
 * When switching to Railway later, set NEXT_PUBLIC_API_URL in GitHub secrets
 * and trigger a redeploy — no code changes required.
 */

import { localStore } from './local-store'
import type { Job, Interview, Contact, Task, SalaryNegotiation, UserProfile, EmailTemplate } from './types'

const REMOTE_URL = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')

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
  // ── Jobs ──────────────────────────────────────────────────────────────────

  getJobs(params?: { search?: string; status?: string; priority?: string; pinned?: boolean; archived?: boolean }) {
    if (useLocal()) return Promise.resolve(localStore.getJobs(params))
    const q = new URLSearchParams()
    if (params?.search) q.set('search', params.search)
    if (params?.status && params.status !== 'all') q.set('status', params.status)
    if (params?.priority && params.priority !== 'all') q.set('priority', params.priority)
    if (params?.pinned) q.set('pinned', 'true')
    if (params?.archived) q.set('archived', 'true')
    const qs = q.toString()
    return remoteRequest<Job[]>(`/api/jobs${qs ? `?${qs}` : ''}`)
  },

  getJob(id: string) {
    if (useLocal()) return Promise.resolve(localStore.getJob(id))
    return remoteRequest<Job>(`/api/jobs/${id}`)
  },

  createJob(data: Partial<Job>) {
    if (useLocal()) return Promise.resolve(localStore.createJob(data))
    return remoteRequest<Job>('/api/jobs', { method: 'POST', body: JSON.stringify(data) })
  },

  updateJob(id: string, data: Partial<Job>) {
    if (useLocal()) return Promise.resolve(localStore.updateJob(id, data))
    return remoteRequest<Job>(`/api/jobs/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  },

  deleteJob(id: string) {
    if (useLocal()) { localStore.deleteJob(id); return Promise.resolve({ success: true }) }
    return remoteRequest<{ success: boolean }>(`/api/jobs/${id}`, { method: 'DELETE' })
  },

  togglePin(id: string) {
    if (useLocal()) return Promise.resolve(localStore.togglePin(id))
    return remoteRequest<Job>(`/api/jobs/${id}/pin`, { method: 'POST' })
  },

  toggleArchive(id: string) {
    if (useLocal()) return Promise.resolve(localStore.toggleArchive(id))
    return remoteRequest<Job>(`/api/jobs/${id}/archive`, { method: 'POST' })
  },

  bulkUpdateStatus(ids: string[], status: Job['status']) {
    if (useLocal()) { localStore.bulkUpdateStatus(ids, status); return Promise.resolve({ success: true }) }
    return remoteRequest<{ success: boolean }>('/api/jobs/bulk', { method: 'PUT', body: JSON.stringify({ ids, status }) })
  },

  bulkDelete(ids: string[]) {
    if (useLocal()) { localStore.bulkDelete(ids); return Promise.resolve({ success: true }) }
    return remoteRequest<{ success: boolean }>('/api/jobs/bulk', { method: 'DELETE', body: JSON.stringify({ ids }) })
  },

  // ── Stats & Analytics ──────────────────────────────────────────────────────

  getStats() {
    if (useLocal()) return Promise.resolve(localStore.getStats())
    return remoteRequest<ReturnType<typeof localStore.getStats>>('/api/stats')
  },

  getActivityHeatmap() {
    if (useLocal()) return Promise.resolve(localStore.getActivityHeatmap())
    return remoteRequest<{ date: string; count: number }[]>('/api/analytics/heatmap')
  },

  search(query: string) {
    if (useLocal()) return Promise.resolve(localStore.search(query))
    return remoteRequest<ReturnType<typeof localStore.search>>(`/api/search?q=${encodeURIComponent(query)}`)
  },

  // ── Activities ─────────────────────────────────────────────────────────────

  getActivities(limit?: number) {
    if (useLocal()) return Promise.resolve(localStore.getActivities(limit))
    return remoteRequest<ReturnType<typeof localStore.getActivities>>(`/api/activities${limit ? `?limit=${limit}` : ''}`)
  },

  addNote(jobId: string, note: string) {
    if (useLocal()) return Promise.resolve(localStore.addNote(jobId, note))
    return remoteRequest<unknown>(`/api/jobs/${jobId}/notes`, { method: 'POST', body: JSON.stringify({ note }) })
  },

  // ── Interviews ─────────────────────────────────────────────────────────────

  createInterview(jobId: string, data: Partial<Interview>) {
    if (useLocal()) return Promise.resolve(localStore.createInterview(jobId, data))
    return remoteRequest<Interview>(`/api/jobs/${jobId}/interviews`, { method: 'POST', body: JSON.stringify(data) })
  },

  updateInterview(jobId: string, interviewId: string, data: Partial<Interview>) {
    if (useLocal()) return Promise.resolve(localStore.updateInterview(interviewId, data))
    return remoteRequest<Interview>(`/api/jobs/${jobId}/interviews/${interviewId}`, { method: 'PUT', body: JSON.stringify(data) })
  },

  deleteInterview(jobId: string, interviewId: string) {
    if (useLocal()) { localStore.deleteInterview(interviewId); return Promise.resolve({ success: true }) }
    return remoteRequest<{ success: boolean }>(`/api/jobs/${jobId}/interviews/${interviewId}`, { method: 'DELETE' })
  },

  // ── Documents ─────────────────────────────────────────────────────────────

  createDocument(jobId: string, data: { name: string; type: string; content: string; version?: string }) {
    if (useLocal()) return Promise.resolve(localStore.createDocument(jobId, data))
    return remoteRequest<unknown>(`/api/jobs/${jobId}/documents`, { method: 'POST', body: JSON.stringify(data) })
  },

  updateDocument(jobId: string, docId: string, data: Record<string, unknown>) {
    if (useLocal()) return Promise.resolve(localStore.updateDocument(docId, data))
    return remoteRequest<unknown>(`/api/jobs/${jobId}/documents/${docId}`, { method: 'PUT', body: JSON.stringify(data) })
  },

  deleteDocument(jobId: string, docId: string) {
    if (useLocal()) { localStore.deleteDocument(docId); return Promise.resolve({ success: true }) }
    return remoteRequest<{ success: boolean }>(`/api/jobs/${jobId}/documents/${docId}`, { method: 'DELETE' })
  },

  // ── Contacts ──────────────────────────────────────────────────────────────

  createContact(jobId: string, data: Partial<Contact>) {
    if (useLocal()) return Promise.resolve(localStore.createContact(jobId, data))
    return remoteRequest<Contact>(`/api/jobs/${jobId}/contacts`, { method: 'POST', body: JSON.stringify(data) })
  },

  updateContact(jobId: string, contactId: string, data: Partial<Contact>) {
    if (useLocal()) return Promise.resolve(localStore.updateContact(contactId, data))
    return remoteRequest<Contact>(`/api/jobs/${jobId}/contacts/${contactId}`, { method: 'PUT', body: JSON.stringify(data) })
  },

  deleteContact(jobId: string, contactId: string) {
    if (useLocal()) { localStore.deleteContact(contactId); return Promise.resolve({ success: true }) }
    return remoteRequest<{ success: boolean }>(`/api/jobs/${jobId}/contacts/${contactId}`, { method: 'DELETE' })
  },

  // ── Tasks ─────────────────────────────────────────────────────────────────

  getAllTasks() {
    if (useLocal()) return Promise.resolve(localStore.getAllTasks())
    return remoteRequest<Task[]>('/api/tasks')
  },

  createTask(jobId: string, data: Partial<Task>) {
    if (useLocal()) return Promise.resolve(localStore.createTask(jobId, data))
    return remoteRequest<Task>(`/api/jobs/${jobId}/tasks`, { method: 'POST', body: JSON.stringify(data) })
  },

  updateTask(jobId: string, taskId: string, data: Partial<Task>) {
    if (useLocal()) return Promise.resolve(localStore.updateTask(taskId, data))
    return remoteRequest<Task>(`/api/jobs/${jobId}/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify(data) })
  },

  deleteTask(jobId: string, taskId: string) {
    if (useLocal()) { localStore.deleteTask(taskId); return Promise.resolve({ success: true }) }
    return remoteRequest<{ success: boolean }>(`/api/jobs/${jobId}/tasks/${taskId}`, { method: 'DELETE' })
  },

  // ── Salary Negotiations ────────────────────────────────────────────────────

  createSalaryNegotiation(jobId: string, data: Partial<SalaryNegotiation>) {
    if (useLocal()) return Promise.resolve(localStore.createSalaryNegotiation(jobId, data))
    return remoteRequest<SalaryNegotiation>(`/api/jobs/${jobId}/salary`, { method: 'POST', body: JSON.stringify(data) })
  },

  updateSalaryNegotiation(jobId: string, negId: string, data: Partial<SalaryNegotiation>) {
    if (useLocal()) return Promise.resolve(localStore.updateSalaryNegotiation(negId, data))
    return remoteRequest<SalaryNegotiation>(`/api/jobs/${jobId}/salary/${negId}`, { method: 'PUT', body: JSON.stringify(data) })
  },

  deleteSalaryNegotiation(jobId: string, negId: string) {
    if (useLocal()) { localStore.deleteSalaryNegotiation(negId); return Promise.resolve({ success: true }) }
    return remoteRequest<{ success: boolean }>(`/api/jobs/${jobId}/salary/${negId}`, { method: 'DELETE' })
  },

  // ── User Profile ──────────────────────────────────────────────────────────

  getUserProfile() {
    if (useLocal()) return Promise.resolve(localStore.getUserProfile())
    return remoteRequest<UserProfile>('/api/profile')
  },

  updateUserProfile(data: Partial<UserProfile>) {
    if (useLocal()) return Promise.resolve(localStore.updateUserProfile(data))
    return remoteRequest<UserProfile>('/api/profile', { method: 'PUT', body: JSON.stringify(data) })
  },

  // ── Email Templates ───────────────────────────────────────────────────────

  getEmailTemplates() {
    if (useLocal()) return Promise.resolve(localStore.getEmailTemplates())
    return remoteRequest<EmailTemplate[]>('/api/templates')
  },

  createEmailTemplate(data: Partial<EmailTemplate>) {
    if (useLocal()) return Promise.resolve(localStore.createEmailTemplate(data))
    return remoteRequest<EmailTemplate>('/api/templates', { method: 'POST', body: JSON.stringify(data) })
  },

  updateEmailTemplate(id: string, data: Partial<EmailTemplate>) {
    if (useLocal()) return Promise.resolve(localStore.updateEmailTemplate(id, data))
    return remoteRequest<EmailTemplate>(`/api/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  },

  deleteEmailTemplate(id: string) {
    if (useLocal()) { localStore.deleteEmailTemplate(id); return Promise.resolve({ success: true }) }
    return remoteRequest<{ success: boolean }>(`/api/templates/${id}`, { method: 'DELETE' })
  },

  // ── AI ────────────────────────────────────────────────────────────────────

  analyzeJob(id: string) {
    if (useLocal()) return Promise.resolve(localStore.analyzeJob(id))
    return remoteRequest<Job>(`/api/jobs/${id}/analyze`, { method: 'POST' })
  },

  generateCoverLetter(id: string, background?: string) {
    if (useLocal()) return Promise.resolve(localStore.generateCoverLetter(id))
    return remoteRequest<{ coverLetter: string }>(`/api/jobs/${id}/cover-letter`, {
      method: 'POST',
      body: JSON.stringify({ background }),
    })
  },

  generateInterviewPrep(id: string, interviewType?: string) {
    if (useLocal()) return Promise.resolve(localStore.generateInterviewPrep(id, interviewType))
    return remoteRequest<{ prep: string }>(`/api/jobs/${id}/interview-prep`, {
      method: 'POST',
      body: JSON.stringify({ interviewType }),
    })
  },

  generateEmail(jobId: string, templateId: string) {
    if (useLocal()) return Promise.resolve(localStore.generateEmail(jobId, templateId))
    return remoteRequest<{ subject: string; body: string }>(`/api/jobs/${jobId}/email-draft`, {
      method: 'POST',
      body: JSON.stringify({ templateId }),
    })
  },

  generateSalaryAdvice(id: string) {
    if (useLocal()) return Promise.resolve(localStore.generateSalaryAdvice(id))
    return remoteRequest<{ advice: string }>(`/api/jobs/${id}/salary-advice`, { method: 'POST' })
  },

  // ── Data Management ───────────────────────────────────────────────────────

  exportAll() {
    if (useLocal()) return Promise.resolve(localStore.exportAll())
    return remoteRequest<object>('/api/export')
  },

  importAll(data: Record<string, unknown>) {
    if (useLocal()) { localStore.importAll(data); return Promise.resolve({ success: true }) }
    return remoteRequest<{ success: boolean }>('/api/import', { method: 'POST', body: JSON.stringify(data) })
  },

  clearAll() {
    if (useLocal()) { localStore.clearAll(); return Promise.resolve({ success: true }) }
    return remoteRequest<{ success: boolean }>('/api/data', { method: 'DELETE' })
  },
}
