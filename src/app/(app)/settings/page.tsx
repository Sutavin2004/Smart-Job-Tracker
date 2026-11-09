'use client'

import { useState, useEffect } from 'react'
import { Loader2, Download, Upload } from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { signOut } from '@/components/Sidebar'
import type { UserProfile } from '@/lib/types'

type Tab = 'profile' | 'account' | 'appearance' | 'data' | 'shortcuts'

const TABS: { id: Tab; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'account', label: 'Account' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'data', label: 'Data' },
  { id: 'shortcuts', label: 'Shortcuts' },
]

const SHORTCUTS: [string, string][] = [
  ['⌘ K', 'Open the command menu'],
  ['⌘ N', 'Add a job'],
  ['D', 'Go to dashboard'],
  ['J', 'Go to board'],
  ['G', 'Go to job agent'],
  ['A', 'Go to analytics'],
  ['R', 'Go to résumé'],
  ['S', 'Go to settings'],
]

interface Me {
  user: { name: string; email: string; createdAt: string; emailVerified: boolean; hasPassword: boolean; google: boolean }
  usage: { ai: { used: number; limit: number }; agent: { used: number; limit: number } }
  demo: boolean
  emailEnabled: boolean
}

/** A titled block: description on the left, controls on the right. */
function Section({ title, description, children, danger }: {
  title: string; description?: string; children: React.ReactNode; danger?: boolean
}) {
  return (
    <section className="grid gap-x-10 gap-y-4 border-b border-slate-200 py-8 first:pt-0 last:border-0 dark:border-[#2A2B2E] md:grid-cols-[220px_minmax(0,1fr)]">
      <div>
        <h2 className={cn('text-sm font-semibold', danger ? 'text-red-700 dark:text-red-400' : 'text-slate-900 dark:text-white')}>{title}</h2>
        {description && <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  )
}

function Field({ label, id, children, className }: { label: string; id: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-slate-700 dark:text-slate-300">{label}</label>
      {children}
    </div>
  )
}

function Meter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const shown = Math.min(used, limit)
  const pct = limit ? (shown / limit) * 100 : 0
  return (
    <div>
      <div className="flex items-baseline justify-between text-[13px]">
        <span className="text-slate-700 dark:text-slate-300">{label}</span>
        <span className="tabular-nums text-slate-500">{shown} of {limit}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-[#26272A]" role="progressbar" aria-label={label} aria-valuenow={shown} aria-valuemin={0} aria-valuemax={limit}>
        <div className={cn('h-full rounded-full', pct >= 100 ? 'bg-amber-600' : 'bg-brand-600')} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [tab, setTab] = useState<Tab>('profile')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [me, setMe] = useState<Me | null>(null)
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [verifyExpired, setVerifyExpired] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('verify') === 'expired') {
      setTab('account')
      setVerifyExpired(true)
    } else if (params.get('tab') === 'account') setTab('account')
    setMounted(true)
    fetch('/api/profile').then(r => r.json()).then(setProfile).catch(() => {})
    fetch('/api/auth/me').then(r => r.json()).then(setMe).catch(() => {})
  }, [])

  function update(key: keyof UserProfile, value: unknown) {
    setProfile(p => (p ? { ...p, [key]: value } : p))
  }

  async function saveProfile() {
    if (!profile) return
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      if (!res.ok) throw new Error()
      toast.success('Profile saved')
    } catch {
      toast.error('Could not save your profile. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.01em] text-slate-900 dark:text-white">Settings</h1>
          <p className="mt-1 text-sm text-slate-500">Your profile, account and data.</p>
        </div>
        {tab === 'profile' && profile && (
          <button onClick={saveProfile} disabled={saving} className="btn-primary">
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        )}
      </header>

      <div role="tablist" aria-label="Settings sections" className="mt-6 flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-[#2A2B2E]">
        {TABS.map(t => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
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

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="pt-8">
        {verifyExpired && tab === 'account' && (
          <p role="status" className="mb-6 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            That confirmation link has expired or was already used. Send a new one from the Email section below.
          </p>
        )}
        {tab === 'profile' && (profile ? <ProfileTab profile={profile} update={update} /> : <Loading />)}
        {tab === 'account' && (me ? <AccountTab me={me} profile={profile} onProfile={setProfile} /> : <Loading />)}
        {tab === 'appearance' && mounted && (
          <Section title="Theme" description="System follows your device setting.">
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 dark:border-[#2A2B2E]" role="radiogroup" aria-label="Theme">
              {(['light', 'dark', 'system'] as const).map(v => (
                <button
                  key={v}
                  role="radio"
                  aria-checked={theme === v}
                  onClick={() => setTheme(v)}
                  className={cn(
                    'rounded-md px-4 py-1.5 text-sm capitalize transition-colors',
                    theme === v ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </Section>
        )}
        {tab === 'data' && <DataTab />}
        {tab === 'shortcuts' && (
          <Section title="Keyboard shortcuts" description="Single-key shortcuts work when you are not typing in a field.">
            <dl className="divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-[#2A2B2E] dark:border-[#2A2B2E]">
              {SHORTCUTS.map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between px-4 py-2.5">
                  <dt className="text-sm text-slate-700 dark:text-slate-300">{desc}</dt>
                  <dd><kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans text-xs text-slate-600 dark:border-[#2A2B2E] dark:bg-[#1A1B1D] dark:text-slate-300">{key}</kbd></dd>
                </div>
              ))}
            </dl>
          </Section>
        )}
      </div>
    </div>
  )
}

function Loading() {
  return <div className="flex items-center gap-2 py-10 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading…</div>
}

function ProfileTab({ profile, update }: { profile: UserProfile; update: (k: keyof UserProfile, v: unknown) => void }) {
  const text = (key: keyof UserProfile, label: string, placeholder = '', type = 'text') => (
    <Field label={label} id={`p-${key}`}>
      <input id={`p-${key}`} type={type} className="input" value={(profile[key] as string) ?? ''} placeholder={placeholder} onChange={e => update(key, e.target.value)} />
    </Field>
  )
  return (
    <>
      <Section title="About you" description="Used on cover letters and in emails the app drafts for you.">
        <div className="grid gap-4 sm:grid-cols-2">
          {text('name', 'Full name')}
          {text('email', 'Contact email', '', 'email')}
          {text('phone', 'Phone')}
          {text('currentTitle', 'Current title', 'e.g. Software Engineering Student')}
          <Field label="Years of experience" id="p-years">
            <input id="p-years" type="number" min={0} className="input w-32" value={profile.yearsExperience} onChange={e => update('yearsExperience', Number(e.target.value))} />
          </Field>
          {text('education', 'Education', 'e.g. B.Sc. Computer Science, 2025')}
        </div>
      </Section>
      <Section title="Links" description="Added to cover letters when they are relevant.">
        <div className="grid gap-4 sm:grid-cols-2">
          {text('linkedin', 'LinkedIn', 'https://linkedin.com/in/…')}
          {text('github', 'GitHub', 'https://github.com/…')}
          {text('portfolio', 'Website', 'https://…')}
        </div>
      </Section>
      <Section title="Background for the AI" description="The assistant reads this when it scores jobs and writes for you. A few honest sentences work best.">
        <div className="space-y-4">
          <Field label="Summary" id="p-bio">
            <textarea id="p-bio" rows={4} className="input resize-y" value={profile.bio} onChange={e => update('bio', e.target.value)} placeholder="What you are good at, what you have built, what you want next." />
          </Field>
          <Field label="What you are looking for" id="p-goals">
            <textarea id="p-goals" rows={3} className="input resize-y" value={profile.jobSearchGoals} onChange={e => update('jobSearchGoals', e.target.value)} placeholder="Team size, kind of work, location, anything that is a must-have." />
          </Field>
        </div>
      </Section>
    </>
  )
}

function AccountTab({ me, profile, onProfile }: { me: Me; profile: UserProfile | null; onProfile: (p: UserProfile) => void }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [busy, setBusy] = useState<'pw' | 'del' | null>(null)
  const [deletePw, setDeletePw] = useState('')
  const [confirmText, setConfirmText] = useState('')

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    setBusy('pw')
    const res = await fetch('/api/auth/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(null)
    if (!res.ok) return toast.error(data.error ?? 'Could not change your password.')
    setCurrent(''); setNext('')
    toast.success(me.user.hasPassword ? 'Password changed. Other devices were signed out.' : 'Password set. You can now sign in with it too.')
  }

  async function deleteAccount(e: React.FormEvent) {
    e.preventDefault()
    setBusy('del')
    const res = await fetch('/api/auth/account', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: deletePw, confirm: confirmText }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { setBusy(null); return toast.error(data.error ?? 'Could not delete the account.') }
    window.location.href = '/signup'
  }

  const joined = new Date(me.user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <>
      <Section title="Signed in as">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">{me.user.email}</p>
            <p className="mt-0.5 text-[13px] text-slate-500">Member since {joined}</p>
          </div>
          <button onClick={signOut} className="btn-secondary">Sign out</button>
        </div>
      </Section>

      <Section title="Today's usage" description="Limits reset at midnight UTC.">
        <div className="max-w-md space-y-4">
          <Meter label="AI actions (cover letters, résumé, interview prep)" used={me.usage.ai.used} limit={me.usage.ai.limit} />
          <Meter label="Job agent runs" used={me.usage.agent.used} limit={me.usage.agent.limit} />
        </div>
      </Section>

      {!me.demo && <EmailSection me={me} profile={profile} onProfile={onProfile} />}

      {!me.demo && (
        <Section title="Password" description={me.user.hasPassword ? 'Changing it signs you out everywhere else.' : 'You sign in with Google. Set a password to also sign in with your email.'}>
          <form onSubmit={changePassword} className="max-w-sm space-y-4">
            {me.user.hasPassword && (
              <Field label="Current password" id="pw-current">
                <input id="pw-current" type="password" autoComplete="current-password" className="input" value={current} onChange={e => setCurrent(e.target.value)} required />
              </Field>
            )}
            <Field label="New password" id="pw-new">
              <input id="pw-new" type="password" autoComplete="new-password" minLength={8} className="input" value={next} onChange={e => setNext(e.target.value)} required />
            </Field>
            <button type="submit" disabled={busy !== null || (me.user.hasPassword && !current) || next.length < 8} className="btn-secondary">
              {busy === 'pw' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {me.user.hasPassword ? 'Change password' : 'Set password'}
            </button>
          </form>
        </Section>
      )}

      {!me.demo && (
        <Section title="Delete account" description="Removes your account and every job, note, task and document in it. This cannot be undone." danger>
          <form onSubmit={deleteAccount} className="max-w-sm space-y-4">
            <Field label='Type "delete my account" to confirm' id="del-confirm">
              <input id="del-confirm" className="input" value={confirmText} onChange={e => setConfirmText(e.target.value)} autoComplete="off" />
            </Field>
            {me.user.hasPassword && (
              <Field label="Password" id="del-pw">
                <input id="del-pw" type="password" autoComplete="current-password" className="input" value={deletePw} onChange={e => setDeletePw(e.target.value)} />
              </Field>
            )}
            <button
              type="submit"
              disabled={busy !== null || confirmText.trim().toLowerCase() !== 'delete my account' || (me.user.hasPassword && !deletePw)}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === 'del' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Delete account
            </button>
          </form>
        </Section>
      )}
    </>
  )
}

function EmailSection({ me, profile, onProfile }: { me: Me; profile: UserProfile | null; onProfile: (p: UserProfile) => void }) {
  const [sending, setSending] = useState(false)
  const [saving, setSaving] = useState(false)
  const digestOn = Boolean(profile?.emailDigest)

  async function resend() {
    setSending(true)
    const res = await fetch('/api/auth/resend-verification', { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    setSending(false)
    if (res.ok) toast.success(`Sent. Check ${me.user.email}.`)
    else toast.error(data.error ?? 'The email could not be sent.')
  }

  async function toggleDigest() {
    setSaving(true)
    const res = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ emailDigest: !digestOn }) })
    setSaving(false)
    if (res.ok) onProfile(await res.json())
    else toast.error('Could not save that setting.')
  }

  return (
    <Section title="Email" description="Password resets, and an optional note when the morning search finds new jobs.">
      {!me.emailEnabled ? (
        <p className="text-[13px] text-slate-500">Email is not set up on this site yet.</p>
      ) : (
        <div className="max-w-md space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              {me.user.email}{' '}
              <span className={cn('ml-1 text-[13px]', me.user.emailVerified ? 'text-brand-700 dark:text-brand-400' : 'text-amber-700 dark:text-amber-400')}>
                {me.user.emailVerified ? 'Confirmed' : 'Not confirmed'}
              </span>
            </p>
            {!me.user.emailVerified && (
              <button onClick={resend} disabled={sending} className="btn-secondary py-1.5">
                {sending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Send confirmation email
              </button>
            )}
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p id="digest-label" className="text-sm font-medium text-slate-900 dark:text-white">Email me new matches</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-slate-500">
                After the morning search (turn it on from the Job agent page), if it added anything.
                {!me.user.emailVerified && ' Confirm your email first.'}
              </p>
            </div>
            <button
              role="switch"
              aria-checked={digestOn}
              aria-labelledby="digest-label"
              onClick={toggleDigest}
              disabled={saving || !profile || (!digestOn && !me.user.emailVerified)}
              className={cn('relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50', digestOn ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600')}
            >
              <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white transition-[left]', digestOn ? 'left-[18px]' : 'left-0.5')} />
            </button>
          </div>
        </div>
      )}
    </Section>
  )
}

function DataTab() {
  const [exporting, setExporting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function exportJSON() {
    setExporting(true)
    try {
      const res = await fetch('/api/export', { method: 'POST' })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `jobtrack-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Export failed. Try again.')
    } finally {
      setExporting(false)
    }
  }

  async function importFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const data = JSON.parse(await file.text())
      const res = await fetch('/api/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (!res.ok) throw new Error()
      toast.success('Import finished')
    } catch {
      toast.error('That file could not be imported. Use a JSON export from JobTrack.')
    }
  }

  async function deleteAllJobs() {
    setDeleting(true)
    try {
      const jobs: { id: string }[] = await fetch('/api/jobs').then(r => r.json())
      for (const job of jobs) await fetch(`/api/jobs/${job.id}`, { method: 'DELETE' })
      toast.success(`Deleted ${jobs.length} ${jobs.length === 1 ? 'job' : 'jobs'}`)
      setConfirmDelete(false)
    } catch {
      toast.error('Some jobs could not be deleted. Try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Section title="Export" description="CSV opens in any spreadsheet. JSON includes documents and tasks and can be imported again.">
        <div className="flex flex-wrap gap-2">
          <a href="/api/export" download className="btn-secondary"><Download className="h-4 w-4" aria-hidden="true" /> Download CSV</a>
          <button onClick={exportJSON} disabled={exporting} className="btn-secondary">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
            Download JSON
          </button>
        </div>
      </Section>
      <Section title="Import" description="Adds jobs from a JobTrack JSON export. Nothing already on your board is replaced.">
        <label className="btn-secondary cursor-pointer">
          <Upload className="h-4 w-4" aria-hidden="true" /> Choose a JSON file
          <input type="file" accept=".json,application/json" className="sr-only" onChange={importFile} />
        </label>
      </Section>
      <Section title="Clear the board" description="Deletes every job along with its interviews, contacts, tasks and notes. Your profile and templates stay." danger>
        {confirmDelete ? (
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={deleteAllJobs} disabled={deleting} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
              {deleting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Yes, delete all jobs
            </button>
            <button onClick={() => setConfirmDelete(false)} className="btn-ghost">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)} className="btn-danger">Delete all jobs</button>
        )}
      </Section>
    </>
  )
}
