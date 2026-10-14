'use client'

import { useState, Suspense } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, LogIn, AlertCircle, FileText, Package, Truck, BarChart3 } from 'lucide-react'
import Image from 'next/image'

function landingPage(level: number): string {
  if (level >= 3) return '/dashboard'
  return '/contracts'
}

const features = [
  { label: 'Contract tracking and renewal monitoring', icon: FileText },
  { label: 'Fuel package allocation and controls', icon: Package },
  { label: 'Delivery and issuance recording', icon: Truck },
  { label: 'Monthly reports and running balances', icon: BarChart3 },
]

export default function LoginForm() {
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
      const session = await getSession()
      const level = (session?.user?.accessLevel as number) ?? 1
      const landing = landingPage(level)

      const dest = rawCallback && !rawCallback.startsWith('/dashboard')
        ? rawCallback
        : landing

      router.push(dest)
    } else if (res?.error) {
      setError('Invalid username or password. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex bg-[var(--bg-primary)]">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-b from-[#0f172a] to-[#1a2740] flex-col justify-between p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative flex items-center gap-3">
          <Image src="/npc-big-logo.png" alt="NPC" width={48} height={48} />
          <div>
            <p className="text-white text-sm font-medium leading-tight">National Power Corporation</p>
            <p className="text-slate-400 text-xs mt-0.5">Fuel Supply Contract Management</p>
          </div>
        </div>

        <div className="relative space-y-8">
          <h1 className="text-white text-3xl font-medium leading-snug max-w-sm">
            Contract records, allocations, and deliveries — kept in one system.
          </h1>

          <ul className="space-y-3 max-w-sm">
            {features.map((f) => (
              <li key={f.label} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="w-8 h-8 rounded-md bg-white/[0.06] border border-white/10 flex items-center justify-center flex-shrink-0">
                  <f.icon size={15} className="text-slate-400" />
                </span>
                {f.label}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-slate-500 text-xs">
          © {new Date().getFullYear()} National Power Corporation. All rights reserved.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <Image src="/npc-big-logo.png" alt="NPC" width={40} height={40} />
            <span className="text-[var(--text-primary)] text-sm font-medium">National Power Corporation</span>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-medium text-[var(--text-primary)]">Sign in</h2>
            <p className="text-sm text-[var(--text-muted)] mt-1.5">Enter your account credentials to continue.</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-md p-3 mb-5 text-sm">
              <AlertCircle size={15} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-[var(--text-secondary)]">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                required
                autoFocus
                className="input-field"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-[var(--text-secondary)]">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="input-field pr-10"
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
              className="btn-primary w-full justify-center py-2.5 mt-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
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
