'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Bot, Play, CheckCircle, AlertCircle, Clock, Zap, RotateCcw,
  ExternalLink, ChevronDown, ChevronRight, MapPin, Building2,
  Sparkles, Briefcase, ArrowUpRight, Save, Settings2, Loader2,
  Target, Brain, DollarSign, Wifi, ChevronUp,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatRelative } from '@/lib/utils'
import { toast } from 'sonner'
import type { AgentSession, UserProfile } from '@/lib/types'
import { CURRENCY_OPTIONS } from '@/lib/types'
import Link from 'next/link'

interface LogLine {
  message: string
  type: 'log' | 'job_added' | 'found' | 'error' | 'complete'
  timestamp: string
}

interface SessionJob {
  id: string
  company: string
  role: string
  location: string | null
  remote: boolean
  hybrid: boolean
  salary: string | null
  salaryRaw: string | null
  aiScore: number | null
  aiSuggestion: string | null
  source: string | null
  jobUrl: string | null
  industry: string | null
  priority: string
  status: string
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return null
  const color = score >= 75 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
    : score >= 55 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
    : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
  return (
    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums', color)}>
      {score}/100
    </span>
  )
}

function SessionJobRow({ job }: { job: SessionJob }) {
  const sourceLabel = job.source ?? 'AI'
  const hasLink = !!job.jobUrl

  return (
    <div className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5">
        {job.company[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">{job.company}</span>
          <ScoreBadge score={job.aiScore} />
          <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-medium">
            {sourceLabel}
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{job.role}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {job.location}
              {job.remote && ' · Remote'}
              {job.hybrid && ' · Hybrid'}
            </span>
          )}
          {(job.salary || job.salaryRaw) && (
            <span>{job.salary ?? job.salaryRaw}</span>
          )}
        </div>
        {job.aiSuggestion && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 line-clamp-1 italic">{job.aiSuggestion}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link
          href={`/jobs?id=${job.id}`}
          className="flex items-center gap-1 text-[11px] font-medium text-brand-600 dark:text-brand-400 hover:underline"
        >
          <Briefcase className="w-3.5 h-3.5" />
          Board
        </Link>
        {hasLink ? (
          <a
            href={job.jobUrl!}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 px-2 py-1 rounded-lg transition-colors"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Apply
          </a>
        ) : (
          <span className="text-[11px] text-slate-300 dark:text-slate-600 italic">no link</span>
        )}
      </div>
    </div>
  )
}

function SessionRow({ session }: { session: AgentSession }) {
  const [expanded, setExpanded] = useState(false)
  const [jobs, setJobs] = useState<SessionJob[]>([])
  const [loadingJobs, setLoadingJobs] = useState(false)

  async function toggleExpand() {
    if (!expanded && jobs.length === 0 && session.jobsAdded > 0) {
      setLoadingJobs(true)
      try {
        const data = await fetch(`/api/agent/sessions/${session.id}/jobs`).then(r => r.json())
        setJobs(Array.isArray(data) ? data : [])
      } catch {
        toast.error('Failed to load session jobs')
      } finally {
        setLoadingJobs(false)
      }
    }
    setExpanded(v => !v)
  }

  const isClickable = session.status === 'completed' && session.jobsAdded > 0

  return (
    <div className="border-b border-slate-100 dark:border-slate-700/60 last:border-0">
      <button
        onClick={isClickable ? toggleExpand : undefined}
        className={cn(
          'w-full px-5 py-4 flex items-center gap-4 text-left transition-colors',
          isClickable
            ? 'hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer'
            : 'cursor-default'
        )}
      >
        <div className={cn(
          'w-2 h-2 rounded-full shrink-0',
          session.status === 'completed' ? 'bg-green-500'
            : session.status === 'failed' ? 'bg-red-500'
            : 'bg-amber-500 animate-pulse'
        )} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {session.status === 'completed'
              ? `Found ${session.jobsFound} jobs · Added ${session.jobsAdded} new`
              : session.status === 'failed'
              ? `Failed: ${session.error ?? 'Unknown error'}`
              : 'Running...'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatRelative(session.startedAt)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn(
            'text-[10px] font-semibold px-2 py-0.5 rounded-full',
            session.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
              : session.status === 'failed' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
          )}>
            {session.status}
          </span>
          {isClickable && (
            <div className="text-slate-400">
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </div>
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/30">
              {loadingJobs ? (
                <div className="px-5 py-6 text-center text-xs text-slate-400 animate-pulse">Loading jobs…</div>
              ) : jobs.length === 0 ? (
                <div className="px-5 py-6 text-center text-xs text-slate-400">No jobs found in this session</div>
              ) : (
                <>
                  <div className="px-5 py-2.5 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      {jobs.length} job{jobs.length !== 1 ? 's' : ''} added · hover to see actions
                    </span>
                    <Link
                      href="/jobs?discoveredBy=agent"
                      className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                    >
                      View all on board <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-700/40">
                    {jobs.map(job => (
                      <SessionJobRow key={job.id} job={job} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Inline search preferences panel ─────────────────────────────────────────

function SearchPreferencesPanel({
  profile,
  onSaved,
}: {
  profile: UserProfile
  onSaved: (p: UserProfile) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<UserProfile>(profile)
  const [saving, setSaving] = useState(false)

  // Sync if parent profile changes (initial load)
  useEffect(() => { setDraft(profile) }, [profile])

  function update(key: keyof UserProfile, value: unknown) {
    setDraft(d => ({ ...d, [key]: value }))
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      if (!res.ok) throw new Error()
      const saved = await res.json()
      onSaved(saved)
      toast.success('Search preferences saved!')
      setOpen(false)
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const isComplete = !!draft.targetRoles && !!draft.skills

  return (
    <div className="card overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors text-left"
      >
        <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
          <Settings2 className="w-4.5 h-4.5 text-brand-600 dark:text-brand-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Search Preferences</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {isComplete
              ? `${draft.targetRoles.split(',').filter(Boolean).slice(0, 2).map(r => r.trim()).join(', ')}${draft.preferRemote ? ' · Remote' : ''}${draft.preferHybrid ? ' · Hybrid' : ''}`
              : 'Set your target roles and skills to enable the agent'}
          </p>
        </div>
        {!isComplete && (
          <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full shrink-0">
            Required
          </span>
        )}
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>

      {/* Expandable form */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 dark:border-slate-700/60 p-5 space-y-5">

              {/* Target roles + skills */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                    <Target className="w-3.5 h-3.5 text-brand-500" /> Target Roles *
                  </label>
                  <input
                    value={draft.targetRoles}
                    onChange={e => update('targetRoles', e.target.value)}
                    placeholder="Software Engineer, Frontend Developer"
                    className="input text-sm"
                  />
                  <p className="text-[10px] text-slate-400">Comma-separated · up to 3 used per search</p>
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                    <Brain className="w-3.5 h-3.5 text-brand-500" /> Skills *
                  </label>
                  <input
                    value={draft.skills}
                    onChange={e => update('skills', e.target.value)}
                    placeholder="TypeScript, React, Next.js, Python"
                    className="input text-sm"
                  />
                  <p className="text-[10px] text-slate-400">Used to score how well each job fits you</p>
                </div>
              </div>

              {/* Locations */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                  <MapPin className="w-3.5 h-3.5 text-brand-500" /> Target Locations
                </label>
                <input
                  value={draft.targetLocations}
                  onChange={e => update('targetLocations', e.target.value)}
                  placeholder="Toronto, Vancouver, New York (comma-separated)"
                  className="input text-sm"
                />
              </div>

              {/* Salary + work style in one row */}
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                    <DollarSign className="w-3.5 h-3.5 text-brand-500" /> Salary Range
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={draft.currency}
                      onChange={e => update('currency', e.target.value)}
                      className="input text-sm w-20"
                    >
                      {CURRENCY_OPTIONS.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                      <input
                        type="number"
                        value={draft.targetSalaryMin}
                        onChange={e => update('targetSalaryMin', Number(e.target.value))}
                        placeholder="60"
                        className="input text-sm pl-5 w-24"
                      />
                    </div>
                    <span className="text-slate-400 text-sm">–</span>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                      <input
                        type="number"
                        value={draft.targetSalaryMax}
                        onChange={e => update('targetSalaryMax', Number(e.target.value))}
                        placeholder="120"
                        className="input text-sm pl-5 w-24"
                      />
                    </div>
                    <span className="text-slate-400 text-xs">k/yr</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                    <Wifi className="w-3.5 h-3.5 text-brand-500" /> Work Style
                  </label>
                  <div className="flex gap-2">
                    {([['preferRemote', '🌍 Remote'] , ['preferHybrid', '🏢 Hybrid']] as [keyof UserProfile, string][]).map(([key, label]) => (
                      <label key={key as string} className={cn(
                        'flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 cursor-pointer text-sm font-medium transition-all select-none',
                        draft[key]
                          ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
                      )}>
                        <input
                          type="checkbox"
                          checked={draft[key] as boolean}
                          onChange={e => update(key, e.target.checked)}
                          className="sr-only"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Exclude keywords */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                  Exclude Keywords
                </label>
                <input
                  value={draft.excludeKeywords}
                  onChange={e => update('excludeKeywords', e.target.value)}
                  placeholder="senior, lead, manager, 10+ years (comma-separated)"
                  className="input text-sm"
                />
                <p className="text-[10px] text-slate-400">Jobs containing these words will be filtered out</p>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/60">
                <p className="text-xs text-slate-400">Changes apply on the next agent run</p>
                <button onClick={save} disabled={saving} className="btn-primary text-sm py-2 px-5">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {saving ? 'Saving…' : 'Save Preferences'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function AgentPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [sessions, setSessions] = useState<AgentSession[]>([])
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState<LogLine[]>([])
  const [step, setStep] = useState(0)
  const [result, setResult] = useState<{ added: number; skipped: number } | null>(null)
  const terminalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(setProfile).catch(() => {})
    loadSessions()
  }, [])

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [log])

  async function loadSessions() {
    try {
      const data = await fetch('/api/agent/sessions').then(r => r.json())
      setSessions(Array.isArray(data) ? data : [])
    } catch { /* ignore */ }
  }

  async function runAgent() {
    if (running) return
    setRunning(true)
    setLog([])
    setResult(null)
    setStep(1)

    const addLog = (msg: string, type: LogLine['type'] = 'log') => {
      setLog(prev => [...prev, { message: msg, type, timestamp: new Date().toISOString() }])
    }

    try {
      const res = await fetch('/api/agent/discover', { method: 'POST' })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'Agent failed to start')
        setRunning(false)
        return
      }

      const reader = res.body?.getReader()
      if (!reader) { setRunning(false); return }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.message) addLog(data.message, data.type)
            if (data.step) setStep(data.step)
            if (data.type === 'complete') {
              setResult({ added: data.added ?? 0, skipped: data.skipped ?? 0 })
              setStep(4)
              toast.success(`🤖 Agent added ${data.added} new jobs!`)
              loadSessions()
            }
            if (data.type === 'error') toast.error(data.message)
          } catch { /* skip malformed */ }
        }
      }
    } catch (err) {
      addLog(`❌ Connection error: ${err instanceof Error ? err.message : 'Unknown'}`, 'error')
      toast.error('Agent connection failed')
    } finally {
      setRunning(false)
    }
  }

  const profileIncomplete = !profile?.targetRoles || !profile?.skills
  const STEPS = ['Searching', 'Analyzing', 'Adding Jobs', 'Complete']

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f0e1a] p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-brand-500" /> Job Discovery Agent
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Searches LinkedIn, Indeed & Glassdoor — scores every posting — adds the best matches automatically
          </p>
        </div>
        <div className={cn(
          'flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full',
          running ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
            : result ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
        )}>
          <span className={cn('w-2 h-2 rounded-full', running ? 'bg-amber-500 animate-pulse' : result ? 'bg-green-500' : 'bg-slate-400')} />
          {running ? 'Running...' : result ? 'Completed' : 'Ready'}
        </div>
      </div>

      {/* Search preferences (replaces the old warning banner) */}
      {profile && (
        <SearchPreferencesPanel
          profile={profile}
          onSaved={setProfile}
        />
      )}

      {/* Agent launch card */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-glow-brand shrink-0 animate-float">
            <Bot className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {running ? 'Agent is running...' : 'Ready to find your next opportunity'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Pulls real listings from LinkedIn, Indeed & Glassdoor via JSearch · RemoteOK · AI-augmented search
            </p>
            {profile && profile.targetRoles && (
              <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
                {profile.targetRoles.split(',').filter(Boolean).slice(0, 3).map(r => (
                  <span key={r} className="text-xs bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 px-2.5 py-1 rounded-full font-medium">
                    {r.trim()}
                  </span>
                ))}
                {profile.preferRemote && (
                  <span className="text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full font-medium">
                    🌐 Remote
                  </span>
                )}
                {profile.preferHybrid && (
                  <span className="text-xs bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 px-2.5 py-1 rounded-full font-medium">
                    🏢 Hybrid
                  </span>
                )}
              </div>
            )}
            {profileIncomplete && (
              <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Set your target roles and skills above to enable the agent
              </p>
            )}
          </div>
          <div className="shrink-0">
            <button
              onClick={runAgent}
              disabled={running || profileIncomplete}
              className={cn(
                'flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all',
                running ? 'bg-slate-400 cursor-not-allowed'
                  : profileIncomplete ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-brand shadow-glow-brand hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]'
              )}
            >
              {running
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Running...</>
                : <><Play className="w-4 h-4" /> Start Agent</>
              }
            </button>
          </div>
        </div>
      </div>

      {/* Progress steps */}
      {(running || result) && (
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => {
            const done = step > i + 1 || (!!result && i < 4)
            const active = step === i + 1 && running
            return (
              <div key={s} className="flex items-center gap-2 flex-1 last:flex-none">
                <div className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  done ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : active ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                )}>
                  {done ? <CheckCircle className="w-3 h-3" />
                    : active ? <Zap className="w-3 h-3 animate-pulse" />
                    : <span className="w-3 h-3 rounded-full border border-current flex items-center justify-center text-[8px]">{i + 1}</span>}
                  {s}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn('flex-1 h-px', done ? 'bg-green-300 dark:bg-green-700' : 'bg-slate-200 dark:bg-slate-700')} />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Live terminal */}
      {log.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0d0c18] border-b border-white/5">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
            </div>
            <span className="text-xs text-slate-400 font-mono ml-1">agent.log</span>
          </div>
          <div ref={terminalRef} className="bg-[#0d0c18] font-mono text-xs p-4 h-56 overflow-y-auto space-y-1">
            {log.map((line, i) => (
              <div key={i} className={cn(
                'leading-relaxed',
                line.type === 'error' ? 'text-red-400'
                  : line.type === 'job_added' ? 'text-emerald-400'
                  : line.type === 'complete' ? 'text-brand-400 font-semibold'
                  : 'text-slate-300'
              )}>
                <span className="text-slate-600 mr-2">{new Date(line.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                {line.message}
              </div>
            ))}
            {running && <div className="text-slate-500 animate-pulse">█</div>}
          </div>
        </div>
      )}

      {/* Result card */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 border-brand-200 dark:border-brand-800"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Agent completed!</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Added <strong className="text-brand-600 dark:text-brand-400">{result.added} new jobs</strong>
                  {result.skipped > 0 && `, skipped ${result.skipped} duplicates`}
                </p>
              </div>
              <div className="ml-auto flex gap-2">
                <button onClick={runAgent} className="btn-secondary text-xs py-1.5 px-3">
                  <RotateCcw className="w-3.5 h-3.5" /> Run Again
                </button>
                <Link href="/jobs?discoveredBy=agent" className="btn-primary text-xs py-1.5 px-3">
                  <Briefcase className="w-3.5 h-3.5" /> View on Board
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Past sessions */}
      {sessions.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Past Sessions</h2>
              <p className="text-xs text-slate-400 mt-0.5">Click a session to see which jobs were found · hover a job to apply or view</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>{sessions.reduce((a, s) => a + (s.jobsAdded ?? 0), 0)} total added</span>
            </div>
          </div>
          <div>
            {sessions.map(session => (
              <SessionRow key={session.id} session={session} />
            ))}
          </div>
        </div>
      )}

      {sessions.length === 0 && !running && (
        <div className="card p-10 text-center">
          <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No sessions yet</p>
          <p className="text-xs text-slate-400 mt-1">Run the agent to start discovering jobs automatically</p>
        </div>
      )}
    </div>
  )
}
