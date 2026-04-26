'use client'

import { Plus, Search, Bell, Bot } from 'lucide-react'
import { useUIStore } from '@/lib/store'
import { cn } from '@/lib/utils'

interface TopBarProps {
  title?: string
}

export function TopBar({ title }: TopBarProps) {
  const { setAddJobModalOpen, setCommandPaletteOpen } = useUIStore()

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center gap-3 px-6 bg-white/80 dark:bg-[#0f0e1a]/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-white/5">
      {title && (
        <h1 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mr-2">{title}</h1>
      )}

      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="flex items-center gap-2 flex-1 max-w-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-400 text-xs hover:border-brand-400 transition-colors"
      >
        <Search className="w-3.5 h-3.5" />
        <span>Search jobs...</span>
        <span className="ml-auto text-[10px] bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono">⌘K</span>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => setAddJobModalOpen(true)}
          className="btn-primary text-xs py-1.5 px-3 hidden sm:flex"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Job
        </button>
        <button
          onClick={() => setAddJobModalOpen(true)}
          className="btn-primary p-2 sm:hidden"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
