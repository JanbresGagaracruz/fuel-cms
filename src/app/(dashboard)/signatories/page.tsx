'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, RefreshCw, Edit2, Trash2, Users2 } from 'lucide-react'
import { SectionHeader, Modal, InputField, EmptyState } from '@/components/ui/index'
import { useToast } from '@/components/ui/Toast'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

const defaultForm = {
  FuelContractID: '', Title: '',
  PreparedByName: '', PreparedByPos: '',
  ReviewedByName: '', ReviewedByPos: '',
  NotedByName:    '', NotedByPos:    '',
}

function SigField({ label, name, pos, onName, onPos }: {
  label: string
  name: string
  pos:  string
  onName: (v: string) => void
  onPos:  (v: string) => void
}) {
  return (
    <div className="col-span-full grid grid-cols-2 gap-3">
      <InputField label={`${label} — Name`}     value={name} onChange={onName} placeholder={`${label} full name`} />
      <InputField label={`${label} — Position`} value={pos}  onChange={onPos}  placeholder="e.g. Engineer III" />
    </div>
  )
}

export default function SignatoriesPage() {
  const { success, error: toastError } = useToast()

  const [signatories, setSignatories] = useState<any[]>([])
  const [contracts,   setContracts]   = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)
  const [showModal,   setShowModal]   = useState(false)
  const [editId,      setEditId]      = useState<number | null>(null)
  const [form,        setForm]        = useState(defaultForm)
  const [saving,      setSaving]      = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [sRes, cRes] = await Promise.all([
      fetch('/api/signatories'),
      fetch('/api/contracts?pageSize=100'),
    ])

    if (!sRes.ok) {
      throw new Error(`Signatories failed ${sRes.status}`)
    }
    if (!cRes.ok) {
      throw new Error(`Contracts failed ${cRes.status}`)
    }


    const sData = await sRes.json()
    const cData = await cRes.json()
    setSignatories(Array.isArray(sData) ? sData : [])
    setContracts(cData.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditId(null); setForm(defaultForm); setShowModal(true) }
  const openEdit   = (s: any) => {
    setEditId(s.SignatoryID)
    setForm({
      FuelContractID: s.FuelContractID ? String(s.FuelContractID) : '',
      Title:          s.Title          || '',
      PreparedByName: s.PreparedByName || '',
      PreparedByPos:  s.PreparedByPos  || '',
      ReviewedByName: s.ReviewedByName || '',
      ReviewedByPos:  s.ReviewedByPos  || '',
      NotedByName:    s.NotedByName    || '',
      NotedByPos:     s.NotedByPos     || '',
    })
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const url    = editId ? `/api/signatories/${editId}` : '/api/signatories'
    const method = editId ? 'PATCH' : 'POST'
    const res    = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) {
      success(editId ? 'Signatories updated' : 'Signatories created')
      setShowModal(false)
      load()
    } else {
      toastError('Failed to save signatories')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this signatory record?')) return
    const res = await fetch(`/api/signatories/${id}`, { method: 'DELETE' })
    if (res.ok) { success('Deleted'); load() }
    else toastError('Failed to delete')
  }

  const contractLabel = (id: number | null) => {
    if (!id) return <span className="text-[var(--text-muted)] text-xs italic">All contracts (default)</span>
    const c = contracts.find((x: any) => x.FuelContractID === id)
    return c ? c.ContractNo : `#${id}`
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Signatories"
        subtitle="Prepared / Reviewed / Noted by — linked to contracts for report signatures"
        actions={
          <>
            <button onClick={load} className="btn-secondary p-2"><RefreshCw size={15} /></button>
            <button onClick={openCreate} className="btn-primary"><Plus size={15} /> Add Signatories</button>
          </>
        }
      />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-sm text-[var(--text-muted)]">Loading…</div>
          ) : signatories.length === 0 ? (
            <EmptyState
              title="No signatories yet"
              description="Add signatories to include Prepared / Reviewed / Noted by blocks in generated reports."
              action={<button onClick={openCreate} className="btn-primary mt-2"><Plus size={14} /> Add Signatories</button>}
            />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Contract</th>
                  <th>Title</th>
                  <th>Prepared By</th>
                  <th>Reviewed By</th>
                  <th>Noted By</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {signatories.map((s: any) => (
                  <tr key={s.SignatoryID}>
                    <td>
                      <Link
                        href={`/contracts/${s.FuelContractID}`}
                        className="font-500 text-brand-500 hover:text-brand-400 transition-colors text-sm"
                      >
                        {contractLabel(s.FuelContractID)}
                      </Link>
                    </td>
                    <td className="text-sm text-[var(--text-secondary)]">{s.Title || '—'}</td>
                    <td>
                      <p className="text-xs font-500">{s.PreparedByName || '—'}</p>
                      <p className="text-xs text-[var(--text-muted)]">{s.PreparedByPos || ''}</p>
                    </td>
                    <td>
                      <p className="text-xs font-500">{s.ReviewedByName || '—'}</p>
                      <p className="text-xs text-[var(--text-muted)]">{s.ReviewedByPos || ''}</p>
                    </td>
                    <td>
                      <p className="text-xs font-500">{s.NotedByName || '—'}</p>
                      <p className="text-xs text-[var(--text-muted)]">{s.NotedByPos || ''}</p>
                    </td>
                    <td className="text-xs text-[var(--text-muted)]">{formatDate(s.CreatedAt)}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-brand-500 transition-colors"><Edit2 size={13} /></button>
                        <button onClick={() => handleDelete(s.SignatoryID)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-[var(--text-muted)] hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editId ? 'Edit Signatories' : 'Add Signatories'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            {/* Contract selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-500 text-[var(--text-secondary)] uppercase tracking-wide">
                Link to Contract
              </label>
              <select
                value={form.FuelContractID}
                onChange={(e) => setForm({ ...form, FuelContractID: e.target.value })}
                className="input-field"
              >
                <option value="">— All contracts (default) —</option>
                {contracts.map((c: any) => (
                  <option key={c.FuelContractID} value={String(c.FuelContractID)}>
                    {c.ContractNo}{c.Representative ? ` — ${c.Representative}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <InputField
              label="Signatories Title"
              value={form.Title}
              onChange={(v) => setForm({ ...form, Title: v })}
              placeholder="e.g. Fuel Supply Contract 2025"
            />

            <SigField
              label="Prepared by"
              name={form.PreparedByName} pos={form.PreparedByPos}
              onName={(v) => setForm({ ...form, PreparedByName: v })}
              onPos={(v)  => setForm({ ...form, PreparedByPos:  v })}
            />
            <SigField
              label="Reviewed by"
              name={form.ReviewedByName} pos={form.ReviewedByPos}
              onName={(v) => setForm({ ...form, ReviewedByName: v })}
              onPos={(v)  => setForm({ ...form, ReviewedByPos:  v })}
            />
            <SigField
              label="Noted by"
              name={form.NotedByName} pos={form.NotedByPos}
              onName={(v) => setForm({ ...form, NotedByName: v })}
              onPos={(v)  => setForm({ ...form, NotedByPos:  v })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : <><Users2 size={14} /> {editId ? 'Save Changes' : 'Create'}</>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}