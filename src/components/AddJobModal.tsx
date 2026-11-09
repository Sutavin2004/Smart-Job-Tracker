'use client'

import { useState, useEffect, useRef, useId, FormEvent } from 'react'
import { X, Link2, Loader2, Sparkles, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { JOB_STATUSES, JOB_PRIORITIES, STATUS_CONFIG, PRIORITY_CONFIG, type JobStatus, type JobPriority } from '@/lib/types'
import { apiClient } from '@/lib/api-client'

interface Props {
  onClose: () => void
  onCreated: () => void
}

const EMPTY = {
  company: '', role: '', status: 'saved', priority: 'medium',
  jobUrl: '', location: '', salary: '', notes: '', deadline: '', jobDescription: '',
}

export function AddJobModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState(EMPTY)
  const [extra, setExtra] = useState<{ remote?: boolean; salaryMin?: number | null; salaryMax?: number | null; currency?: string | null }>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [importUrl, setImportUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState<string | null>(null)
  const [showDesc, setShowDesc] = useState(false)
  const id = useId()
  const firstField = useRef<HTMLInputElement>(null)

  // Focus the first field once on open; close on Escape.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  useEffect(() => {
    firstField.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseRef.current() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const set = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleImport() {
    if (!importUrl.trim()) return
    setImporting(true)
    setError('')
    setImported(null)
    try {
      const { job, source } = await apiClient.importJobFromUrl(importUrl.trim())
      setForm(f => ({
        ...f,
        company: job.company ?? f.company,
        role: job.role ?? f.role,
        location: job.location ?? f.location,
        salary: job.salaryRaw ?? f.salary,
        jobUrl: job.jobUrl ?? importUrl.trim(),
        deadline: job.deadline ?? f.deadline,
        jobDescription: job.jobDescription ?? f.jobDescription,
      }))
      setExtra({ remote: job.remote, salaryMin: job.salaryMin, salaryMax: job.salaryMax, currency: job.currency })
      if (job.jobDescription) setShowDesc(true)
      const ATS: Record<string, string> = { greenhouse: 'Greenhouse', lever: 'Lever', ashby: 'Ashby' }
      setImported(
        ATS[source] ? `Filled in from ${ATS[source]}`
          : source === 'json-ld' ? 'Filled in from the posting'
          : source === 'ai' ? 'Filled in by AI from the page'
          : 'Filled in what we could find')
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't import that link")
      setForm(f => ({ ...f, jobUrl: f.jobUrl || importUrl.trim() }))
    } finally {
      setImporting(false)
    }
  }

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
        jobDescription: form.jobDescription || undefined,
        remote: extra.remote ?? /\bremote\b/i.test(form.location),
        salaryMin: extra.salaryMin ?? undefined,
        salaryMax: extra.salaryMax ?? undefined,
        ...(extra.currency ? { currency: extra.currency } : {}),
      } as Parameters<typeof apiClient.createJob>[0])
      toast.success(`Added ${form.role} at ${form.company}`)
      onCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const label = 'block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1'

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} className="bg-white dark:bg-[#1A1B1D] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-[#2A2B2E]">
          <h2 id={`${id}-title`} className="text-base font-semibold">New application</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Import from link */}
        <div className="px-6 pt-5">
          <label htmlFor={`${id}-import`} className={label}>
            <span className="inline-flex items-center gap-1"><Sparkles className="w-3 h-3 text-brand-500" /> Paste a job posting link to fill this in</span>
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                ref={firstField}
                id={`${id}-import`}
                type="url"
                inputMode="url"
                value={importUrl}
                onChange={e => setImportUrl(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleImport() } }}
                placeholder="https://boards.greenhouse.io/…"
                className="input pl-8"
              />
            </div>
            <button type="button" onClick={handleImport} disabled={importing || !importUrl.trim()} className="btn-secondary shrink-0">
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Import'}
            </button>
          </div>
          {imported && (
            <p role="status" className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> {imported}. Check the details below.
            </p>
          )}
          <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200 dark:bg-[#26272A]" /> or enter details <span className="h-px flex-1 bg-slate-200 dark:bg-[#26272A]" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={`${id}-company`} className={label}>Company <span className="text-red-500" aria-hidden>*</span></label>
              <input id={`${id}-company`} required value={form.company} onChange={set('company')} placeholder="e.g. Acme Corp" className="input" />
            </div>
            <div>
              <label htmlFor={`${id}-role`} className={label}>Role <span className="text-red-500" aria-hidden>*</span></label>
              <input id={`${id}-role`} required value={form.role} onChange={set('role')} placeholder="e.g. Software Engineer" className="input" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor={`${id}-status`} className={label}>Status</label>
              <select id={`${id}-status`} value={form.status} onChange={set('status')} className="input">
                {JOB_STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor={`${id}-priority`} className={label}>Priority</label>
              <select id={`${id}-priority`} value={form.priority} onChange={set('priority')} className="input">
                {JOB_PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={`${id}-location`} className={label}>Location</label>
              <input id={`${id}-location`} value={form.location} onChange={set('location')} placeholder="Remote / Toronto, ON" className="input" />
            </div>
            <div>
              <label htmlFor={`${id}-salary`} className={label}>Salary range</label>
              <input id={`${id}-salary`} value={form.salary} onChange={set('salary')} placeholder="e.g. $80k–$100k" className="input" />
            </div>
          </div>

          <div>
            <label htmlFor={`${id}-url`} className={label}>Job URL</label>
            <input id={`${id}-url`} type="url" value={form.jobUrl} onChange={set('jobUrl')} placeholder="https://..." className="input" />
          </div>

          <div>
            <label htmlFor={`${id}-deadline`} className={label}>Application deadline</label>
            <input id={`${id}-deadline`} type="date" value={form.deadline} onChange={set('deadline')} className="input" />
          </div>

          <div>
            {showDesc ? (
              <>
                <label htmlFor={`${id}-desc`} className={label}>Job description</label>
                <textarea id={`${id}-desc`} value={form.jobDescription} onChange={set('jobDescription')} rows={5} className="input resize-y text-xs" placeholder="Paste the posting text — the AI tools use it for tailoring and prep." />
              </>
            ) : (
              <button type="button" onClick={() => setShowDesc(true)} className="text-xs text-brand-600 hover:underline">+ Add job description</button>
            )}
          </div>

          <div>
            <label htmlFor={`${id}-notes`} className={label}>Notes</label>
            <textarea id={`${id}-notes`} value={form.notes} onChange={set('notes')} placeholder="Referral, recruiter name, key requirements..." rows={3} className={cn('input resize-none')} />
          </div>

          {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Saving…' : 'Add application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
