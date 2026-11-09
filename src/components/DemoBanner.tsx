import { Github, Info } from 'lucide-react'
import { DEMO_REPO_URL } from '@/lib/demo'

/** Shown on the public demo deployment only. */
export function DemoBanner() {
  return (
    <div role="note" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-slate-200 bg-white px-4 py-2 text-center text-[13px] text-slate-600 dark:border-[#2A2B2E] dark:bg-[#1A1B1D] dark:text-slate-300">
      <span className="inline-flex items-center gap-1.5"><Info className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" aria-hidden="true" /> You are using the demo account. Sample data resets every day, and AI writing tools are off.</span>
      <a href={DEMO_REPO_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-slate-900 underline underline-offset-2 hover:no-underline dark:text-white">
        <Github className="h-3.5 w-3.5" aria-hidden="true" /> View the source
      </a>
    </div>
  )
}
