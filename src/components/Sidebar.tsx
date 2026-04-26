'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Briefcase, BarChart2, Calendar, Settings,
  Sun, Moon, CheckSquare, Mail, FileText,
  PanelLeftClose, PanelLeftOpen, Bot, Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'
import { useUIStore } from '@/lib/store'
import { useEffect, useState } from 'react'

const NAV_MAIN = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/agent', label: 'Job Agent', icon: Bot, badge: 'AI', gradient: true },
  { href: '/jobs', label: 'Jobs Board', icon: Briefcase },
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
]

const NAV_TOOLS = [
  { href: '/resume', label: 'Resume Tools', icon: FileText },
  { href: '/templates', label: 'Email Templates', icon: Mail },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === 'dark'

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href)
  }

  return (
    <aside
      className={cn(
        'hidden md:flex h-screen flex-col bg-white dark:bg-[#1a1826] border-r border-slate-200 dark:border-slate-700/60 shrink-0 transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center border-b border-slate-100 dark:border-slate-700/60 shrink-0',
        sidebarCollapsed ? 'px-3 py-4 justify-center' : 'px-4 py-4 gap-2'
      )}>
        <div className="w-8 h-8 bg-gradient-brand rounded-xl flex items-center justify-center shadow-glow-brand shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">JobTrack</p>
            <p className="text-xs font-medium leading-tight gradient-text">AI Edition</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className={cn('flex-1 py-3 overflow-y-auto', sidebarCollapsed ? 'px-2 space-y-0.5' : 'px-3 space-y-0.5')}>
        {!sidebarCollapsed && (
          <p className="px-2 pb-1 text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">Main</p>
        )}
        {NAV_MAIN.map(({ href, label, icon: Icon, badge, gradient }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              title={sidebarCollapsed ? label : undefined}
              className={cn(
                'sidebar-nav-item group relative',
                active ? 'active' : '',
                sidebarCollapsed && 'justify-center px-2'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span className="truncate flex-1">{label}</span>}
              {!sidebarCollapsed && badge && (
                <span className={cn(
                  'text-[9px] font-bold px-1.5 py-0.5 rounded-full',
                  gradient
                    ? 'bg-gradient-brand text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                )}>
                  {badge}
                </span>
              )}
              {sidebarCollapsed && badge && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-500" />
              )}
            </Link>
          )
        })}

        <div className="pt-3">
          {!sidebarCollapsed && (
            <p className="px-2 pb-1 text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">Tools</p>
          )}
          {NAV_TOOLS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                title={sidebarCollapsed ? label : undefined}
                className={cn(
                  'sidebar-nav-item',
                  active ? 'active' : '',
                  sidebarCollapsed && 'justify-center px-2'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span className="truncate">{label}</span>}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Bottom */}
      <div className={cn(
        'border-t border-slate-100 dark:border-slate-700/60 py-3 space-y-0.5',
        sidebarCollapsed ? 'px-2' : 'px-3'
      )}>
        {mounted && (
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            title={isDark ? 'Light mode' : 'Dark mode'}
            className={cn('sidebar-nav-item w-full', sidebarCollapsed && 'justify-center px-2')}
          >
            {isDark ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
            {!sidebarCollapsed && (isDark ? 'Light mode' : 'Dark mode')}
          </button>
        )}
        <button
          onClick={toggleSidebar}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn('sidebar-nav-item w-full', sidebarCollapsed && 'justify-center px-2')}
        >
          {sidebarCollapsed
            ? <PanelLeftOpen className="w-4 h-4 shrink-0" />
            : <PanelLeftClose className="w-4 h-4 shrink-0" />
          }
          {!sidebarCollapsed && 'Collapse'}
        </button>
      </div>
    </aside>
  )
}
