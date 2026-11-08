'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, Loader2 } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    setLoading(false)
    if (!res.ok) {
      setError('Wrong password. Try again.')
      setPassword('')
      return
    }
    const next = params.get('next')
    // Only allow same-site relative redirects.
    const dest = next && next.startsWith('/') && !next.startsWith('//') ? next : '/'
    router.replace(dest)
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 shadow-xl">
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white">
        <Lock className="h-6 w-6" />
      </div>
      <h1 className="text-center text-xl font-bold text-slate-900 dark:text-white">JobTrack</h1>
      <p className="mt-1 mb-6 text-center text-sm text-slate-500 dark:text-slate-400">Enter your password to continue</p>
      <input
        type="password"
        autoFocus
        autoComplete="current-password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-violet-500"
      />
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={loading || !password}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 font-medium text-white disabled:opacity-50"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        Sign in
      </button>
    </form>
  )
}

export default function LoginPage() {
  // Full-screen overlay so the app chrome behind it stays hidden.
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  )
}
