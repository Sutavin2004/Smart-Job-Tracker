'use client'

import { useState, FormEvent } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { JOB_STATUSES, JOB_PRIORITIES, STATUS_CONFIG, PRIORITY_CONFIG, type JobStatus, type JobPriority } from '@/lib/types'
import { apiClient } from '@/lib/api-client'

interface Props {
  onClose: () => void
  onCreated: () => void
}

export function AddJobModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    company: '', role: '', status: 'saved', priority: 'medium',
    jobUrl: '', location: '', salary: '', notes: '', deadline: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await apiClient.createJob({
        ...form,
        status: form.status as JobStatus,
        priority: form.priority as JobPriority,
        jobUrl: form.jobUrl || undefined,
        location: form.location || undefined,
        salary: form.salary || undefined,
        notes: form.notes || undefined,
        deadline: form.deadline || undefined,
      })
      onCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-base font-semibold">New Application</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Company <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.company}
                onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                placeholder="e.g. Acme Corp"
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                placeholder="e.g. Software Engineer"
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="input">
                {JOB_STATUSES.map(s => (
                  <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="input">
                {JOB_PRIORITIES.map(p => (
                  <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Location</label>
              <input
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="Remote / City, State"
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Salary Range</label>
              <input
                value={form.salary}
                onChange={e => setForm(f => ({ ...f, salary: e.target.value }))}
                placeholder="e.g. $80k–$100k"
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Job URL</label>
            <input
              type="url"
              value={form.jobUrl}
              onChange={e => setForm(f => ({ ...f, jobUrl: e.target.value }))}
              placeholder="https://..."
              className="input"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Application Deadline</label>
            <input
              type="date"
              value={form.deadline}
              onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
              className="input"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Referral, recruiter name, key requirements..."
              rows={3}
              className={cn('input resize-none')}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Saving…' : 'Add Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
