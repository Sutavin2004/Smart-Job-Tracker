'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Briefcase, Bot, BarChart2, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/', icon: LayoutDashboard, label: 'Home' },
  { href: '/jobs', icon: Briefcase, label: 'Jobs' },
  { href: '/agent', icon: Bot, label: 'Agent' },
  { href: '/analytics', icon: BarChart2, label: 'Analytics' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex border-t border-slate-200 dark:border-slate-700/60 bg-white dark:bg-[#1a1826]">
      {TABS.map(({ href, icon: Icon, label }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
              active
                ? 'text-brand-600 dark:text-brand-400'
                : 'text-slate-400 dark:text-slate-500'
            )}
          >
            <Icon className={cn('w-5 h-5', active && 'drop-shadow-[0_0_6px_rgba(132,72,255,0.5)]')} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
