'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Package, Plus, Search, RefreshCw } from 'lucide-react'
import {
  SectionHeader, Pagination, TableSkeleton, EmptyState,
  Modal, InputField, SelectField
} from '@/components/ui/index'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'

export default function PackagesPage() {
  const { success, error: toastError } = useToast()
  const [packages, setPackages] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [contracts, setContracts] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ PackageName: '', FuelContractID: '' })
  const [saving, setSaving] = useState(false)
  const [pkgStatus, setPkgStatus] = useState<'idle' | 'checking' | 'taken' | 'available'>('idle')
  const pkgNameTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
        const params = new URLSearchParams({ page: String(page), pageSize: '15' })
        const [pkgRes, cRes] = await Promise.all([
          fetch(`/api/packages?${params}`),
          fetch('/api/contracts?pageSize=100'),
        ])
        const pkgData = await pkgRes.json()
        const cData = await cRes.json()
        setPackages(pkgData.data || [])
        setTotal(pkgData.total || 0)
        setContracts(cData.data || [])
    } catch (error) {
      console.error('Failed to load data:', error)
      setPackages([])
      setTotal(0)
      setContracts([])
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { load() }, [load])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pkgStatus === 'taken') {
      toastError('Duplicate package name', 'Please use a different package name.')
      return
    }
    setSaving(true)
    const res = await fetch('/api/packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      success('Package created', 'The package has been added successfully.')
      setForm({ PackageName: '', FuelContractID: '' })
      setShowModal(false)
      load()
    } else {
      const data = await res.json()
      toastError('Failed to create package', data.error || 'An error occurred while creating the package.')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Contract Packages"
        subtitle={`${total} package${total !== 1 ? 's' : ''} across all contracts`}
        actions={
          <>
            <button onClick={load} className="btn-secondary p-2"><RefreshCw size={15} /></button>
            <button onClick={() => { setShowModal(true); setForm({ PackageName: '', FuelContractID: '' }); setPkgStatus('idle') }} className="btn-primary">
              <Plus size={15} /> Add Package
            </button>
          </>
        }
      />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={8} cols={5} />
          ) : packages.length === 0 ? (
            <EmptyState
              title="No packages found"
              description="Add a package to a fuel contract to organize delivery details."
              action={
                <button onClick={() => setShowModal(true)} className="btn-primary mt-2">
                  <Plus size={14} /> Add Package
                </button>
              }
            />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Package Name</th>
                  <th>Contract</th>
                  <th>Details Count</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((p: any) => (
                  <tr key={p.FuelContractPackageId}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-brand-500/10 flex items-center justify-center">
                          <Package size={12} className="text-brand-500" />
                        </div>
                        <span className="font-500 text-[var(--text-primary)]">{p.PackageName}</span>
                      </div>
                    </td>
                    <td>
                      <Link
                        href={`/contracts/${p.FuelContractID}`}
                        className="text-sm text-brand-500 hover:text-brand-400 transition-colors"
                      >
                        {p.contract?.ContractNo || `#${p.FuelContractID}`}
                      </Link>
                    </td>
                    <td>
                      <span className="text-sm font-500">{p._count?.details ?? 0}</span>
                      <span className="text-xs text-[var(--text-muted)] ml-1">details</span>
                    </td>
                    <td className="text-sm text-[var(--text-secondary)]">{formatDate(p.CreatedAt)}</td>
                    <td>
                      <Link
                        href={`/contracts/${p.FuelContractID}`}
                        className="text-xs text-[var(--text-muted)] hover:text-brand-500 transition-colors"
                      >
                        View Contract →
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

      <Modal open={showModal} onClose={() => { setShowModal(false); setForm({ PackageName: '', FuelContractID: '' }); setPkgStatus('idle') }} title="Add Package">
        <form onSubmit={handleCreate} className="space-y-4">
          <SelectField
            label="Fuel Contract"
            value={form.FuelContractID}
            onChange={(v) => setForm({ ...form, FuelContractID: v })}
            options={contracts.map((c: any) => ({
              label: c.ContractNo,
              value: String(c.FuelContractID),
            }))}
            placeholder="Select a contract…"
            required
          />
          {/* <InputField
            label="Package Name"
            value={form.PackageName}
            onChange={(v) => setForm({ ...form, PackageName: v })}
            placeholder="e.g. Package A – Diesel Supply"
            required
          /> */}
          {/* Contract No. with duplicate checker */}
          <div className="space-y-1.5">
            <label className="text-xs font-500 text-[var(--text-secondary)] uppercase tracking-wide">
              Contract No. <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={form.PackageName}
                onChange={(e) => {
                  const v = e.target.value.toUpperCase()
                  setForm({ ...form, PackageName: v })
                  setPkgStatus('idle')
                  if (pkgNameTimer.current) clearTimeout(pkgNameTimer.current)
                  if (!v.trim()) return
                  setPkgStatus('checking')
                  pkgNameTimer.current = setTimeout(async () => {
                    const res  = await fetch(`/api/packages?search=${encodeURIComponent(v.trim())}&contractId=${form.FuelContractID}&pageSize=1`)
                    const data = await res.json()

                    console.log('Duplicate check result:', data)
                    const exact = (data.data || []).some(
                      (c: any) => c.PackageName.toLowerCase() === v.trim().toLowerCase()
                    )
                    setPkgStatus(exact ? 'taken' : 'available')
                  }, 500)
                }}
                required
                placeholder="e.g. LOG MSSP 2026-xx-xxx"
                className={`input-field pr-8 ${
                  pkgStatus === 'taken'
                    ? 'border-red-400 focus:ring-red-400'
                    : pkgStatus === 'available'
                    ? 'border-green-400 focus:ring-green-400'
                    : ''
                }`}
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                {pkgStatus === 'checking' && (
                  <div className="w-3.5 h-3.5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                )}
                {pkgStatus === 'available' && (
                  <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {pkgStatus === 'taken' && (
                  <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
            </div>
            {pkgStatus === 'taken' && (
              <p className="text-xs text-red-500 mt-0.5">This contract number already exists.</p>
            )}
            {pkgStatus === 'available' && (
              <p className="text-xs text-green-500 mt-0.5">Contract number is available.</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); setForm({ PackageName: '', FuelContractID: '' }); setPkgStatus('idle') }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Adding…' : <><Plus size={14} /> Add Package</>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
