'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileText, Loader2, Play, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { CURRENCY_OPTIONS, type UserProfile } from '@/lib/types'

/** Plain-language names for fields, used in the "filled in from your résumé" note. */
const LABELS: Record<string, string> = {
  name: 'name', email: 'email', phone: 'phone', linkedin: 'LinkedIn', github: 'GitHub', portfolio: 'website',
  currentTitle: 'current title', yearsExperience: 'years of experience', education: 'education', bio: 'summary',
  skills: 'skills', targetRoles: 'roles', targetLocations: 'locations', jobSearchGoals: 'what you want next',
  targetSalaryMin: 'salary range', excludeKeywords: 'words to skip', autoDiscover: 'daily search', currency: 'currency',
}

const EDITABLE = [
  'name', 'email', 'phone', 'linkedin', 'github', 'portfolio', 'currentTitle', 'yearsExperience', 'education', 'bio', 'skills',
  'targetRoles', 'targetLocations', 'targetSalaryMin', 'targetSalaryMax', 'currency', 'preferRemote', 'preferHybrid',
  'excludeKeywords', 'jobSearchGoals', 'autoDiscover', 'autoPrepare',
] as const
type Editable = typeof EDITABLE[number]

type Busy = null | 'reading' | 'filling' | 'saving'

function listOf(keys: string[]) {
  const names = [...new Set(keys.map(k => LABELS[k] ?? k))]
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0]
}

function Step({ n, title, description, children }: { n: number; title: string; description: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`step-${n}`} className="grid gap-4 border-t border-slate-200 py-8 first:border-t-0 first:pt-2 dark:border-[#2A2B2E] md:grid-cols-[220px_1fr] md:gap-10">
      <div>
        <p className="text-[13px] tabular-nums text-slate-400">Step {n}</p>
        <h2 id={`step-${n}`} className="mt-0.5 text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  )
}

function Field({ label, id, hint, children, className }: { label: string; id: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-[13px] font-medium text-slate-700 dark:text-slate-300">{label}</label>
      {children}
      {hint && <p id={`${id}-hint`} className="text-[12px] text-slate-500">{hint}</p>}
    </div>
  )
}

function Switch({ id, label, description, checked, onChange, disabled }: { id: string; label: string; description: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-start gap-4 py-3">
      <div className="min-w-0 flex-1">
        <p id={`${id}-label`} className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
        <p className="mt-0.5 text-[13px] text-slate-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn('relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50', checked ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600')}
      >
        <span className={cn('inline-block h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-5' : 'translate-x-0.5')} />
      </button>
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [saved, setSaved] = useState<UserProfile | null>(null)
  const [draft, setDraft] = useState<UserProfile | null>(null)
  const [busy, setBusy] = useState<Busy>(null)
  const [editingText, setEditingText] = useState(false)
  const [resumeText, setResumeText] = useState('')
  const [result, setResult] = useState<{ filled: string[]; suggested: string[] } | null>(null)

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then((p: UserProfile) => { setSaved(p); setDraft(p); setResumeText(p.masterResume ?? '') }).catch(() => {})
  }, [])

  const changed = saved && draft ? EDITABLE.filter(k => draft[k] !== saved[k]) : []
  const dirty = changed.length > 0
  const hasResume = Boolean(saved?.masterResume?.trim())
  const ready = Boolean(draft?.targetRoles?.trim() && draft?.skills?.trim())

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  function set<K extends Editable>(key: K, value: UserProfile[K]) {
    setDraft(d => (d ? { ...d, [key]: value } : d))
  }

  /** Save the résumé, then fill in everything it can. */
  async function saveResume(text: string, overwrite = false) {
    if (text.trim().length < 100) { toast.error('That résumé looks too short. Paste the full text.'); return }
    setBusy('filling')
    try {
      const put = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ masterResume: text }) })
      if (!put.ok) throw new Error('Could not save your résumé. Try again.')
      const res = await fetch('/api/profile/autofill', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ overwrite }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Your résumé was saved, but the profile could not be filled in.')
      if (data.note) toast.error(data.note)
      const p: UserProfile = data.profile
      // Keep any unsaved edits the user made in the fields below.
      setDraft(d => (d && saved ? { ...p, ...Object.fromEntries(EDITABLE.filter(k => d[k] !== saved[k]).map(k => [k, d[k]])) } : p))
      setSaved(p)
      setResumeText(p.masterResume)
      setEditingText(false)
      setResult({ filled: data.filled ?? [], suggested: data.suggested ?? [] })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setBusy(null)
    }
  }

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (hasResume && !window.confirm('Replace your saved résumé with this file? Fields you have filled in stay as they are.')) return
    setBusy('reading')
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/resume/upload', { method: 'POST', body })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'That file could not be read.')
      await saveResume(data.text)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'That file could not be read.')
      setBusy(null)
    }
  }

  async function refill() {
    if (!window.confirm('Fill in every field again from your résumé? This replaces what is in them now.')) return
    await saveResume(saved?.masterResume ?? '', true)
  }

  async function save(): Promise<boolean> {
    if (!draft || !dirty) return true
    setBusy('saving')
    try {
      const body = Object.fromEntries(changed.map(k => [k, draft[k]]))
      const res = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error()
      const p = await res.json()
      setSaved(p)
      setDraft(p)
      toast.success('Profile saved')
      return true
    } catch {
      toast.error('Could not save your profile. Try again.')
      return false
    } finally {
      setBusy(null)
    }
  }

  async function runAgent() {
    if (!(await save())) return
    router.push('/agent?run=1')
  }

  if (!draft) {
    return <div className="flex items-center gap-2 px-8 py-16 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading…</div>
  }

  const text = (key: Editable, label: string, opts: { placeholder?: string; hint?: string; type?: string; className?: string } = {}) => (
    <Field label={label} id={`f-${key}`} hint={opts.hint} className={opts.className}>
      <input
        id={`f-${key}`}
        type={opts.type ?? 'text'}
        className="input"
        value={String(draft[key] ?? '')}
        placeholder={opts.placeholder}
        aria-describedby={opts.hint ? `f-${key}-hint` : undefined}
        onChange={e => set(key, e.target.value as never)}
      />
    </Field>
  )
  const area = (key: Editable, label: string, rows: number, hint?: string, placeholder?: string) => (
    <Field label={label} id={`f-${key}`} hint={hint}>
      <textarea id={`f-${key}`} rows={rows} className="input resize-y" value={String(draft[key] ?? '')} placeholder={placeholder} aria-describedby={hint ? `f-${key}-hint` : undefined} onChange={e => set(key, e.target.value as never)} />
    </Field>
  )

  const words = saved?.masterResume?.split(/\s+/).filter(Boolean).length ?? 0

  return (
    <div className="mx-auto max-w-5xl px-5 pb-32 pt-8 sm:px-8 sm:pt-10">
      <header className="relative">
        <Link href="/settings" className="absolute right-0 top-1 text-[13px] text-slate-500 hover:text-slate-900 hover:underline dark:hover:text-white">Account settings</Link>
        <h1 className="text-2xl font-semibold tracking-[-0.01em] text-slate-900 dark:text-white">Profile</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Everything the app knows about you, in one place. Add your résumé and the rest fills itself in. Check it, say what you are looking for, then run the agent.
        </p>
      </header>

      <div className="mt-6">
        <Step n={1} title="Your résumé" description="Include everything. Each tailored application picks what is relevant from it.">
          <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" className="sr-only" onChange={upload} aria-label="Upload résumé file" tabIndex={-1} />

          {busy === 'reading' || busy === 'filling' ? (
            <div role="status" className="flex items-center gap-3 rounded-lg border border-slate-200 px-5 py-6 text-sm text-slate-700 dark:border-[#2A2B2E] dark:text-slate-300">
              <Loader2 className="h-4 w-4 animate-spin text-brand-600" aria-hidden="true" />
              {busy === 'reading' ? 'Reading your résumé…' : 'Filling in your profile from your résumé. This takes a few seconds.'}
            </div>
          ) : !hasResume && !editingText ? (
            <div className="rounded-lg border border-dashed border-slate-300 px-6 py-8 text-center dark:border-[#3A3B3F]">
              <p className="text-sm font-medium text-slate-900 dark:text-white">Start by adding your résumé</p>
              <p className="mx-auto mt-1 max-w-sm text-[13px] text-slate-500">A PDF or Word file works. Your details, skills and the roles that suit you are filled in from it.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button onClick={() => fileRef.current?.click()} className="btn-primary"><Upload className="h-4 w-4" aria-hidden="true" /> Upload résumé</button>
                <button onClick={() => setEditingText(true)} className="btn-secondary">Paste the text instead</button>
              </div>
            </div>
          ) : editingText ? (
            <div className="space-y-3">
              <Field label="Résumé text" id="resume-text">
                <textarea id="resume-text" rows={16} className="input resize-y font-mono text-[13px] leading-relaxed" value={resumeText} onChange={e => setResumeText(e.target.value)} placeholder="Paste your full résumé here." />
              </Field>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => saveResume(resumeText)} className="btn-primary" disabled={!resumeText.trim()}>Save résumé</button>
                <button onClick={() => { setResumeText(saved?.masterResume ?? ''); setEditingText(false) }} className="btn-secondary">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 px-5 py-4 dark:border-[#2A2B2E]">
              <FileText className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 dark:text-white">Résumé saved</p>
                <p className="text-[13px] text-slate-500">{words.toLocaleString()} words</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => fileRef.current?.click()} className="btn-secondary py-1.5"><Upload className="h-4 w-4" aria-hidden="true" /> Replace</button>
                <button onClick={() => setEditingText(true)} className="btn-secondary py-1.5">Edit text</button>
                <button onClick={refill} className="btn-secondary py-1.5">Fill in again</button>
              </div>
            </div>
          )}

          {result && !busy && (
            <p role="status" className="mt-3 rounded-md bg-brand-50 px-4 py-3 text-[13px] leading-relaxed text-brand-900 dark:bg-brand-900/20 dark:text-brand-200">
              {result.filled.length
                ? <>Filled in from your résumé: {listOf(result.filled)}.</>
                : <>Your résumé is saved. The fields below already had values, so nothing was replaced. Use “Fill in again” to replace them.</>}
              {result.suggested.length > 0 && <> Also set starting values for {listOf(result.suggested)}.</>} Check them below and change anything that is off.
            </p>
          )}
          {hasResume && (
            <p className="mt-3 text-[13px] text-slate-500">
              Want to see how your résumé reads to an applicant tracking system? <Link href="/resume" className="font-medium text-brand-700 underline underline-offset-4 dark:text-brand-400">Check it</Link>.
            </p>
          )}
        </Step>

        <Step n={2} title="About you" description="Filled in from your résumé. Used in cover letters, application answers and fit scores.">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {text('name', 'Full name')}
              {text('email', 'Contact email', { type: 'email' })}
              {text('phone', 'Phone')}
              {text('currentTitle', 'Current title', { placeholder: 'e.g. Computer Science student' })}
              {text('education', 'Education', { placeholder: 'e.g. B.Sc. Computer Science, 2027' })}
              <Field label="Years of experience" id="f-years" hint="Internships and co-ops count.">
                <input id="f-years" type="number" min={0} max={60} className="input w-28" value={draft.yearsExperience} aria-describedby="f-years-hint" onChange={e => set('yearsExperience', Number(e.target.value))} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {text('linkedin', 'LinkedIn', { placeholder: 'https://linkedin.com/in/…' })}
              {text('github', 'GitHub', { placeholder: 'https://github.com/…' })}
              {text('portfolio', 'Website', { placeholder: 'https://…' })}
            </div>
            {area('skills', 'Skills', 3, 'Separate with commas, most important first. Each job is scored on how many of these it asks for.')}
            {area('bio', 'Summary', 4, 'A few honest sentences. The AI reads this when it writes for you.')}
          </div>
        </Step>

        <Step n={3} title="What you’re looking for" description="Tells the agent what to search for and how to score what it finds.">
          <div className="space-y-6">
            {text('targetRoles', 'Roles', { placeholder: 'Software Engineer, DevOps Engineer', hint: 'Separate with commas. The first three are searched.' })}
            {text('targetLocations', 'Locations', { placeholder: 'Toronto, Mississauga, Remote', hint: 'Cities you would work in. Add “Remote” to include remote jobs.' })}
            <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
              <fieldset>
                <legend className="mb-1.5 text-[13px] font-medium text-slate-700 dark:text-slate-300">Salary range, in thousands a year</legend>
                <div className="flex items-center gap-2">
                  <label htmlFor="f-currency" className="sr-only">Currency</label>
                  <select id="f-currency" className="input w-24" value={draft.currency} onChange={e => set('currency', e.target.value)}>
                    {CURRENCY_OPTIONS.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <label htmlFor="f-salmin" className="sr-only">Minimum</label>
                  <input id="f-salmin" type="number" min={0} className="input w-24" value={draft.targetSalaryMin || ''} placeholder="Min" onChange={e => set('targetSalaryMin', Number(e.target.value))} />
                  <span className="text-slate-400" aria-hidden="true">to</span>
                  <label htmlFor="f-salmax" className="sr-only">Maximum</label>
                  <input id="f-salmax" type="number" min={0} className="input w-24" value={draft.targetSalaryMax || ''} placeholder="Max" onChange={e => set('targetSalaryMax', Number(e.target.value))} />
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-1.5 text-[13px] font-medium text-slate-700 dark:text-slate-300">Open to</legend>
                <div className="flex gap-5 py-2">
                  {([['preferRemote', 'Remote'], ['preferHybrid', 'Hybrid']] as const).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-brand-600" checked={Boolean(draft[key])} onChange={e => set(key, e.target.checked)} />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
            {text('excludeKeywords', 'Skip jobs that mention', { placeholder: 'senior, lead, 5+ years', hint: 'Separate with commas. Matching jobs are never added.' })}
            {area('jobSearchGoals', 'What you want next', 3, undefined, 'The kind of team, work and growth you are after.')}
            <div className="divide-y divide-slate-200 border-y border-slate-200 dark:divide-[#2A2B2E] dark:border-[#2A2B2E]">
              <Switch
                id="sw-daily"
                label="Search every morning"
                description={ready ? 'Around 6–7 am Toronto time the agent searches and adds new matches to your board.' : 'Add roles and skills first.'}
                checked={Boolean(draft.autoDiscover)}
                disabled={!draft.autoDiscover && !ready}
                onChange={v => set('autoDiscover', v)}
              />
              <Switch
                id="sw-prepare"
                label="Prepare applications for the best matches"
                description="Writes a tailored résumé and cover letter for your top 3 new matches each day, ready under Ready to apply."
                checked={draft.autoPrepare !== false}
                onChange={v => set('autoPrepare', v)}
              />
            </div>
          </div>
        </Step>

        <section aria-labelledby="run-heading" className="mt-2 flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 px-5 py-5 dark:border-[#2A2B2E]">
          <div className="min-w-0 flex-1">
            <h2 id="run-heading" className="text-base font-semibold text-slate-900 dark:text-white">Find jobs with this profile</h2>
            <p className="mt-0.5 text-[13px] text-slate-500">
              {ready ? 'Saves your changes and runs the agent now. It takes about a minute.' : 'Add your résumé, or fill in roles and skills, to run the agent.'}
            </p>
          </div>
          <button onClick={runAgent} disabled={!ready || busy !== null} className="btn-primary px-5">
            <Play className="h-4 w-4" aria-hidden="true" /> Run the agent
          </button>
        </section>
      </div>

      {dirty && (
        <div className="fixed inset-x-0 bottom-16 z-30 flex justify-center px-4 md:bottom-6">
          <div role="region" aria-label="Unsaved changes" className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5 shadow-panel dark:border-[#2A2B2E] dark:bg-[#1A1B1D]">
            <p className="text-sm text-slate-700 dark:text-slate-300">Unsaved changes</p>
            <button onClick={() => setDraft(saved)} className="btn-ghost py-1.5 text-sm">Discard</button>
            <button onClick={save} disabled={busy !== null} className="btn-primary py-1.5 text-sm">
              {busy === 'saving' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Save
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
