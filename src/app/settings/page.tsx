'use client'

import { useState, useEffect } from 'react'
import {
  Save, User, Target, Brain, Download, Trash2, Sun, Moon, AlertTriangle,
  Upload, Link2, Github, Linkedin, Globe, Briefcase, DollarSign, MapPin,
  Keyboard, Sparkles, Database, Shield, Bell, Palette, CheckCircle2,
  ChevronRight, Loader2, Info,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { UserProfile } from '@/lib/types'
import { CURRENCY_OPTIONS } from '@/lib/types'

type Tab = 'profile' | 'preferences' | 'data' | 'about'

const TABS: { id: Tab; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" />, desc: 'Personal info & job search prefs' },
  { id: 'preferences', label: 'Preferences', icon: <Palette className="w-4 h-4" />, desc: 'Theme & display settings' },
  { id: 'data', label: 'Data', icon: <Database className="w-4 h-4" />, desc: 'Export, import & data management' },
  { id: 'about', label: 'About', icon: <Info className="w-4 h-4" />, desc: 'App info & keyboard shortcuts' },
]

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

const PROFILE_FIELDS: { completion: (p: UserProfile) => boolean; label: string }[] = [
  { label: 'Full name', completion: p => !!p.name },
  { label: 'Email', completion: p => !!p.email },
  { label: 'Current title', completion: p => !!p.currentTitle },
  { label: 'Target roles', completion: p => !!p.targetRoles },
  { label: 'Skills', completion: p => !!p.skills },
  { label: 'Bio', completion: p => !!p.bio },
  { label: 'Target locations', completion: p => !!p.targetLocations },
  { label: 'Salary range', completion: p => p.targetSalaryMin > 0 },
]

function SectionCard({ title, icon, description, children }: {
  title: string; icon: React.ReactNode; description?: string; children: React.ReactNode
}) {
  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700/60 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0 mt-0.5">
          {icon}
        </div>
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-white text-sm">{title}</h2>
          {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const { resolvedTheme, setTheme } = useTheme()
  const [tab, setTab] = useState<Tab>('profile')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)

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
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  async function deleteAllData() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      const jobs = await fetch('/api/jobs').then(r => r.json())
      for (const job of jobs) {
        await fetch(`/api/jobs/${job.id}`, { method: 'DELETE' })
      }
      toast.success('All job data deleted')
      setConfirmDelete(false)
    } catch {
      toast.error('Failed to delete data')
    } finally {
      setDeleting(false)
    }
  }

  async function exportJSON() {
    setExporting(true)
    try {
      const res = await fetch('/api/export', { method: 'POST' })
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `jobtrack-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('JSON export downloaded')
    } catch {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  const completedFields = profile ? PROFILE_FIELDS.filter(f => f.completion(profile)) : []
  const completion = profile ? (completedFields.length / PROFILE_FIELDS.length) * 100 : 0

  const initials = profile?.name
    ? profile.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Page header */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 px-8 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage your profile, preferences, and data</p>
          </div>
          {tab === 'profile' && profile && (
            <button
              onClick={saveProfile}
              disabled={saving}
              className="btn-primary py-2 px-5 text-sm"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar nav */}
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
                <span className={cn('shrink-0', tab === t.id ? 'text-white' : 'text-slate-400 dark:text-slate-500')}>
                  {t.icon}
                </span>
                <span className="font-medium">{t.label}</span>
                {tab === t.id && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
              </button>
            ))}
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 space-y-5">

            {/* ── PROFILE TAB ── */}
            {tab === 'profile' && profile && (
              <>
                {/* Profile completion card */}
                <div className="card p-5">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-lg">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white text-sm">
                            {profile.name || 'Your Name'}
                          </p>
                          <p className="text-xs text-slate-500">{profile.currentTitle || 'Add your title →'}</p>
                        </div>
                        <div className="text-right">
                          <span className={cn(
                            'text-sm font-bold',
                            completion >= 80 ? 'text-emerald-600' : completion >= 50 ? 'text-amber-600' : 'text-slate-400'
                          )}>
                            {Math.round(completion)}%
                          </span>
                          <p className="text-[10px] text-slate-400">complete</p>
                        </div>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all duration-500',
                            completion >= 80 ? 'bg-emerald-500' : completion >= 50 ? 'bg-amber-500' : 'bg-brand-500'
                          )}
                          style={{ width: `${completion}%` }}
                        />
                      </div>
                      {completion < 100 && (
                        <p className="text-[10px] text-slate-400 mt-1.5">
                          Missing: {PROFILE_FIELDS.filter(f => !f.completion(profile)).map(f => f.label).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Personal info */}
                <SectionCard title="Personal Information" icon={<User className="w-4 h-4" />}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FieldRow label="Full Name">
                      <input value={profile.name} onChange={e => update('name', e.target.value)} placeholder="Alex Chen" className="input text-sm" />
                    </FieldRow>
                    <FieldRow label="Email">
                      <input type="email" value={profile.email} onChange={e => update('email', e.target.value)} placeholder="alex@example.com" className="input text-sm" />
                    </FieldRow>
                    <FieldRow label="Phone">
                      <input value={profile.phone} onChange={e => update('phone', e.target.value)} placeholder="+1 (416) 555-0000" className="input text-sm" />
                    </FieldRow>
                    <FieldRow label="Current Title">
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input value={profile.currentTitle} onChange={e => update('currentTitle', e.target.value)} placeholder="Software Engineering Student" className="input text-sm pl-8" />
                      </div>
                    </FieldRow>
                    <FieldRow label="Years of Experience">
                      <input type="number" min="0" value={profile.yearsExperience} onChange={e => update('yearsExperience', Number(e.target.value))} className="input text-sm w-32" />
                    </FieldRow>
                    <FieldRow label="Education">
                      <input value={profile.education} onChange={e => update('education', e.target.value)} placeholder="B.Sc. Computer Science, U of T, 2025" className="input text-sm" />
                    </FieldRow>
                  </div>
                </SectionCard>

                {/* Online presence */}
                <SectionCard title="Online Presence" icon={<Link2 className="w-4 h-4" />} description="Used to personalise cover letters and AI suggestions">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {[
                      { key: 'linkedin' as keyof UserProfile, label: 'LinkedIn', icon: <Linkedin className="w-3.5 h-3.5" />, placeholder: 'https://linkedin.com/in/...' },
                      { key: 'github' as keyof UserProfile, label: 'GitHub', icon: <Github className="w-3.5 h-3.5" />, placeholder: 'https://github.com/...' },
                      { key: 'portfolio' as keyof UserProfile, label: 'Portfolio / Website', icon: <Globe className="w-3.5 h-3.5" />, placeholder: 'https://...' },
                    ].map(({ key, label, icon, placeholder }) => (
                      <FieldRow key={key as string} label={label}>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
                          <input value={(profile[key] as string) ?? ''} onChange={e => update(key, e.target.value)} placeholder={placeholder} className="input text-sm pl-8" />
                        </div>
                      </FieldRow>
                    ))}
                  </div>
                </SectionCard>

                {/* Job search targets */}
                <SectionCard title="Job Search Targets" icon={<Target className="w-4 h-4" />} description="The AI agent uses these to find and rank jobs for you">
                  <div className="space-y-5">
                    <FieldRow label="Target Roles (comma-separated)">
                      <input value={profile.targetRoles} onChange={e => update('targetRoles', e.target.value)} placeholder="Software Engineer, Frontend Developer, Full Stack Developer" className="input text-sm" />
                    </FieldRow>
                    <FieldRow label="Skills (comma-separated)">
                      <input value={profile.skills} onChange={e => update('skills', e.target.value)} placeholder="TypeScript, React, Next.js, Python, Node.js" className="input text-sm" />
                    </FieldRow>
                    <div className="grid sm:grid-cols-2 gap-5">
                      <FieldRow label="Target Locations (comma-separated)">
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input value={profile.targetLocations} onChange={e => update('targetLocations', e.target.value)} placeholder="Toronto, Vancouver, Remote" className="input text-sm pl-8" />
                        </div>
                      </FieldRow>
                      <FieldRow label="Keywords to Exclude">
                        <input value={profile.excludeKeywords} onChange={e => update('excludeKeywords', e.target.value)} placeholder="senior, lead, manager" className="input text-sm" />
                      </FieldRow>
                    </div>
                    {/* Work style */}
                    <div>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Work Style</p>
                      <div className="flex flex-wrap gap-2">
                        {([['preferRemote', 'Remote OK', '🌍'], ['preferHybrid', 'Hybrid OK', '🏢']] as [keyof UserProfile, string, string][]).map(([key, label, emoji]) => (
                          <label key={key as string} className={cn(
                            'flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer text-sm font-medium transition-all select-none',
                            profile[key]
                              ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                              : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                          )}>
                            <input type="checkbox" checked={profile[key] as boolean} onChange={e => update(key, e.target.checked)} className="sr-only" />
                            {emoji} {label}
                            {profile[key] && <CheckCircle2 className="w-3.5 h-3.5 text-brand-500" />}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </SectionCard>

                {/* Compensation */}
                <SectionCard title="Compensation" icon={<DollarSign className="w-4 h-4" />}>
                  <div className="flex flex-wrap gap-5 items-end">
                    <FieldRow label="Currency">
                      <select value={profile.currency} onChange={e => update('currency', e.target.value)} className="input text-sm w-28">
                        {CURRENCY_OPTIONS.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </FieldRow>
                    <FieldRow label="Min Salary (thousands)">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                        <input type="number" value={profile.targetSalaryMin} onChange={e => update('targetSalaryMin', Number(e.target.value))} className="input text-sm pl-6 w-32" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">k</span>
                      </div>
                    </FieldRow>
                    <FieldRow label="Max Salary (thousands)">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                        <input type="number" value={profile.targetSalaryMax} onChange={e => update('targetSalaryMax', Number(e.target.value))} className="input text-sm pl-6 w-32" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">k</span>
                      </div>
                    </FieldRow>
                    <FieldRow label="Weekly Application Goal">
                      <input type="number" min="1" max="50" value={profile.weeklyGoal} onChange={e => update('weeklyGoal', Number(e.target.value))} className="input text-sm w-24" />
                    </FieldRow>
                  </div>
                </SectionCard>

                {/* AI Context */}
                <SectionCard title="AI Context" icon={<Brain className="w-4 h-4" />} description="Claude uses this to write personalised cover letters, score jobs, and tailor advice to you">
                  <div className="space-y-5">
                    <FieldRow label="Bio — Tell the AI about yourself">
                      <textarea
                        value={profile.bio}
                        onChange={e => update('bio', e.target.value)}
                        rows={4}
                        placeholder="CS student graduating May 2025 with strong frontend skills and two internships. Looking for my first full-time role in web development..."
                        className="input text-sm resize-none"
                      />
                    </FieldRow>
                    <FieldRow label="Job Search Goals">
                      <textarea
                        value={profile.jobSearchGoals}
                        onChange={e => update('jobSearchGoals', e.target.value)}
                        rows={3}
                        placeholder="Looking for a challenging role at a growth-stage startup with mentorship and room to grow into a lead role within 2 years..."
                        className="input text-sm resize-none"
                      />
                    </FieldRow>
                  </div>
                </SectionCard>

                {/* Mobile save button */}
                <button onClick={saveProfile} disabled={saving} className="btn-primary w-full justify-center py-3 sm:hidden">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving…' : 'Save Profile'}
                </button>
              </>
            )}

            {/* ── PREFERENCES TAB ── */}
            {tab === 'preferences' && mounted && (
              <SectionCard title="Appearance" icon={<Palette className="w-4 h-4" />} description="Choose how the app looks">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Theme</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'light', label: 'Light', Icon: Sun, preview: 'bg-white border-slate-200' },
                      { value: 'dark', label: 'Dark', Icon: Moon, preview: 'bg-slate-900 border-slate-700' },
                      { value: 'system', label: 'System', Icon: () => <span className="text-xl">💻</span>, preview: 'bg-gradient-to-br from-white to-slate-900 border-slate-300' },
                    ].map(({ value, label, Icon, preview }) => {
                      const active = resolvedTheme === value || (value === 'system' && !['light', 'dark'].includes(resolvedTheme ?? ''))
                      return (
                        <button
                          key={value}
                          onClick={() => setTheme(value)}
                          className={cn(
                            'flex flex-col items-center gap-3 p-4 rounded-xl border-2 text-sm font-medium transition-all',
                            active
                              ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          )}
                        >
                          {/* Mini preview */}
                          <div className={cn('w-full h-10 rounded-lg border', preview)} />
                          <div className="flex items-center gap-1.5">
                            <Icon className="w-3.5 h-3.5" />
                            <span className={active ? 'text-brand-700 dark:text-brand-300' : 'text-slate-500'}>{label}</span>
                          </div>
                          {active && <div className="w-1.5 h-1.5 rounded-full bg-brand-500" />}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Bell className="w-3.5 h-3.5" />
                    <span>Follow-up reminders appear as a badge in the bottom-right of the app.</span>
                  </div>
                </div>
              </SectionCard>
            )}

            {/* ── DATA TAB ── */}
            {tab === 'data' && (
              <div className="space-y-5">
                {/* Export */}
                <SectionCard title="Export Data" icon={<Download className="w-4 h-4" />} description="Download a copy of all your job applications and notes">
                  <div className="flex flex-wrap gap-3">
                    <a
                      href="/api/export"
                      download
                      className="btn-secondary text-sm inline-flex items-center gap-2"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export as CSV
                    </a>
                    <button
                      onClick={exportJSON}
                      disabled={exporting}
                      className="btn-secondary text-sm inline-flex items-center gap-2"
                    >
                      {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                      {exporting ? 'Exporting…' : 'Export as JSON'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
                    CSV includes all job fields, interview dates, and AI scores. JSON includes all records including documents and tasks.
                  </p>
                </SectionCard>

                {/* Import */}
                <SectionCard title="Import Data" icon={<Upload className="w-4 h-4" />} description="Restore from a previously exported JSON file">
                  <label className="btn-secondary text-sm inline-flex items-center gap-2 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    Choose JSON file
                    <input
                      type="file"
                      accept=".json"
                      className="sr-only"
                      onChange={async e => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        try {
                          const text = await file.text()
                          const data = JSON.parse(text)
                          const res = await fetch('/api/import', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(data),
                          })
                          if (!res.ok) throw new Error()
                          toast.success('Data imported successfully')
                        } catch {
                          toast.error('Import failed — check the file format')
                        }
                      }}
                    />
                  </label>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
                    Only accepts JSON files exported from this app. Existing data is not overwritten.
                  </p>
                </SectionCard>

                {/* Danger zone */}
                <div className="card border-2 border-red-100 dark:border-red-900/30 overflow-hidden">
                  <div className="px-6 py-4 border-b border-red-100 dark:border-red-900/30 flex items-start gap-3 bg-red-50 dark:bg-red-900/10">
                    <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 shrink-0 mt-0.5">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-red-700 dark:text-red-400 text-sm">Danger Zone</h2>
                      <p className="text-xs text-red-500 dark:text-red-500/70 mt-0.5">These actions are permanent and cannot be undone</p>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Delete all job data</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Permanently removes all jobs, interviews, tasks, and notes</p>
                      </div>
                      <button
                        onClick={deleteAllData}
                        disabled={deleting}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ml-4',
                          confirmDelete
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                        )}
                      >
                        {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        {deleting ? 'Deleting…' : confirmDelete ? '⚠️ Confirm Delete' : 'Delete All Data'}
                      </button>
                    </div>
                    {confirmDelete && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        Click the button again to confirm. This will permanently delete everything.
                        <button onClick={() => setConfirmDelete(false)} className="ml-auto underline">Cancel</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── ABOUT TAB ── */}
            {tab === 'about' && (
              <div className="space-y-5">
                {/* App info */}
                <div className="card p-8 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-brand-500 to-brand-700 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/20">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Smart Job Tracker</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">AI Agent Edition</p>

                  <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                    {['Next.js 15', 'Prisma', 'PostgreSQL', 'Claude AI', 'Tailwind CSS'].map(tech => (
                      <span key={tech} className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {tech}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-3 text-left max-w-xs mx-auto">
                    {[
                      { label: 'Version', value: '2.0.0' },
                      { label: 'AI Model', value: 'Claude Opus' },
                      { label: 'DB', value: 'PostgreSQL' },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                        <p className="text-xs text-slate-400">{label}</p>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Keyboard shortcuts */}
                <SectionCard title="Keyboard Shortcuts" icon={<Keyboard className="w-4 h-4" />}>
                  <div className="grid grid-cols-2 gap-2">
                    {SHORTCUTS.map(([key, desc]) => (
                      <div key={key} className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                        <span className="text-xs text-slate-600 dark:text-slate-300">{desc}</span>
                        <kbd className="text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-lg shadow-sm">
                          {key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {/* Features */}
                <SectionCard title="Features" icon={<Sparkles className="w-4 h-4" />} description="Everything the app does for you">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      '🤖 AI Job Discovery Agent',
                      '📊 Job fit scoring (0–100)',
                      '✉️ AI Cover letter generator',
                      '📄 Resume tailoring & ATS score',
                      '🎯 Interview prep generator',
                      '📅 Follow-up reminders',
                      '💰 Salary advice & negotiation',
                      '📈 Analytics & heatmap',
                      '🔗 LinkedIn/Indeed/Glassdoor search',
                      '📤 CSV & JSON export',
                    ].map(f => (
                      <div key={f} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                        {f}
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
