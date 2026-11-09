import Link from 'next/link'
import { Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-900/30">
          <Compass className="h-7 w-7 text-brand-600" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Page not found</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">That page doesn&apos;t exist or has moved.</p>
        <Link href="/" className="btn-primary mt-5 inline-flex">Back to dashboard</Link>
      </div>
    </div>
  )
}
