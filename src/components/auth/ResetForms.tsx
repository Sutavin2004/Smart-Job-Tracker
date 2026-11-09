'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

const h1 = 'text-[22px] font-semibold tracking-[-0.01em] text-slate-900 dark:text-white'

export function ForgotForm({ enabled }: { enabled: boolean }) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!enabled) {
    return (
      <div>
        <h1 className={h1}>Reset your password</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">Password reset by email is not set up on this site yet. Contact the site owner to get back into your account.</p>
        <Link href="/login" className="btn-secondary mt-6 w-full justify-center py-2.5">Back to sign in</Link>
      </div>
    )
  }

  if (sent) {
    return (
      <div>
        <h1 className={h1}>Check your email</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          If an account uses <span className="font-medium text-slate-700 dark:text-slate-300">{email}</span>, a link to reset the password is on its way. It expires in an hour.
        </p>
        <Link href="/login" className="btn-secondary mt-6 w-full justify-center py-2.5">Back to sign in</Link>
      </div>
    )
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null)
    const res = await fetch('/api/auth/forgot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }).catch(() => null)
    setBusy(false)
    if (res?.ok) return setSent(true)
    const data = await res?.json().catch(() => ({}))
    setError(data?.error ?? 'Could not reach the server. Try again.')
  }

  return (
    <div>
      <h1 className={h1}>Reset your password</h1>
      <p className="mt-1.5 text-sm text-slate-500">Enter your account email and we will send you a link.</p>
      <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
          <input id="email" type="email" autoComplete="email" className="input" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        {error && <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
        <button type="submit" disabled={busy || !email} className="btn-primary w-full justify-center py-2.5">
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Send reset link
        </button>
      </form>
      <p className="mt-6 text-sm text-slate-500"><Link href="/login" className="font-medium text-brand-600 underline-offset-4 hover:underline dark:text-brand-400">Back to sign in</Link></p>
    </div>
  )
}

export function ResetForm({ token }: { token: string }) {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null)
    const res = await fetch('/api/auth/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) }).catch(() => null)
    if (res?.ok) { window.location.href = '/'; return }
    const data = await res?.json().catch(() => ({}))
    setError(data?.error ?? 'Could not reach the server. Try again.')
    setBusy(false)
  }

  if (!token) {
    return (
      <div>
        <h1 className={h1}>This link is incomplete</h1>
        <p className="mt-2 text-sm text-slate-500">Open the link from the email again, or ask for a new one.</p>
        <Link href="/forgot-password" className="btn-primary mt-6 w-full justify-center py-2.5">Send a new link</Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className={h1}>Choose a new password</h1>
      <p className="mt-1.5 text-sm text-slate-500">You will be signed out on every other device.</p>
      <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">New password</label>
          <input id="password" type="password" autoComplete="new-password" minLength={8} className="input" value={password} onChange={e => setPassword(e.target.value)} aria-describedby="password-hint" required />
          <p id="password-hint" className="mt-1.5 text-[13px] text-slate-500">At least 8 characters.</p>
        </div>
        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {error} {error.includes('expired') && <Link href="/forgot-password" className="font-medium underline">Send a new link</Link>}
          </p>
        )}
        <button type="submit" disabled={busy || password.length < 8} className="btn-primary w-full justify-center py-2.5">
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Save password and sign in
        </button>
      </form>
    </div>
  )
}
