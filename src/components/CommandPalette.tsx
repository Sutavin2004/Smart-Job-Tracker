'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, Bot, BarChart2, Settings, Briefcase, X, FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { Job } from '@/lib/types'
import { STATUS_CONFIG } from '@/lib/types'

const QUICK_ACTIONS = [
  { label: 'Add Job', icon: Plus, action: 'add-job', shortcut: '⌘N' },
  { label: 'Run Agent', icon: Bot, action: 'nav:/agent' },
  { label: 'Analytics', icon: BarChart2, action: 'nav:/analytics' },
  { label: 'Resume Tools', icon: FileText, action: 'nav:/resume' },
  { label: 'Settings', icon: Settings, action: 'nav:/settings' },
]

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen, setAddJobModalOpen } = useUIStore()
  const [query, setQuery] = useState('')
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [cursor, setCursor] = useState(0)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!commandPaletteOpen) { setQuery(''); setCursor(0); return }
    setTimeout(() => inputRef.current?.focus(), 50)
    fetch('/api/jobs').then(r => r.json()).then(setJobs).catch(() => {})
  }, [commandPaletteOpen])

  useEffect(() => {
    if (!query.trim()) { setFilteredJobs(jobs.slice(0, 5)); return }
    const q = query.toLowerCase()
    setFilteredJobs(jobs.filter(j => j.company.toLowerCase().includes(q) || j.role.toLowerCase().includes(q)).slice(0, 6))
  }, [query, jobs])

  function close() { setCommandPaletteOpen(false) }

  function runAction(action: string) {
    close()
    if (action === 'add-job') { setTimeout(() => setAddJobModalOpen(true), 100); return }
    if (action.startsWith('nav:')) { router.push(action.slice(4)); return }
  }

  function openJob(job: Job) {
    close()
    router.push(`/jobs?id=${job.id}`)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!commandPaletteOpen) return
      if (e.key === 'Escape') { close(); return }
      const total = QUICK_ACTIONS.length + filteredJobs.length
      if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => (c + 1) % total) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(c => (c - 1 + total) % total) }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (cursor < QUICK_ACTIONS.length) runAction(QUICK_ACTIONS[cursor].action)
        else openJob(filteredJobs[cursor - QUICK_ACTIONS.length])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commandPaletteOpen, cursor, filteredJobs])

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={close}
          />
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: -8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-lg bg-white dark:bg-[#1a1826] rounded-2xl shadow-modal border border-slate-200/60 dark:border-white/10 overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-white/5">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => { setQuery(e.target.value); setCursor(0) }}
                placeholder="Search jobs or type a command..."
                className="flex-1 bg-transparent outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <kbd className="text-[10px] bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono text-slate-400">Esc</kbd>
            </div>

            <div className="max-h-80 overflow-y-auto py-2">
              <p className="px-4 py-1 text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">Quick Actions</p>
              {QUICK_ACTIONS.map((action, i) => (
                <button
                  key={action.action}
                  onClick={() => runAction(action.action)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-white/5 text-left transition-colors',
                    cursor === i && 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                  )}
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center">
                    <action.icon className="w-3.5 h-3.5" />
                  </div>
                  {action.label}
                  {action.shortcut && <span className="ml-auto text-[10px] text-slate-400 font-mono">{action.shortcut}</span>}
                </button>
              ))}

              {filteredJobs.length > 0 && (
                <>
                  <p className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">
                    {query ? 'Results' : 'Recent Jobs'}
                  </p>
                  {filteredJobs.map((job, i) => {
                    const cfg = STATUS_CONFIG[job.status as keyof typeof STATUS_CONFIG]
                    return (
                      <button
                        key={job.id}
                        onClick={() => openJob(job)}
                        className={cn(
                          'w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-white/5 text-left transition-colors',
                          cursor === QUICK_ACTIONS.length + i && 'bg-brand-50 dark:bg-brand-900/20'
                        )}
                      >
                        <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                          {job.company[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 dark:text-white truncate">{job.company}</p>
                          <p className="text-xs text-slate-500 truncate">{job.role}</p>
                        </div>
                        <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', cfg?.bg, cfg?.color)}>
                          {cfg?.label}
                        </span>
                      </button>
                    )
                  })}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
