import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-sm text-center">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Page not found</h1>
        <p className="mt-1 text-sm text-slate-500">The link may be old, or the page may have moved.</p>
        <Link href="/" className="btn-primary mt-5 inline-flex">Back to dashboard</Link>
      </div>
    </div>
  )
}
