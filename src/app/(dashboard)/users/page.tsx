'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Shield, RefreshCw, Search, Plus, KeyRound,
         UserCheck, UserX, Eye, EyeOff } from 'lucide-react'
import {
  SectionHeader, Badge, Pagination, TableSkeleton,
  EmptyState, Modal, InputField, SelectField,
} from '@/components/ui/index'
import { useToast } from '@/components/ui/Toast'
import { formatDate } from '@/lib/utils'
import { accessLevelLabel, accessLevelVariant } from '@/lib/permissions'

const defaultCreateForm = {
  UsrNam: '', password: '', confirmPassword: '',
  DisplayName: '', Firstname: '', Lastname: '',
  Email: '', PositionName: '', access_level: '1',
}

const ACCESS_LEVEL_OPTIONS = [
  { label: 'Level 1 — Viewer',       value: '1' },
  { label: 'Level 2 — Staff',        value: '2' },
  { label: 'Level 3 — Admin',        value: '3' },
  { label: 'Level 4 — Super Admin',  value: '4' },
]

export default function UsersPage() {
  const { success, error: toastError } = useToast()

  const [users,   setUsers]   = useState<any[]>([])
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(1)
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')

  // Create modal
  const [createModal, setCreateModal] = useState(false)
  const [createForm,  setCreateForm]  = useState(defaultCreateForm)
  const [creating,    setCreating]    = useState(false)
  const [showPw,      setShowPw]      = useState(false)

  // Username duplicate check
  const [usernameStatus, setUsernameStatus] =
    useState<'idle' | 'checking' | 'taken' | 'available'>('idle')
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset password modal
  const [resetModal,  setResetModal]  = useState(false)
  const [resetUser,   setResetUser]   = useState<any>(null)
  const [newPassword, setNewPassword] = useState('')
  const [showNewPw,   setShowNewPw]   = useState(false)
  const [resetting,   setResetting]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), pageSize: '15', search })
    const res    = await fetch(`/api/users?${params}`)
    if (res.ok) {
      const data = await res.json()
      setUsers(data.data  || [])
      setTotal(data.total || 0)
    }
    setLoading(false)
  }, [page, search])

  useEffect(() => { load() }, [load])

  // ── Create user ────────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (usernameStatus === 'taken') {
      toastError('Username already exists')
      return
    }
    if (createForm.password !== createForm.confirmPassword) {
      toastError('Passwords do not match')
      return
    }
    if (createForm.password.length < 6) {
      toastError('Password must be at least 6 characters')
      return
    }
    setCreating(true)
    const res = await fetch('/api/users', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(createForm),
    })
    setCreating(false)
    if (res.ok) {
      success('User created', createForm.UsrNam)
      setCreateModal(false)
      setCreateForm(defaultCreateForm)
      setUsernameStatus('idle')
      load()
    } else {
      const data = await res.json()
      toastError('Failed to create user', data.error)
    }
  }

  // ── Reset password ─────────────────────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      toastError('Password must be at least 6 characters')
      return
    }
    setResetting(true)
    const res = await fetch(`/api/users/${resetUser.UserID}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ newPassword }),
    })
    setResetting(false)
    if (res.ok) {
      success('Password reset', `Password updated for ${resetUser.UsrNam}`)
      setResetModal(false)
      setNewPassword('')
      setResetUser(null)
    } else {
      toastError('Failed to reset password')
    }
  }

  // ── Toggle enable ──────────────────────────────────────────────────────────
  const handleToggleEnable = async (user: any) => {
    const res = await fetch(`/api/users/${user.UserID}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ enable: !user.enable }),
    })
    if (res.ok) {
      success(user.enable ? 'User disabled' : 'User enabled', user.UsrNam)
      load()
    } else {
      toastError('Failed to update user')
    }
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="User Management"
        subtitle={`${total} user${total !== 1 ? 's' : ''} registered`}
        actions={
          <div className="flex gap-2">
            <button onClick={load} className="btn-secondary p-2">
              <RefreshCw size={15} />
            </button>
            <button onClick={() => setCreateModal(true)} className="btn-primary">
              <Plus size={15} /> New User
            </button>
          </div>
        }
      />

      {/* Access level legend */}
      <div className="flex flex-wrap gap-3">
        {[1, 2, 3, 4].map(lvl => (
          <div key={lvl} className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <Badge variant={accessLevelVariant(lvl) as any}>Level {lvl}</Badge>
            <span>{accessLevelLabel(lvl)}</span>
            <span>—</span>
            <span>
              {lvl === 1 && 'Read-only'}
              {lvl === 2 && 'View + Create + Update'}
              {lvl === 3 && 'Full CRUD + Users'}
              {lvl === 4 && 'All permissions'}
            </span>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Search by username, name or email…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="input-field pl-9"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={8} cols={7} />
          ) : users.length === 0 ? (
            <EmptyState title="No users found" description="Try adjusting your search." />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Username</th>
                  <th>Position</th>
                  <th>Email</th>
                  <th>Access Level</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.UserID}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-brand-500 text-xs font-600">
                            {(u.DisplayName || u.UsrNam || 'U')[0].toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm font-500 text-[var(--text-primary)]">
                          {u.DisplayName || `${u.Firstname || ''} ${u.Lastname || ''}`.trim() || u.UsrNam}
                        </p>
                      </div>
                    </td>
                    <td className="text-sm font-mono text-[var(--text-secondary)]">{u.UsrNam}</td>
                    <td className="text-sm text-[var(--text-secondary)]">{u.PositionName || '—'}</td>
                    <td className="text-sm text-[var(--text-secondary)]">{u.Email || '—'}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <Shield size={11} className="text-[var(--text-muted)]" />
                        <Badge variant={accessLevelVariant(u.access_level || 1) as any}>
                          {accessLevelLabel(u.access_level || 1)}
                        </Badge>
                      </div>
                    </td>
                    <td>
                      <Badge variant={u.enable ? 'success' : 'default'}>
                        {u.enable ? 'Active' : 'Disabled'}
                      </Badge>
                    </td>
                    <td className="text-xs text-[var(--text-muted)]">{formatDate(u.dtEntered)}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        {/* Reset password */}
                        <button
                          onClick={() => { setResetUser(u); setNewPassword(''); setResetModal(true) }}
                          className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-brand-500 transition-colors"
                          title="Reset password"
                        >
                          <KeyRound size={13} />
                        </button>
                        {/* Enable / Disable */}
                        <button
                          onClick={() => handleToggleEnable(u)}
                          className={`p-1.5 rounded transition-colors ${
                            u.enable
                              ? 'hover:bg-red-50 dark:hover:bg-red-950/30 text-[var(--text-muted)] hover:text-red-500'
                              : 'hover:bg-green-50 dark:hover:bg-green-950/30 text-[var(--text-muted)] hover:text-green-500'
                          }`}
                          title={u.enable ? 'Disable user' : 'Enable user'}
                        >
                          {u.enable ? <UserX size={13} /> : <UserCheck size={13} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination page={page} total={total} pageSize={15} onChange={setPage} />
      </div>

      {/* ── Create User Modal ── */}
      <Modal
        open={createModal}
        onClose={() => { setCreateModal(false); setCreateForm(defaultCreateForm); setUsernameStatus('idle') }}
        title="Create New User"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Username with duplicate check */}
            <div className="space-y-1.5">
              <label className="text-xs font-500 text-[var(--text-secondary)] uppercase tracking-wide">
                Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={createForm.UsrNam}
                  onChange={(e) => {
                    const v = e.target.value
                    setCreateForm({ ...createForm, UsrNam: v })
                    setUsernameStatus('idle')
                    if (usernameTimer.current) clearTimeout(usernameTimer.current)
                    if (!v.trim()) return
                    setUsernameStatus('checking')
                    usernameTimer.current = setTimeout(async () => {
                      const res  = await fetch(`/api/users?search=${encodeURIComponent(v.trim())}&pageSize=5`)
                      const data = await res.json()
                      const exact = (data.data || []).some(
                        (u: any) => u.UsrNam.toLowerCase() === v.trim().toLowerCase()
                      )
                      setUsernameStatus(exact ? 'taken' : 'available')
                    }, 500)
                  }}
                  required
                  placeholder="e.g. jdoe"
                  className={`input-field pr-8 ${
                    usernameStatus === 'taken'     ? 'border-red-400'   :
                    usernameStatus === 'available' ? 'border-green-400' : ''
                  }`}
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  {usernameStatus === 'checking'  && <div className="w-3.5 h-3.5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />}
                  {usernameStatus === 'available' && <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  {usernameStatus === 'taken'     && <svg className="w-3.5 h-3.5 text-red-500"   fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>}
                </div>
              </div>
              {usernameStatus === 'taken'     && <p className="text-xs text-red-500">Username already taken.</p>}
              {usernameStatus === 'available' && <p className="text-xs text-green-500">Username is available.</p>}
            </div>

            <SelectField
              label="Access Level"
              value={createForm.access_level}
              onChange={(v) => setCreateForm({ ...createForm, access_level: v })}
              options={ACCESS_LEVEL_OPTIONS}
              required
            />

            <InputField label="First Name"    value={createForm.Firstname}    onChange={(v) => setCreateForm({ ...createForm, Firstname: v })}    placeholder="Juan" />
            <InputField label="Last Name"     value={createForm.Lastname}     onChange={(v) => setCreateForm({ ...createForm, Lastname: v })}     placeholder="Dela Cruz" />
            <InputField label="Display Name"  value={createForm.DisplayName}  onChange={(v) => setCreateForm({ ...createForm, DisplayName: v })}  placeholder="Auto-filled if blank" />
            <InputField label="Position"      value={createForm.PositionName} onChange={(v) => setCreateForm({ ...createForm, PositionName: v })} placeholder="e.g. Engineer III" />

            <div className="sm:col-span-2">
              <InputField label="Email" value={createForm.Email} onChange={(v) => setCreateForm({ ...createForm, Email: v })} type="email" placeholder="jdoe@example.com" />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-500 text-[var(--text-secondary)] uppercase tracking-wide">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  required
                  placeholder="Min. 6 characters"
                  className="input-field pr-9"
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-500 text-[var(--text-secondary)] uppercase tracking-wide">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type={showPw ? 'text' : 'password'}
                value={createForm.confirmPassword}
                onChange={(e) => setCreateForm({ ...createForm, confirmPassword: e.target.value })}
                required
                placeholder="Re-enter password"
                className={`input-field ${
                  createForm.confirmPassword && createForm.password !== createForm.confirmPassword
                    ? 'border-red-400' : ''
                }`}
              />
              {createForm.confirmPassword && createForm.password !== createForm.confirmPassword && (
                <p className="text-xs text-red-500">Passwords do not match.</p>
              )}
            </div>

          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => { setCreateModal(false); setCreateForm(defaultCreateForm); setUsernameStatus('idle') }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={creating || usernameStatus === 'taken'}>
              {creating ? 'Creating…' : <><Plus size={14} /> Create User</>}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Reset Password Modal ── */}
      <Modal
        open={resetModal}
        onClose={() => { setResetModal(false); setNewPassword(''); setResetUser(null) }}
        title={`Reset Password — ${resetUser?.UsrNam ?? ''}`}
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400">
            You are resetting the password for <strong>{resetUser?.DisplayName || resetUser?.UsrNam}</strong>. The user will need to use the new password on their next login.
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-500 text-[var(--text-secondary)] uppercase tracking-wide">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNewPw ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Min. 6 characters"
                className="input-field pr-9"
                autoFocus
              />
              <button type="button" onClick={() => setShowNewPw(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {newPassword && newPassword.length < 6 && (
              <p className="text-xs text-red-500">Password must be at least 6 characters.</p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-secondary" onClick={() => { setResetModal(false); setNewPassword(''); setResetUser(null) }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={resetting || newPassword.length < 6}>
              {resetting ? 'Resetting…' : <><KeyRound size={14} /> Reset Password</>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}