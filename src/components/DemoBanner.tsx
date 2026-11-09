import { Github, Info } from 'lucide-react'
import { DEMO_REPO_URL } from '@/lib/demo'

/** Shown on the public demo deployment only. */
export function DemoBanner() {
  return (
    <div role="note" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-gradient-brand px-4 py-2 text-center text-xs font-medium text-white">
      <span className="inline-flex items-center gap-1.5"><Info className="h-3.5 w-3.5" aria-hidden="true" /> Live demo with sample data. Changes reset daily; AI writing tools are off here.</span>
      <a href={DEMO_REPO_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline underline-offset-2 hover:no-underline">
        <Github className="h-3.5 w-3.5" aria-hidden="true" /> View the source
      </a>
    </div>
  )
}
