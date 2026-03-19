'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { cn } from '@/lib/utils'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed')
    if (stored === 'true') setIsCollapsed(true)
  }, [])

  const handleToggle = () => {
    const next = !isCollapsed
    setIsCollapsed(next)
    localStorage.setItem('sidebar-collapsed', String(next))
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar — always visible on desktop, drawer on mobile */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto lg:flex flex-shrink-0',
          isMobileOpen ? 'flex' : 'hidden lg:flex'
        )}
      >
        <Sidebar isCollapsed={isCollapsed} onToggle={handleToggle} />
      </div>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar
          onMenuToggle={() => setIsMobileOpen(!isMobileOpen)}
          isSidebarCollapsed={isCollapsed}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
