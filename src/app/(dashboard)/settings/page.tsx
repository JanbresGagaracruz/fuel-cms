'use client'

import { useTheme } from '@/components/ui/ThemeProvider'
import { useSession } from 'next-auth/react'
import { SectionHeader } from '@/components/ui/index'
import { Sun, Moon, Monitor, Shield, Bell, Database } from 'lucide-react'

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme()
  const { data: session } = useSession()

  return (
    <div className="space-y-6 max-w-2xl">
      <SectionHeader
        title="Settings"
        subtitle="Manage your application preferences"
      />

      {/* Appearance */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Monitor size={15} className="text-[var(--text-muted)]" />
          <h2 className="font-display font-600 text-[var(--text-primary)] text-sm">Appearance</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-500 text-[var(--text-primary)]">Color theme</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Switch between light and dark mode</p>
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          {[
            { label: 'Light', icon: Sun, value: 'light' },
            { label: 'Dark', icon: Moon, value: 'dark' },
          ].map(({ label, icon: Icon, value }) => (
            <button
              key={value}
              onClick={() => value !== theme && toggleTheme()}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-500 transition-all ${
                theme === value
                  ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Account */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={15} className="text-[var(--text-muted)]" />
          <h2 className="font-display font-600 text-[var(--text-primary)] text-sm">Account</h2>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Display Name', value: session?.user?.name || '—' },
            { label: 'Username', value: session?.user?.username || '—' },
            { label: 'Email', value: session?.user?.email || '—' },
            { label: 'Position', value: session?.user?.position || '—' },
            { label: 'Access Level', value: session?.user?.accessLevel ? `Level ${session.user.accessLevel}` : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
              <span className="text-xs text-[var(--text-muted)] uppercase tracking-wide">{label}</span>
              <span className="text-sm font-500 text-[var(--text-primary)]">{value}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
