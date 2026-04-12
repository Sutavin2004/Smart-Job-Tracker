'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Briefcase, BarChart2, Calendar, Settings,
  Sun, Moon, Sparkles, ChevronLeft, ChevronRight,
  CheckSquare, Mail, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'
import { useUIStore } from '@/lib/store'
import { useEffect, useState } from 'react'

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/jobs', label: 'Jobs Board', icon: Briefcase },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/templates', label: 'Templates', icon: Mail },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === 'dark'

  return (
    <aside
      className={cn(
        'h-screen flex flex-col bg-white dark:bg-[#1a1826] border-r border-slate-200 dark:border-slate-700/60 shrink-0 transition-all duration-300',
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
            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Smart Job</p>
            <p className="text-xs font-medium leading-tight gradient-text">Tracker</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className={cn('flex-1 py-3 space-y-0.5 overflow-y-auto', sidebarCollapsed ? 'px-2' : 'px-3')}>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
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
      </nav>

      {/* Bottom actions */}
      <div className={cn(
        'border-t border-slate-100 dark:border-slate-700/60 py-3 space-y-0.5',
        sidebarCollapsed ? 'px-2' : 'px-3'
      )}>
        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            title={isDark ? 'Light mode' : 'Dark mode'}
            className={cn(
              'sidebar-nav-item w-full',
              sidebarCollapsed && 'justify-center px-2'
            )}
          >
            {isDark
              ? <Sun className="w-4 h-4 shrink-0" />
              : <Moon className="w-4 h-4 shrink-0" />
            }
            {!sidebarCollapsed && (isDark ? 'Light mode' : 'Dark mode')}
          </button>
        )}

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'sidebar-nav-item w-full',
            sidebarCollapsed && 'justify-center px-2'
          )}
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
