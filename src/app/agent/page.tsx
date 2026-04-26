'use client'

import { useState, useEffect, useRef } from 'react'
import { Bot, Play, CheckCircle, AlertCircle, Clock, Zap, RotateCcw, ExternalLink } from 'lucide-react'
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
              toast.success(`🤖 Agent found ${data.added} new jobs!`)
              loadSessions()
            }
            if (data.type === 'error') {
              toast.error(data.message)
            }
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
            <Bot className="w-6 h-6 text-brand-500" />
            Job Discovery Agent
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Your personal AI that finds, scores, and tracks jobs automatically
          </p>
        </div>
        <div className={cn(
          'flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full',
          running
            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
            : result
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
        )}>
          <span className={cn('w-2 h-2 rounded-full', running ? 'bg-amber-500 animate-pulse' : result ? 'bg-green-500' : 'bg-slate-400')} />
          {running ? 'Running...' : result ? 'Completed' : 'Ready'}
        </div>
      </div>

      {/* Profile incomplete warning */}
      {profileIncomplete && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
        >
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Profile incomplete</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              The agent needs your target roles and skills to find relevant jobs.
            </p>
          </div>
          <Link href="/settings" className="ml-auto shrink-0 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline">
            Complete profile →
          </Link>
        </motion.div>
      )}

      {/* Agent card */}
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
              The agent searches job boards, scores each posting for fit, and adds the best matches automatically.
            </p>

            {profile && (
              <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
                {profile.targetRoles.split(',').filter(Boolean).slice(0, 3).map(r => (
                  <span key={r} className="text-xs bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 px-2.5 py-1 rounded-full font-medium">
                    {r.trim()}
                  </span>
                ))}
                {profile.preferRemote && (
                  <span className="text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full font-medium">
                    Remote
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="shrink-0">
            <button
              onClick={runAgent}
              disabled={running || profileIncomplete}
              className={cn(
                'flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all',
                running
                  ? 'bg-slate-400 cursor-not-allowed'
                  : profileIncomplete
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-brand shadow-glow-brand hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]'
              )}
            >
              {running ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Start Agent
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Progress steps */}
      {(running || result) && (
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => {
            const done = step > i + 1 || (result && i < 4)
            const active = step === i + 1 && running
            return (
              <div key={s} className="flex items-center gap-2 flex-1 last:flex-none">
                <div className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  done ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : active ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                )}>
                  {done ? <CheckCircle className="w-3 h-3" /> : active ? <Zap className="w-3 h-3 animate-pulse" /> : <span className="w-3 h-3 rounded-full border border-current flex items-center justify-center text-[8px]">{i + 1}</span>}
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
          <div
            ref={terminalRef}
            className="bg-[#0d0c18] font-mono text-xs p-4 h-56 overflow-y-auto space-y-1"
          >
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
            {running && (
              <div className="text-slate-500 animate-pulse">█</div>
            )}
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
                <button
                  onClick={runAgent}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Run Again
                </button>
                <Link
                  href="/jobs?discoveredBy=agent"
                  className="btn-primary text-xs py-1.5 px-3"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Jobs
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Past sessions */}
      {sessions.length > 0 && (
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/60">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Past Sessions</h2>
          </div>
          <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {sessions.map(session => (
              <div key={session.id} className="px-5 py-3.5 flex items-center gap-4">
                <div className={cn(
                  'w-2 h-2 rounded-full shrink-0',
                  session.status === 'completed' ? 'bg-green-500'
                    : session.status === 'failed' ? 'bg-red-500'
                    : 'bg-amber-500 animate-pulse'
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {session.status === 'completed'
                      ? `Found ${session.jobsFound} jobs, added ${session.jobsAdded}`
                      : session.status === 'failed'
                      ? `Failed: ${session.error ?? 'Unknown error'}`
                      : 'Running...'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatRelative(session.startedAt)}
                  </p>
                </div>
                <span className={cn(
                  'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                  session.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : session.status === 'failed' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                )}>
                  {session.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
