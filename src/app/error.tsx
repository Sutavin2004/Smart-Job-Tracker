'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

/** Shown when a page crashes; keeps the sidebar and lets the user retry. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div role="alert" className="max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/30">
          <AlertTriangle className="h-7 w-7 text-red-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Something went wrong</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          This page hit an unexpected error. Your data is safe.
        </p>
        <button onClick={reset} className="btn-primary mt-5 inline-flex"><RotateCcw className="h-4 w-4" /> Try again</button>
        {error.digest && <p className="mt-3 text-[11px] text-slate-400">Error ID: {error.digest}</p>}
      </div>
    </div>
  )
}
