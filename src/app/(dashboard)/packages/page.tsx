'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Package, Plus, Search, RefreshCw } from 'lucide-react'
import {
  SectionHeader, Pagination, TableSkeleton, EmptyState,
  Modal, InputField, SelectField
} from '@/components/ui/index'
import { formatDate } from '@/lib/utils'

export default function PackagesPage() {
  const [packages, setPackages] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [contracts, setContracts] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ PackageName: '', FuelContractID: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '15' })
      const [pkgRes, cRes] = await Promise.all([
        fetch(`/api/packages?${params}`),
        fetch('/api/contracts?pageSize=100'),
      ])
      const pkgData = pkgRes.ok ? await pkgRes.json() : {}
      const cData = cRes.ok ? await cRes.json() : {}
      
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
    setSaving(true)
    await fetch('/api/packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setShowModal(false)
    setForm({ PackageName: '', FuelContractID: '' })
    load()
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Contract Packages"
        subtitle={`${total} package${total !== 1 ? 's' : ''} across all contracts`}
        actions={
          <>
            <button onClick={load} className="btn-secondary p-2"><RefreshCw size={15} /></button>
            <button onClick={() => setShowModal(true)} className="btn-primary">
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

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Package">
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
          <InputField
            label="Package Name"
            value={form.PackageName}
            onChange={(v) => setForm({ ...form, PackageName: v })}
            placeholder="e.g. Package A – Diesel Supply"
            required
          />
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Adding…' : <><Plus size={14} /> Add Package</>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
