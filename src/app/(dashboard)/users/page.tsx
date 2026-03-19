'use client'

import { useEffect, useState, useCallback } from 'react'
import { Shield, RefreshCw, Search } from 'lucide-react'
import { SectionHeader, Badge, Pagination, TableSkeleton, EmptyState } from '@/components/ui/index'
import { formatDate } from '@/lib/utils'
import { accessLevelLabel, accessLevelVariant } from '@/lib/permissions'

export default function UsersPage() {
  const [users,   setUsers]   = useState<any[]>([])
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(1)
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), pageSize: '15', search })
    const res = await fetch(`/api/users?${params}`)
    if (res.ok) {
      const data = await res.json()
      setUsers(data.data || [])
      setTotal(data.total || 0)
    }
    setLoading(false)
  }, [page, search])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-5">
      <SectionHeader
        title="User Management"
        subtitle={`${total} user${total !== 1 ? 's' : ''} registered`}
        actions={
          <button onClick={load} className="btn-secondary p-2"><RefreshCw size={15} /></button>
        }
      />

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Search users…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="input-field pl-9"
        />
      </div>

      {/* Access level legend */}
      <div className="flex flex-wrap gap-3">
        {[1, 2, 3, 4].map(lvl => (
          <div key={lvl} className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <Badge variant={accessLevelVariant(lvl) as any}>Level {lvl}</Badge>
            <span>{accessLevelLabel(lvl)}</span>
            <span className="text-[var(--border-strong)]">—</span>
            <span>
              {lvl === 1 && 'Read-only'}
              {lvl === 2 && 'View + Create + Update'}
              {lvl === 3 && 'Full CRUD + Users'}
              {lvl === 4 && 'All permissions'}
            </span>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={8} cols={6} />
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
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.UserID}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-brand-500/20 flex items-center justify-center">
                          <span className="text-brand-500 text-xs font-600">
                            {(u.DisplayName || u.UsrNam || 'U')[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-500 text-[var(--text-primary)]">
                            {u.DisplayName || `${u.Firstname || ''} ${u.Lastname || ''}`.trim() || u.UsrNam}
                          </p>
                        </div>
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
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination page={page} total={total} pageSize={15} onChange={setPage} />
      </div>
    </div>
  )
}

