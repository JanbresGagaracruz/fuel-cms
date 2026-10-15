'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'
import Image from 'next/image'

function landingPage(level: number): string {
  if (level >= 3) return '/dashboard'
  return '/contracts'
}

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3">
          <Image src="/npc-big-logo.png" alt="National Power Corporation" width={44} height={44} />
          <div>
            <p className="text-[15px] font-medium text-[var(--text-primary)] leading-tight">
              National Power Corporation
            </p>
            <p className="text-[13px] text-[var(--text-muted)] mt-0.5">
              Fuel Contract Management System
            </p>
          </div>
        </div>

        <div className="h-px bg-[var(--border)] my-8" />

        <h1 className="text-xl font-medium text-[var(--text-primary)]">Sign in</h1>
        <p className="text-[15px] text-[var(--text-secondary)] mt-1.5 mb-7">
          Enter your username and password to continue.
        </p>

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-md px-3 py-2.5 mb-5 text-sm"
          >
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              autoFocus
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-[13px] font-medium text-[var(--text-secondary)] mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="input-field pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
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

        <p className="text-[13px] text-[var(--text-muted)] mt-10">
          © {new Date().getFullYear()} National Power Corporation
        </p>
      </div>
    </div>
  )
}
