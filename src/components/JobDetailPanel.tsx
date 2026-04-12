'use client'

import { useState } from 'react'
import {
  X, ExternalLink, Sparkles, FileText, Calendar, Clock, Trash2,
  Save, BookOpen, ChevronDown, Plus, CheckCircle, XCircle, MinusCircle,
  Loader2, MapPin, DollarSign, AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate, formatRelative, formatDateTime } from '@/lib/utils'
import { type Job, JOB_STATUSES, JOB_PRIORITIES, STATUS_CONFIG, PRIORITY_CONFIG, INTERVIEW_TYPES } from '@/lib/types'
import { StatusBadge, PriorityBadge } from './StatusBadge'
import { useToast } from './ToastProvider'

type Tab = 'overview' | 'ai' | 'cover-letter' | 'interviews' | 'activity'

interface Props {
  job: Job
  onClose: () => void
  onUpdated: () => void
  onDeleted: () => void
}

export function JobDetailPanel({ job, onClose, onUpdated, onDeleted }: Props) {
  const { toast } = useToast()
  const [tab, setTab] = useState<Tab>('overview')

  // Edit state
  const [status, setStatus] = useState(job.status)
  const [priority, setPriority] = useState(job.priority)
  const [notes, setNotes] = useState(job.notes ?? '')
  const [salary, setSalary] = useState(job.salary ?? '')
  const [location, setLocation] = useState(job.location ?? '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // AI states
  const [analyzing, setAnalyzing] = useState(false)
  const [generatingCL, setGeneratingCL] = useState(false)
  const [generatingPrep, setGeneratingPrep] = useState(false)
  const [background, setBackground] = useState('')
  const [prepType, setPrepType] = useState('general')
  const [prep, setPrep] = useState('')
  const [coverLetter, setCoverLetter] = useState(job.coverLetter ?? '')
  const [aiSuggestion, setAiSuggestion] = useState(job.aiSuggestion ?? '')

  // Interview state
  const [showAddInterview, setShowAddInterview] = useState(false)
  const [intType, setIntType] = useState('phone')
  const [intDate, setIntDate] = useState('')
  const [intNotes, setIntNotes] = useState('')
  const [addingInterview, setAddingInterview] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await fetch(`/api/jobs/${job.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, priority, notes, salary, location }),
      })
      toast('Changes saved')
      onUpdated()
    } catch {
      toast('Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${job.company} — ${job.role}"?`)) return
    setDeleting(true)
    try {
      await fetch(`/api/jobs/${job.id}`, { method: 'DELETE' })
      toast('Application deleted')
      onDeleted()
    } catch {
      toast('Failed to delete', 'error')
      setDeleting(false)
    }
  }

  async function handleAnalyze() {
    setAnalyzing(true)
    try {
      const res = await fetch(`/api/jobs/${job.id}/analyze`, { method: 'POST' })
      const data = await res.json()
      setAiSuggestion(data.aiSuggestion)
      toast('AI analysis ready ✨')
      onUpdated()
    } catch {
      toast('Analysis failed', 'error')
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleCoverLetter() {
    setGeneratingCL(true)
    try {
      const res = await fetch(`/api/jobs/${job.id}/cover-letter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ background }),
      })
      const data = await res.json()
      setCoverLetter(data.coverLetter)
      toast('Cover letter generated ✨')
    } catch {
      toast('Generation failed', 'error')
    } finally {
      setGeneratingCL(false)
    }
  }

  async function handleInterviewPrep() {
    setGeneratingPrep(true)
    try {
      const res = await fetch(`/api/jobs/${job.id}/interview-prep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewType: prepType }),
      })
      const data = await res.json()
      setPrep(data.prep)
      toast('Interview prep ready ✨')
    } catch {
      toast('Generation failed', 'error')
    } finally {
      setGeneratingPrep(false)
    }
  }

  async function handleAddInterview() {
    if (!intDate) return
    setAddingInterview(true)
    try {
      await fetch(`/api/jobs/${job.id}/interviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: intType, scheduledAt: intDate, notes: intNotes }),
      })
      toast('Interview scheduled')
      setShowAddInterview(false)
      setIntDate('')
      setIntNotes('')
      onUpdated()
    } catch {
      toast('Failed to add interview', 'error')
    } finally {
      setAddingInterview(false)
    }
  }

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'ai', label: 'AI Coach', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'cover-letter', label: 'Cover Letter', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'interviews', label: 'Interviews', icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'activity', label: 'Activity', icon: <Clock className="w-3.5 h-3.5" /> },
  ]

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-slate-900 dark:text-white text-base truncate">{job.company}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{job.role}</p>
            {job.jobUrl && (
              <a href={job.jobUrl} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline mt-1">
                View Posting <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 mt-3">
          <StatusBadge status={status} />
          <PriorityBadge priority={priority} />
          {job.deadline && new Date(job.deadline) < new Date() && (
            <span className="inline-flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="w-3 h-3" /> Deadline passed
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 dark:border-slate-700 shrink-0 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors',
              tab === t.id
                ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            )}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value as typeof status)} className="input">
                  {JOB_STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Priority</label>
                <select value={priority} onChange={e => setPriority(e.target.value as typeof priority)} className="input">
                  {JOB_PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> Location</span>
                </label>
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Remote / City" className="input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  <span className="inline-flex items-center gap-1"><DollarSign className="w-3 h-3" /> Salary</span>
                </label>
                <input value={salary} onChange={e => setSalary(e.target.value)} placeholder="$80k–$100k" className="input" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={4}
                placeholder="Add notes, contacts, requirements..."
                className="input resize-none"
              />
            </div>

            <div className="flex flex-col gap-2 text-xs text-slate-400 dark:text-slate-500">
              <span>Applied: {formatDate(job.dateApplied)}</span>
              {job.deadline && <span>Deadline: {formatDate(job.deadline)}</span>}
              <span>Updated: {formatRelative(job.updatedAt)}</span>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
                {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</> : <><Save className="w-3.5 h-3.5" /> Save</>}
              </button>
              <button onClick={handleDelete} disabled={deleting} className="btn-danger">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}

        {/* ── AI COACH ── */}
        {tab === 'ai' && (
          <>
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold mb-1">AI Suggestion</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Get tailored next steps for this application.</p>
              </div>
              <button onClick={handleAnalyze} disabled={analyzing} className="btn-primary w-full justify-center">
                {analyzing
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing…</>
                  : <><Sparkles className="w-3.5 h-3.5" /> Get AI Suggestion</>
                }
              </button>
              {aiSuggestion && (
                <div className="bg-gradient-to-br from-brand-50 to-purple-50 dark:from-brand-900/20 dark:to-purple-900/20 border border-brand-100 dark:border-brand-800 rounded-xl p-4">
                  <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> AI Suggestion
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{aiSuggestion}</p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-3">
              <div>
                <h3 className="text-sm font-semibold mb-1">Interview Prep</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Generate tailored interview questions and tips.</p>
              </div>
              <div className="flex gap-2">
                <select value={prepType} onChange={e => setPrepType(e.target.value)} className="input flex-1">
                  {INTERVIEW_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  <option value="general">General</option>
                </select>
                <button onClick={handleInterviewPrep} disabled={generatingPrep} className="btn-primary shrink-0">
                  {generatingPrep ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                </button>
              </div>
              {prep && (
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {prep}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── COVER LETTER ── */}
        {tab === 'cover-letter' && (
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold mb-1">Generate Cover Letter</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Add some background about yourself for a more personalized letter.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Your Background (optional)</label>
              <textarea
                value={background}
                onChange={e => setBackground(e.target.value)}
                rows={3}
                placeholder="e.g. 3 years of React experience, worked at startup, CS degree..."
                className="input resize-none"
              />
            </div>
            <button onClick={handleCoverLetter} disabled={generatingCL} className="btn-primary w-full justify-center">
              {generatingCL
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…</>
                : <><FileText className="w-3.5 h-3.5" /> Generate Cover Letter</>
              }
            </button>
            {coverLetter && (
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Cover Letter</p>
                  <button
                    onClick={() => { navigator.clipboard.writeText(coverLetter); toast('Copied to clipboard') }}
                    className="text-xs text-brand-600 hover:underline"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{coverLetter}</p>
              </div>
            )}
          </div>
        )}

        {/* ── INTERVIEWS ── */}
        {tab === 'interviews' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Interviews</h3>
              <button
                onClick={() => setShowAddInterview(v => !v)}
                className="btn-secondary text-xs py-1.5 px-2.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            {showAddInterview && (
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
                    <select value={intType} onChange={e => setIntType(e.target.value)} className="input">
                      {INTERVIEW_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Date & Time</label>
                    <input
                      type="datetime-local"
                      value={intDate}
                      onChange={e => setIntDate(e.target.value)}
                      className="input"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
                  <input
                    value={intNotes}
                    onChange={e => setIntNotes(e.target.value)}
                    placeholder="Interviewer name, platform..."
                    className="input"
                  />
                </div>
                <button onClick={handleAddInterview} disabled={addingInterview || !intDate} className="btn-primary text-xs">
                  {addingInterview ? 'Scheduling…' : 'Schedule Interview'}
                </button>
              </div>
            )}

            {job.interviews && job.interviews.length > 0 ? (
              <div className="space-y-2">
                {job.interviews.map(iv => (
                  <div key={iv.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{iv.type} Interview</span>
                      {iv.outcome === 'passed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {iv.outcome === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
                      {iv.outcome === 'pending' && <MinusCircle className="w-4 h-4 text-slate-400" />}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {formatDateTime(iv.scheduledAt)}
                    </p>
                    {iv.notes && <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{iv.notes}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-6">No interviews scheduled yet.</p>
            )}
          </div>
        )}

        {/* ── ACTIVITY ── */}
        {tab === 'activity' && (
          <div className="space-y-2">
            {job.activities && job.activities.length > 0 ? (
              job.activities.map(act => (
                <div key={act.id} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-2 shrink-0" />
                  <div>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{act.message}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatRelative(act.createdAt)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 text-center py-6">No activity yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
