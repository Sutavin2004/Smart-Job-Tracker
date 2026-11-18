'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Zap, CheckCircle, ArrowUpRight,
  Copy, Loader2,
  XCircle, Sparkles, RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import type { UserProfile } from '@/lib/types'

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


export default function ResumeCheckPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [analyzeResume, setAnalyzeResume] = useState('')
  const [analyzeJD, setAnalyzeJD] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then((p: UserProfile) => {
      setProfile(p)
      setAnalyzeResume(p.masterResume ?? '')
    }).catch(() => {})
  }, [])

  const wordCount = useCallback((text: string) => text.split(/\s+/).filter(Boolean).length, [])

  async function runAnalysis() {
    if (!analyzeResume.trim()) { toast.error('Paste your résumé first'); return }
    setAnalyzing(true)
    setAnalysis(null)
    try {
      const res = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: analyzeResume, jobDescription: analyzeJD || undefined }),
      })
      if (!res.ok) { toast.error('The check could not run. Try again in a minute.'); return }
      setAnalysis(await res.json())
    } catch {
      toast.error('The check could not run. Try again in a minute.')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
      <header>
        <p className="text-[13px] text-slate-500"><Link href="/profile" className="hover:underline">Profile</Link> / Résumé check</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-[-0.01em] text-slate-900 dark:text-white">Résumé check</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">See how your résumé reads to the applicant tracking systems many employers use to screen applications. Add a job posting to see which of its keywords you are missing.</p>
      </header>
      <div className="pt-6">
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
      </div>
    </div>
  )
}
