'use client'

import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useTheme } from '@/components/ui/ThemeProvider'
import {
  Sun, Moon, Bell, LogOut, Menu, Search, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const routeLabels: Record<string, string> = {
  '/dashboard':       'Dashboard',
  '/contracts':       'Fuel Contracts',
  '/packages':        'Contract Packages',
  '/details':         'Contract Details',
  '/activity':        'Activity Log',
  '/users':           'User Management',
  '/settings':        'Settings',
  '/running-balance': 'Running Balance',
  '/amendment-log':   'Amendment Log',
}

interface TopbarProps {
  onMenuToggle: () => void
  isSidebarCollapsed: boolean
}

const roleMap: Record<number, string> = {
  1: 'Viewer',
  2: 'Editor',
  3: 'Admin',
  4: 'Super Admin',
};

export function Topbar({ onMenuToggle, isSidebarCollapsed }: TopbarProps) {

  const { data: session } = useSession()
  const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()
  const [showProfile, setShowProfile] = useState(false)

  const segments = pathname.split('/').filter(Boolean)
  const currentLabel = routeLabels[`/${segments[0]}`] || 'Page'

  return (
    <header className="topbar sticky top-0 z-30 flex items-center justify-between h-14 px-4 lg:px-6 flex-shrink-0">
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors lg:hidden"
        >
          <Menu size={18} />
        </button>
        <nav className="flex items-center gap-1 text-sm">
          <span className="text-[var(--text-muted)] hidden sm:inline">FuelContract</span>
          <ChevronRight size={14} className="text-[var(--text-muted)] hidden sm:inline" />
          <span className="font-500 text-[var(--text-primary)]">{currentLabel}</span>
          {segments[1] && (
            <>
              <ChevronRight size={14} className="text-[var(--text-muted)]" />
              <span className="text-[var(--text-secondary)] capitalize">{segments[1]}</span>
            </>
          )}
        </nav>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1.5">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* User */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center">
              <span className="text-white text-xs font-600">
                {(session?.user?.name || session?.user?.username || 'U')[0].toUpperCase()}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-500 text-[var(--text-primary)] leading-tight">
                {session?.user?.name || session?.user?.username}
              </p>
              <p className="text-xs text-[var(--text-muted)] leading-tight">
                {roleMap[session?.user?.accessLevel ?? 0] || 'Staff'}
              </p>
            </div>
          </button>

          {showProfile && (
            <div className="absolute right-0 top-full mt-1 w-52 card p-1.5 z-50 animate-fade-up">
              <div className="px-3 py-2 border-b border-[var(--border)] mb-1">
                <p className="text-sm font-500 text-[var(--text-primary)]">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-[var(--text-muted)]">{session?.user?.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
