'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Play, CheckCircle, Clock, Zap, RotateCcw,
  ExternalLink, ChevronDown, ChevronRight, MapPin,
  Briefcase, ArrowUpRight, Loader2, CalendarClock,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatRelative } from '@/lib/utils'
import { toast } from 'sonner'
import type { AgentSession, UserProfile } from '@/lib/types'
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

// ── Main page ────────────────────────────────────────────────────────────────

export default function AgentPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [sessions, setSessions] = useState<AgentSession[]>([])
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState<LogLine[]>([])
  const [step, setStep] = useState(0)
  const [result, setResult] = useState<{ added: number; skipped: number } | null>(null)
  const terminalRef = useRef<HTMLDivElement | HTMLOListElement>(null)

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(setProfile).catch(() => {})
    loadSessions()
  }, [])

  // "Run the agent" on the Profile page lands here with ?run=1: start once the profile is loaded.
  const autoRun = useRef(false)
  useEffect(() => {
    if (!profile || autoRun.current) return
    const params = new URLSearchParams(window.location.search)
    if (params.get('run') !== '1') return
    autoRun.current = true
    window.history.replaceState(null, '', '/agent')
    if (profile.targetRoles && profile.skills) runAgent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

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
  const STEPS = ['Searching', 'Scoring', 'Adding jobs', 'Done']

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-5 py-8 sm:px-8 sm:py-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-[-0.01em] text-slate-900 dark:text-white">Job agent</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          Searches job boards and company career pages for you, scores every job against your profile, and adds the ones that fit to your board.
        </p>
      </header>

      {profile && (profileIncomplete ? (
        <section aria-labelledby="run-heading" className="card p-6">
          <h2 id="run-heading" className="text-base font-semibold text-slate-900 dark:text-white">Add your résumé first</h2>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            The agent needs to know which roles and skills to look for. Your profile fills those in from your résumé.
          </p>
          <Link href="/profile" className="btn-primary mt-4">Go to Profile</Link>
        </section>
      ) : (
        <section aria-labelledby="run-heading" className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 id="run-heading" className="text-base font-semibold text-slate-900 dark:text-white">{running ? 'Searching…' : 'Find jobs now'}</h2>
              <p className="mt-1 text-sm text-slate-500">Takes about a minute. You can leave this page; new jobs land on your board.</p>
            </div>
            <button onClick={runAgent} disabled={running} className="btn-primary px-5">
              {running
                ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Searching</>
                : <><Play className="h-4 w-4" aria-hidden="true" /> Find jobs</>}
            </button>
          </div>
          <div className="mt-5 flex flex-wrap items-end gap-x-8 gap-y-3 border-t border-slate-200 pt-4 text-sm dark:border-[#2A2B2E]">
            <dl className="flex min-w-0 flex-1 flex-wrap gap-x-8 gap-y-3">
              <div className="min-w-0">
                <dt className="text-[12px] text-slate-500">Looking for</dt>
                <dd className="truncate text-slate-900 dark:text-white">{profile.targetRoles.split(',').map(r => r.trim()).filter(Boolean).slice(0, 3).join(', ')}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[12px] text-slate-500">Where</dt>
                <dd className="truncate text-slate-900 dark:text-white">{[profile.targetLocations, profile.preferRemote && !/remote/i.test(profile.targetLocations) ? 'Remote' : ''].filter(Boolean).join(', ') || 'Anywhere'}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-slate-500">Every morning</dt>
                <dd className="text-slate-900 dark:text-white">{profile.autoDiscover ? 'On' : 'Off'}</dd>
              </div>
            </dl>
            <Link href="/profile" className="text-[13px] font-medium text-brand-700 underline underline-offset-4 dark:text-brand-400">Change what it looks for</Link>
          </div>
        </section>
      ))}

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

      {/* What the agent is doing, in plain words */}
      {log.length > 0 && (
        <section aria-labelledby="progress-heading" className="card overflow-hidden">
          <h2 id="progress-heading" className="border-b border-slate-200 px-5 py-3 text-sm font-semibold text-slate-900 dark:border-[#2A2B2E] dark:text-white">
            {running ? 'What it’s doing' : 'What it did'}
          </h2>
          <ol ref={terminalRef as React.RefObject<HTMLOListElement>} aria-live="polite" className="max-h-72 space-y-1.5 overflow-y-auto px-5 py-4 text-[13px] leading-relaxed">
            {log.map((line, i) => (
              <li key={i} className={cn(
                line.type === 'error' ? 'text-red-700 dark:text-red-400'
                  : line.type === 'job_added' ? 'font-medium text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400'
              )}>
                {line.message}
              </li>
            ))}
            {running && <li className="flex items-center gap-2 text-slate-500"><Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Working…</li>}
          </ol>
        </section>
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
                <Link href="/jobs?discoveredBy=agent" className="btn-secondary text-xs py-1.5 px-3">
                  <Briefcase className="w-3.5 h-3.5" /> View on board
                </Link>
                <Link href="/apply" className="btn-primary text-xs py-1.5 px-3">Review and apply</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Past searches */}
      {sessions.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-[#2A2B2E] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Past searches</h2>
              <p className="text-xs text-slate-500 mt-0.5">Open one to see the jobs it added</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
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
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No searches yet</p>
          <p className="text-[13px] text-slate-500 mt-1">Each search shows up here with the jobs it added.</p>
        </div>
      )}
    </div>
  )
}
