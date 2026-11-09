'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Briefcase, BarChart2, Calendar, Settings,
  Sun, Moon, CheckSquare, Mail, FileText,
  PanelLeftClose, PanelLeftOpen, Bot, LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'
import { useUIStore } from '@/lib/store'
import { useEffect, useState } from 'react'

const NAV_MAIN = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/jobs', label: 'Board', icon: Briefcase },
  { href: '/agent', label: 'Job agent', icon: Bot },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
]

const NAV_TOOLS = [
  { href: '/resume', label: 'Résumé', icon: FileText },
  { href: '/templates', label: 'Email templates', icon: Mail },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function initials(name: string, email: string) {
  const parts = (name || email).trim().split(/\s+/).filter(Boolean)
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? '?').slice(0, 2)
  return letters.toUpperCase()
}

export async function signOut() {
  await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
  window.location.href = '/login'
}

export function Sidebar({ user, demo }: { user: { name: string; email: string }; demo?: boolean }) {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const { sidebarCollapsed: collapsed, toggleSidebar } = useUIStore()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === 'dark'
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: typeof Bot }) {
    const active = isActive(href)
    return (
      <Link
        href={href}
        title={collapsed ? label : undefined}
        aria-current={active ? 'page' : undefined}
        className={cn('sidebar-nav-item', active && 'active', collapsed && 'justify-center px-2')}
      >
        <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-brand-600 dark:text-brand-400' : '')} strokeWidth={1.75} />
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    )
  }

  return (
    <aside
      className={cn(
        'hidden h-full shrink-0 flex-col border-r border-slate-200 bg-slate-50 transition-[width] duration-200 dark:border-[#2A2B2E] dark:bg-[#121314] md:flex',
        collapsed ? 'w-14' : 'w-56'
      )}
    >
      <div className={cn('flex h-14 shrink-0 items-center', collapsed ? 'justify-center px-2' : 'justify-between pl-4 pr-2')}>
        {!collapsed && <Link href="/" className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white">JobTrack</Link>}
        <button
          onClick={toggleSidebar}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-200/60 hover:text-slate-900 dark:hover:bg-white/5 dark:hover:text-white"
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" strokeWidth={1.75} /> : <PanelLeftClose className="h-4 w-4" strokeWidth={1.75} />}
        </button>
      </div>

      <nav aria-label="Main" className={cn('flex-1 space-y-0.5 overflow-y-auto pb-3', collapsed ? 'px-2' : 'px-2.5')}>
        {NAV_MAIN.map(item => <NavLink key={item.href} {...item} />)}
        <div className="my-3 border-t border-slate-200 dark:border-[#2A2B2E]" role="separator" />
        {NAV_TOOLS.map(item => <NavLink key={item.href} {...item} />)}
      </nav>

      <div className={cn('shrink-0 space-y-0.5 border-t border-slate-200 py-2.5 dark:border-[#2A2B2E]', collapsed ? 'px-2' : 'px-2.5')}>
        {mounted && (
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            title={isDark ? 'Light theme' : 'Dark theme'}
            className={cn('sidebar-nav-item w-full', collapsed && 'justify-center px-2')}
          >
            {isDark ? <Sun className="h-4 w-4 shrink-0" strokeWidth={1.75} /> : <Moon className="h-4 w-4 shrink-0" strokeWidth={1.75} />}
            {!collapsed && (isDark ? 'Light theme' : 'Dark theme')}
          </button>
        )}
        <div className={cn('flex items-center gap-2.5 rounded-md py-1.5', collapsed ? 'justify-center' : 'px-2.5')}>
          <span
            aria-hidden="true"
            title={collapsed ? `${user.name || user.email}` : undefined}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-semibold text-brand-800 dark:bg-brand-900 dark:text-brand-200"
          >
            {initials(user.name, user.email)}
          </span>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium leading-tight text-slate-900 dark:text-white">{user.name || 'Your account'}</p>
              <p className="truncate text-[12px] leading-tight text-slate-500">{demo ? 'Demo account' : user.email}</p>
            </div>
          )}
          {!collapsed && (
            <button onClick={signOut} title="Sign out" aria-label="Sign out" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-200/60 hover:text-slate-900 dark:hover:bg-white/5 dark:hover:text-white">
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
            </button>
          )}
        </div>
        {collapsed && (
          <button onClick={signOut} title="Sign out" aria-label="Sign out" className="sidebar-nav-item w-full justify-center px-2">
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
          </button>
        )}
      </div>
    </aside>
  )
}
