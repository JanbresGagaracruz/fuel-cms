'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Package, ClipboardList, Plus, Edit2,
  Trash2, ChevronDown, ChevronRight, AlertTriangle, FileBarChart2,
} from 'lucide-react'
import {
  Badge, Modal, InputField, SelectField, ConfirmDialog, EmptyState, Skeleton,
} from '@/components/ui/index'
import { useToast } from '@/components/ui/Toast'
import {
  formatDate, formatCurrency, formatNumber, getExpiryStatus, getContractTypeColor,
} from '@/lib/utils'
import { generatePackageReport, generateReportRows } from '@/lib/reportGenerator'

// ─── constants ───────────────────────────────────────────────────────────────

const CONTRACT_TYPES = [
  { label: 'Original',  value: 'ORIGINAL'  },
  { label: 'Amendment', value: 'AMENDMENT' },
  { label: 'Running',   value: 'RUNNING'   },
  // { label: 'Renewal',   value: 'RENEWAL'   },
  // { label: 'Addendum',  value: 'ADDENDUM'  },
]

const defaultPkgForm    = { PackageName: '' }
const defaultDetailForm = {
  ContractType: 'ORIGINAL', FuelContractPackageId: '',
  PlantID: '', PlantName: '', FuelTypeID: '',
  FunctionalGroup: '', LocationGroup: '',
  InvoiceNo: '', DeliveryDate: '',
  ContractPrice: '', VolumeOrdered: '', VolumeValidated: '',
}
type DetailForm = typeof defaultDetailForm

// ─── Divider label inside modal ───────────────────────────────────────────────
function FieldGroup({ label }: { label: string }) {
  return (
    <div className="col-span-full flex items-center gap-3 pt-1">
      <span className="text-xs font-600 text-[var(--text-muted)] uppercase tracking-widest whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
  )
}

// ─── DetailFormFields — OUTSIDE page to prevent remount on keystroke ──────────
interface DetailFormFieldsProps {
  form:      DetailForm
  onChange:  (v: DetailForm) => void
  packages:  any[]
  fuelTypes: any[]
  plants:    any[]
}

function DetailFormFields({ form, onChange, packages, fuelTypes, plants }: DetailFormFieldsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">

      {/* ── Group 1: Classification ── */}
      <FieldGroup label="Classification" />

      <SelectField
        label="Contract Type *"
        value={form.ContractType}
        onChange={(v) => onChange({ ...form, ContractType: v })}
        options={CONTRACT_TYPES}
        required
      />
      <SelectField
        label="Package"
        value={form.FuelContractPackageId}
        onChange={(v) => onChange({ ...form, FuelContractPackageId: v })}
        options={[
          { label: '— No Package —', value: '' },
          ...packages.map((p: any) => ({
            label: p.PackageName,
            value: String(p.FuelContractPackageId),
          })),
        ]}
      />
      <InputField
        label="Invoice No."
        value={form.InvoiceNo}
        onChange={(v) => onChange({ ...form, InvoiceNo: v })}
        placeholder="e.g. INV-2025-001"
      />

      {/* ── Group 2: Location / Plant ── */}
      <FieldGroup label="Location" />

      <div className="space-y-1.5">
        <label className="text-xs font-500 text-[var(--text-secondary)] uppercase tracking-wide">
          Plant
        </label>
        <select
          value={form.PlantID}
          onChange={(e) => {
            const sel = plants.find((p: any) => String(p.PlantID) === e.target.value)
            onChange({ ...form, PlantID: e.target.value, PlantName: sel?.PlantName ?? '' })
          }}
          className="input-field"
        >
          <option value="">— Select plant —</option>
          {plants.map((p: any) => (
            <option key={p.PlantID} value={String(p.PlantID)}>
              {p.PlantName}{p.ElecCoop ? ` (${p.ElecCoop})` : ''}
            </option>
          ))}
        </select>
      </div>

      <InputField
        label="Functional Group"
        value={form.FunctionalGroup}
        onChange={(v) => onChange({ ...form, FunctionalGroup: v })}
        placeholder="e.g. Operations"
      />
      <InputField
        label="Location Group"
        value={form.LocationGroup}
        onChange={(v) => onChange({ ...form, LocationGroup: v })}
        placeholder="e.g. NCR"
      />

      {/* ── Group 3: Fuel & Delivery ── */}
      <FieldGroup label="Fuel & Delivery" />

      <div className="space-y-1.5">
        <label className="text-xs font-500 text-[var(--text-secondary)] uppercase tracking-wide">
          Fuel Type
        </label>
        <select
          value={form.FuelTypeID}
          onChange={(e) => onChange({ ...form, FuelTypeID: e.target.value })}
          className="input-field"
        >
          <option value="">— Select fuel type —</option>
          {fuelTypes.map((f: any) => (
            <option key={f.FuelTypeID} value={String(f.FuelTypeID)}>
              {f.Type}{f.Fuel ? ` — ${f.Fuel}` : ''}
            </option>
          ))}
        </select>
      </div>

      <InputField
        label="Delivery Date"
        value={form.DeliveryDate}
        onChange={(v) => onChange({ ...form, DeliveryDate: v })}
        type="date"
      />
      <InputField
        label="Contract Price/Fuel Price (₱/L)"
        value={form.ContractPrice}
        onChange={(v) => onChange({ ...form, ContractPrice: v })}
        type="number"
        placeholder="0.0000"
      />

      {/* ── Group 4: Volume ── */}
      <FieldGroup label="Volume" />

      <InputField
        label="Volume Ordered (L)"
        value={form.VolumeOrdered}
        onChange={(v) => onChange({ ...form, VolumeOrdered: v })}
        type="number"
        placeholder="0.00"
      />
      <InputField
        label="Volume Validated (L)"
        value={form.VolumeValidated}
        onChange={(v) => onChange({ ...form, VolumeValidated: v })}
        type="number"
        placeholder="0.00"
      />
      {/* Auto-filled plant name — editable fallback */}
      <InputField
        label="Plant Name (auto-filled)"
        value={form.PlantName}
        onChange={(v) => onChange({ ...form, PlantName: v })}
        placeholder="From plant selection"
      />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContractDetailPage() {
  const { id }   = useParams()
  const router   = useRouter()
  const { success, error: toastError } = useToast()

  const [contract,    setContract]    = useState<any>(null)
  const [loading,     setLoading]     = useState(true)
  const [expandedPkg, setExpandedPkg] = useState<number | null>(null)
  const [savingReport, setSavingReport] = useState<number | null>(null) // packageId

  // Lookup data
  const [fuelTypes, setFuelTypes] = useState<any[]>([])
  const [plants,    setPlants]    = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])

  // Package modal
  const [pkgModal,  setPkgModal]  = useState(false)
  const [pkgForm,   setPkgForm]   = useState(defaultPkgForm)
  const [savingPkg, setSavingPkg] = useState(false)

  // Add Detail modal
  const [detailModal,  setDetailModal]  = useState(false)
  const [detailForm,   setDetailForm]   = useState<DetailForm>(defaultDetailForm)
  const [savingDetail, setSavingDetail] = useState(false)

  // Edit Detail modal
  const [editDetailModal,  setEditDetailModal]  = useState(false)
  const [editDetailForm,   setEditDetailForm]   = useState<DetailForm>(defaultDetailForm)
  const [editDetailId,     setEditDetailId]     = useState<number | null>(null)
  const [savingEditDetail, setSavingEditDetail] = useState(false)

  // Delete Detail confirm
  const [deleteDetailConfirm, setDeleteDetailConfirm] = useState(false)
  const [deleteDetailId,      setDeleteDetailId]      = useState<number | null>(null)
  const [deleteDetailName,    setDeleteDetailName]    = useState('')

  // Edit Contract modal
  const [editModal,  setEditModal]  = useState(false)
  const [editForm,   setEditForm]   = useState<any>({})
  const [savingEdit, setSavingEdit] = useState(false)

  // Delete Contract confirm
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  // ── Lookups ───────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch('/api/fuel-types').then(r => r.json()),
      fetch('/api/plants').then(r => r.json()),
      fetch('/api/suppliers').then(r => r.json()),
    ]).then(([ft, pl, sp]) => {
      setFuelTypes(Array.isArray(ft) ? ft : [])
      setPlants(Array.isArray(pl) ? pl : [])
      setSuppliers(Array.isArray(sp) ? sp : [])
    })
  }, [])

  // ── Load contract ─────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/contracts/${id}`)
    if (res.ok) {
      const data = await res.json()
      setContract(data)
      setEditForm({
        ContractNo:      data.ContractNo      || '',
        SupplierID:      data.supplier.SupplierName     || '',
        Representative:  data.Representative  || '',
        EffectivityFrom: data.EffectivityFrom ? data.EffectivityFrom.split('T')[0] : '',
        EffectivityTo:   data.EffectivityTo   ? data.EffectivityTo.split('T')[0]   : '',
        DocumentName:    data.DocumentName    || '',
        ExpiredDate:     data.ExpiredDate     ? data.ExpiredDate.split('T')[0]     : '',
        isActive:        data.isActive ? 'true' : 'false',
        isMiniGrid:      data.isMiniGrid === true,
      })
    }
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAddPackage = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingPkg(true)
    const res = await fetch('/api/packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...pkgForm, FuelContractID: id }),
    })
    setSavingPkg(false)
    if (res.ok) {
      success('Package added', pkgForm.PackageName)
      setPkgModal(false)
      setPkgForm(defaultPkgForm)
      load()
    } else {
      toastError('Failed to add package')
    }
  }

  const handleAddDetail = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingDetail(true)
    const res = await fetch('/api/details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...detailForm, FuelContractID: id }),
    })
    setSavingDetail(false)
    if (res.ok) {
      success('Detail added', `${detailForm.ContractType} — ${detailForm.InvoiceNo || 'no invoice'}`)
      setDetailModal(false)
      setDetailForm(defaultDetailForm)
      load()
    } else {
      toastError('Failed to add detail')
    }
  }

  const openEditDetail = (d: any) => {
    setEditDetailId(d.FuelContractDetailID)
    setEditDetailForm({
      ContractType:          d.ContractType          || 'ORIGINAL',
      FuelContractPackageId: d.FuelContractPackageId != null ? String(d.FuelContractPackageId) : '',
      PlantID:               d.PlantID    != null    ? String(d.PlantID)    : '',
      PlantName:             d.PlantName             || '',
      FuelTypeID:            d.FuelTypeID != null    ? String(d.FuelTypeID) : '',
      FunctionalGroup:       d.FunctionalGroup       || '',
      LocationGroup:         d.LocationGroup         || '',
      InvoiceNo:             d.InvoiceNo             || '',
      DeliveryDate:          d.DeliveryDate          ? d.DeliveryDate.split('T')[0] : '',
      ContractPrice:         d.ContractPrice   != null ? String(d.ContractPrice)   : '',
      VolumeOrdered:         d.VolumeOrdered   != null ? String(d.VolumeOrdered)   : '',
      VolumeValidated:       d.VolumeValidated != null ? String(d.VolumeValidated) : '',
    })
    setEditDetailModal(true)
  }

  const handleEditDetail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editDetailId) return
    setSavingEditDetail(true)
    const res = await fetch(`/api/details/${editDetailId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editDetailForm),
    })
    setSavingEditDetail(false)
    if (res.ok) {
      success('Detail updated', editDetailForm.InvoiceNo || `Detail #${editDetailId}`)
      setEditDetailModal(false)
      setEditDetailId(null)
      load()
    } else {
      toastError('Failed to update detail')
    }
  }

  const openDeleteDetail = (d: any) => {
    setDeleteDetailId(d.FuelContractDetailID)
    setDeleteDetailName(d.InvoiceNo || `Detail #${d.FuelContractDetailID}`)
    setDeleteDetailConfirm(true)
  }

  const handleDeleteDetail = async () => {
    if (!deleteDetailId) return
    const res = await fetch(`/api/details/${deleteDetailId}`, { method: 'DELETE' })
    if (res.ok) {
      success('Detail deleted', deleteDetailName)
    } else {
      toastError('Failed to delete detail')
    }
    setDeleteDetailId(null)
    load()
  }

  const handleEditContract = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingEdit(true)
    const res = await fetch(`/api/contracts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editForm, isActive: editForm.isActive === 'true', isMiniGrid: editForm.isMiniGrid === true }),
    })
    setSavingEdit(false)
    if (res.ok) {
      success('Contract updated', editForm.ContractNo)
      setEditModal(false)
      load()
    } else {
      toastError('Failed to update contract')
    }
  }

  const handleDelete = async () => {
    const res = await fetch(`/api/contracts/${id}`, { method: 'DELETE' })
    if (res.ok) {
      success('Contract deleted')
      router.push('/contracts')
    } else {
      toastError('Failed to delete contract')
    }
  }

  const handleGenerateReport = async (pkg: any) => {
    const contractArg = {
      ContractNo:      contract.ContractNo,
      FuelContractID:  contract.FuelContractID,
      Representative:  contract.Representative,
      EffectivityFrom: contract.EffectivityFrom,
      EffectivityTo:   contract.EffectivityTo,
      ExpiredDate:     contract.ExpiredDate,
      SupplierID:      contract.SupplierID,
      isMiniGrid:      contract.isMiniGrid === true,
    }
    const pkgArg = {
      FuelContractPackageId: pkg.FuelContractPackageId,
      PackageName:           pkg.PackageName,
      details:               pkg.details || [],
    }

    // Open HTML report in new tab
    const html = generatePackageReport(contractArg, pkgArg)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const win  = window.open(url, '_blank')
    if (win) win.addEventListener('load', () => URL.revokeObjectURL(url), { once: true })

    // Save rows to rpt_fcms
    setSavingReport(pkg.FuelContractPackageId)
    try {
      const rows = generateReportRows(contractArg, pkgArg)
      const res  = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      })
      if (res.ok) {
        const data = await res.json()
        success('Report saved', `${data.saved} rows recorded to rpt_fcms`)
      } else {
        toastError('Report opened but failed to save to database')
      }
    } catch {
      toastError('Report opened but save failed')
    } finally {
      setSavingReport(null)
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  const fuelLabel = (fid: any) => {
    if (!fid) return '—'
    const f = fuelTypes.find((x: any) => String(x.FuelTypeID) === String(fid))
    return f ? `${f.Type}${f.Fuel ? ` — ${f.Fuel}` : ''}` : `#${fid}`
  }
  const plantLabel = (pid: any) => {
    if (!pid) return '—'
    const p = plants.find((x: any) => String(x.PlantID) === String(pid))
    return p ? p.PlantName : `#${pid}`
  }

  // ── Early returns ─────────────────────────────────────────────────────────
  if (loading) return <ContractDetailSkeleton />
  if (!contract) return (
    <div className="text-center py-20">
      <p className="text-[var(--text-muted)]">Contract not found.</p>
      <Link href="/contracts" className="btn-primary mt-4 inline-flex">← Back</Link>
    </div>
  )

  const expiryStatus = getExpiryStatus(contract.ExpiredDate)

  // ── Compute totals for summary strip (RUNNING rows only) ─────────────────
  const details  = contract.details || []
  const running  = details.filter((d: any) => (d.ContractType ?? '').toUpperCase() === 'RUNNING')
  const totalVol = running.reduce((s: number, d: any) => s + Number(d.VolumeOrdered   ?? 0), 0)
  const totalVal = running.reduce((s: number, d: any) => s + Number(d.VolumeValidated ?? 0), 0)
  const prices   = running.filter((d: any) => d.ContractPrice != null)
  const avgPrice = prices.length > 0 ? prices.reduce((s: number, d: any) => s + Number(d.ContractPrice), 0) / prices.length : 0
  const totalAmt = running.reduce((s: number, d: any) => s + Number(d.ContractPrice ?? 0) * Number(d.VolumeOrdered ?? 0) * 1.12, 0)

  return (
    <div className="space-y-6 w-full">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <Link href="/contracts" className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-3 transition-colors">
            <ArrowLeft size={14} /> Back to Contracts
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-display font-700 text-[var(--text-primary)]">{contract.ContractNo}</h1>
            <Badge variant={contract.isActive ? 'success' : 'default'}>
              {contract.isActive ? 'Active' : 'Inactive'}
            </Badge>
            {expiryStatus === 'critical' && (
              <Badge variant="danger"><AlertTriangle size={11} className="mr-1" /> Expiring Soon</Badge>
            )}
            {expiryStatus === 'expired' && <Badge variant="danger">Expired</Badge>}
          </div>
          <p className="text-[var(--text-muted)] text-sm mt-1">{contract.Representative || 'No representative'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditModal(true)} className="btn-secondary">
            <Edit2 size={14} /> Edit
          </button>
          <button onClick={() => setDeleteConfirm(true)} className="btn-danger">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* ── Contract Info Card — full width, content-fitted ── */}
      <div className="card p-6 w-full">
        <h2 className="font-display font-600 text-[var(--text-primary)] text-sm mb-5">Contract Information</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-5">
          {[
            { label: 'Contract No.',     value: contract.ContractNo },
            { label: 'Supplier Name',    value: contract.supplier?.SupplierName     || '—' },
            { label: 'Representative',   value: contract.Representative  || '—' },
            { label: 'Effectivity From', value: formatDate(contract.EffectivityFrom) },
            { label: 'Effectivity To',   value: formatDate(contract.EffectivityTo)   },
            { label: 'Expired Date',     value: formatDate(contract.ExpiredDate)     },
            { label: 'Date Entered',     value: formatDate(contract.date_entry)       },
            { label: 'Document',         value: contract.DocumentName    || '—' },
            { label: 'Packages',         value: String(contract._count?.packages ?? 0) },
            { label: 'Total Details',    value: String(contract._count?.details  ?? 0) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">{label}</p>
              <p className="text-sm font-500 text-[var(--text-primary)] break-words leading-snug">{value}</p>
            </div>
          ))}
          {/* Mini-Grid field */}
          <div>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">Mini-Grid</p>
            {contract.isMiniGrid ? (
              <span className="badge bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 text-xs">
                Mini-Grid
              </span>
            ) : (
              <p className="text-sm font-500 text-[var(--text-muted)]">No</p>
            )}
          </div>
        </div>

        {running.length > 0 && (
          <div className="mt-5 pt-5 border-t border-[var(--border)] grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
            <div>
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">Total Vol. Ordered</p>
              <p className="text-sm font-600 text-[var(--text-primary)]">{formatNumber(totalVol)} <span className="font-400 text-[var(--text-muted)]">L</span></p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">Total Vol. Validated</p>
              <p className="text-sm font-600 text-[var(--text-primary)]">{formatNumber(totalVal)} <span className="font-400 text-[var(--text-muted)]">L</span></p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">Avg. Contract Price</p>
              <p className="text-sm font-600 text-[var(--text-primary)]">{formatCurrency(avgPrice)}<span className="font-400 text-[var(--text-muted)]"> /L</span></p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">Est. Total (incl. VAT)</p>
              <p className="text-sm font-600 text-brand-500">{formatCurrency(totalAmt)}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Packages Card — full width ── */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-600 text-[var(--text-primary)] flex items-center gap-2">
            <Package size={16} /> Packages
            <span className="text-sm font-400 text-[var(--text-muted)]">({contract.packages?.length ?? 0})</span>
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => { setDetailForm({ ...defaultDetailForm }); setDetailModal(true) }}
              className="btn-secondary text-xs"
            >
              <ClipboardList size={13} /> Add Detail
            </button>
            <button onClick={() => setPkgModal(true)} className="btn-primary text-xs">
              <Plus size={13} /> Add Package
            </button>
          </div>
        </div>

        {(!contract.packages || contract.packages.length === 0) ? (
          <div className="card w-full">
            <EmptyState
              title="No packages yet"
              description="Add a package to start organizing contract details."
              action={
                <button onClick={() => setPkgModal(true)} className="btn-primary mt-2">
                  <Plus size={14} /> Add Package
                </button>
              }
            />
          </div>
        ) : (
          <div className="space-y-3">
            {contract.packages.map((pkg: any) => (
              <div key={pkg.FuelContractPackageId} className="card overflow-hidden w-full">

                {/* Package accordion header */}
                <div className="flex items-center w-full">
                  <button
                    onClick={() => setExpandedPkg(
                      expandedPkg === pkg.FuelContractPackageId ? null : pkg.FuelContractPackageId
                    )}
                    className="flex-1 flex items-center justify-between p-4 hover:bg-[var(--bg-tertiary)] transition-colors text-left min-w-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                        <Package size={14} className="text-brand-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-500 text-[var(--text-primary)] text-sm truncate">{pkg.PackageName}</p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {pkg._count?.details ?? 0} detail{pkg._count?.details !== 1 ? 's' : ''} · Added {formatDate(pkg.CreatedAt)}
                        </p>
                      </div>
                    </div>
                    {expandedPkg === pkg.FuelContractPackageId
                      ? <ChevronDown size={16} className="text-[var(--text-muted)] flex-shrink-0 ml-2" />
                      : <ChevronRight size={16} className="text-[var(--text-muted)] flex-shrink-0 ml-2" />
                    }
                  </button>

                  {/* Generate Report button */}
                  <button
                    onClick={() => handleGenerateReport(pkg)}
                    disabled={savingReport === pkg.FuelContractPackageId}
                    className="flex items-center gap-1.5 mx-3 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-500 transition-all whitespace-nowrap flex-shrink-0 shadow-sm disabled:opacity-60 disabled:cursor-wait"
                    title="Generate report and save to rpt_fcms"
                  >
                    <FileBarChart2 size={13} />
                    {savingReport === pkg.FuelContractPackageId ? 'Saving…' : 'Generate Report'}
                  </button>
                </div>

                {/* Expanded details */}
                {expandedPkg === pkg.FuelContractPackageId && (
                  <div className="border-t border-[var(--border)]">

                    {/* Sub-toolbar */}
                    <div className="px-4 py-2 bg-[var(--bg-tertiary)] flex items-center justify-between">
                      <span className="text-xs text-[var(--text-muted)]">Contract Details</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleGenerateReport(pkg)}
                          disabled={savingReport === pkg.FuelContractPackageId}
                          className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors flex items-center gap-1 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 disabled:opacity-50"
                        >
                          <FileBarChart2 size={12} /> Generate Report
                        </button>
                        <button
                          onClick={() => {
                            setDetailForm({ ...defaultDetailForm, FuelContractPackageId: String(pkg.FuelContractPackageId) })
                            setDetailModal(true)
                          }}
                          className="text-xs text-brand-500 hover:text-brand-400 transition-colors flex items-center gap-1"
                        >
                          <Plus size={12} /> Add Detail
                        </button>
                      </div>
                    </div>

                    {!pkg.details || pkg.details.length === 0 ? (
                      <div className="p-6 text-center text-sm text-[var(--text-muted)]">
                        No details added to this package yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Type</th>
                              <th>Plant</th>
                              <th>Fuel Type</th>
                              <th>Functional Group</th>
                              <th>Location</th>
                              <th>Delivery Date</th>
                              <th>Vol. Ordered</th>
                              <th>Vol. Validated</th>
                              <th>Price / L</th>
                              <th>Invoice No.</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pkg.details.map((d: any) => (
                              <tr key={d.FuelContractDetailID}>
                                <td>
                                  <span className={`badge text-xs ${getContractTypeColor(d.ContractType)}`}>
                                    {d.ContractType || 'ORIGINAL'}
                                  </span>
                                </td>
                                <td className="text-xs text-[var(--text-secondary)] whitespace-nowrap">
                                  {d.PlantName || plantLabel(d.PlantID)}
                                </td>
                                <td className="text-xs text-[var(--text-secondary)] whitespace-nowrap">
                                  {fuelLabel(d.FuelTypeID)}
                                </td>
                                <td className="text-xs text-[var(--text-secondary)]">{d.FunctionalGroup || '—'}</td>
                                <td className="text-xs text-[var(--text-secondary)]">{d.LocationGroup || '—'}</td>
                                <td className="text-xs text-[var(--text-secondary)] whitespace-nowrap">{formatDate(d.DeliveryDate)}</td>
                                <td className="text-xs text-right font-mono">{formatNumber(d.VolumeOrdered)}</td>
                                <td className="text-xs text-right font-mono">{formatNumber(d.VolumeValidated)}</td>
                                <td className="text-xs text-right font-mono">{formatCurrency(d.ContractPrice)}</td>
                                <td className="text-xs text-[var(--text-secondary)]">{d.InvoiceNo || '—'}</td>
                                <td>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => openEditDetail(d)}
                                      className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-brand-500 transition-colors"
                                      title="Edit"
                                    >
                                      <Edit2 size={13} />
                                    </button>
                                    <button
                                      onClick={() => openDeleteDetail(d)}
                                      className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-[var(--text-muted)] hover:text-red-500 transition-colors"
                                      title="Delete"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════ MODALS ══════════════ */}

      {/* Add Package */}
      <Modal open={pkgModal} onClose={() => setPkgModal(false)} title="Add Package">
        <form onSubmit={handleAddPackage} className="space-y-4">
          <InputField label="Package Name" value={pkgForm.PackageName} onChange={(v) => setPkgForm({ PackageName: v })} required placeholder="e.g. Package A – Diesel" />
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setPkgModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={savingPkg}>
              {savingPkg ? 'Adding…' : <><Plus size={14} /> Add Package</>}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Detail */}
      <Modal open={detailModal} onClose={() => setDetailModal(false)} title="Add Contract Detail" size="xl">
        <form onSubmit={handleAddDetail} className="space-y-2">
          <DetailFormFields form={detailForm} onChange={setDetailForm} packages={contract?.packages || []} fuelTypes={fuelTypes} plants={plants} />
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" className="btn-secondary" onClick={() => setDetailModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={savingDetail}>
              {savingDetail ? 'Adding…' : <><Plus size={14} /> Add Detail</>}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Detail */}
      <Modal open={editDetailModal} onClose={() => setEditDetailModal(false)} title="Edit Contract Detail" size="xl">
        <form onSubmit={handleEditDetail} className="space-y-2">
          {/* Context strip */}
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)]">
            <span className="text-xs text-[var(--text-muted)]">Editing:</span>
            <span className={`badge text-xs ${getContractTypeColor(editDetailForm.ContractType)}`}>
              {editDetailForm.ContractType || 'ORIGINAL'}
            </span>
            {editDetailForm.InvoiceNo && (
              <span className="text-xs font-mono bg-[var(--bg-tertiary)] px-2 py-0.5 rounded text-[var(--text-secondary)]">
                {editDetailForm.InvoiceNo}
              </span>
            )}
            {editDetailForm.PlantName && (
              <span className="text-xs text-[var(--text-muted)]">· {editDetailForm.PlantName}</span>
            )}
          </div>
          <DetailFormFields form={editDetailForm} onChange={setEditDetailForm} packages={contract?.packages || []} fuelTypes={fuelTypes} plants={plants} />
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" className="btn-secondary" onClick={() => setEditDetailModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={savingEditDetail}>
              {savingEditDetail ? 'Saving…' : <><Edit2 size={14} /> Save Changes</>}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Detail */}
      <ConfirmDialog
        open={deleteDetailConfirm}
        onClose={() => setDeleteDetailConfirm(false)}
        onConfirm={handleDeleteDetail}
        title="Delete Contract Detail"
        description={`Are you sure you want to delete "${deleteDetailName}"? This cannot be undone.`}
        confirmLabel="Delete Detail"
        danger
      />

      {/* Edit Contract */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title="Edit Contract" size="lg">
        <form onSubmit={handleEditContract} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Contract No." value={editForm.ContractNo || ''} onChange={(v) => setEditForm({ ...editForm, ContractNo: v })} required />
            <div className="space-y-1.5">
              <label className="text-xs font-500 text-[var(--text-secondary)] uppercase tracking-wide">
                Supplier
              </label>
              <select
                value={editForm.SupplierID || ''}
                onChange={(e) => setEditForm({ ...editForm, SupplierID: e.target.value })}
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
              <InputField label="Representative" value={editForm.Representative || ''} onChange={(v) => setEditForm({ ...editForm, Representative: v })} />
            </div>
            <InputField label="Effectivity From" value={editForm.EffectivityFrom || ''} onChange={(v) => setEditForm({ ...editForm, EffectivityFrom: v })} type="date" />
            <InputField label="Effectivity To"   value={editForm.EffectivityTo   || ''} onChange={(v) => setEditForm({ ...editForm, EffectivityTo: v })}   type="date" />
            <InputField label="Expired Date"     value={editForm.ExpiredDate     || ''} onChange={(v) => setEditForm({ ...editForm, ExpiredDate: v })}     type="date" />
            <SelectField
              label="Status"
              value={editForm.isActive || 'true'}
              onChange={(v) => setEditForm({ ...editForm, isActive: v })}
              options={[{ label: 'Active', value: 'true' }, { label: 'Inactive', value: 'false' }]}
            />
            <div className="sm:col-span-2">
              <InputField label="Document Name" value={editForm.DocumentName || ''} onChange={(v) => setEditForm({ ...editForm, DocumentName: v })} />
            </div>
            {/* Mini-Grid toggle */}
            <div className="sm:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={editForm.isMiniGrid || false}
                    onChange={(e) => setEditForm({ ...editForm, isMiniGrid: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 rounded-full bg-[var(--border-strong)] peer-checked:bg-brand-500 transition-colors" />
                  <div className="absolute left-1 top-1 w-3 h-3 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
                </div>
                <div>
                  <p className="text-sm font-500 text-[var(--text-primary)]">Mini-Grid Contract</p>
                  <p className="text-xs text-[var(--text-muted)]">Adds a Plant Name column to the generated report</p>
                </div>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setEditModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={savingEdit}>
              {savingEdit ? 'Saving…' : <><Edit2 size={14} /> Save Changes</>}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Contract */}
      <ConfirmDialog
        open={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Contract"
        description={`Are you sure you want to delete "${contract.ContractNo}"? All packages and details will also be removed.`}
        confirmLabel="Delete Contract"
        danger
      />
    </div>
  )
}

function ContractDetailSkeleton() {
  return (
    <div className="space-y-6 w-full">
      <Skeleton className="h-4 w-32 mb-3" />
      <div className="flex gap-3 mb-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="card p-6 w-full">
        <Skeleton className="h-4 w-40 mb-5" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-5">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </div>
      </div>
      {[...Array(2)].map((_, i) => (
        <div key={i} className="card w-full p-4">
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
    </div>
  )
}
