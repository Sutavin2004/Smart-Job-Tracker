'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Zap, Target, CheckCircle, AlertCircle, ArrowUpRight,
  Copy, Download, Upload, Loader2,
  XCircle, Sparkles, RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Job, UserProfile } from '@/lib/types'

type ResumeTab = 'master' | 'analyzer' | 'tailor'

interface AnalysisResult {
  overallScore: number
  atsScore: number
  readabilityScore: number
  keywordMatchScore: number
  missingKeywords: string[]
  presentKeywords: string[]
  strongPoints: string[]
  improvements: string[]
  atsWarnings: string[]
  rewrittenBullets: Array<{ original: string; improved: string }>
  summary: string
}

interface TailorResult {
  topKeywords: string[]
  presentKeywords: string[]
  missingKeywords: string[]
  skillsToEmphasize: string[]
  rewrittenBullets: Array<{ original: string; improved: string }>
  tailoredSummary: string
  tailoredResume: string
  atsScoreBefore: number
  atsScoreAfter: number
}


function ScoreBar({ score, label }: { score: number; label: string }) {
  const color = score >= 70 ? '#10b981' : score >= 45 ? '#f59e0b' : '#ef4444'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-600 dark:text-slate-300">{label}</span>
        <span className="font-semibold text-slate-900 dark:text-white">{score}/100</span>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-[#26272A] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 transition-colors">
      {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : label}
    </button>
  )
}

function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

const TABS: { id: ResumeTab; label: string }[] = [
  { id: 'master', label: 'Your résumé' },
  { id: 'analyzer', label: 'ATS check' },
  { id: 'tailor', label: 'Tailor to a job' },
]

export default function ResumePage() {
  const [tab, setTab] = useState<ResumeTab>('master')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [masterResume, setMasterResume] = useState('')
  const [savingMaster, setSavingMaster] = useState(false)
  const [masterDirty, setMasterDirty] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [autofilling, setAutofilling] = useState(false)
  const [filled, setFilled] = useState<string[] | null>(null)
  const [uploadedFrom, setUploadedFrom] = useState<string | null>(null)

  async function uploadResume(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (masterResume.trim() && !window.confirm('Replace the text below with the contents of this file?')) return
    setUploading(true)
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/resume/upload', { method: 'POST', body })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'That file could not be read.')
      setMasterResume(data.text)
      setMasterDirty(true)
      setUploadedFrom(file.name)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'That file could not be read.')
    } finally {
      setUploading(false)
    }
  }

  const [analyzeResume, setAnalyzeResume] = useState('')
  const [analyzeJD, setAnalyzeJD] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)

  const [jobs, setJobs] = useState<Job[]>([])
  const [tailorJobId, setTailorJobId] = useState('')
  const [tailoring, setTailoring] = useState(false)
  const [tailorResult, setTailorResult] = useState<TailorResult | null>(null)
  const [showFullResume, setShowFullResume] = useState(false)

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then((p: UserProfile) => {
      setProfile(p)
      setMasterResume(p.masterResume ?? '')
      setAnalyzeResume(p.masterResume ?? '')
    }).catch(() => {})
    fetch('/api/jobs').then(r => r.json()).then(setJobs).catch(() => {})
  }, [])

  const wordCount = useCallback((text: string) => text.split(/\s+/).filter(Boolean).length, [])

  async function saveMaster() {
    if (!profile) return
    setSavingMaster(true)
    try {
      // Send only the résumé so this can't overwrite profile fields changed elsewhere.
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterResume }),
      })
      if (!res.ok) throw new Error()
      setProfile(await res.json())
      setMasterDirty(false)
      toast.success('Résumé saved')
      await autofill(false)
    } catch {
      toast.error('Could not save your résumé. Try again.')
    } finally {
      setSavingMaster(false)
    }
  }

  const FIELD_LABELS: Record<string, string> = {
    name: 'name', email: 'email', phone: 'phone', linkedin: 'LinkedIn', github: 'GitHub', portfolio: 'website',
    currentTitle: 'current title', yearsExperience: 'years of experience', education: 'education', bio: 'summary',
    skills: 'skills', targetRoles: 'target roles', targetLocations: 'locations', jobSearchGoals: 'what you are looking for',
  }

  /** Fill in the profile and job-agent settings from the saved résumé. */
  async function autofill(overwrite: boolean) {
    setAutofilling(true)
    try {
      const res = await fetch('/api/profile/autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overwrite }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { toast.error(data.error ?? 'Could not fill in your profile.'); return }
      if (data.profile) setProfile(data.profile)
      setFilled(data.filled ?? [])
      if (data.note) toast.error(data.note)
    } finally {
      setAutofilling(false)
    }
  }

  async function runAnalysis() {
    if (!analyzeResume.trim()) { toast.error('Paste your resume first'); return }
    setAnalyzing(true)
    setAnalysis(null)
    try {
      const res = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: analyzeResume, jobDescription: analyzeJD || undefined }),
      })
      if (!res.ok) { toast.error('Analysis failed — check your Anthropic API key'); return }
      setAnalysis(await res.json())
      toast.success('Analysis complete!')
    } catch {
      toast.error('Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  async function runTailor() {
    if (!tailorJobId) { toast.error('Select a job first'); return }
    const job = jobs.find(j => j.id === tailorJobId)
    if (!job?.jobDescription) { toast.error('Add a job description in the job detail panel first'); return }
    if (!profile?.masterResume?.trim()) { toast.error('Save your master resume first'); return }
    setTailoring(true)
    setTailorResult(null)
    setShowFullResume(false)
    try {
      const res = await fetch(`/api/jobs/${tailorJobId}/resume-tailor`, { method: 'POST' })
      if (!res.ok) { toast.error('Tailoring failed'); return }
      setTailorResult(await res.json())
      toast.success('Resume tailored!')
    } catch {
      toast.error('Failed to tailor resume')
    } finally {
      setTailoring(false)
    }
  }

  const selectedJob = jobs.find(j => j.id === tailorJobId)
  const hasJD = !!selectedJob?.jobDescription

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.01em] text-slate-900 dark:text-white">Résumé</h1>
          <p className="mt-1 text-sm text-slate-500">Keep one full résumé here. The AI tools use it to score jobs, write cover letters and tailor it per application.</p>
        </div>
        {profile?.masterResume && (
          <p className="text-[13px] text-slate-500">Saved résumé: {wordCount(profile.masterResume)} words</p>
        )}
      </header>

      <div role="tablist" aria-label="Résumé tools" className="mt-6 flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-[#2A2B2E]">
        {TABS.map(t => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              '-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition-colors',
              tab === t.id
                ? 'border-brand-600 font-medium text-slate-900 dark:border-brand-400 dark:text-white'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="pt-6">
        <div>
          <div className="space-y-5">

            {/* ── MASTER RESUME ── */}
            {tab === 'master' && (
              <div className="space-y-4">
                <div className="card overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5 dark:border-[#2A2B2E]">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Your full résumé</h2>
                      <p className="mt-0.5 text-[13px] text-slate-500">Upload a file or paste the text. Include everything; each tool picks what is relevant.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className={cn('btn-secondary cursor-pointer py-1.5', uploading && 'pointer-events-none opacity-60')}>
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="h-4 w-4" aria-hidden="true" />}
                        {uploading ? 'Reading…' : 'Upload PDF or Word'}
                        <input type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" className="sr-only" onChange={uploadResume} disabled={uploading} />
                      </label>
                      {masterResume && (
                        <button onClick={() => downloadText(masterResume, 'resume.txt')} className="btn-ghost py-1.5" title="Download as text">
                          <Download className="h-4 w-4" aria-hidden="true" /><span className="sr-only">Download as text</span>
                        </button>
                      )}
                      <button onClick={saveMaster} disabled={savingMaster || !masterDirty} className="btn-primary py-1.5">
                        {savingMaster && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                        {savingMaster ? 'Saving…' : masterDirty ? 'Save' : 'Saved'}
                      </button>
                    </div>
                  </div>
                  <div className="p-5">
                    {autofilling && (
                      <p role="status" className="mb-3 flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 text-[13px] text-slate-700 dark:bg-[#222326] dark:text-slate-300">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Filling in your profile and job agent settings from your résumé…
                      </p>
                    )}
                    {!autofilling && filled && (
                      <div role="status" className="mb-3 rounded-md bg-brand-50 px-3 py-2.5 text-[13px] text-brand-900 dark:bg-brand-900/40 dark:text-brand-100">
                        {filled.length > 0 ? (
                          <>Filled in your {filled.map(f => FIELD_LABELS[f] ?? f).join(', ')} from your résumé. Review them on the <a href="/agent" className="font-medium underline underline-offset-2">Job agent</a> page and in <a href="/settings" className="font-medium underline underline-offset-2">Settings</a>.</>
                        ) : (
                          <>Your profile already has everything the résumé covers, so nothing was changed.</>
                        )}{' '}
                        <button onClick={() => { if (window.confirm('Replace your profile and job agent settings with what is in this résumé?')) autofill(true) }} className="font-medium underline underline-offset-2">Fill in again from the résumé</button>
                      </div>
                    )}
                    {uploadedFrom && (
                      <p className="mb-3 rounded-md bg-brand-50 px-3 py-2 text-[13px] text-brand-800 dark:bg-brand-900/40 dark:text-brand-200">
                        Text from {uploadedFrom}. Check it over, fix anything that came through oddly, then save.
                      </p>
                    )}
                    <textarea
                      aria-label="Résumé text"
                      value={masterResume}
                      onChange={e => { setMasterResume(e.target.value); setMasterDirty(true) }}
                      rows={24}
                      placeholder="Paste your résumé here, or upload a PDF or Word file above."
                      className="input resize-y font-mono text-xs leading-relaxed"
                    />
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <span>{wordCount(masterResume)} words</span>
                      {masterDirty ? (
                        <span className="text-amber-700 dark:text-amber-400">Not saved yet. Saving also fills in your profile.</span>
                      ) : profile?.masterResume && !autofilling && filled === null ? (
                        <button onClick={() => autofill(false)} className="text-[13px] font-medium text-brand-700 underline-offset-4 hover:underline dark:text-brand-400">Fill in my profile from this résumé</button>
                      ) : null}
                    </div>
                  </div>
                </div>

                <section className="card p-5" aria-labelledby="tips-heading">
                  <h3 id="tips-heading" className="text-sm font-semibold text-slate-900 dark:text-white">What makes this work better</h3>
                  <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[13px] leading-relaxed text-slate-600 marker:text-slate-400 dark:text-slate-300">
                    <li>Numbers beat adjectives: “cut load time by 60%” says more than “improved performance”.</li>
                    <li>List every tool you have used, even briefly. Keyword matching depends on it.</li>
                    <li>Keep personal projects, courses and certifications. They are trimmed per job, not here.</li>
                  </ul>
                </section>
              </div>
            )}

            {/* ── ATS ANALYZER ── */}
            {tab === 'analyzer' && (
              <div className="space-y-5">
                {/* Inputs */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="card overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-[#2A2B2E]">
                      <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Resume text</h2>
                      <div className="flex items-center gap-3">
                        {profile?.masterResume && analyzeResume !== profile.masterResume && (
                          <button
                            onClick={() => setAnalyzeResume(profile.masterResume ?? '')}
                            className="flex items-center gap-1 text-xs text-brand-600 hover:underline"
                          >
                            <RefreshCw className="w-3 h-3" /> Use saved résumé
                          </button>
                        )}
                        <span className="text-xs text-slate-400">{wordCount(analyzeResume)} words</span>
                      </div>
                    </div>
                    <div className="p-5">
                      <textarea
                        value={analyzeResume}
                        onChange={e => setAnalyzeResume(e.target.value)}
                        rows={14}
                        placeholder="Paste your resume here (or click 'Use saved résumé' above to load your saved resume)..."
                        className="input font-mono text-xs resize-none"
                      />
                    </div>
                  </div>

                  <div className="card overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-[#2A2B2E]">
                      <div>
                        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Job description</h2>
                        <p className="text-[11px] text-slate-400">Optional. Adds a keyword match score.</p>
                      </div>
                    </div>
                    <div className="p-5">
                      <textarea
                        value={analyzeJD}
                        onChange={e => setAnalyzeJD(e.target.value)}
                        rows={8}
                        placeholder="Paste the job posting to see which of its keywords your résumé is missing."
                        className="input text-xs resize-none"
                      />
                    </div>
                    <div className="px-5 pb-5">
                      <button
                        onClick={runAnalysis}
                        disabled={analyzing || !analyzeResume.trim()}
                        className="btn-primary w-full justify-center py-2.5"
                      >
                        {analyzing
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking…</>
                          : <><Zap className="w-4 h-4" /> Check résumé</>
                        }
                      </button>
                    </div>
                  </div>
                </div>

                {/* Loading skeleton */}
                {analyzing && (
                  <div className="card p-6 space-y-4 animate-pulse">
                    <div className="flex justify-around">
                      {[1, 2, 3].map(i => <div key={i} className="w-20 h-20 rounded-full bg-slate-100 dark:bg-[#26272A]" />)}
                    </div>
                    {[70, 55, 40, 80].map(w => (
                      <div key={w} className="h-3 bg-slate-100 dark:bg-[#26272A] rounded-full" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                )}

                {/* Results */}
                {analysis && !analyzing && (
                  <div className="space-y-5">
                    {/* Score rings */}
                    <div className="card p-6">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="font-semibold text-slate-900 dark:text-white">Scores</h3>
                        <CopyButton text={`ATS Analysis\nOverall: ${analysis.overallScore}/100\nATS: ${analysis.atsScore}/100\nReadability: ${analysis.readabilityScore}/100\n\n${analysis.summary}`} label="Copy report" />
                      </div>
                      <div className="space-y-3">
                        <ScoreBar score={analysis.overallScore} label="Overall" />
                        <ScoreBar score={analysis.atsScore} label="ATS compatibility" />
                        <ScoreBar score={analysis.readabilityScore} label="Readability" />
                        {analysis.keywordMatchScore > 0 && <ScoreBar score={analysis.keywordMatchScore} label="Keyword match" />}
                      </div>
                    </div>

                    {/* Summary */}
                    {analysis.summary && (
                      <div className="card p-5">
                        <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{analysis.summary}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* Strong points */}
                      {analysis.strongPoints.length > 0 && (
                        <div className="card p-5">
                          <h3 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-1.5"> What works
                          </h3>
                          <ul className="space-y-2">
                            {analysis.strongPoints.map((p, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />{p}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Improvements */}
                      {analysis.improvements.length > 0 && (
                        <div className="card p-5">
                          <h3 className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-1.5"> What to improve
                          </h3>
                          <ul className="space-y-2">
                            {analysis.improvements.map((p, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                <ArrowUpRight className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />{p}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* ATS Warnings */}
                      {analysis.atsWarnings.length > 0 && (
                        <div className="card p-5">
                          <h3 className="text-xs font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center gap-1.5"> ATS Warnings
                          </h3>
                          <ul className="space-y-2">
                            {analysis.atsWarnings.map((w, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                <XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />{w}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Keywords */}
                      {(analysis.missingKeywords.length > 0 || analysis.presentKeywords.length > 0) && (
                        <div className="card p-5">
                          <h3 className="text-xs font-semibold text-slate-500 mb-3">Keywords</h3>
                          {analysis.presentKeywords.length > 0 && (
                            <div className="mb-3">
                              <p className="text-[11px] font-semibold text-emerald-600 mb-1.5">Present ✓</p>
                              <div className="flex flex-wrap gap-1.5">
                                {analysis.presentKeywords.map(k => (
                                  <span key={k} className="text-[11px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">{k}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {analysis.missingKeywords.length > 0 && (
                            <div>
                              <p className="text-[11px] font-semibold text-red-600 mb-1.5">Missing ✗</p>
                              <div className="flex flex-wrap gap-1.5">
                                {analysis.missingKeywords.map(k => (
                                  <span key={k} className="text-[11px] bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full">{k}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Rewritten bullets */}
                    {analysis.rewrittenBullets?.length > 0 && (
                      <div className="card p-5">
                        <h3 className="text-xs font-semibold text-slate-500 mb-3 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-slate-500" /> AI-Improved Bullet Points
                        </h3>
                        <div className="space-y-4">
                          {analysis.rewrittenBullets.slice(0, 5).map((b, i) => (
                            <div key={i} className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-[#1A1B1D]">
                              <p className="text-xs text-slate-400 line-through leading-relaxed">{b.original}</p>
                              <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed font-medium">→ {b.improved}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── TAILOR TO JOB ── */}
            {tab === 'tailor' && (
              <div className="space-y-5">
                {/* Job selector */}
                <div className="card p-5 space-y-4">
                  <div>
                    <h2 className="font-semibold text-slate-900 dark:text-white mb-1">Select a Job to Tailor For</h2>
                    <p className="text-xs text-slate-500">The AI will read the job description and rewrite your resume to match</p>
                  </div>

                  <select
                    value={tailorJobId}
                    onChange={e => { setTailorJobId(e.target.value); setTailorResult(null) }}
                    className="input text-sm"
                  >
                    <option value="">— Choose a tracked job —</option>
                    {jobs.map(j => (
                      <option key={j.id} value={j.id}>
                        {j.company} · {j.role}{!j.jobDescription ? ' (no JD — add one in job detail)' : ''}
                      </option>
                    ))}
                  </select>

                  {/* Job preview */}
                  {selectedJob && (
                    <div className={cn(
                      'flex items-start gap-3 p-3 rounded-xl border',
                      hasJD
                        ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800'
                        : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
                    )}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{selectedJob.company}</p>
                        <p className="text-xs text-slate-500">{selectedJob.role}</p>
                        {hasJD
                          ? <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Job description ready</p>
                          : <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> No job description — open job detail panel and paste the JD</p>
                        }
                      </div>
                    </div>
                  )}

                  {/* Master resume check */}
                  {!profile?.masterResume?.trim() && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-400">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      Save your master resume first — the AI needs it to tailor from.
                    </div>
                  )}

                  <button
                    onClick={runTailor}
                    disabled={tailoring || !tailorJobId || !hasJD || !profile?.masterResume?.trim()}
                    className="btn-primary w-full justify-center py-3"
                  >
                    {tailoring
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Tailoring your resume…</>
                      : <><Target className="w-4 h-4" /> Tailor Resume for This Job</>
                    }
                  </button>
                </div>

                {/* Loading */}
                {tailoring && (
                  <div className="card p-8 text-center space-y-3 animate-pulse">
                    <Sparkles className="w-8 h-8 text-brand-400 mx-auto" />
                    <p className="text-sm text-slate-500">Claude is reading the job description and tailoring your resume…</p>
                    <p className="text-xs text-slate-400">This usually takes 10–20 seconds</p>
                  </div>
                )}

                {/* Results */}
                {tailorResult && !tailoring && (
                  <div className="space-y-5">
                    {/* ATS score improvement */}
                    <div className="card p-5">
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-4">ATS score improvement</h3>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-3xl font-semibold text-slate-400">{tailorResult.atsScoreBefore}</p>
                          <p className="text-xs text-slate-500 mt-1">Before</p>
                        </div>
                        <div className="flex-1 flex flex-col items-center gap-1">
                          <div className="flex items-center gap-2 w-full">
                            <div className="flex-1 h-2 bg-slate-100 dark:bg-[#26272A] rounded-full overflow-hidden">
                              <div className="h-full bg-slate-300 rounded-full transition-all" style={{ width: `${tailorResult.atsScoreBefore}%` }} />
                            </div>
                          </div>
                          <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                          <div className="flex items-center gap-2 w-full">
                            <div className="flex-1 h-2 bg-slate-100 dark:bg-[#26272A] rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${tailorResult.atsScoreAfter}%` }} />
                            </div>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-3xl font-semibold text-emerald-600">{tailorResult.atsScoreAfter}</p>
                          <p className="text-xs text-slate-500 mt-1">After</p>
                        </div>
                        <div className="text-center px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                          <p className="text-lg font-semibold text-emerald-600">+{tailorResult.atsScoreAfter - tailorResult.atsScoreBefore}</p>
                          <p className="text-[11px] text-emerald-600">points</p>
                        </div>
                      </div>
                    </div>

                    {/* Keyword analysis */}
                    {tailorResult.topKeywords?.length > 0 && (
                      <div className="card p-5">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Keyword match</h3>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {tailorResult.topKeywords.map(k => (
                            <span key={k} className={cn(
                              'text-[11px] px-2.5 py-1 rounded-full font-medium',
                              tailorResult.presentKeywords?.includes(k)
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                            )}>
                              {tailorResult.presentKeywords?.includes(k) ? '✓' : '✗'} {k}
                            </span>
                          ))}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          <span className="text-emerald-600 font-medium">{tailorResult.presentKeywords?.length ?? 0} present</span>
                          {' · '}
                          <span className="text-red-600 font-medium">{tailorResult.missingKeywords?.length ?? 0} missing</span>
                          {' — added to tailored resume'}
                        </p>
                      </div>
                    )}

                    {/* Tailored summary */}
                    {tailorResult.tailoredSummary && (
                      <div className="card p-5">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Tailored summary</h3>
                          <CopyButton text={tailorResult.tailoredSummary} />
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed bg-brand-50 dark:bg-brand-900/10 p-4 rounded-xl border border-brand-100 dark:border-brand-900/30">
                          {tailorResult.tailoredSummary}
                        </p>
                      </div>
                    )}

                    {/* Skills to emphasize */}
                    {tailorResult.skillsToEmphasize?.length > 0 && (
                      <div className="card p-5">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Skills to emphasize</h3>
                        <div className="flex flex-wrap gap-2">
                          {tailorResult.skillsToEmphasize.map(s => (
                            <span key={s} className="text-xs font-medium px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Improved bullets */}
                    {tailorResult.rewrittenBullets?.length > 0 && (
                      <div className="card p-5">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-slate-500" /> Improved Bullet Points
                        </h3>
                        <div className="space-y-3">
                          {tailorResult.rewrittenBullets.slice(0, 6).map((b, i) => (
                            <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-[#1A1B1D] space-y-1.5">
                              <p className="text-xs text-slate-400 line-through leading-relaxed">{b.original}</p>
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed font-medium flex-1">→ {b.improved}</p>
                                <CopyButton text={b.improved} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Full tailored resume */}
                    {tailorResult.tailoredResume && (
                      <div className="card overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-[#2A2B2E]">
                          <div>
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Full tailored resume</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Complete resume optimized for {selectedJob?.company} · {selectedJob?.role}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <CopyButton text={tailorResult.tailoredResume} label="Copy all" />
                            <button
                              onClick={() => downloadText(tailorResult.tailoredResume, `resume-${selectedJob?.company}-${selectedJob?.role}.txt`)}
                              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" /> Download
                            </button>
                            <button
                              onClick={() => setShowFullResume(v => !v)}
                              className="text-xs text-brand-600 hover:underline"
                            >
                              {showFullResume ? 'Collapse' : 'Show full resume'}
                            </button>
                          </div>
                        </div>
                        {showFullResume && (
                          <div className="p-5">
                            <pre className="font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                              {tailorResult.tailoredResume}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
