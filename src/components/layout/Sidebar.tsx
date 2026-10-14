'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  Package,
  ClipboardList,
  Activity,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Fuel,
  BarChart2,
  ArrowLeftRight,
  Users2
} from 'lucide-react'
import Image from 'next/image'

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Overview',
    minLevel: 4,   // Super Admin only
  },
  {
    label: 'Fuel Contracts',
    href: '/contracts',
    icon: FileText,
    description: 'Manage contracts',
    minLevel: 2,
  },
  {
    label: 'Packages',
    href: '/packages',
    icon: Package,
    description: 'Contract packages',
    minLevel: 2,
  },
  {
    label: 'Running Balance',
    href: '/running-balance',
    icon: BarChart2,
    description: 'Package balance summary',
    minLevel: 1,
  },
  {
    label: 'Amendment Log',
    href: '/amendment-log',
    icon: ArrowLeftRight,
    description: 'Amendment transfer history',
    minLevel: 1,
  },
  {
    label: 'Details',
    href: '/details',
    icon: ClipboardList,
    description: 'Delivery details',
    minLevel: 2,
  },
  {
    label: 'Activity Log',
    href: '/activity',
    icon: Activity,
    description: 'Trail & history',
    minLevel: 4,
  },
  {
    label:    'Signatories',
    href:     '/signatories',
    icon:     Users2,
    description: 'Report signatories',
    minLevel: 2,
  },
]
 
const bottomItems = [
  {
    label: 'Users',
    href: '/users',
    icon: Users,
    description: 'User management',
    adminOnly: true,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'App settings',
  },
]

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname  = usePathname()
  const { data: session } = useSession()
  const userLevel = (session?.user?.accessLevel ?? 0)
  const isAdmin   = userLevel >= 3

  const roleMap: Record<number, string> = {
    1: 'Viewer',
    2: 'Editor',
    3: 'Admin',
    4: 'Super Admin',
  };

  return (
    <aside
      className={cn(
        'sidebar flex flex-col h-full transition-all duration-300 ease-in-out relative',
        isCollapsed ? 'w-[64px]' : 'w-[230px]'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 py-5 px-4 border-b border-white/5 flex-shrink-0',
        isCollapsed && 'justify-center px-0'
      )}>
        <Image src="/npc-big-logo.png" alt="FuelContract MS" width={32} height={32} className={cn(isCollapsed && 'hidden')} />
        {!isCollapsed && (
          <div className="animate-fade-up overflow-hidden">
            <p className="text-white font-display font-700 text-sm leading-tight tracking-tight">FuelContract</p>
            <p className="text-white/30 text-xs">Management System</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-1">
        {!isCollapsed && (
          <p className="text-white/20 text-xs font-600 uppercase tracking-widest px-2 pb-2">
            Main
          </p>
        )}
        {navItems.filter(item => userLevel >= (item.minLevel ?? 1)).map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn('nav-item', isActive && 'active')}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!isCollapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/5 py-3 px-2 space-y-1">
        {!isCollapsed && (
          <p className="text-white/20 text-xs font-600 uppercase tracking-widest px-2 pb-2">
            System
          </p>
        )}
        {bottomItems.map((item) => {
          if (item.adminOnly && !isAdmin) return null
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn('nav-item', isActive && 'active')}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </div>

      {/* User chip */}
      {session?.user && (
        <div className={cn(
          'border-t border-white/5 p-3 flex items-center gap-2',
          isCollapsed && 'justify-center'
        )}>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="text-white/80 text-xs font-300 truncate">
                National Power Corporation 
              </p>
            </div>
          )}
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-lg hover:bg-brand-600 transition-colors z-10"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  )
}
