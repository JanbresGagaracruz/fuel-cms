'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  ArrowLeft, Package, Plus, Edit2,
  Trash2,FileBarChart2, Lock, CheckCircle,
} from 'lucide-react'
import {
  Modal, InputField, SelectField, ConfirmDialog, EmptyState, Skeleton,
} from '@/components/ui/index'
import { useToast } from '@/components/ui/Toast'
import {
  formatDate, formatCurrency, formatNumber, getExpiryStatus, getContractTypeColor,
} from '@/lib/utils'
import { generatePackageReport, generateReportRows, generatePackageSummary } from '@/lib/reportGenerator'
import {  canCreate, canDelete } from '@/lib/permissions'

// ─── constants ───────────────────────────────────────────────────────────────

const CONTRACT_TYPES = [
  { label: 'Original',  value: 'ORIGINAL'  },
  { label: 'Amendment', value: 'AMENDMENT' },
  { label: 'Running',   value: 'RUNNING'   },
  { label: 'Closing',   value: 'CLOSING'   },
  // { label: 'Renewal',   value: 'RENEWAL'   },
  // { label: 'Addendum',  value: 'ADDENDUM'  },
]

const defaultDetailForm = {
  ContractType: 'ORIGINAL', FuelContractPackageId: '',
  amendSourcePackageId: '',   
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

interface DetailFormFieldsProps {
  form:             DetailForm
  onChange:         (v: DetailForm) => void
  packages:         any[]
  fuelTypes:        any[]
  plants:           any[]
  packageSummaries: any[]   
}

function DetailFormFields({ form, onChange, packages, fuelTypes, plants, packageSummaries }: DetailFormFieldsProps) {
  const isAmendment = form.ContractType === 'AMENDMENT'
  const isClosing = form.ContractType === 'CLOSING'

  const handleAmendSourceSelect = (srcPkgId: string) => {
    if (!srcPkgId) {
      onChange({ ...form, amendSourcePackageId: '', ContractPrice: '', VolumeOrdered: '' })
      return
    }
    const summary = packageSummaries.find((s: any) => String(s.FuelContractPackageId) === srcPkgId)
    if (summary) {
      onChange({
        ...form,
        amendSourcePackageId: srcPkgId,
        ContractPrice: summary.EndRunningBalance != null ? String(Number(summary.EndRunningBalance).toFixed(4)) : '',
        VolumeOrdered: summary.EndVolumeBalance  != null ? String(Number(summary.EndVolumeBalance).toFixed(4))  : '',
      })
    } else {
      onChange({ ...form, amendSourcePackageId: srcPkgId, ContractPrice: '', VolumeOrdered: '' })
    }
  }

  if (isClosing) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
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
            ...packages
              .filter((p: any) => !p.isCertified)
              .map((p: any) => ({
                label: p.PackageName,
                value: String(p.FuelContractPackageId),
              })),
          ]}
        />
        <InputField label="Invoice No." value={form.InvoiceNo} onChange={(v) => onChange({ ...form, InvoiceNo: v })} placeholder="e.g. INV-2025-001" />
        <div className="col-span-full p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-400">
          <strong>Closing entry</strong> — only Estimated Price and Validated Volume are required.
        </div>
        <FieldGroup label="Closing Values" />
        <InputField label="Est. Price / Closing Price (₱/L)" value={form.ContractPrice} onChange={(v) => onChange({ ...form, ContractPrice: v })} type="number" placeholder="0.0000" />
        <InputField label="Volume Validated (L)" value={form.VolumeValidated} onChange={(v) => onChange({ ...form, VolumeValidated: v })} type="number" placeholder="0.00" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">

      <FieldGroup label="Classification" />

      <SelectField
        label="Contract Type *"
        value={form.ContractType}
        onChange={(v) => onChange({ ...form, ContractType: v, ContractPrice: '', VolumeOrdered: '', FuelContractPackageId: '', amendSourcePackageId: '' })}
        options={CONTRACT_TYPES}
        required
      />

      <SelectField
        label="Package (Destination)"
        value={form.FuelContractPackageId}
        onChange={(v) => onChange({ ...form, FuelContractPackageId: v })}
        options={[
          { label: '— No Package —', value: '' },
          ...packages
            .filter((p: any) => !p.isCertified)
            .map((p: any) => ({
              label: p.PackageName,
              value: String(p.FuelContractPackageId),
            })),
        ]}
      />

      {isAmendment && (
        <div className="col-span-full space-y-1.5">
          <label className="text-xs font-500 text-[var(--text-secondary)] uppercase tracking-wide">
            Amend From (Source Package) <span className="text-brand-500">*</span>
          </label>
          <select
            value={form.amendSourcePackageId}
            onChange={(e) => handleAmendSourceSelect(e.target.value)}
            className="input-field"
          >
            <option value="">— Select source package whose balance to amend —</option>
            {packageSummaries
              .map((s: any) => {
                const balLabel = ` | ₱${Number(s.EndRunningBalance).toLocaleString('en-PH', { minimumFractionDigits: 2 })} / ${Number(s.EndVolumeBalance).toLocaleString('en-PH', { minimumFractionDigits: 2 })} L`
                return (
                  <option key={s.FuelContractPackageId} value={String(s.FuelContractPackageId)}>
                    [{s.ContractNo}] {s.PackageName}
                  </option>
                )
              })
            }
          </select>

          {form.amendSourcePackageId && (() => {
            const s = packageSummaries.find((x: any) => String(x.FuelContractPackageId) === form.amendSourcePackageId)
            if (!s) {
              return (
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  No saved summary for this package. Generate its report first to auto-populate balances, or enter values manually.
                </p>
              )
            }
          })()}
        </div>
      )}

      <InputField
        label="Invoice No."
        value={form.InvoiceNo}
        onChange={(v) => onChange({ ...form, InvoiceNo: v })}
        placeholder="e.g. INV-2025-001"
      />

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

      <div className="space-y-1.5">
        <label className="text-xs font-500 text-[var(--text-secondary)] uppercase tracking-wide">
          Contract Price/Fuel Price  (₱/L)
        </label>
        <input
          type="number"
          value={form.ContractPrice}
          onChange={(e) => onChange({ ...form, ContractPrice: e.target.value })}
          placeholder="0.0000"
          className={`input-field ${isAmendment && form.amendSourcePackageId ? 'bg-amber-50 dark:bg-amber-950/20 ' : ''}`}
        />
      </div>

      <FieldGroup label="Volume" />

      <div className="space-y-1.5">
        <label className="text-xs font-500 text-[var(--text-secondary)] uppercase tracking-wide">
          Volume Ordered (L)
        </label>
        <input
          type="number"
          value={form.VolumeOrdered}
          onChange={(e) => onChange({ ...form, VolumeOrdered: e.target.value })}
          placeholder="0.00"
          className={`input-field ${isAmendment && form.amendSourcePackageId ? 'bg-amber-50 dark:bg-amber-950/20 ' : ''}`}
        />
      </div>

      <InputField
        label="Volume Validated (L)"
        value={form.VolumeValidated}
        onChange={(v) => onChange({ ...form, VolumeValidated: v })}
        type="number"
        placeholder="0.00"
      />
      <InputField
        label="Plant Name (auto-filled)"
        value={form.PlantName}
        onChange={(v) => onChange({ ...form, PlantName: v })}
        placeholder="From plant selection"
      />
    </div>
  )
}


export default function PackageDetailsPage() {
  const { id, packagesid }   = useParams()
  const { data: session } = useSession()
  const { success, error: toastError } = useToast()

  const [contract,    setContract]    = useState<any>(null)
  const [loading,     setLoading]     = useState(true)
  const [savingReport,  setSavingReport]  = useState<number | null>(null) 

  // Lookup data
  const [fuelTypes,        setFuelTypes]        = useState<any[]>([])
  const [plants,           setPlants]           = useState<any[]>([])
  const [packageSummaries, setPackageSummaries] = useState<any[]>([])


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

    // ── Lookups ───────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch('/api/fuel-types').then(r => r.json()),
      fetch('/api/plants').then(r => r.json()),
    ]).then(([ft, pl]) => {
      setFuelTypes(Array.isArray(ft) ? ft : [])
      setPlants(Array.isArray(pl) ? pl : [])
    })
  }, [])

  const loadPackageSummaries = useCallback(async () => {
    const res  = await fetch('/api/package-summary')
    const data = await res.json()
    setPackageSummaries(Array.isArray(data) ? data : [])
  }, [])

  useEffect(() => { loadPackageSummaries() }, [loadPackageSummaries])

    // ── Load contract ─────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/contracts/${id}/packages/${packagesid}`)
    if (res.ok) {
      const data = await res.json()
      setContract(data)
    }
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  const handleAddDetail = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingDetail(true)

    const { amendSourcePackageId, ...apiPayload } = detailForm

    const res = await fetch('/api/details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...apiPayload, FuelContractID: id }),
    })
    setSavingDetail(false)
    if (res.ok) {
      if (detailForm.ContractType === 'AMENDMENT' && amendSourcePackageId) {
        const srcSummary = packageSummaries.find((s: any) => String(s.FuelContractPackageId) === amendSourcePackageId)
        const srcPkg     = contract?.packages?.find((p: any) => String(p.FuelContractPackageId) === amendSourcePackageId)
        const destPkg    = contract?.packages?.find((p: any) => String(p.FuelContractPackageId) === detailForm.FuelContractPackageId)

        const srcContractNo = srcSummary?.ContractNo || contract.ContractNo

        await Promise.all([
          fetch(`/api/package-summary/${amendSourcePackageId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ EndRunningBalance: 0, EndVolumeBalance: 0 }),
          }),
          fetch('/api/amendment-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              FuelContractID:         contract.FuelContractID,
              ContractNo:             contract.ContractNo,
              SourcePackageId:        amendSourcePackageId,
              SourcePackageName:      srcSummary?.PackageName || srcPkg?.PackageName || `Package #${amendSourcePackageId}`,
              SourceContractNo:       srcContractNo,
              DestinationPackageId:   detailForm.FuelContractPackageId,
              DestinationPackageName: destPkg?.PackageName || `Package #${detailForm.FuelContractPackageId}`,
              AmendedAmount:          srcSummary?.EndRunningBalance ?? null,
              AmendedVolume:          srcSummary?.EndVolumeBalance  ?? null,
              InvoiceNo:              detailForm.InvoiceNo || null,
            }),
          }),
        ])
        await loadPackageSummaries()  
      }
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
      amendSourcePackageId:  '',
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

  const handleGenerateReport = async (pkg: any) => {

    let signatories = null
    try {
      const sigRes  = await fetch(`/api/signatories?contractId=${contract.FuelContractID}`)
      const sigData = await sigRes.json()
      // Prefer contract-specific, fall back to first available
      signatories = Array.isArray(sigData) && sigData.length > 0 ? sigData[0] : null

      console.log('Fetched signatories:', contract.FuelContractID)
    } catch { toastError('Something went wrong fetching signatories.') }

    const contractArg = {
      ContractNo:      contract.ContractNo,
      FuelContractID:  contract.FuelContractID,
      Representative:  contract.Representative,
      EffectivityFrom: contract.EffectivityFrom,
      EffectivityTo:   contract.EffectivityTo,
      ExpiredDate:     contract.ExpiredDate,
      SupplierID:      contract.SupplierID,
      isMiniGrid:      contract.isMiniGrid === true,
      signatories,
    }
    const pkgArg = {
      FuelContractPackageId: pkg.FuelContractPackageId,
      PackageName:           pkg.PackageName,
      details:               pkg.details || [],
    }
    

    const html = generatePackageReport(contractArg, pkgArg)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const win  = window.open(url, '_blank')
    if (win) win.addEventListener('load', () => URL.revokeObjectURL(url), { once: true })

    setSavingReport(pkg.FuelContractPackageId)
    try {
      const rows = generateReportRows(contractArg, pkgArg)
      const rowsRes = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      })

      if (!rowsRes.ok) {
        toastError('Report opened but failed to save rows to database')
        return
      }
      const rowsData = await rowsRes.json()

      const summary = generatePackageSummary(contractArg, pkgArg)
      const summaryRes = await fetch('/api/package-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary }),
      })
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json()
        if (summaryData.skipped) {
          success('Report saved', `${rowsData.saved} rows recorded`)
        } else {
          success('Report saved', `${rowsData.saved} rows recorded`)
          await loadPackageSummaries()
        }
      } else {
        success('Report saved', `${rowsData.saved} rows recorded (summary save failed)`)
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
  const expiryStatus = getExpiryStatus(contract?.ExpiredDate)

  if (loading) return <ContractPackageDetailSkeleton />

    return (
      <div className="space-y-6 w-full">
        <div>
          <Link href={`/contracts/${id}`} className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-3 transition-colors">
            <ArrowLeft size={14} /> Back to Contract
          </Link>
        </div>

        <div className="w-full space-y-4">
          {contract?.packages.map((pkg: any) => {
            return (
              <div key={pkg.FuelContractPackageId} className="card overflow-hidden w-full min-w-0">

                {/* ── Package Header ── */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                      <Package size={16} className="text-brand-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-600 text-[var(--text-primary)] text-sm">{pkg.PackageName}</p>
                        {pkg.isCertified ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 font-500">
                            <CheckCircle size={11} /> Certified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 font-500">
                            Pending
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {pkg.details?.length ?? 0} details · Added {formatDate(pkg.CreatedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Header action buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <button
                      onClick={() => handleGenerateReport(pkg)}
                      disabled={savingReport === pkg.FuelContractPackageId}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-500 transition-colors whitespace-nowrap disabled:opacity-60 disabled:cursor-wait"
                    >
                      <FileBarChart2 size={13} />
                      {savingReport === pkg.FuelContractPackageId ? 'Saving…' : 'Generate Report'}
                    </button>
                    {!pkg.isCertified && expiryStatus !== 'expired' && (
                      <button
                        onClick={() => {
                          setDetailForm({ ...defaultDetailForm, FuelContractPackageId: String(pkg.FuelContractPackageId) })
                          setDetailModal(true)
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-500 transition-colors whitespace-nowrap"
                      >
                        <Plus size={13} /> Add Detail
                      </button>
                    )}
                  </div>
                </div>

                {/* ── Details Table ── */}
                {!pkg.details || pkg.details.length === 0 ? (
                  <div className="py-10 text-center text-sm text-[var(--text-muted)]">
                    No details added to this package yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="data-table min-w-[900px]">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Plant</th>
                          <th>Fuel Type</th>
                          <th>Func. Group</th>
                          <th>Location</th>
                          <th>Delivery Date</th>
                          <th className="text-right">Vol. Ordered</th>
                          <th className="text-right">Vol. Validated</th>
                          <th className="text-right">Price / L</th>
                          <th>Invoice No.</th>
                          <th className="text-center">Actions</th>
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
                              {d.PlantName || plantLabel(d.PlantID) || '—'}
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
                            <td className="text-xs text-[var(--text-secondary)] font-mono">{d.InvoiceNo || '—'}</td>
                            <td>
                              <div className="flex items-center justify-center gap-1">
                                {pkg.isCertified || expiryStatus === 'expired' ? (
                                  <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                                    <Lock size={11} /> Locked
                                  </span>
                                ) : (
                                  <>
                                    {canCreate(session?.user?.accessLevel ?? 1) && (
                                      <button
                                        onClick={() => openEditDetail(d)}
                                        className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-brand-500 transition-colors"
                                        title="Edit"
                                      >
                                        <Edit2 size={13} />
                                      </button>
                                    )}
                                    {canDelete(session?.user?.accessLevel ?? 1) && (
                                      <button
                                        onClick={() => openDeleteDetail(d)}
                                        className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-[var(--text-muted)] hover:text-red-500 transition-colors"
                                        title="Delete"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
      </div>


        {/* Add Detail */}
        <Modal open={detailModal} onClose={() => setDetailModal(false)} title="Add Contract Detail" size="xl">
          <form onSubmit={handleAddDetail} className="space-y-2">
            <DetailFormFields form={detailForm} onChange={setDetailForm} packages={contract?.packages || []} fuelTypes={fuelTypes} plants={plants} packageSummaries={packageSummaries} />
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
            <DetailFormFields form={editDetailForm} onChange={setEditDetailForm} packages={contract?.packages || []} fuelTypes={fuelTypes} plants={plants} packageSummaries={packageSummaries} />
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
      </div>
    )
}

function ContractPackageDetailSkeleton() {
  return (
    <div className="space-y-6 w-full">
      <Skeleton className="h-4 w-32 mb-3" />
      <div className="card p-6 w-full">
        <div className="flex items-center justify-between ">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg  flex items-center justify-center flex-shrink-0">
                <Skeleton className="h-12 w-16 mb-3" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Skeleton className="h-4 w-60 mb-3 inline-flex items-center gap-1" />
                </div>
                <Skeleton className="h-4 w-40 mb-3 inline-flex items-center gap-1" />
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-3">
              <Skeleton className="flex items-center gap-1.5 px-3 py-1.5 4 h-5 w-12 mb-3" />
              <Skeleton className="flex items-center gap-1.5 px-3 py-1.5 4 h-5 w-12 mb-3" />
            </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-5 mb-5">
          {[...Array(11)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}