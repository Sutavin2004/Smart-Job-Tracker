'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Play, CheckCircle, AlertCircle, Clock, Zap, RotateCcw,
  ExternalLink, ChevronDown, ChevronRight, MapPin, Building2,
  Sparkles, Briefcase, ArrowUpRight, Save, Loader2,
  Target, Brain, DollarSign, Wifi, ChevronUp, CalendarClock,
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
    : 'bg-slate-100 text-slate-500 dark:bg-[#26272A] dark:text-slate-400'
  return (
    <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full tabular-nums', color)}>
      {score}/100
    </span>
  )
}

function SessionJobRow({ job }: { job: SessionJob }) {
  const sourceLabel = job.source ?? 'AI'
  const hasLink = !!job.jobUrl

  return (
    <div className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">{job.company}</span>
          <ScoreBadge score={job.aiScore} />
          <span className="text-[11px] bg-slate-100 dark:bg-[#26272A] text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-medium">
            {sourceLabel}
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{job.role}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {job.location}
              {job.remote && ', remote'}
              {job.hybrid && ' · Hybrid'}
            </span>
          )}
          {(job.salary || job.salaryRaw) && (
            <span>{job.salary ?? job.salaryRaw}</span>
          )}
        </div>
        {job.aiSuggestion && (
          <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-1 line-clamp-1 italic">{job.aiSuggestion}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
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
            className="flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#26272A] hover:bg-slate-200 dark:hover:bg-slate-600 px-2 py-1 rounded-lg transition-colors"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Apply
          </a>
        ) : (
          <span className="text-[11px] text-slate-300 dark:text-slate-400 italic">no link</span>
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
    <div className="border-b border-slate-200 dark:border-[#2A2B2E] last:border-0">
      <button
        onClick={isClickable ? toggleExpand : undefined}
        className={cn(
          'w-full px-5 py-4 flex items-center gap-4 text-left transition-colors',
          isClickable
            ? 'hover:bg-slate-50 dark:hover:bg-white/[0.05] cursor-pointer'
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
            {session.trigger === 'scheduled' && (
              <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-brand-50 dark:bg-brand-900/30 px-1.5 py-0.5 text-[11px] font-medium text-brand-700 dark:text-brand-300">
                <CalendarClock className="w-3 h-3" /> Daily run
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn(
            'text-[11px] font-semibold px-2 py-0.5 rounded-full',
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
            <div className="border-t border-slate-200 dark:border-[#2A2B2E] bg-slate-50/50 dark:bg-white/[0.03]">
              {loadingJobs ? (
                <div className="px-5 py-6 text-center text-xs text-slate-400 animate-pulse">Loading jobs…</div>
              ) : jobs.length === 0 ? (
                <div className="px-5 py-6 text-center text-xs text-slate-400">No jobs found in this session</div>
              ) : (
                <>
                  <div className="px-5 py-2.5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">
                      {jobs.length} job{jobs.length !== 1 ? 's' : ''} added
                    </span>
                    <Link
                      href="/jobs?discoveredBy=agent"
                      className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                    >
                      View all on board <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-[#26272A]">
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
        // autoDiscover has its own toggle; leave it out so a stale draft can't overwrite it.
        body: JSON.stringify(Object.fromEntries(Object.entries(draft).filter(([k]) => k !== 'autoDiscover'))),
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
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Search preferences</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {isComplete
              ? [draft.targetRoles.split(',').filter(Boolean).slice(0, 2).map(r => r.trim()).join(', '), draft.preferRemote && 'remote', draft.preferHybrid && 'hybrid'].filter(Boolean).join(', ')
              : 'Add target roles and skills to run the agent'}
          </p>
        </div>
        {!isComplete && (
          <span className="text-[11px] font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full shrink-0">
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
            <div className="border-t border-slate-200 dark:border-[#2A2B2E] p-5 space-y-5">

              {/* Target roles + skills */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <Target className="w-3.5 h-3.5 text-slate-500" /> Target Roles *
                  </label>
                  <input
                    value={draft.targetRoles}
                    onChange={e => update('targetRoles', e.target.value)}
                    placeholder="Software Engineer, Frontend Developer"
                    className="input text-sm"
                  />
                  <p className="text-[11px] text-slate-400">Comma-separated · up to 3 used per search</p>
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <Brain className="w-3.5 h-3.5 text-slate-500" /> Skills *
                  </label>
                  <input
                    value={draft.skills}
                    onChange={e => update('skills', e.target.value)}
                    placeholder="TypeScript, React, Next.js, Python"
                    className="input text-sm"
                  />
                  <p className="text-[11px] text-slate-400">Used to score how well each job fits you</p>
                </div>
              </div>

              {/* Locations */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" /> Target Locations
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
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <DollarSign className="w-3.5 h-3.5 text-slate-500" /> Salary Range
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
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <Wifi className="w-3.5 h-3.5 text-slate-500" /> Work Style
                  </label>
                  <div className="flex gap-2">
                    {([['preferRemote', 'Remote'] , ['preferHybrid', 'Hybrid']] as [keyof UserProfile, string][]).map(([key, label]) => (
                      <label key={key as string} className={cn(
                        'flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 cursor-pointer text-sm font-medium transition-all select-none',
                        draft[key]
                          ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                          : 'border-slate-200 dark:border-[#2A2B2E] text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
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
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Exclude keywords
                </label>
                <input
                  value={draft.excludeKeywords}
                  onChange={e => update('excludeKeywords', e.target.value)}
                  placeholder="senior, lead, manager, 10+ years (comma-separated)"
                  className="input text-sm"
                />
                <p className="text-[11px] text-slate-400">Jobs containing these words will be filtered out</p>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-[#2A2B2E]">
                <p className="text-xs text-slate-400">Changes apply on the next agent run</p>
                <button onClick={save} disabled={saving} className="btn-primary text-sm py-2 px-5">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {saving ? 'Saving…' : 'Save preferences'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Daily run toggle ─────────────────────────────────────────────────────────

function DailyRunToggle({ profile, onSaved }: { profile: UserProfile; onSaved: (p: UserProfile) => void }) {
  const [saving, setSaving] = useState(false)
  const on = Boolean(profile.autoDiscover)
  const ready = Boolean(profile.targetRoles && profile.skills)

  async function toggle() {
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoDiscover: !on }),
      })
      if (!res.ok) throw new Error()
      onSaved(await res.json())
      toast.success(!on ? 'Daily discovery is on. New matches will appear each morning.' : 'Daily discovery is off')
    } catch {
      toast.error("Couldn't update that setting")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card flex items-center gap-4 px-5 py-4">
      <div className="flex-1 min-w-0">
        <p id="daily-run-label" className="text-sm font-semibold text-slate-900 dark:text-white">Run every morning</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {ready
            ? 'Around 6–7 am Toronto time, the agent searches with your saved preferences and adds new matches to your board.'
            : 'Set your target roles and skills first.'}
        </p>
      </div>
      <button
        role="switch"
        aria-checked={on}
        aria-labelledby="daily-run-label"
        onClick={toggle}
        disabled={saving || (!on && !ready)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50',
          on ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600'
        )}
      >
        <span className={cn('inline-block h-5 w-5 rounded-full bg-white shadow transition-transform', on ? 'translate-x-5' : 'translate-x-0.5')} />
      </button>
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
              toast.success(`Added ${data.added} new ${data.added === 1 ? 'job' : 'jobs'} to your board`)
              loadSessions()
            }
            if (data.type === 'error') toast.error(data.message)
          } catch { /* skip malformed */ }
        }
      }
    } catch (err) {
      addLog(`Connection error: ${err instanceof Error ? err.message : 'Unknown'}`, 'error')
      toast.error('Agent connection failed')
    } finally {
      setRunning(false)
    }
  }

  const profileIncomplete = !profile?.targetRoles || !profile?.skills
  const STEPS = ['Searching', 'Analyzing', 'Adding Jobs', 'Complete']

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-5 py-8 sm:px-8 sm:py-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.01em] text-slate-900 dark:text-white">
            Job agent
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Searches job boards, scores each listing against your profile and adds the strong matches to your board.
          </p>
        </div>
        <div className={cn(
          'flex items-center gap-2 text-[13px] text-slate-600 dark:text-slate-300'
        )}>
          <span className={cn('w-2 h-2 rounded-full', running ? 'bg-amber-500 animate-pulse' : result ? 'bg-brand-500' : 'bg-slate-400')} />
          {running ? 'Running' : result ? 'Finished' : 'Idle'}
        </div>
      </div>

      {/* Search preferences (replaces the old warning banner) */}
      {profile && (
        <SearchPreferencesPanel
          profile={profile}
          onSaved={setProfile}
        />
      )}

      {profile && <DailyRunToggle profile={profile} onSaved={setProfile} />}

      {/* Agent launch card */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {running ? 'Searching…' : 'Run a search now'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Checks RemoteOK, Remotive and Jobicy for remote roles, plus Adzuna, JSearch and web search when those are configured. A run takes about a minute.
            </p>
            {profile && profile.targetRoles && (
              <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
                {profile.targetRoles.split(',').filter(Boolean).slice(0, 3).map(r => (
                  <span key={r} className="text-xs border border-slate-200 dark:border-[#2A2B2E] text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md">
                    {r.trim()}
                  </span>
                ))}
                {profile.preferRemote && (
                  <span className="text-xs border border-slate-200 dark:border-[#2A2B2E] text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md">
                    Remote
                  </span>
                )}
                {profile.preferHybrid && (
                  <span className="text-xs border border-slate-200 dark:border-[#2A2B2E] text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md">
                    Hybrid
                  </span>
                )}
              </div>
            )}
            {profileIncomplete && (
              <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Add target roles and skills above to run the agent.
              </p>
            )}
          </div>
          <div className="shrink-0">
            <button
              onClick={runAgent}
              disabled={running || profileIncomplete}
              className={cn(
                'btn-primary px-5 py-2.5'
              )}
            >
              {running
                ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Running</>
                : <><Play className="h-4 w-4" aria-hidden="true" /> Run agent</>
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
                  done ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                    : active ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                    : 'bg-slate-100 text-slate-400 dark:bg-[#1A1B1D]'
                )}>
                  {done ? <CheckCircle className="w-3 h-3" />
                    : active ? <Zap className="w-3 h-3 animate-pulse" />
                    : <span className="w-3 h-3 rounded-full border border-current flex items-center justify-center text-[8px]">{i + 1}</span>}
                  {s}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn('flex-1 h-px', done ? 'bg-green-300 dark:bg-green-700' : 'bg-slate-200 dark:bg-[#26272A]')} />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Live terminal */}
      {log.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[#121314] border-b border-white/5">
            <span className="text-xs text-slate-400">Run log</span>
          </div>
          <div ref={terminalRef} className="bg-[#121314] font-mono text-xs p-4 h-56 overflow-y-auto space-y-1">
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
            className="card p-5"
          >
            <div className="flex items-center gap-4">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Run finished</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Added {result.added} new {result.added === 1 ? 'job' : 'jobs'} to your board
                  {result.skipped > 0 && `, skipped ${result.skipped} already there`}.
                </p>
              </div>
              <div className="ml-auto flex gap-2">
                <button onClick={runAgent} className="btn-secondary text-xs py-1.5 px-3">
                  <RotateCcw className="w-3.5 h-3.5" /> Run again
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
          <div className="px-5 py-4 border-b border-slate-200 dark:border-[#2A2B2E] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Past sessions</h2>
              <p className="text-xs text-slate-400 mt-0.5">Click a session to see which jobs it found</p>
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
          <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No sessions yet</p>
          <p className="text-xs text-slate-400 mt-1">Run the agent to start discovering jobs automatically</p>
        </div>
      )}
    </div>
  )
}
