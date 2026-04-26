'use client'

import { useState, useEffect } from 'react'
import { Save, User, Target, Brain, Download, Trash2, Sun, Moon, AlertTriangle } from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { UserProfile } from '@/lib/types'
import { CURRENCY_OPTIONS } from '@/lib/types'

type Tab = 'profile' | 'preferences' | 'data' | 'about'

const SHORTCUTS = [
  ['⌘K', 'Command palette'],
  ['⌘N', 'Add job'],
  ['D', 'Dashboard'],
  ['J', 'Jobs board'],
  ['G', 'Agent page'],
  ['A', 'Analytics'],
  ['R', 'Resume tools'],
  ['S', 'Settings'],
]

export default function SettingsPage() {
  const { resolvedTheme, setTheme } = useTheme()
  const [tab, setTab] = useState<Tab>('profile')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetch('/api/profile').then(r => r.json()).then(setProfile).catch(() => {})
  }, [])

  function update(key: keyof UserProfile, value: unknown) {
    setProfile(p => p ? { ...p, [key]: value } : p)
  }

  async function saveProfile() {
    if (!profile) return
    setSaving(true)
    try {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      toast.success('Profile saved!')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function deleteAllData() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    try {
      const jobs = await fetch('/api/jobs').then(r => r.json())
      for (const job of jobs) {
        await fetch(`/api/jobs/${job.id}`, { method: 'DELETE' })
      }
      toast.success('All job data deleted')
      setConfirmDelete(false)
    } catch {
      toast.error('Failed to delete all data')
    }
  }

  const completion = profile ? [
    !!profile.name, !!profile.email, !!profile.currentTitle,
    !!profile.targetRoles, !!profile.skills, !!profile.bio,
    !!profile.targetLocations, profile.targetSalaryMin > 0
  ].filter(Boolean).length / 8 * 100 : 0

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f0e1a] p-6 space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>

      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
        {(['profile', 'preferences', 'data', 'about'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all',
              tab === t ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'profile' && profile && (
        <div className="space-y-5">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-brand-500" />
                <h2 className="font-semibold">Profile Completion</h2>
              </div>
              <span className="text-sm font-bold text-brand-600">{Math.round(completion)}%</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-brand rounded-full transition-all" style={{ width: `${completion}%` }} />
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-semibold mb-4 flex items-center gap-2"><User className="w-4 h-4 text-slate-400" /> Personal</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {([
                ['name', 'Full Name', 'Alex Chen'],
                ['email', 'Email', 'alex@example.com'],
                ['phone', 'Phone', '+1 (416) 555-0000'],
                ['currentTitle', 'Current Title', 'Software Engineering Student'],
              ] as [keyof UserProfile, string, string][]).map(([key, label, placeholder]) => (
                <div key={key as string}>
                  <label className="text-xs font-medium text-slate-500 block mb-1">{label}</label>
                  <input
                    value={(profile[key] as string) ?? ''}
                    onChange={e => update(key, e.target.value)}
                    placeholder={placeholder}
                    className="input-base text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-semibold mb-4">Online Presence</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {([
                ['linkedin', 'LinkedIn URL'],
                ['github', 'GitHub URL'],
                ['portfolio', 'Portfolio URL'],
              ] as [keyof UserProfile, string][]).map(([key, label]) => (
                <div key={key as string}>
                  <label className="text-xs font-medium text-slate-500 block mb-1">{label}</label>
                  <input
                    value={(profile[key] as string) ?? ''}
                    onChange={e => update(key, e.target.value)}
                    placeholder="https://..."
                    className="input-base text-sm"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">Years of Experience</label>
                <input
                  type="number"
                  min="0"
                  value={profile.yearsExperience}
                  onChange={e => update('yearsExperience', Number(e.target.value))}
                  className="input-base text-sm"
                />
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-semibold mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-slate-400" /> Job Search</h2>
            <div className="space-y-4">
              {([
                ['targetRoles', 'Target Roles (comma-separated)', 'Software Engineer, Frontend Developer'],
                ['skills', 'Skills (comma-separated)', 'TypeScript, React, Next.js, Python'],
                ['targetLocations', 'Target Locations (comma-separated)', 'Toronto, Vancouver, Remote'],
                ['excludeKeywords', 'Keywords to Exclude', 'senior, lead, manager'],
                ['education', 'Education', 'B.Sc. Computer Science, University of Toronto, 2025'],
              ] as [keyof UserProfile, string, string][]).map(([key, label, placeholder]) => (
                <div key={key as string}>
                  <label className="text-xs font-medium text-slate-500 block mb-1">{label}</label>
                  <input
                    value={(profile[key] as string) ?? ''}
                    onChange={e => update(key, e.target.value)}
                    placeholder={placeholder}
                    className="input-base text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-semibold mb-4">Compensation & Preferences</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">Currency</label>
                <select value={profile.currency} onChange={e => update('currency', e.target.value)} className="input-base text-sm">
                  {CURRENCY_OPTIONS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">Min Salary (k)</label>
                <input type="number" value={profile.targetSalaryMin} onChange={e => update('targetSalaryMin', Number(e.target.value))} className="input-base text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">Max Salary (k)</label>
                <input type="number" value={profile.targetSalaryMax} onChange={e => update('targetSalaryMax', Number(e.target.value))} className="input-base text-sm" />
              </div>
            </div>
            <div className="flex gap-3 items-end">
              {([['preferRemote', 'Remote OK'], ['preferHybrid', 'Hybrid OK']] as [keyof UserProfile, string][]).map(([key, label]) => (
                <label key={key as string} className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer text-sm font-medium transition-all',
                  profile[key] ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300' : 'border-slate-200 dark:border-slate-700 text-slate-500'
                )}>
                  <input type="checkbox" checked={profile[key] as boolean} onChange={e => update(key, e.target.checked)} className="accent-brand-500" />
                  {label}
                </label>
              ))}
              <div className="ml-auto">
                <label className="text-xs font-medium text-slate-500 block mb-1">Weekly goal</label>
                <input type="number" min="1" max="50" value={profile.weeklyGoal} onChange={e => update('weeklyGoal', Number(e.target.value))} className="input-base text-sm w-24" />
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-semibold mb-1 flex items-center gap-2"><Brain className="w-4 h-4 text-slate-400" /> AI Context</h2>
            <p className="text-xs text-slate-400 mb-4">Used by the AI to personalize cover letters, analysis, and job scoring</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">Bio — tell the AI about yourself</label>
                <textarea
                  value={profile.bio}
                  onChange={e => update('bio', e.target.value)}
                  rows={4}
                  placeholder="CS student with strong frontend skills..."
                  className="input-base text-sm resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">Job Search Goals</label>
                <textarea
                  value={profile.jobSearchGoals}
                  onChange={e => update('jobSearchGoals', e.target.value)}
                  rows={3}
                  placeholder="Looking for a challenging role at a growth-stage startup..."
                  className="input-base text-sm resize-none"
                />
              </div>
            </div>
          </div>

          <button onClick={saveProfile} disabled={saving} className="btn-primary w-full justify-center py-3">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      )}

      {tab === 'preferences' && mounted && (
        <div className="card p-5">
          <h2 className="font-semibold mb-4">Theme</h2>
          <div className="flex gap-3">
            {[
              { value: 'light', label: 'Light', Icon: Sun },
              { value: 'dark', label: 'Dark', Icon: Moon },
              { value: 'system', label: 'System', Icon: () => <span className="text-base">💻</span> },
            ].map(({ value, label, Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  'flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all',
                  resolvedTheme === value || (value === 'system' && !['light', 'dark'].includes(resolvedTheme ?? ''))
                    ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500'
                )}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'data' && (
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2"><Download className="w-4 h-4" /> Export</h2>
            <p className="text-sm text-slate-500 mb-4">Download all your job data as CSV</p>
            <a href="/api/export" download className="btn-secondary inline-flex">
              <Download className="w-4 h-4" />
              Export as CSV
            </a>
          </div>
          <div className="card p-5 border-red-200 dark:border-red-900/50">
            <h2 className="font-semibold mb-1 text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Danger Zone
            </h2>
            <p className="text-sm text-slate-500 mb-4">Permanently delete all job data. This cannot be undone.</p>
            <button onClick={deleteAllData} className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
              confirmDelete ? 'bg-red-600 text-white' : 'border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
            )}>
              <Trash2 className="w-4 h-4" />
              {confirmDelete ? 'Confirm — Delete All Data' : 'Delete All Job Data'}
            </button>
          </div>
        </div>
      )}

      {tab === 'about' && (
        <div className="card p-5 space-y-6">
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-glow-brand">
              <span className="text-3xl">✨</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">JobTrack — AI Edition</h2>
            <p className="text-sm text-slate-500 mt-1">v2.0.0 · Next.js 15 + Prisma + Claude AI</p>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Keyboard Shortcuts</h3>
            <div className="grid grid-cols-2 gap-2">
              {SHORTCUTS.map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <span className="text-xs text-slate-600 dark:text-slate-300">{desc}</span>
                  <kbd className="text-[10px] font-mono bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-2 py-0.5 rounded">{key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
