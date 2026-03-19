'use client'

import { useEffect, useState, useCallback } from 'react'
import { Activity, Filter } from 'lucide-react'
import { SectionHeader, Pagination, Badge, TableSkeleton, SelectField } from '@/components/ui/index'
import { formatDate, formatRelative, getActivityColor } from '@/lib/utils'

const ACTION_OPTS = [
  { label: 'All Actions', value: '' },
  { label: 'Create', value: 'CREATE' },
  { label: 'Update', value: 'UPDATE' },
  { label: 'Delete', value: 'DELETE' },
  { label: 'View', value: 'VIEW' },
  { label: 'Login', value: 'LOGIN' },
]

const MODULE_OPTS = [
  { label: 'All Modules', value: '' },
  { label: 'Authentication', value: 'Authentication' },
  { label: 'Fuel Contracts', value: 'Fuel Contracts' },
  { label: 'Contract Packages', value: 'Contract Packages' },
  { label: 'Contract Details', value: 'Contract Details' },
]

const actionVariant: Record<string, any> = {
  CREATE: 'success', UPDATE: 'warning', DELETE: 'danger',
  LOGIN: 'info', LOGOUT: 'default', VIEW: 'default',
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState('')
  const [module, setModule] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page), pageSize: '20',
      ...(action && { action }),
      ...(module && { module }),
    })
    const res = await fetch(`/api/activity?${params}`)
    const data = await res.json()
    setActivities(data.data || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [page, action, module])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Activity Log"
        subtitle={`${total} events recorded`}
      />

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex items-center gap-2 text-[var(--text-muted)]">
          <Filter size={14} />
          <span className="text-xs font-500 uppercase tracking-wide">Filter by</span>
        </div>
        <div className="grid grid-cols-2 gap-3 flex-1 max-w-md">
          <SelectField
            label="Action"
            value={action}
            onChange={(v) => { setAction(v); setPage(1) }}
            options={ACTION_OPTS}
          />
          <SelectField
            label="Module"
            value={module}
            onChange={(v) => { setModule(v); setPage(1) }}
            options={MODULE_OPTS}
          />
        </div>
        {(action || module) && (
          <button
            onClick={() => { setAction(''); setModule(''); setPage(1) }}
            className="text-xs text-brand-500 hover:text-brand-400"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Timeline + Table */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Timeline (recent) */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={14} className="text-brand-500" />
            <h3 className="text-sm font-display font-600 text-[var(--text-primary)]">Live Timeline</h3>
          </div>
          {loading ? (
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-[var(--border)] mt-1.5 flex-shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 w-3/4 shimmer rounded" />
                    <div className="h-2.5 w-1/2 shimmer rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[3px] top-2 bottom-2 w-px bg-[var(--border)]" />
              <div className="space-y-4 pl-5">
                {activities.slice(0, 10).map((a) => (
                  <div key={a.id} className="relative">
                    <div className={`absolute -left-5 top-1.5 w-2 h-2 rounded-full ${getActivityColor(a.action).replace('text-', 'bg-')}`} />
                    <p className="text-xs font-500 text-[var(--text-primary)] leading-snug">
                      <span className={getActivityColor(a.action)}>{a.action}</span>
                      {' — '}{a.module}
                    </p>
                    {a.entityName && (
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">{a.entityName}</p>
                    )}
                    {a.details && (
                      <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">{a.details}</p>
                    )}
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{formatRelative(a.createdAt)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Full table */}
        <div className="xl:col-span-2 card overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <TableSkeleton rows={10} cols={5} />
            ) : activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Activity size={28} className="text-[var(--text-muted)] mb-3" />
                <p className="font-500 text-[var(--text-primary)]">No activity found</p>
                <p className="text-sm text-[var(--text-muted)]">Try adjusting your filters.</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Module</th>
                    <th>Entity</th>
                    <th>Details</th>
                    <th>IP Address</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <Badge variant={actionVariant[a.action] || 'default'}>
                          {a.action}
                        </Badge>
                      </td>
                      <td className="text-xs text-[var(--text-secondary)]">{a.module}</td>
                      <td className="text-xs">
                        {a.entityName ? (
                          <span className="text-[var(--text-primary)] font-500">{a.entityName}</span>
                        ) : (
                          <span className="text-[var(--text-muted)]">—</span>
                        )}
                      </td>
                      <td className="text-xs text-[var(--text-secondary)] max-w-[200px] truncate">
                        {a.details || '—'}
                      </td>
                      <td className="text-xs font-mono text-[var(--text-muted)]">
                        {a.ipAddress || '—'}
                      </td>
                      <td className="text-xs text-[var(--text-muted)] whitespace-nowrap">
                        <span title={formatDate(a.createdAt, 'MMM dd, yyyy HH:mm:ss')}>
                          {formatRelative(a.createdAt)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <Pagination page={page} total={total} pageSize={20} onChange={setPage} />
        </div>
      </div>
    </div>
  )
}
