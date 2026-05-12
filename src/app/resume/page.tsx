'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  FileText, Zap, Target, Save, CheckCircle, AlertCircle, ArrowUpRight,
  Copy, Download, Loader2, ChevronRight, BookOpen, Lightbulb,
  TrendingUp, XCircle, BarChart3, Sparkles, RefreshCw,
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

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const r = 30
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90">
          <circle cx="36" cy="36" r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-slate-100 dark:text-slate-700" />
          <circle
            cx="36" cy="36" r={r} fill="none" strokeWidth="5"
            stroke={color} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-slate-900 dark:text-white">{score}</span>
        </div>
      </div>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  )
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color = score >= 70 ? '#10b981' : score >= 45 ? '#f59e0b' : '#ef4444'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-600 dark:text-slate-300">{label}</span>
        <span className="font-semibold text-slate-900 dark:text-white">{score}/100</span>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
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

const TABS: { id: ResumeTab; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'master', label: 'Master Resume', icon: <BookOpen className="w-4 h-4" />, desc: 'Store your base resume' },
  { id: 'analyzer', label: 'ATS Analyzer', icon: <BarChart3 className="w-4 h-4" />, desc: 'Score & improve' },
  { id: 'tailor', label: 'Tailor to Job', icon: <Target className="w-4 h-4" />, desc: 'Customize per application' },
]

export default function ResumePage() {
  const [tab, setTab] = useState<ResumeTab>('master')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [masterResume, setMasterResume] = useState('')
  const [savingMaster, setSavingMaster] = useState(false)
  const [masterDirty, setMasterDirty] = useState(false)

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
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profile, masterResume }),
      })
      toast.success('Master resume saved!')
      setMasterDirty(false)
    } catch {
      toast.error('Failed to save')
    } finally {
      setSavingMaster(false)
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Page header */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 px-8 py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-brand-500" /> Resume Tools
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Analyze your resume, optimize for ATS, and tailor it to specific jobs
            </p>
          </div>
          {profile?.masterResume && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-xl">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              Master resume saved · {wordCount(profile.masterResume)} words
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-52 shrink-0 space-y-1">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all text-sm',
                  tab === t.id
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                <span className={cn('shrink-0', tab === t.id ? 'text-white' : 'text-slate-400')}>
                  {t.icon}
                </span>
                <div className="min-w-0">
                  <p className="font-medium leading-tight">{t.label}</p>
                  <p className={cn('text-[10px] leading-tight mt-0.5', tab === t.id ? 'text-white/70' : 'text-slate-400')}>{t.desc}</p>
                </div>
                {tab === t.id && <ChevronRight className="w-3.5 h-3.5 ml-auto shrink-0" />}
              </button>
            ))}

            {/* Quick stats */}
            {profile?.masterResume && (
              <div className="mt-4 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 space-y-2">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Master Resume</p>
                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <p>{wordCount(profile.masterResume)} words</p>
                  <p>{profile.masterResume.split('\n').filter(Boolean).length} lines</p>
                </div>
              </div>
            )}
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 space-y-5">

            {/* ── MASTER RESUME ── */}
            {tab === 'master' && (
              <div className="space-y-4">
                <div className="card overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                    <div>
                      <h2 className="font-semibold text-slate-900 dark:text-white">Master Resume</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        This is used by all AI features — cover letters, job analysis, and tailoring
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {masterResume && (
                        <CopyButton text={masterResume} label="Copy all" />
                      )}
                      {masterResume && (
                        <button
                          onClick={() => downloadText(masterResume, 'master-resume.txt')}
                          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </button>
                      )}
                      <button
                        onClick={saveMaster}
                        disabled={savingMaster || !masterDirty}
                        className={cn(
                          'flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all',
                          masterDirty
                            ? 'bg-brand-600 text-white hover:bg-brand-700'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                        )}
                      >
                        {savingMaster ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        {savingMaster ? 'Saving…' : masterDirty ? 'Save' : 'Saved'}
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <textarea
                      value={masterResume}
                      onChange={e => { setMasterResume(e.target.value); setMasterDirty(true) }}
                      rows={24}
                      placeholder={`Paste your full resume here. Include everything — the AI will pick what's relevant per job.\n\nTips for best results:\n• Use plain text (no tables or columns)\n• Include metrics: "Increased performance by 40%"\n• List all technologies, tools, and frameworks\n• Include education, projects, and certifications\n• The more detail, the better the tailoring`}
                      className="input font-mono text-xs resize-none leading-relaxed"
                    />
                    <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                      <span>{wordCount(masterResume)} words · {masterResume.length.toLocaleString()} characters</span>
                      {masterDirty && <span className="text-amber-500">Unsaved changes</span>}
                    </div>
                  </div>
                </div>

                {/* Tips */}
                <div className="card p-5">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" /> Tips for a strong master resume
                  </h3>
                  <ul className="space-y-2">
                    {[
                      'Use plain text — no tables, columns, or graphics (ATS systems struggle with formatting)',
                      'Quantify achievements: "reduced load time by 60%" beats "improved performance"',
                      'List every tool and technology — even ones you used briefly in a project',
                      'Include all projects, even personal ones — they signal initiative',
                      'Keep education, certifications, and courses — they are keyword gold',
                    ].map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <span className="w-4 h-4 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* ── ATS ANALYZER ── */}
            {tab === 'analyzer' && (
              <div className="space-y-5">
                {/* Inputs */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="card overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-700">
                      <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Resume Text</h2>
                      <div className="flex items-center gap-3">
                        {profile?.masterResume && analyzeResume !== profile.masterResume && (
                          <button
                            onClick={() => setAnalyzeResume(profile.masterResume ?? '')}
                            className="flex items-center gap-1 text-xs text-brand-600 hover:underline"
                          >
                            <RefreshCw className="w-3 h-3" /> Use master
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
                        placeholder="Paste your resume here (or click 'Use master' above to load your saved resume)..."
                        className="input font-mono text-xs resize-none"
                      />
                    </div>
                  </div>

                  <div className="card overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-700">
                      <div>
                        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Job Description</h2>
                        <p className="text-[10px] text-slate-400">Optional — enables keyword matching score</p>
                      </div>
                    </div>
                    <div className="p-5">
                      <textarea
                        value={analyzeJD}
                        onChange={e => setAnalyzeJD(e.target.value)}
                        rows={8}
                        placeholder="Paste the job description here to get a tailored keyword match score and missing keyword list..."
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
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</>
                          : <><Zap className="w-4 h-4" /> Analyze Resume</>
                        }
                      </button>
                    </div>
                  </div>
                </div>

                {/* Loading skeleton */}
                {analyzing && (
                  <div className="card p-6 space-y-4 animate-pulse">
                    <div className="flex justify-around">
                      {[1, 2, 3].map(i => <div key={i} className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-700" />)}
                    </div>
                    {[70, 55, 40, 80].map(w => (
                      <div key={w} className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                )}

                {/* Results */}
                {analysis && !analyzing && (
                  <div className="space-y-5">
                    {/* Score rings */}
                    <div className="card p-6">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="font-semibold text-slate-900 dark:text-white">Score Breakdown</h3>
                        <CopyButton text={`ATS Analysis\nOverall: ${analysis.overallScore}/100\nATS: ${analysis.atsScore}/100\nReadability: ${analysis.readabilityScore}/100\n\n${analysis.summary}`} label="Copy report" />
                      </div>
                      <div className="flex items-center justify-around mb-6">
                        <ScoreRing score={analysis.overallScore} label="Overall" color="#8448ff" />
                        <ScoreRing score={analysis.atsScore} label="ATS" color="#3b82f6" />
                        <ScoreRing score={analysis.readabilityScore} label="Readability" color="#10b981" />
                        {analysis.keywordMatchScore > 0 && (
                          <ScoreRing score={analysis.keywordMatchScore} label="Keywords" color="#f59e0b" />
                        )}
                      </div>
                      <div className="space-y-3">
                        <ScoreBar score={analysis.overallScore} label="Overall Score" />
                        <ScoreBar score={analysis.atsScore} label="ATS Compatibility" />
                        <ScoreBar score={analysis.readabilityScore} label="Readability" />
                        {analysis.keywordMatchScore > 0 && <ScoreBar score={analysis.keywordMatchScore} label="Keyword Match" />}
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
                          <h3 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5" /> Strong Points
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
                          <h3 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5" /> Improvements
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
                          <h3 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" /> ATS Warnings
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
                          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Keywords</h3>
                          {analysis.presentKeywords.length > 0 && (
                            <div className="mb-3">
                              <p className="text-[10px] font-semibold text-emerald-600 mb-1.5">Present ✓</p>
                              <div className="flex flex-wrap gap-1.5">
                                {analysis.presentKeywords.map(k => (
                                  <span key={k} className="text-[11px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">{k}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {analysis.missingKeywords.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold text-red-600 mb-1.5">Missing ✗</p>
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
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-brand-500" /> AI-Improved Bullet Points
                        </h3>
                        <div className="space-y-4">
                          {analysis.rewrittenBullets.slice(0, 5).map((b, i) => (
                            <div key={i} className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
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
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {selectedJob.company[0]}
                      </div>
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
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-4">ATS Score Improvement</h3>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-slate-400">{tailorResult.atsScoreBefore}</p>
                          <p className="text-xs text-slate-500 mt-1">Before</p>
                        </div>
                        <div className="flex-1 flex flex-col items-center gap-1">
                          <div className="flex items-center gap-2 w-full">
                            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-slate-300 rounded-full transition-all" style={{ width: `${tailorResult.atsScoreBefore}%` }} />
                            </div>
                          </div>
                          <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                          <div className="flex items-center gap-2 w-full">
                            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${tailorResult.atsScoreAfter}%` }} />
                            </div>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-3xl font-bold text-emerald-600">{tailorResult.atsScoreAfter}</p>
                          <p className="text-xs text-slate-500 mt-1">After</p>
                        </div>
                        <div className="text-center px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                          <p className="text-lg font-bold text-emerald-600">+{tailorResult.atsScoreAfter - tailorResult.atsScoreBefore}</p>
                          <p className="text-[10px] text-emerald-600">points</p>
                        </div>
                      </div>
                    </div>

                    {/* Keyword analysis */}
                    {tailorResult.topKeywords?.length > 0 && (
                      <div className="card p-5">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Keyword Match</h3>
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
                          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Tailored Summary</h3>
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
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Skills to Emphasize</h3>
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
                          <Sparkles className="w-4 h-4 text-brand-500" /> Improved Bullet Points
                        </h3>
                        <div className="space-y-3">
                          {tailorResult.rewrittenBullets.slice(0, 6).map((b, i) => (
                            <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-1.5">
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
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
                          <div>
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Full Tailored Resume</h3>
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
          </main>
        </div>
      </div>
    </div>
  )
}
