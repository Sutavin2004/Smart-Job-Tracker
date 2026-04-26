'use client'

import { useState, useEffect } from 'react'
import { FileText, Zap, Target, Save, CheckCircle, AlertCircle, ArrowUp } from 'lucide-react'
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

export default function ResumePage() {
  const [tab, setTab] = useState<ResumeTab>('master')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [masterResume, setMasterResume] = useState('')
  const [savingMaster, setSavingMaster] = useState(false)

  const [analyzeResume, setAnalyzeResume] = useState('')
  const [analyzeJD, setAnalyzeJD] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)

  const [jobs, setJobs] = useState<Job[]>([])
  const [tailorJobId, setTailorJobId] = useState('')
  const [tailoring, setTailoring] = useState(false)
  const [tailorResult, setTailorResult] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then((p: UserProfile) => {
      setProfile(p)
      setMasterResume(p.masterResume ?? '')
      setAnalyzeResume(p.masterResume ?? '')
    }).catch(() => {})
    fetch('/api/jobs').then(r => r.json()).then(setJobs).catch(() => {})
  }, [])

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
    } catch {
      toast.error('Failed to save')
    } finally {
      setSavingMaster(false)
    }
  }

  async function runAnalysis() {
    if (!analyzeResume.trim()) { toast.error('Please paste your resume first'); return }
    setAnalyzing(true)
    setAnalysis(null)
    try {
      const res = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: analyzeResume, jobDescription: analyzeJD || undefined }),
      })
      if (!res.ok) { toast.error('Analysis failed — check your API key'); return }
      const data = await res.json()
      setAnalysis(data)
    } catch {
      toast.error('Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  async function runTailor() {
    if (!tailorJobId) { toast.error('Select a job first'); return }
    setTailoring(true)
    setTailorResult(null)
    try {
      const res = await fetch(`/api/jobs/${tailorJobId}/resume-tailor`, { method: 'POST' })
      if (!res.ok) { toast.error('Tailor failed'); return }
      const data = await res.json()
      setTailorResult(data)
    } catch {
      toast.error('Failed to tailor resume')
    } finally {
      setTailoring(false)
    }
  }

  function ScoreGauge({ score, label, color }: { score: number; label: string; color: string }) {
    const r = 28
    const circ = 2 * Math.PI * r
    const dash = (score / 100) * circ
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="relative w-20 h-20">
          <svg viewBox="0 0 72 72" className="w-full h-full -rotate-90">
            <circle cx="36" cy="36" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-100 dark:text-slate-700" />
            <circle
              cx="36" cy="36" r={r} fill="none" strokeWidth="6"
              stroke={color}
              strokeDasharray={`${dash} ${circ}`}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-slate-900 dark:text-white">{score}</span>
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f0e1a] p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-brand-500" />
          Resume Tools
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Analyze, optimize, and tailor your resume with AI</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
        {([['master', 'Master Resume'], ['analyzer', 'ATS Analyzer'], ['tailor', 'Tailor to Job']] as [ResumeTab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === t
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Master Resume Tab */}
      {tab === 'master' && (
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white">Master Resume</h2>
                <p className="text-xs text-slate-500 mt-0.5">This is used by the AI for all personalization — cover letters, analysis, and more</p>
              </div>
              <button
                onClick={saveMaster}
                disabled={savingMaster}
                className="btn-primary text-xs py-1.5 px-3"
              >
                {savingMaster ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save
              </button>
            </div>
            <textarea
              value={masterResume}
              onChange={e => setMasterResume(e.target.value)}
              rows={20}
              placeholder="Paste your full resume here (the more detail, the better the AI can personalize)..."
              className="input-base font-mono text-xs resize-none"
            />
            <p className="text-xs text-slate-400 mt-2">{masterResume.split(/\s+/).filter(Boolean).length} words</p>
          </div>
        </div>
      )}

      {/* ATS Analyzer Tab */}
      {tab === 'analyzer' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-4">
            <div className="card p-5">
              <h2 className="font-semibold text-slate-900 dark:text-white mb-3">Your Resume</h2>
              <textarea
                value={analyzeResume}
                onChange={e => setAnalyzeResume(e.target.value)}
                rows={12}
                placeholder="Paste your resume here..."
                className="input-base font-mono text-xs resize-none"
              />
            </div>
            <div className="card p-5">
              <h2 className="font-semibold text-slate-900 dark:text-white mb-3">Job Description (optional)</h2>
              <textarea
                value={analyzeJD}
                onChange={e => setAnalyzeJD(e.target.value)}
                rows={6}
                placeholder="Paste job description for keyword matching..."
                className="input-base text-xs resize-none"
              />
            </div>
            <button onClick={runAnalysis} disabled={analyzing} className="btn-primary w-full justify-center">
              {analyzing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Zap className="w-4 h-4" />}
              {analyzing ? 'Analyzing...' : 'Analyze Resume'}
            </button>
          </div>

          <div>
            {analyzing && (
              <div className="card p-6 space-y-3">
                {[80, 60, 40, 30].map(w => (
                  <div key={w} className={`h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse`} style={{ width: `${w}%` }} />
                ))}
              </div>
            )}
            {analysis && (
              <div className="card p-5 space-y-5">
                <div className="flex items-center justify-around">
                  <ScoreGauge score={analysis.overallScore} label="Overall" color="#8448ff" />
                  <ScoreGauge score={analysis.atsScore} label="ATS" color="#3b82f6" />
                  <ScoreGauge score={analysis.readabilityScore} label="Readability" color="#10b981" />
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300">{analysis.summary}</p>

                {analysis.strongPoints.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase mb-2">Strong Points</h3>
                    <ul className="space-y-1">
                      {analysis.strongPoints.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.improvements.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase mb-2">Improvements</h3>
                    <ul className="space-y-1">
                      {analysis.improvements.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <ArrowUp className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.missingKeywords.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase mb-2">Missing Keywords</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.missingKeywords.map(k => (
                        <span key={k} className="text-[11px] bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full">{k}</span>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.atsWarnings.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase mb-2">ATS Warnings</h3>
                    <ul className="space-y-1">
                      {analysis.atsWarnings.map((w, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <AlertCircle className="w-3.5 h-3.5 text-orange-500 mt-0.5 shrink-0" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tailor to Job Tab */}
      {tab === 'tailor' && (
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-semibold text-slate-900 dark:text-white mb-3">Select a Job</h2>
            <select
              value={tailorJobId}
              onChange={e => setTailorJobId(e.target.value)}
              className="input-base"
            >
              <option value="">— Select a tracked job —</option>
              {jobs.filter(j => j.jobDescription).map(j => (
                <option key={j.id} value={j.id}>{j.company} — {j.role}</option>
              ))}
            </select>
            {jobs.filter(j => !j.jobDescription).length > 0 && (
              <p className="text-xs text-slate-400 mt-1.5">* Only jobs with a job description are listed. Add a JD in the job detail panel.</p>
            )}
            <button onClick={runTailor} disabled={tailoring || !tailorJobId} className="btn-primary mt-3">
              {tailoring ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Target className="w-4 h-4" />}
              {tailoring ? 'Tailoring...' : 'Tailor Resume'}
            </button>
          </div>

          {tailorResult && (
            <div className="card p-5 space-y-5">
              {(tailorResult.topKeywords as string[])?.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase text-slate-500 mb-2">Top JD Keywords</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {(tailorResult.topKeywords as string[]).map(k => (
                      <span key={k} className={cn(
                        'text-[11px] px-2 py-0.5 rounded-full font-medium',
                        (tailorResult.presentKeywords as string[])?.includes(k)
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                          : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                      )}>
                        {k}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5"><span className="text-green-600">Green</span> = in your resume · <span className="text-red-600">Red</span> = missing</p>
                </div>
              )}

              {tailorResult.tailoredSummary ? (
                <div>
                  <h3 className="text-xs font-semibold uppercase text-slate-500 mb-2">Tailored Summary</h3>
                  <p className="text-sm text-slate-700 dark:text-slate-300 bg-brand-50 dark:bg-brand-900/20 p-3 rounded-lg">
                    {String(tailorResult.tailoredSummary)}
                  </p>
                </div>
              ) : null}

              {(tailorResult.rewrittenBullets as Array<{ original: string; improved: string }>)?.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase text-slate-500 mb-2">Improved Bullets</h3>
                  <div className="space-y-3">
                    {(tailorResult.rewrittenBullets as Array<{ original: string; improved: string }>).slice(0, 5).map((b, i) => (
                      <div key={i} className="space-y-1">
                        <p className="text-xs text-slate-400 line-through">{b.original}</p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-300">→ {b.improved}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(tailorResult.atsScoreBefore !== undefined) && (
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-400">{tailorResult.atsScoreBefore as number}</p>
                    <p className="text-xs text-slate-500">Before</p>
                  </div>
                  <ArrowUp className="w-5 h-5 text-green-500" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{tailorResult.atsScoreAfter as number}</p>
                    <p className="text-xs text-slate-500">After (estimated)</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
