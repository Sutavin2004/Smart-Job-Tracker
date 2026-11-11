'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ExternalLink, Download, Copy, Check, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Job } from '@/lib/types'
import { isAggregator } from '@/lib/url'

interface Kit {
  id: string
  company: string
  role: string
  jobUrl: string | null
  location: string | null
  aiScore: number | null
  aiSuggestion: string | null
  applicationPreparedAt: string | null
  resume: string | null
  coverLetter: string | null
  answers: { id: string; question: string; answer: string }[]
  notes: string[]
  matchedKeywords: string[]
  missingKeywords: string[]
}

interface AutoState { autoPrepare: boolean; hasResume: boolean; aiEnabled: boolean; pending: number; demo?: boolean }

function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      onClick={async () => { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500) }}
      className="btn-ghost px-2 py-1 text-[13px]"
    >
      {done ? <Check className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
      {done ? 'Copied' : label}
    </button>
  )
}

export default function ApplyPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [kit, setKit] = useState<Kit | null>(null)
  const [kitLoading, setKitLoading] = useState(false)
  const [preparing, setPreparing] = useState<string | null>(null)
  const [auto, setAuto] = useState<AutoState | null>(null)
  const [autoRunning, setAutoRunning] = useState(false)

  const loadJobs = useCallback(async () => {
    const data: Job[] = await fetch('/api/jobs?status=saved&sortBy=aiScore').then(r => r.json()).catch(() => [])
    const list = Array.isArray(data) ? data.slice().sort((a, b) => (b.aiScore ?? -1) - (a.aiScore ?? -1)) : []
    setJobs(list)
    setLoading(false)
    setSelectedId(id => id && list.some(j => j.id === id) ? id : list[0]?.id ?? null)
    return list
  }, [])

  // On open: prepare the top few matches automatically if the user has that on.
  useEffect(() => {
    (async () => {
      await loadJobs()
      const state: AutoState = await fetch('/api/apply/auto').then(r => r.json()).catch(() => null)
      setAuto(state)
      if (state?.autoPrepare && state.aiEnabled && state.hasResume && state.pending > 0) {
        setAutoRunning(true)
        const res = await fetch('/api/apply/auto', { method: 'POST' }).then(r => r.json()).catch(() => null)
        setAutoRunning(false)
        if (res?.prepared) toast.success(`Prepared ${res.prepared} ${res.prepared === 1 ? 'application' : 'applications'}`)
        if (res?.limitReached) toast.error("Reached today's AI limit. The rest can be prepared tomorrow.")
        await loadJobs()
      }
    })()
  }, [loadJobs])

  useEffect(() => {
    if (!selectedId) { setKit(null); return }
    setKitLoading(true)
    fetch(`/api/jobs/${selectedId}/kit`).then(r => r.json()).then(setKit).catch(() => setKit(null)).finally(() => setKitLoading(false))
  }, [selectedId, autoRunning])

  async function prepare(id: string) {
    setPreparing(id)
    const res = await fetch(`/api/jobs/${id}/prepare`, { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    setPreparing(null)
    if (!res.ok) return toast.error(data.error ?? 'Could not prepare this application.')
    toast.success('Application prepared')
    await loadJobs()
    if (id === selectedId) setKit(await fetch(`/api/jobs/${id}/kit`).then(r => r.json()))
  }

  async function markApplied(id: string) {
    const res = await fetch(`/api/jobs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'applied', dateApplied: new Date().toISOString() }),
    })
    if (!res.ok) return toast.error('Could not update the job.')
    const company = jobs.find(j => j.id === id)?.company
    toast.success(`Moved ${company} to Applied`)
    const next = jobs[jobs.findIndex(j => j.id === id) + 1]?.id ?? null
    setSelectedId(next)
    await loadJobs()
  }

  const selected = jobs.find(j => j.id === selectedId) ?? null
  const ready = jobs.filter(j => j.applicationPreparedAt).length

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-[-0.01em] text-slate-900 dark:text-white">Ready to apply</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Your saved jobs, best fit first. Each one can get a résumé and cover letter tailored to the posting. Open the posting, upload the files, then mark it applied.
        </p>
      </header>

      {auto?.demo && (
        <p className="mt-5 rounded-md bg-slate-100 px-4 py-3 text-sm text-slate-700 dark:bg-[#1A1B1D] dark:text-slate-300">In the demo, AI writing is off. The Notion job has a sample prepared application so you can see what one looks like.</p>
      )}
      {auto?.aiEnabled && !auto.hasResume && !auto.demo && (
        <p className="mt-5 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          Add your full résumé first. Every tailored version is built from it. <Link href="/resume" className="font-medium underline underline-offset-4">Go to Résumé</Link>
        </p>
      )}
      {autoRunning && (
        <p role="status" className="mt-5 flex items-center gap-2 rounded-md bg-brand-50 px-4 py-3 text-sm text-brand-800 dark:bg-brand-900/40 dark:text-brand-200">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Preparing your top matches. This takes about a minute.
        </p>
      )}

      {loading ? (
        <div className="mt-8 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading…</div>
      ) : jobs.length === 0 ? (
        <section className="card mt-8 px-6 py-14 text-center">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Nothing waiting</h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-500">Jobs in the Saved column show up here. Run the job agent to find new ones.</p>
          <Link href="/agent" className="btn-primary mt-6">Open the job agent</Link>
        </section>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <section aria-label="Saved jobs" className="card self-start overflow-hidden">
            <p className="border-b border-slate-200 px-4 py-2.5 text-[13px] text-slate-500 dark:border-[#2A2B2E]">
              {jobs.length} saved, {ready} prepared
            </p>
            <ul className="max-h-[70vh] divide-y divide-slate-100 overflow-y-auto dark:divide-[#26272A]">
              {jobs.map(j => (
                <li key={j.id}>
                  <button
                    onClick={() => setSelectedId(j.id)}
                    aria-current={j.id === selectedId ? 'true' : undefined}
                    className={cn('flex w-full items-start gap-3 px-4 py-3 text-left transition-colors', j.id === selectedId ? 'bg-brand-50 dark:bg-brand-900/30' : 'hover:bg-slate-50 dark:hover:bg-white/[0.03]')}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-900 dark:text-white">{j.company}</span>
                      <span className="block truncate text-[13px] text-slate-500">{j.role}</span>
                      <span className={cn('mt-1 block text-[12px]', j.applicationPreparedAt ? 'text-brand-700 dark:text-brand-400' : 'text-slate-500')}>
                        {preparing === j.id ? 'Preparing…' : j.applicationPreparedAt ? 'Ready' : 'Not prepared'}
                      </span>
                    </span>
                    {j.aiScore != null && <span className="shrink-0 text-[13px] tabular-nums text-slate-500">{j.aiScore}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section aria-label="Application" className="min-w-0">
            {selected && (
              <div className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{selected.company}</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{selected.role}{selected.location ? `, ${selected.location}` : ''}</p>
                    {selected.aiScore != null && <p className="mt-1 text-[13px] text-slate-500">Fit {selected.aiScore}/100{kit?.aiSuggestion ? `. ${kit.aiSuggestion}` : ''}</p>}
                    {isAggregator(selected.jobUrl) && (
                      <p className="mt-2 text-[13px] text-amber-700 dark:text-amber-400">
                        This link goes to a job-listing site, not {selected.company}. Search {selected.company}&apos;s careers page for the same role and apply there if you can.
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selected.jobUrl && (
                      <a href={selected.jobUrl} target="_blank" rel="noreferrer" className="btn-secondary">
                        <ExternalLink className="h-4 w-4" aria-hidden="true" /> Open posting
                      </a>
                    )}
                    <button onClick={() => markApplied(selected.id)} className="btn-primary">Mark as applied</button>
                  </div>
                </div>

                {kitLoading ? (
                  <div className="mt-6 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading…</div>
                ) : !kit?.resume ? (
                  <div className="mt-6 rounded-lg border border-dashed border-slate-300 p-6 text-center dark:border-[#34353A]">
                    <p className="text-sm text-slate-700 dark:text-slate-300">No tailored application yet.</p>
                    <p className="mt-1 text-[13px] text-slate-500">
                      {auto && !auto.aiEnabled
                        ? auto.demo ? 'AI writing is off in the demo. Open the Notion job to see a prepared application.' : 'AI writing is not set up on this site yet.'
                        : 'Writes a résumé and cover letter for this posting from your saved résumé, plus answers to common questions. Uses one AI action.'}
                    </p>
                    <button onClick={() => prepare(selected.id)} disabled={preparing !== null || !auto?.aiEnabled || !auto?.hasResume} className="btn-primary mt-4">
                      {preparing === selected.id && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                      {preparing === selected.id ? 'Preparing… about 30 seconds' : 'Prepare application'}
                    </button>
                  </div>
                ) : (
                  <div className="mt-6 space-y-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <a href={`/api/jobs/${selected.id}/download?doc=resume`} className="btn-secondary"><Download className="h-4 w-4" aria-hidden="true" /> Résumé (.docx)</a>
                      {kit.coverLetter && <a href={`/api/jobs/${selected.id}/download?doc=cover_letter`} className="btn-secondary"><Download className="h-4 w-4" aria-hidden="true" /> Cover letter (.docx)</a>}
                      <button onClick={() => prepare(selected.id)} disabled={preparing !== null} className="btn-ghost">
                        {preparing === selected.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="h-4 w-4" aria-hidden="true" />}
                        Write again
                      </button>
                    </div>

                    {(() => {
                      // Keywords the AI's notes already mention don't need a second line.
                      const unmentioned = kit.missingKeywords.filter(k => !kit.notes.some(n => n.toLowerCase().includes(k.toLowerCase())))
                      return (kit.notes.length > 0 || unmentioned.length > 0) && (
                      <div className="rounded-md bg-amber-50 px-4 py-3 text-[13px] leading-relaxed text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                        <p className="font-medium">Check before you send</p>
                        <ul className="mt-1 list-disc pl-5">
                          {kit.notes.map(n => <li key={n}>{n}</li>)}
                          {unmentioned.length > 0 && <li>The posting mentions {unmentioned.slice(0, 8).join(', ')}, which your résumé doesn&apos;t show. Add them only if they are true.</li>}
                        </ul>
                      </div>
                      )
                    })()}

                    <Block title="Résumé" text={kit.resume} />
                    {kit.coverLetter && <Block title="Cover letter" text={kit.coverLetter} />}
                    {kit.answers.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Answers to common questions</h3>
                        <ul className="mt-3 space-y-4">
                          {kit.answers.map(a => (
                            <li key={a.id}>
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-[13px] font-medium text-slate-700 dark:text-slate-300">{a.question}</p>
                                <CopyButton text={a.answer} label="Copy" />
                              </div>
                              <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{a.answer}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

function Block({ title, text }: { title: string; text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
        <div className="flex gap-1">
          <CopyButton text={text} label="Copy text" />
          <button onClick={() => setOpen(o => !o)} aria-expanded={open} className="btn-ghost px-2 py-1 text-[13px]">{open ? 'Show less' : 'Show all'}</button>
        </div>
      </div>
      <pre className={cn('mt-2 whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 p-4 font-sans text-[13px] leading-relaxed text-slate-700 dark:border-[#2A2B2E] dark:bg-[#121314] dark:text-slate-300', !open && 'max-h-64 overflow-hidden')}>{text}</pre>
    </div>
  )
}
