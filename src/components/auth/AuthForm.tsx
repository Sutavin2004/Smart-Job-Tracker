'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

type Mode = 'login' | 'signup'

const COPY = {
  login: { title: 'Sign in', submit: 'Sign in', busy: 'Signing in…', swap: "Don't have an account?", swapLink: 'Create one', swapHref: '/signup' },
  signup: { title: 'Create your account', submit: 'Create account', busy: 'Creating account…', swap: 'Already have an account?', swapLink: 'Sign in', swapHref: '/login' },
}

export function AuthForm({ mode, next, demo }: { mode: Mode; next: string; demo: boolean }) {
  const c = COPY[mode]
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<'form' | 'demo' | null>(null)

  async function post(url: string, body: object | undefined, which: 'form' | 'demo') {
    setBusy(which)
    setError(null)
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      })
      if (res.ok) {
        window.location.href = next
        return
      }
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Something went wrong. Try again.')
    } catch {
      setError('Could not reach the server. Check your connection and try again.')
    }
    setBusy(null)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    post(`/api/auth/${mode}`, mode === 'signup' ? { name, email, password } : { email, password }, 'form')
  }

  if (demo && mode === 'signup') {
    return (
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.01em] text-slate-900 dark:text-white">Sign-up is off in the demo</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">This copy of JobTrack runs on sample data. Open the demo account from the sign-in page to look around.</p>
        <Link href="/login" className="btn-primary mt-6 w-full justify-center py-2.5">Go to sign in</Link>
      </div>
    )
  }

  const swapHref = next !== '/' ? `${c.swapHref}?next=${encodeURIComponent(next)}` : c.swapHref

  return (
    <div>
      <h1 className="text-[22px] font-semibold tracking-[-0.01em] text-slate-900 dark:text-white">{c.title}</h1>
      <p className="mt-1.5 text-sm text-slate-500">
        {c.swap}{' '}
        <Link href={swapHref} className="font-medium text-brand-600 underline-offset-4 hover:underline dark:text-brand-400">{c.swapLink}</Link>
      </p>

      {demo && mode === 'login' && (
        <div className="mt-7 rounded-lg border border-slate-200 p-4 dark:border-[#2A2B2E]">
          <p className="text-sm font-medium text-slate-900 dark:text-white">Looking around?</p>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-500">Open a sample account with a filled-in board. It resets every day.</p>
          <button
            type="button"
            onClick={() => post('/api/auth/demo', undefined, 'demo')}
            disabled={busy !== null}
            className="btn-secondary mt-3 w-full justify-center"
          >
            {busy === 'demo' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {busy === 'demo' ? 'Opening…' : 'Open the demo account'}
          </button>
        </div>
      )}

      <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
        {mode === 'signup' && (
          <Field label="Name" id="name">
            <input id="name" className="input" autoComplete="name" value={name} onChange={e => setName(e.target.value)} required maxLength={80} />
          </Field>
        )}
        <Field label="Email" id="email">
          <input id="email" type="email" className="input" autoComplete="email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </Field>
        <Field label="Password" id="password" hint={mode === 'signup' ? 'At least 8 characters.' : undefined}>
          <input
            id="password"
            type="password"
            className="input"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={mode === 'signup' ? 8 : undefined}
            aria-describedby={mode === 'signup' ? 'password-hint' : undefined}
          />
        </Field>

        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>
        )}

        <button type="submit" disabled={busy !== null} className="btn-primary w-full justify-center py-2.5">
          {busy === 'form' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {busy === 'form' ? c.busy : c.submit}
        </button>
      </form>

      {mode === 'signup' && (
        <p className="mt-6 text-[13px] leading-relaxed text-slate-500">
          Your board, notes and résumé are private to your account. You can delete the account and everything in it from Settings.
        </p>
      )}
    </div>
  )
}

function Field({ label, id, hint, children }: { label: string; id: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      {children}
      {hint && <p id={`${id}-hint`} className="mt-1.5 text-[13px] text-slate-500">{hint}</p>}
    </div>
  )
}
