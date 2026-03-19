'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Plus, Search, Filter, RefreshCw } from 'lucide-react'
import {
  SectionHeader, Badge, Pagination, TableSkeleton, EmptyState,
  Modal, InputField, SelectField
} from '@/components/ui/index'
import { useToast } from '@/components/ui/Toast'
import { formatDate, getDaysUntilExpiry, getExpiryStatus } from '@/lib/utils'
import { canCreate, canUpdate } from '@/lib/permissions'

function ExpiryBadge({ date }: { date: string | null }) {
  const status = getExpiryStatus(date)
  const days = getDaysUntilExpiry(date)
  const variantMap: Record<string, any> = {
    good: 'success', warning: 'warning', critical: 'danger', expired: 'danger', none: 'default'
  }
  if (status === 'none') return <span className="text-[var(--text-muted)] text-xs">—</span>
  return (
    <Badge variant={variantMap[status]}>
      {status === 'expired' ? 'Expired' : `${days}d left`}
    </Badge>
  )
}

const defaultForm = {
  ContractNo: '', SupplierID: '', Representative: '',
  EffectivityFrom: '', EffectivityTo: '', DocumentName: '', ExpiredDate: '',
  isActive: 'true', isMiniGrid: false,
}

export default function ContractsPage() {
  const { data: session } = useSession()
  const { success, error: toastError } = useToast()
  const userLevel = session?.user?.accessLevel ?? 1

  const [contracts, setContracts] = useState<any[]>([])
  const [total,     setTotal]     = useState(0)
  const [page,      setPage]      = useState(1)
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form,      setForm]      = useState(defaultForm)
  const [saving,    setSaving]    = useState(false)

  // Supplier lookup
  const [suppliers, setSuppliers] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/suppliers').then(r => r.json()).then(d => {
      setSuppliers(Array.isArray(d) ? d : [])
    })
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page), pageSize: '15', search,
      ...(activeFilter && { active: activeFilter })
    })
    const res = await fetch(`/api/contracts?${params}`)
    const data = await res.json()
    setContracts(data.data || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [page, search, activeFilter])

  useEffect(() => { load() }, [load])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, isActive: form.isActive === 'true', isMiniGrid: form.isMiniGrid }),
    })
    setSaving(false)
    if (res.ok) {
      success('Contract created', form.ContractNo)
      setShowModal(false)
      setForm(defaultForm)
      load()
    } else {
      const body = await res.json()
      toastError('Failed to create contract', body.error)
    }
  }

  const handleToggleActive = async (id: number, current: boolean) => {
    if (!canUpdate(userLevel)) {
      toastError('Permission denied', 'You need Staff access or higher to modify contracts.')
      return
    }
    const res = await fetch(`/api/contracts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !current }),
    })
    if (res.ok) {
      success(current ? 'Contract deactivated' : 'Contract activated')
      load()
    } else {
      toastError('Failed to update status')
    }
  }

  const supplierLabel = (id: string | number | null) => {
    if (!id) return '—'
    const s = suppliers.find((x: any) => String(x.SupplierID) === String(id))
    return s ? (s.SupplierName || s.FullName || `#${id}`) : `#${id}`
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Fuel Contracts"
        subtitle={`${total} contract${total !== 1 ? 's' : ''} total`}
        actions={
          <>
            <button onClick={load} className="btn-secondary p-2">
              <RefreshCw size={15} />
            </button>
            {canCreate(userLevel) && (
              <button onClick={() => setShowModal(true)} className="btn-primary">
                <Plus size={15} /> New Contract
              </button>
            )}
          </>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search by contract no. or representative…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="input-field pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-[var(--text-muted)]" />
          {['', 'true', 'false'].map((v) => (
            <button
              key={v}
              onClick={() => { setActiveFilter(v); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-500 transition-colors ${
                activeFilter === v
                  ? 'bg-brand-500 text-white'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
              }`}
            >
              {v === '' ? 'All' : v === 'true' ? 'Active' : 'Inactive'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={8} cols={7} />
          ) : contracts.length === 0 ? (
            <EmptyState
              title="No contracts found"
              description="Create your first fuel contract to get started."
              action={canCreate(userLevel) ? (
                <button onClick={() => setShowModal(true)} className="btn-primary mt-2">
                  <Plus size={15} /> Create Contract
                </button>
              ) : undefined}
            />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Contract No.</th>
                  <th>Supplier</th>
                  <th>Representative</th>
                  <th>Effectivity</th>
                  <th>Expiry</th>
                  <th>Pkgs / Details</th>
                  <th>Mini-Grid</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c.FuelContractID}>
                    <td>
                      <Link
                        href={`/contracts/${c.FuelContractID}`}
                        className="font-500 text-brand-500 hover:text-brand-400 transition-colors"
                      >
                        {c.ContractNo}
                      </Link>
                    </td>
                    <td className="text-xs text-[var(--text-secondary)]">
                      {supplierLabel(c.SupplierID)}
                    </td>
                    <td className="text-[var(--text-secondary)]">{c.Representative || '—'}</td>
                    <td className="text-xs text-[var(--text-secondary)] whitespace-nowrap">
                      {formatDate(c.EffectivityFrom)} – {formatDate(c.EffectivityTo)}
                    </td>
                    <td><ExpiryBadge date={c.ExpiredDate} /></td>
                    <td className="text-xs text-[var(--text-secondary)]">
                      {c._count?.packages ?? 0} / {c._count?.details ?? 0}
                    </td>
                    <td className="text-center">
                      {c.isMiniGrid ? (
                        <span className="badge bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 text-xs">
                          Mini-Grid
                        </span>
                      ) : (
                        <span className="text-[var(--text-muted)] text-xs">—</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleActive(c.FuelContractID, c.isActive)}
                        className={canUpdate(userLevel) ? 'cursor-pointer' : 'cursor-default'}
                        disabled={!canUpdate(userLevel)}
                      >
                        <Badge variant={c.isActive ? 'success' : 'default'}>
                          {c.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </button>
                    </td>
                    <td>
                      <Link
                        href={`/contracts/${c.FuelContractID}`}
                        className="text-xs text-[var(--text-muted)] hover:text-brand-500 transition-colors"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination page={page} total={total} pageSize={15} onChange={setPage} />
      </div>

      {/* Create Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Fuel Contract" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <InputField
              label="Contract No. *"
              value={form.ContractNo}
              onChange={(v) => setForm({ ...form, ContractNo: v })}
              required
              placeholder="e.g. FC-2025-001"
            />

            {/* Supplier dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-500 text-[var(--text-secondary)] uppercase tracking-wide">
                Supplier
              </label>
              <select
                value={form.SupplierID}
                onChange={(e) => setForm({ ...form, SupplierID: e.target.value })}
                className="input-field"
              >
                <option value="">— Select supplier —</option>
                {suppliers.map((s: any) => (
                  <option key={s.SupplierID} value={String(s.SupplierID)}>
                    {s.SupplierName || s.FullName}
                    {s.FullName && s.SupplierName && s.SupplierName !== s.FullName
                      ? ` (${s.FullName})`
                      : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <InputField
                label="Representative"
                value={form.Representative}
                onChange={(v) => setForm({ ...form, Representative: v })}
                placeholder="Name of representative"
              />
            </div>

            <InputField label="Effectivity From" value={form.EffectivityFrom} onChange={(v) => setForm({ ...form, EffectivityFrom: v })} type="date" />
            <InputField label="Effectivity To"   value={form.EffectivityTo}   onChange={(v) => setForm({ ...form, EffectivityTo: v })}   type="date" />
            <InputField label="Expired Date"     value={form.ExpiredDate}     onChange={(v) => setForm({ ...form, ExpiredDate: v })}     type="date" />

            <SelectField
              label="Status"
              value={form.isActive}
              onChange={(v) => setForm({ ...form, isActive: v })}
              options={[{ label: 'Active', value: 'true' }, { label: 'Inactive', value: 'false' }]}
            />

            <div className="sm:col-span-2">
              <InputField
                label="Document Name"
                value={form.DocumentName}
                onChange={(v) => setForm({ ...form, DocumentName: v })}
                placeholder="e.g. Contract Agreement 2025.pdf"
              />
            </div>

            {/* Mini-Grid checkbox */}
            <div className="sm:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={form.isMiniGrid}
                    onChange={(e) => setForm({ ...form, isMiniGrid: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 rounded-full bg-[var(--border-strong)] peer-checked:bg-brand-500 transition-colors" />
                  <div className="absolute left-1 top-1 w-3 h-3 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
                </div>
                <div>
                  <p className="text-sm font-500 text-[var(--text-primary)]">Mini-Grid Contract</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Adds a Plant Name column to the generated report
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Creating…' : <><Plus size={14} /> Create Contract</>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
