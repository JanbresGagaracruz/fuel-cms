'use client'

import { useState, Suspense } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Fuel, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'
import Image from 'next/image'

function landingPage(level: number): string {
  if (level >= 4) return '/dashboard'   // Super Admin
  if (level >= 3) return '/dashboard'   // Admin
  if (level >= 2) return '/contracts'   // Staff
  return '/contracts'                   // Viewer (level 1) — read-only contracts list
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawCallback = searchParams.get('callbackUrl')

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await signIn('credentials', {
      username,
      password,
      redirect: false,
    })

    setLoading(false)
    if (res?.ok) {
      // Fetch the session to read the actual access level
      const session = await getSession()
      const level   = (session?.user?.accessLevel as number) ?? 1
      const landing = landingPage(level)

      // If there's a callbackUrl that isn't a dashboard-only page, honour it
      // (e.g. a direct link to /contracts/123 is fine for level 1)
      const dest = rawCallback && !rawCallback.startsWith('/dashboard')
        ? rawCallback
        : landing

      router.push(dest)
    }else if (res?.error) {
      setError('Invalid username or password. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex bg-[var(--bg-primary)]">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0b0d11] flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        {/* Glow orb */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-brand-500/10 blur-[80px]" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
              <Image src="/npc-big-logo.png" alt="FuelContract MS" width={64} height={64} />
            <span className="text-white font-display font-700 text-lg">National Power Corporation</span>
          </div>
        </div>

        <div className="relative space-y-6">
          <div>
            <h1 className="text-white font-display text-4xl font-800 leading-tight">
              Fuel Contract
              <br />
              <span className="text-brand-400">Management</span>
              <br />
              System
            </h1>
            <p className="text-white/40 mt-4 text-sm leading-relaxed max-w-xs">
              Centralize your fuel supply contracts, packages, and delivery details in one place.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-xs">
            {[
              { label: 'Contract Tracking', icon: '📄' },
              { label: 'Package Management', icon: '📦' },
              { label: 'Delivery Details', icon: '🚛' },
              { label: 'Activity Trails', icon: '📊' },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-2 bg-white/5 rounded-lg p-3">
                <span className="text-base">{f.icon}</span>
                <span className="text-white/60 text-xs">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-white/20 text-xs">
          © {new Date().getFullYear()} FuelContract MS. All rights reserved.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
              <Image src="/npc-big-logo.png" alt="FuelContract MS" width={50} height={50} />
            <span className="font-display font-700 text-[var(--text-primary)]">National Power Corporation</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-display font-700 text-[var(--text-primary)]">Sign in</h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">Enter your credentials to continue</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-lg p-3 mb-5 text-sm animate-fade-up">
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-500 text-[var(--text-secondary)] uppercase tracking-wide">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                autoFocus
                className="input-field"
                autoComplete="username"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-500 text-[var(--text-secondary)] uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="input-field pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <LogIn size={15} />
                  Sign in
                </span>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  )
}
