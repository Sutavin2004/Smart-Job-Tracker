import { useState, useEffect, FormEvent } from 'react'
import { api, Job, CreateJobInput, JobStatus } from './api'

// ─── Status configuration ────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: JobStatus; label: string }[] = [
  { value: 'saved', label: 'Saved' },
  { value: 'applied', label: 'Applied' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offered', label: 'Offered' },
  { value: 'rejected', label: 'Rejected' },
]

const STATUS_BADGE: Record<JobStatus, string> = {
  saved: 'bg-gray-100 text-gray-700 border-gray-200',
  applied: 'bg-blue-100 text-blue-700 border-blue-200',
  interviewing: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  offered: 'bg-green-100 text-green-700 border-green-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
}

// ─── Tiny reusable components ────────────────────────────────────────────────

function Badge({ status }: { status: string }) {
  const cls = STATUS_BADGE[status as JobStatus] ?? 'bg-gray-100 text-gray-600 border-gray-200'
  const label = STATUS_OPTIONS.find(s => s.value === status)?.label ?? status
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {label}
    </span>
  )
}

function StatCard({ label, value, color = 'text-gray-900' }: { label: string; value: number; color?: string }) {
  return (
    <div className="text-center min-w-[60px]">
      <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

function Input({ label, required, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        required={required}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
        {...props}
      />
    </div>
  )
}

// ─── Main App ────────────────────────────────────────────────────────────────

const EMPTY_FORM: CreateJobInput = { company: '', role: '', status: 'applied', job_url: '', notes: '' }

export default function App() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [selected, setSelected] = useState<Job | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Add-form state
  const [form, setForm] = useState<CreateJobInput>(EMPTY_FORM)
  const [addError, setAddError] = useState('')

  // Edit state (synced from selected)
  const [editStatus, setEditStatus] = useState<JobStatus>('applied')
  const [editNotes, setEditNotes] = useState('')

  useEffect(() => { loadJobs() }, [])

  // ── Data helpers ──────────────────────────────────────────────────────────

  async function loadJobs() {
    setApiError('')
    try {
      setJobs(await api.getJobs())
    } catch (e) {
      setApiError('Could not reach the backend. Make sure the server is running.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function selectJob(job: Job) {
    setSelected(job)
    setEditStatus(job.status)
    setEditNotes(job.notes ?? '')
  }

  // ── Handlers ─────────────────────────────────────────────────────────────

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    setAddError('')
    try {
      await api.createJob({ ...form, job_url: form.job_url || undefined, notes: form.notes || undefined })
      setForm(EMPTY_FORM)
      setShowAdd(false)
      await loadJobs()
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add application.')
    }
  }

  async function handleSaveChanges() {
    if (!selected) return
    setSaving(true)
    try {
      const updated = await api.updateJob(selected.id, { status: editStatus, notes: editNotes || undefined })
      setSelected(updated)
      await loadJobs()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  async function handleAnalyze() {
    if (!selected) return
    setAnalyzing(true)
    try {
      const updated = await api.analyzeJob(selected.id)
      setSelected(updated)
      await loadJobs()
    } catch (e) {
      console.error(e)
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleDelete() {
    if (!selected) return
    if (!confirm(`Delete "${selected.company} — ${selected.role}"?`)) return
    try {
      await api.deleteJob(selected.id)
      setSelected(null)
      await loadJobs()
    } catch (e) {
      console.error(e)
    }
  }

  // ── Derived stats ─────────────────────────────────────────────────────────

  const total = jobs.length
  const interviewing = jobs.filter(j => j.status === 'interviewing').length
  const offered = jobs.filter(j => j.status === 'offered').length

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Smart Job Tracker</h1>
            <p className="text-xs text-indigo-500 font-medium">Powered by Claude AI ✨</p>
          </div>
          <div className="flex items-center gap-8">
            <StatCard label="Total" value={total} />
            <StatCard label="Interviewing" value={interviewing} color="text-yellow-600" />
            <StatCard label="Offered" value={offered} color="text-green-600" />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-5">

        {/* ── API Error Banner ── */}
        {apiError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            <span>⚠️</span> {apiError}
          </div>
        )}

        {/* ── Add Button ── */}
        <div>
          <button
            onClick={() => { setShowAdd(v => !v); setAddError('') }}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 active:scale-95 transition-all shadow-sm"
          >
            {showAdd ? '✕ Cancel' : '+ Add Application'}
          </button>
        </div>

        {/* ── Add Job Form ── */}
        {showAdd && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-800 mb-5 text-base">New Application</h2>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Company" required value={form.company}
                onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                placeholder="e.g. Acme Corp" />

              <Input label="Role" required value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                placeholder="e.g. Software Engineer" />

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              <Input label="Job URL" type="url" value={form.job_url ?? ''}
                onChange={e => setForm(f => ({ ...f, job_url: e.target.value }))}
                placeholder="https://..." />

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea
                  value={form.notes ?? ''}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={2}
                  placeholder="Referral, recruiter name, anything relevant..."
                />
              </div>

              {addError && (
                <p className="md:col-span-2 text-red-600 text-sm">{addError}</p>
              )}

              <div className="md:col-span-2">
                <button type="submit"
                  className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                  Save Application
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Jobs Table ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-400 text-sm animate-pulse">Loading applications…</div>
          ) : jobs.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <p className="text-gray-400 text-sm">No applications yet.</p>
              <button onClick={() => setShowAdd(true)}
                className="text-indigo-600 text-sm hover:underline font-medium">
                Add your first application →
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Company', 'Role', 'Status', 'Applied', '✨'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {jobs.map(job => (
                    <tr
                      key={job.id}
                      onClick={() => selectJob(job)}
                      className={`cursor-pointer transition-colors hover:bg-indigo-50/50 ${
                        selected?.id === job.id ? 'bg-indigo-50' : ''
                      }`}
                    >
                      <td className="px-4 py-3 font-semibold text-gray-900">{job.company}</td>
                      <td className="px-4 py-3 text-gray-600">{job.role}</td>
                      <td className="px-4 py-3"><Badge status={job.status} /></td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{job.date_applied}</td>
                      <td className="px-4 py-3 text-center">
                        {job.ai_suggestion
                          ? <span className="text-indigo-500" title="Has AI suggestion">✨</span>
                          : <span className="text-gray-200">—</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Job Detail Panel ── */}
        {selected && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-0.5">
                <h2 className="text-lg font-bold text-gray-900">{selected.company}</h2>
                <p className="text-gray-500 text-sm">{selected.role}</p>
                {selected.job_url && (
                  <a href={selected.job_url} target="_blank" rel="noreferrer"
                    className="text-indigo-600 text-xs hover:underline inline-block pt-1">
                    View Job Posting ↗
                  </a>
                )}
              </div>
              <button onClick={() => setSelected(null)}
                className="text-gray-300 hover:text-gray-500 text-xl leading-none transition-colors">
                ✕
              </button>
            </div>

            {/* Edit fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-50">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as JobStatus)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder="Add any notes…"
                />
              </div>

              {/* Action buttons */}
              <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>

                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  {analyzing
                    ? <><span className="animate-spin inline-block">⏳</span> Analyzing…</>
                    : '✨ Get AI Suggestion'}
                </button>

                <button
                  onClick={handleDelete}
                  className="ml-auto text-red-500 px-4 py-2 rounded-lg text-sm font-medium border border-red-100 hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* AI Suggestion box */}
            {selected.ai_suggestion && (
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-indigo-600 mb-2 flex items-center gap-1.5">
                  ✨ AI Suggestion
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">{selected.ai_suggestion}</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="text-center py-6 text-xs text-gray-400">
        Smart Job Tracker · Built with FastAPI + React + Claude AI
      </footer>
    </div>
  )
}
