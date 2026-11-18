'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { X } from 'lucide-react'

/** Each stop points at a menu link (data-tour on desktop, data-tour-mobile on phones). */
const STEPS = [
  {
    href: '/profile',
    title: 'Start with your profile',
    body: 'Upload your résumé here. Your details, skills and the roles that suit you are filled in from it, and you choose what kind of job you want.',
  },
  {
    href: '/agent',
    title: 'The job agent finds jobs for you',
    body: 'Every morning it searches job boards and the web, scores each job out of 100 against your profile, and adds the good ones to your board.',
  },
  {
    href: '/apply',
    title: 'Ready to apply',
    body: 'For your best matches it writes a résumé and cover letter for that one job, using only what is on your résumé. Open the posting, upload the files, and mark it applied.',
  },
  {
    href: '/jobs',
    title: 'Your board',
    body: 'Every job you are tracking, sorted by stage. Drag a card when something changes, or click it for interview prep, notes and contacts.',
  },
  {
    href: '/',
    title: 'Your dashboard',
    body: 'How your search is going at a glance: applications, interviews, response rate, and follow-ups that need your attention.',
  },
] as const

type Box = { top: number; left: number; width: number; height: number }

function targetFor(href: string): HTMLElement | null {
  for (const sel of [`[data-tour="${href}"]`, `[data-tour-mobile="${href}"]`]) {
    const el = document.querySelector<HTMLElement>(sel)
    if (el && el.getBoundingClientRect().width > 0) return el
  }
  return null
}

async function markSeen() {
  await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tourSeen: true }) }).catch(() => {})
}

/**
 * A short, optional walkthrough of the main pages. Offered once after the first
 * sign-in; replayable from Settings → Help (which links to /?tour=1).
 * Non-modal: the page stays usable while it is open.
 */
export function WelcomeTour({ offer }: { offer: boolean }) {
  const router = useRouter()
  const pathname = usePathname()
  const [state, setState] = useState<'hidden' | 'offer' | number>('hidden')
  const [box, setBox] = useState<Box | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const offered = useRef(false)

  // Show the offer once, or start straight away when asked to replay.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('tour') === '1') {
      params.delete('tour')
      const q = params.toString()
      window.history.replaceState(null, '', pathname + (q ? `?${q}` : ''))
      setState(0)
    } else if (offer && !offered.current) {
      // Once per visit: the layout doesn't re-render on client navigation, so `offer` stays stale.
      offered.current = true
      setState(s => (s === 'hidden' ? 'offer' : s))
    }
  }, [offer, pathname])

  const step = typeof state === 'number' ? STEPS[state] : null

  const measure = useCallback(() => {
    if (!step) return setBox(null)
    const r = targetFor(step.href)?.getBoundingClientRect()
    setBox(r ? { top: r.top, left: r.left, width: r.width, height: r.height } : null)
  }, [step])

  useLayoutEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  useEffect(() => {
    if (state !== 'hidden') headingRef.current?.focus()
  }, [state])

  const close = useCallback(() => {
    setState('hidden')
    markSeen()
  }, [])

  useEffect(() => {
    if (state === 'hidden') return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state, close])

  if (state === 'hidden') return null

  // Next to the highlighted link on desktop; above the tab bar on phones.
  const beside = box && window.innerWidth >= 768
  const cardStyle: React.CSSProperties = beside
    ? { left: box.left + box.width + 16, top: Math.max(16, Math.min(box.top - 12, window.innerHeight - 260)) }
    : {}

  const last = typeof state === 'number' && state === STEPS.length - 1

  return (
    <>
      {box && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-[60] rounded-md ring-2 ring-brand-600 ring-offset-2 ring-offset-white dark:ring-brand-400 dark:ring-offset-[#121314]"
          style={{ top: box.top, left: box.left, width: box.width, height: box.height }}
        />
      )}
      <div
        role="dialog"
        aria-modal="false"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        className={
          'fixed z-[61] w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white p-5 shadow-panel dark:border-[#2A2B2E] dark:bg-[#1A1B1D] ' +
          (beside ? '' : 'bottom-20 left-1/2 -translate-x-1/2 md:bottom-6 md:left-auto md:right-6 md:translate-x-0')
        }
        style={cardStyle}
      >
        <button onClick={close} aria-label="Close the tour" className="absolute right-3 top-3 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-white">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        {state === 'offer' ? (
          <>
            <h2 id="tour-title" ref={headingRef} tabIndex={-1} className="pr-6 text-base font-semibold text-slate-900 focus:outline-none dark:text-white">Welcome to JobTrack</h2>
            <p id="tour-body" className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">Want a quick look around? It takes about a minute, and you can replay it any time from Settings → Help.</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setState(0)} className="btn-primary">Show me around</button>
              <button onClick={close} className="btn-secondary">No thanks</button>
            </div>
          </>
        ) : step && (
          <>
            <p className="text-[12px] tabular-nums text-slate-500">{(state as number) + 1} of {STEPS.length}</p>
            <h2 id="tour-title" ref={headingRef} tabIndex={-1} className="mt-0.5 pr-6 text-base font-semibold text-slate-900 focus:outline-none dark:text-white">{step.title}</h2>
            <p id="tour-body" className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{step.body}</p>
            <div className="mt-4 flex items-center justify-between gap-2">
              <button onClick={close} className="text-[13px] text-slate-500 hover:text-slate-900 hover:underline dark:hover:text-white">Skip tour</button>
              <div className="flex gap-2">
                {(state as number) > 0 && <button onClick={() => setState((state as number) - 1)} className="btn-secondary py-1.5">Back</button>}
                {last ? (
                  <button onClick={() => { close(); router.push('/profile') }} className="btn-primary py-1.5">Set up my profile</button>
                ) : (
                  <button onClick={() => setState((state as number) + 1)} className="btn-primary py-1.5">Next</button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
