'use client'

import { useState, useEffect } from 'react'
import {
  X, ExternalLink, Sparkles, FileText, Calendar, Clock, Trash2, Save,
  BookOpen, ChevronDown, ChevronUp, Plus, CheckCircle, XCircle,
  MinusCircle, Loader2, MapPin, DollarSign, AlertCircle, Target,
  CheckSquare, Square, Mail, Flag, ArrowUpRight, Briefcase, User,
  TrendingUp, Shield, Lightbulb, Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate, formatRelative, formatDateTime } from '@/lib/utils'
import { type Job, type Task, type Contact, type Document, JOB_STATUSES, JOB_PRIORITIES, STATUS_CONFIG, PRIORITY_CONFIG, INTERVIEW_TYPES, RELATIONSHIP_OPTIONS } from '@/lib/types'
import { StatusBadge, PriorityBadge } from './StatusBadge'
import { toast } from 'sonner'

type Tab = 'overview' | 'ai' | 'materials' | 'tasks' | 'interviews' | 'activity'

interface Props {
  job: Job
  onClose: () => void
  onUpdated: () => void
  onDeleted: () => void
}

function parseJsonArray(s: string | null): string[] {
  if (!s) return []
  try { const v = JSON.parse(s); return Array.isArray(v) ? v : [] } catch { return [] }
}
function parseJsonObj(s: string | null): Record<string, unknown> {
  if (!s) return {}
  try { const v = JSON.parse(s); return typeof v === 'object' && !Array.isArray(v) ? v : {} } catch { return {} }
}

export function JobDetailPanel({ job, onClose, onUpdated, onDeleted }: Props) {
  const [tab, setTab] = useState<Tab>('overview')

  // Overview state
  const [status, setStatus] = useState(job.status)
  const [priority, setPriority] = useState(job.priority)
  const [notes, setNotes] = useState(job.notes ?? '')
  const [salary, setSalary] = useState(job.salary ?? '')
  const [location, setLocation] = useState(job.location ?? '')
  const [followUpDate, setFollowUpDate] = useState(job.followUpDate ? job.followUpDate.slice(0, 10) : '')
  const [deadline, setDeadline] = useState(job.deadline ? job.deadline.slice(0, 10) : '')
  const [showJD, setShowJD] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // AI state
  const [analyzing, setAnalyzing] = useState(false)
  const [aiData, setAiData] = useState({
    suggestion: job.aiSuggestion ?? '',
    score: job.aiScore,
    strengths: parseJsonArray(job.aiStrengths),
    risks: parseJsonArray(job.aiRisks),
    nextSteps: parseJsonArray(job.aiNextSteps),
    keySkills: parseJsonObj(job.aiKeySkills) as { have?: string[]; missing?: string[] },
    salaryInsight: job.aiSalaryInsight ?? '',
    cultureFit: job.aiCultureFit ?? '',
  })
  const [salaryAdvice, setSalaryAdvice] = useState('')
  const [loadingSalary, setLoadingSalary] = useState(false)
  const [prepType, setPrepType] = useState('general')
  const [prep, setPrep] = useState('')
  const [generatingPrep, setGeneratingPrep] = useState(false)

  // Materials state
  const [coverLetter, setCoverLetter] = useState(job.coverLetter ?? '')
  const [background, setBackground] = useState('')
  const [generatingCL, setGeneratingCL] = useState(false)
  const [tailoring, setTailoring] = useState(false)
  const [tailorResult, setTailorResult] = useState<Record<string, unknown> | null>(null)
  const [docs, setDocs] = useState<Document[]>(job.documents ?? [])
  const [emailType, setEmailType] = useState('follow_up')
  const [emailResult, setEmailResult] = useState<{ subject: string; body: string } | null>(null)
  const [generatingEmail, setGeneratingEmail] = useState(false)

  // Tasks state
  const [tasks, setTasks] = useState<Task[]>(job.tasks ?? [])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDue, setNewTaskDue] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState('medium')
  const [addingTask, setAddingTask] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)

  // Interviews state
  const [showAddInterview, setShowAddInterview] = useState(false)
  const [intType, setIntType] = useState('phone')
  const [intDate, setIntDate] = useState('')
  const [intNotes, setIntNotes] = useState('')
  const [addingInterview, setAddingInterview] = useState(false)

  // Contacts state (shown in overview)
  const [contacts] = useState<Contact[]>(job.contacts ?? [])

  // Sync when job prop changes
  useEffect(() => {
    setStatus(job.status); setPriority(job.priority); setNotes(job.notes ?? '')
    setSalary(job.salary ?? ''); setLocation(job.location ?? '')
    setFollowUpDate(job.followUpDate ? job.followUpDate.slice(0, 10) : '')
    setDeadline(job.deadline ? job.deadline.slice(0, 10) : '')
    setAiData({
      suggestion: job.aiSuggestion ?? '', score: job.aiScore,
      strengths: parseJsonArray(job.aiStrengths), risks: parseJsonArray(job.aiRisks),
      nextSteps: parseJsonArray(job.aiNextSteps),
      keySkills: parseJsonObj(job.aiKeySkills) as { have?: string[]; missing?: string[] },
      salaryInsight: job.aiSalaryInsight ?? '', cultureFit: job.aiCultureFit ?? '',
    })
    setCoverLetter(job.coverLetter ?? '')
    setTasks(job.tasks ?? [])
    setDocs(job.documents ?? [])
  }, [job])

  // ── Actions ───────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true)
    try {
      await fetch(`/api/jobs/${job.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, priority, notes, salary, location, followUpDate: followUpDate || null, deadline: deadline || null }),
      })
      toast.success('Saved')
      onUpdated()
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${job.company} — ${job.role}"?`)) return
    setDeleting(true)
    try {
      await fetch(`/api/jobs/${job.id}`, { method: 'DELETE' })
      toast.success('Deleted')
      onDeleted()
    } catch { toast.error('Failed to delete'); setDeleting(false) }
  }

  async function handleAnalyze() {
    setAnalyzing(true)
    try {
      const data = await fetch(`/api/jobs/${job.id}/analyze`, { method: 'POST' }).then(r => r.json())
      setAiData({
        suggestion: data.aiSuggestion ?? '',
        score: data.aiScore,
        strengths: parseJsonArray(data.aiStrengths),
        risks: parseJsonArray(data.aiRisks),
        nextSteps: parseJsonArray(data.aiNextSteps),
        keySkills: parseJsonObj(data.aiKeySkills) as { have?: string[]; missing?: string[] },
        salaryInsight: data.aiSalaryInsight ?? '',
        cultureFit: data.aiCultureFit ?? '',
      })
      toast.success('AI analysis complete')
      onUpdated()
    } catch { toast.error('Analysis failed') }
    finally { setAnalyzing(false) }
  }

  async function handleSalaryAdvice() {
    setLoadingSalary(true)
    try {
      const data = await fetch(`/api/jobs/${job.id}/salary-advice`, { method: 'POST' }).then(r => r.json())
      setSalaryAdvice(data.advice ?? '')
    } catch { toast.error('Failed to get salary advice') }
    finally { setLoadingSalary(false) }
  }

  async function handleInterviewPrep() {
    setGeneratingPrep(true)
    try {
      const data = await fetch(`/api/jobs/${job.id}/interview-prep`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewType: prepType }),
      }).then(r => r.json())
      setPrep(data.prep ?? '')
      toast.success('Interview prep ready — saved to Documents')
      onUpdated()
    } catch { toast.error('Failed to generate prep') }
    finally { setGeneratingPrep(false) }
  }

  async function handleCoverLetter() {
    setGeneratingCL(true)
    try {
      const data = await fetch(`/api/jobs/${job.id}/cover-letter`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ background }),
      }).then(r => r.json())
      setCoverLetter(data.coverLetter ?? '')
      toast.success('Cover letter generated')
      onUpdated()
    } catch { toast.error('Generation failed') }
    finally { setGeneratingCL(false) }
  }

  async function handleTailor() {
    setTailoring(true)
    try {
      const data = await fetch(`/api/jobs/${job.id}/resume-tailor`, { method: 'POST' }).then(r => r.json())
      setTailorResult(data)
      toast.success('Resume tailored — saved to Documents')
      onUpdated()
    } catch { toast.error('Tailoring failed') }
    finally { setTailoring(false) }
  }

  async function handleEmail() {
    setGeneratingEmail(true)
    try {
      const data = await fetch(`/api/jobs/${job.id}/email`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: emailType }),
      }).then(r => r.json())
      setEmailResult(data)
    } catch { toast.error('Failed to generate email') }
    finally { setGeneratingEmail(false) }
  }

  async function handleAddInterview() {
    if (!intDate) return
    setAddingInterview(true)
    try {
      await fetch(`/api/jobs/${job.id}/interviews`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: intType, scheduledAt: intDate, notes: intNotes || null }),
      })
      toast.success('Interview scheduled')
      setShowAddInterview(false); setIntDate(''); setIntNotes('')
      onUpdated()
    } catch { toast.error('Failed to add interview') }
    finally { setAddingInterview(false) }
  }

  async function handleAddTask() {
    if (!newTaskTitle.trim()) return
    setAddingTask(true)
    try {
      const data = await fetch(`/api/jobs/${job.id}/tasks`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTaskTitle, dueDate: newTaskDue || null, priority: newTaskPriority }),
      }).then(r => r.json())
      setTasks(ts => [...ts, data])
      setNewTaskTitle(''); setNewTaskDue(''); setNewTaskPriority('medium')
      setShowAddTask(false)
      toast.success('Task added')
    } catch { toast.error('Failed to add task') }
    finally { setAddingTask(false) }
  }

  async function toggleTask(task: Task) {
    try {
      await fetch(`/api/jobs/${job.id}/tasks/${task.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed }),
      })
      setTasks(ts => ts.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t))
    } catch { toast.error('Failed to update task') }
  }

  async function deleteTask(task: Task) {
    try {
      await fetch(`/api/jobs/${job.id}/tasks/${task.id}`, { method: 'DELETE' })
      setTasks(ts => ts.filter(t => t.id !== task.id))
    } catch { toast.error('Failed to delete task') }
  }

  // ── Tabs config ───────────────────────────────────────────────────────────
  const pendingTasks = tasks.filter(t => !t.completed).length
  const TABS: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'ai', label: 'AI Coach', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'materials', label: 'Materials', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-3.5 h-3.5" />, badge: pendingTasks || undefined },
    { id: 'interviews', label: 'Interviews', icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'activity', label: 'Activity', icon: <Clock className="w-3.5 h-3.5" /> },
  ]

  const scoreColor = !aiData.score ? 'text-slate-400'
    : aiData.score >= 75 ? 'text-emerald-600 dark:text-emerald-400'
    : aiData.score >= 55 ? 'text-amber-600 dark:text-amber-400'
    : 'text-red-600 dark:text-red-400'

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {job.company[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-slate-900 dark:text-white text-base truncate">{job.company}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{job.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <StatusBadge status={status} />
              <PriorityBadge priority={priority} />
              {job.remote && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300">Remote</span>}
              {job.hybrid && !job.remote && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">Hybrid</span>}
              {aiData.score !== null && (
                <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700', scoreColor)}>
                  AI {aiData.score}/100
                </span>
              )}
              {job.source && <span className="text-[10px] text-slate-400 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full">{job.source}</span>}
            </div>
            {job.jobUrl && (
              <a href={job.jobUrl} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline mt-1.5 font-medium">
                <ArrowUpRight className="w-3 h-3" /> Apply / View Posting
              </a>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 dark:border-slate-700 shrink-0 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn(
              'relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors',
              tab === t.id ? 'border-brand-600 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            )}
          >
            {t.icon} {t.label}
            {t.badge ? (
              <span className="ml-0.5 w-4 h-4 rounded-full bg-brand-500 text-white text-[9px] font-bold flex items-center justify-center">
                {t.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value as typeof status)} className="input">
                  {JOB_STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Priority</label>
                <select value={priority} onChange={e => setPriority(e.target.value as typeof priority)} className="input">
                  {JOB_PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label"><MapPin className="w-3 h-3 inline mr-1" />Location</label>
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Remote / City" className="input" />
              </div>
              <div>
                <label className="label"><DollarSign className="w-3 h-3 inline mr-1" />Salary</label>
                <input value={salary} onChange={e => setSalary(e.target.value)} placeholder="$80k–$100k" className="input" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label"><Calendar className="w-3 h-3 inline mr-1" />Follow-up Date</label>
                <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label"><AlertCircle className="w-3 h-3 inline mr-1" />Deadline</label>
                <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="input" />
              </div>
            </div>

            <div>
              <label className="label">Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} placeholder="Add notes, contacts, requirements..." className="input resize-none" />
            </div>

            {/* Job Description */}
            {job.jobDescription && (
              <div>
                <button onClick={() => setShowJD(v => !v)} className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 transition-colors">
                  <Briefcase className="w-3.5 h-3.5" /> Job Description
                  {showJD ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {showJD && (
                  <div className="mt-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                    {job.jobDescription}
                  </div>
                )}
              </div>
            )}

            {/* Contacts */}
            {contacts.length > 0 && (
              <div>
                <label className="label"><User className="w-3 h-3 inline mr-1" />Contacts</label>
                <div className="space-y-1.5">
                  {contacts.map(c => (
                    <div key={c.id} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg px-3 py-2">
                      <div className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-[10px] font-bold text-brand-600 shrink-0">
                        {c.name[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{c.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{c.title ?? c.relationship}</p>
                      </div>
                      {c.email && <a href={`mailto:${c.email}`} className="text-[10px] text-brand-600 hover:underline shrink-0">{c.email}</a>}
                      {c.linkedin && <a href={c.linkedin} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 hover:underline shrink-0">LinkedIn</a>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-slate-400 space-y-0.5">
              <p>Applied: {formatDate(job.dateApplied)}</p>
              {job.source && <p>Source: {job.source}{job.discoveredBy === 'agent' && ' · AI discovered'}</p>}
              {job.industry && <p>Industry: {job.industry}</p>}
              {job.techStack && <p>Tech: {job.techStack}</p>}
              <p>Updated: {formatRelative(job.updatedAt)}</p>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
                {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</> : <><Save className="w-3.5 h-3.5" /> Save Changes</>}
              </button>
              <button onClick={handleDelete} disabled={deleting} className="btn-danger">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}

        {/* ── AI COACH ── */}
        {tab === 'ai' && (
          <div className="space-y-5">
            {/* Fit Score + Analyze button */}
            <div className="flex items-center gap-4">
              {aiData.score !== null ? (
                <div className="relative w-16 h-16 shrink-0">
                  <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
                    <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="5" className="text-slate-100 dark:text-slate-700" />
                    <circle cx="32" cy="32" r="26" fill="none" strokeWidth="5"
                      stroke={aiData.score >= 75 ? '#10b981' : aiData.score >= 55 ? '#f59e0b' : '#ef4444'}
                      strokeDasharray={`${(aiData.score / 100) * 163} 163`}
                      strokeLinecap="round" className="transition-all duration-700"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={cn('text-sm font-bold', scoreColor)}>{aiData.score}</span>
                  </div>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-slate-400" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {aiData.score !== null ? `${aiData.score >= 75 ? 'Strong' : aiData.score >= 55 ? 'Moderate' : 'Weak'} fit` : 'Not analyzed yet'}
                </p>
                {aiData.suggestion && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{aiData.suggestion}</p>}
                {job.aiLastAnalyzed && <p className="text-[11px] text-slate-400 mt-1">Last analyzed {formatRelative(job.aiLastAnalyzed)}</p>}
              </div>
              <button onClick={handleAnalyze} disabled={analyzing} className="btn-primary shrink-0 text-xs py-1.5 px-3">
                {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {analyzing ? 'Analyzing…' : aiData.score !== null ? 'Re-analyze' : 'Analyze'}
              </button>
            </div>

            {/* Full AI breakdown */}
            {(aiData.strengths.length > 0 || aiData.risks.length > 0) && (
              <div className="grid grid-cols-2 gap-3">
                {aiData.strengths.length > 0 && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-xl p-3">
                    <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase mb-2 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Strengths
                    </p>
                    <ul className="space-y-1">
                      {aiData.strengths.map((s, i) => <li key={i} className="text-xs text-emerald-800 dark:text-emerald-300 leading-snug">• {s}</li>)}
                    </ul>
                  </div>
                )}
                {aiData.risks.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800 rounded-xl p-3">
                    <p className="text-[10px] font-semibold text-red-700 dark:text-red-400 uppercase mb-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Risks
                    </p>
                    <ul className="space-y-1">
                      {aiData.risks.map((r, i) => <li key={i} className="text-xs text-red-800 dark:text-red-300 leading-snug">• {r}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {aiData.nextSteps.length > 0 && (
              <div className="bg-brand-50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-800 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-brand-700 dark:text-brand-400 uppercase mb-2 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3" /> Next Steps
                </p>
                <ol className="space-y-1">
                  {aiData.nextSteps.map((s, i) => <li key={i} className="text-xs text-brand-800 dark:text-brand-300 leading-snug">{i + 1}. {s}</li>)}
                </ol>
              </div>
            )}

            {aiData.keySkills && (aiData.keySkills.have?.length || aiData.keySkills.missing?.length) ? (
              <div>
                <p className="text-[10px] font-semibold uppercase text-slate-500 mb-2 flex items-center gap-1"><Target className="w-3 h-3" /> Key Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {(aiData.keySkills.have ?? []).map(s => (
                    <span key={s} className="text-[11px] bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                  {(aiData.keySkills.missing ?? []).map(s => (
                    <span key={s} className="text-[11px] bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full">{s} ✗</span>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Green = you have it · Red = missing</p>
              </div>
            ) : null}

            {aiData.salaryInsight && (
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
                <p className="text-[10px] font-semibold uppercase text-slate-500 mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Salary Insight</p>
                <p className="text-xs text-slate-600 dark:text-slate-300">{aiData.salaryInsight}</p>
              </div>
            )}

            {aiData.cultureFit && (
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
                <p className="text-[10px] font-semibold uppercase text-slate-500 mb-1 flex items-center gap-1"><Star className="w-3 h-3" /> Culture Fit</p>
                <p className="text-xs text-slate-600 dark:text-slate-300">{aiData.cultureFit}</p>
              </div>
            )}

            {/* Salary Advice */}
            <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-brand-500" /> Salary Advice</p>
                <button onClick={handleSalaryAdvice} disabled={loadingSalary} className="btn-secondary text-xs py-1 px-2.5">
                  {loadingSalary ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Get Advice'}
                </button>
              </div>
              {salaryAdvice && <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 leading-relaxed">{salaryAdvice}</p>}
            </div>

            {/* Interview Prep */}
            <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
              <p className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Shield className="w-4 h-4 text-brand-500" /> Interview Prep</p>
              <div className="flex gap-2">
                <select value={prepType} onChange={e => setPrepType(e.target.value)} className="input flex-1 text-xs">
                  {INTERVIEW_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  <option value="general">General</option>
                </select>
                <button onClick={handleInterviewPrep} disabled={generatingPrep} className="btn-primary shrink-0 text-xs px-3">
                  {generatingPrep ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                </button>
              </div>
              {prep && (
                <div className="mt-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                  {prep}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── MATERIALS ── */}
        {tab === 'materials' && (
          <div className="space-y-5">
            {/* Cover Letter */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold flex items-center gap-1.5"><FileText className="w-4 h-4 text-brand-500" /> Cover Letter</p>
                <button onClick={handleCoverLetter} disabled={generatingCL} className="btn-primary text-xs py-1 px-2.5">
                  {generatingCL ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  {generatingCL ? 'Generating…' : coverLetter ? 'Regenerate' : 'Generate'}
                </button>
              </div>
              <input value={background} onChange={e => setBackground(e.target.value)} placeholder="Your background context (optional)..." className="input text-xs mb-2" />
              {coverLetter && (
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">Cover Letter</p>
                    <button onClick={() => { navigator.clipboard.writeText(coverLetter); toast.success('Copied!') }} className="text-xs text-brand-600 hover:underline">Copy</button>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">{coverLetter}</p>
                </div>
              )}
            </div>

            {/* Resume Tailor */}
            <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold flex items-center gap-1.5"><Target className="w-4 h-4 text-brand-500" /> Resume Tailor</p>
                <button onClick={handleTailor} disabled={tailoring || !job.jobDescription} className="btn-primary text-xs py-1 px-2.5" title={!job.jobDescription ? 'Add a job description first' : ''}>
                  {tailoring ? <Loader2 className="w-3 h-3 animate-spin" /> : <Target className="w-3 h-3" />}
                  {tailoring ? 'Tailoring…' : 'Tailor'}
                </button>
              </div>
              {!job.jobDescription && <p className="text-xs text-slate-400 mb-2">Add a job description in Overview to enable tailoring.</p>}
              {tailorResult && (
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="text-center"><p className="text-xl font-bold text-slate-400">{String(tailorResult.atsScoreBefore ?? 0)}</p><p className="text-[10px] text-slate-400">Before</p></div>
                    <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${tailorResult.atsScoreAfter as number ?? 0}%` }} /></div>
                    <div className="text-center"><p className="text-xl font-bold text-emerald-600">{String(tailorResult.atsScoreAfter ?? 0)}</p><p className="text-[10px] text-slate-400">After</p></div>
                  </div>
                  {(tailorResult.missingKeywords as string[] ?? []).length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-red-600 mb-1">Missing Keywords</p>
                      <div className="flex flex-wrap gap-1">
                        {(tailorResult.missingKeywords as string[]).map(k => <span key={k} className="text-[10px] bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded-full">{k}</span>)}
                      </div>
                    </div>
                  )}
                  {tailorResult.tailoredSummary != null && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-slate-500 mb-1">Tailored Summary</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 bg-brand-50 dark:bg-brand-900/10 p-2.5 rounded-lg">{String(tailorResult.tailoredSummary)}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Email Generator */}
            <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
              <p className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Mail className="w-4 h-4 text-brand-500" /> Email Generator</p>
              <div className="flex gap-2">
                <select value={emailType} onChange={e => setEmailType(e.target.value)} className="input flex-1 text-xs">
                  {[['follow_up','Follow-up'],['thank_you','Thank You'],['withdraw','Withdraw'],['counter_offer','Counter Offer'],['networking','Networking'],['cold_outreach','Cold Outreach']].map(([v,l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
                <button onClick={handleEmail} disabled={generatingEmail} className="btn-primary shrink-0 text-xs px-3">
                  {generatingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                </button>
              </div>
              {emailResult && (
                <div className="mt-2 bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold text-slate-500">Subject: {emailResult.subject}</p>
                    <button onClick={() => { navigator.clipboard.writeText(`Subject: ${emailResult.subject}\n\n${emailResult.body}`); toast.success('Copied!') }} className="text-[10px] text-brand-600 hover:underline">Copy all</button>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">{emailResult.body}</p>
                </div>
              )}
            </div>

            {/* Saved Documents */}
            {docs.length > 0 && (
              <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                <p className="text-sm font-semibold mb-2 flex items-center gap-1.5"><FileText className="w-4 h-4 text-slate-500" /> Saved Documents ({docs.length})</p>
                <div className="space-y-2">
                  {docs.map(doc => (
                    <div key={doc.id} className="flex items-start gap-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{doc.name}</p>
                        <p className="text-[10px] text-slate-400">{doc.type} · {formatRelative(doc.createdAt)}</p>
                      </div>
                      <button onClick={() => { navigator.clipboard.writeText(doc.content); toast.success('Copied!') }} className="text-[10px] text-brand-600 hover:underline shrink-0">Copy</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TASKS ── */}
        {tab === 'tasks' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{tasks.filter(t => !t.completed).length} pending · {tasks.filter(t => t.completed).length} done</p>
              <button onClick={() => setShowAddTask(v => !v)} className="btn-secondary text-xs py-1.5 px-2.5">
                <Plus className="w-3.5 h-3.5" /> Add Task
              </button>
            </div>

            {showAddTask && (
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-3">
                <input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="Task title..." className="input text-xs" onKeyDown={e => e.key === 'Enter' && handleAddTask()} />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label">Due Date</label>
                    <input type="date" value={newTaskDue} onChange={e => setNewTaskDue(e.target.value)} className="input text-xs" />
                  </div>
                  <div>
                    <label className="label">Priority</label>
                    <select value={newTaskPriority} onChange={e => setNewTaskPriority(e.target.value)} className="input text-xs">
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>
                <button onClick={handleAddTask} disabled={addingTask || !newTaskTitle.trim()} className="btn-primary text-xs w-full justify-center">
                  {addingTask ? 'Adding…' : 'Add Task'}
                </button>
              </div>
            )}

            {tasks.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No tasks yet</p>
                <p className="text-xs mt-1">Add tasks to track what you need to do</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {tasks.sort((a, b) => (a.completed ? 1 : -1) - (b.completed ? 1 : -1)).map(task => {
                  const overdue = !task.completed && task.dueDate && new Date(task.dueDate) < new Date()
                  return (
                    <div key={task.id} className="flex items-start gap-2 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 group transition-colors">
                      <button onClick={() => toggleTask(task)} className="mt-0.5 shrink-0 text-slate-400 hover:text-brand-500 transition-colors">
                        {task.completed ? <CheckSquare className="w-4 h-4 text-emerald-500" /> : <Square className="w-4 h-4" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm', task.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200')}>{task.title}</p>
                        {task.dueDate && (
                          <p className={cn('text-[11px] flex items-center gap-1 mt-0.5', overdue ? 'text-red-500' : 'text-slate-400')}>
                            <Calendar className="w-3 h-3" />{formatDate(task.dueDate)}{overdue && ' · Overdue'}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className={cn('text-[10px] font-medium', task.priority === 'high' ? 'text-red-500' : task.priority === 'medium' ? 'text-amber-500' : 'text-emerald-500')}>
                          <Flag className="w-3 h-3" />
                        </span>
                        <button onClick={() => deleteTask(task)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── INTERVIEWS ── */}
        {tab === 'interviews' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Interviews ({job.interviews?.length ?? 0})</h3>
              <button onClick={() => setShowAddInterview(v => !v)} className="btn-secondary text-xs py-1.5 px-2.5">
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            {showAddInterview && (
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Type</label>
                    <select value={intType} onChange={e => setIntType(e.target.value)} className="input">
                      {INTERVIEW_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Date & Time</label>
                    <input type="datetime-local" value={intDate} onChange={e => setIntDate(e.target.value)} className="input" />
                  </div>
                </div>
                <input value={intNotes} onChange={e => setIntNotes(e.target.value)} placeholder="Interviewer, platform, notes..." className="input text-xs" />
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
                      <span className="text-sm font-medium capitalize">{iv.type} Interview · Round {iv.round}</span>
                      {iv.outcome === 'passed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {iv.outcome === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
                      {(iv.outcome === 'pending' || iv.outcome === 'scheduled') && <MinusCircle className="w-4 h-4 text-slate-400" />}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatDateTime(iv.scheduledAt)}</p>
                    {iv.notes && <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{iv.notes}</p>}
                    {iv.feedbackReceived && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 italic">{iv.feedbackReceived}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No interviews scheduled yet</p>
              </div>
            )}
          </div>
        )}

        {/* ── ACTIVITY ── */}
        {tab === 'activity' && (
          <div className="space-y-2">
            {job.activities && job.activities.length > 0 ? (
              job.activities.map(act => (
                <div key={act.id} className="flex gap-3">
                  <div className={cn('w-1.5 h-1.5 rounded-full mt-2 shrink-0', act.type === 'agent' ? 'bg-brand-400' : act.type === 'ai_analyzed' ? 'bg-purple-400' : 'bg-slate-300 dark:bg-slate-600')} />
                  <div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">{act.message}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatRelative(act.createdAt)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No activity yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
