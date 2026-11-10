'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Briefcase, Bot, Send, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/', icon: LayoutDashboard, label: 'Home' },
  { href: '/jobs', icon: Briefcase, label: 'Board' },
  { href: '/apply', icon: Send, label: 'Apply' },
  { href: '/agent', icon: Bot, label: 'Agent' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex border-t border-slate-200 dark:border-[#2A2B2E] bg-white dark:bg-[#121314]">
      {TABS.map(({ href, icon: Icon, label }) => {
        const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
              active
                ? 'text-brand-600 dark:text-brand-400'
                : 'text-slate-500'
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={1.75} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
