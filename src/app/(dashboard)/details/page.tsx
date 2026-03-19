'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ClipboardList, Filter, RefreshCw } from 'lucide-react'
import {
  SectionHeader, Pagination, TableSkeleton, EmptyState, SelectField
} from '@/components/ui/index'
import { formatDate, formatNumber, formatCurrency, getContractTypeColor } from '@/lib/utils'

const CONTRACT_TYPE_OPTS = [
  { label: 'All Types',  value: '' },
  { label: 'Original',   value: 'ORIGINAL'  },
  { label: 'Running',    value: 'RUNNING'   },
  { label: 'Amendment',  value: 'AMENDMENT' },
  { label: 'Renewal',    value: 'RENEWAL'   },
  { label: 'Addendum',   value: 'ADDENDUM'  },
]

export default function DetailsPage() {
  const [details, setDetails] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [contractType, setContractType] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      pageSize: '20',
      ...(contractType && { contractType }),
    })
    const res = await fetch(`/api/details?${params}`)
    const data = await res.json()
    setDetails(data.data || [])
    setTotal(data.total || 0)
    setLoading(false)
  }, [page, contractType])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Contract Details"
        subtitle={`${total} detail record${total !== 1 ? 's' : ''} total`}
        actions={
          <button onClick={load} className="btn-secondary p-2"><RefreshCw size={15} /></button>
        }
      />

      {/* Filters */}
      <div className="card p-4 flex flex-wrap items-end gap-4">
        <div className="flex items-center gap-2 text-[var(--text-muted)]">
          <Filter size={14} />
          <span className="text-xs font-500 uppercase tracking-wide">Filter</span>
        </div>
        <div className="max-w-[200px]">
          <SelectField
            label="Contract Type"
            value={contractType}
            onChange={(v) => { setContractType(v); setPage(1) }}
            options={CONTRACT_TYPE_OPTS}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['ORIGINAL', 'RUNNING', 'AMENDMENT', 'RENEWAL', 'ADDENDUM'].map((t) => (
            <button
              key={t}
              onClick={() => { setContractType(contractType === t ? '' : t); setPage(1) }}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors font-500 ${
                contractType === t
                  ? 'bg-brand-500 text-white'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={10} cols={8} />
          ) : details.length === 0 ? (
            <EmptyState
              title="No details found"
              description="Add contract details to packages via the Contracts page."
            />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Contract</th>
                  <th>Package</th>
                  <th>Plant</th>
                  <th>Functional Group</th>
                  <th>Delivery Date</th>
                  <th>Vol. Ordered</th>
                  <th>Vol. Validated</th>
                  <th>Price</th>
                  <th>Invoice No.</th>
                </tr>
              </thead>
              <tbody>
                {details.map((d: any) => (
                  <tr key={d.FuelContractDetailID}>
                    <td>
                      <span className={`badge text-xs ${getContractTypeColor(d.ContractType)}`}>
                        {d.ContractType || 'ORIGINAL'}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/contracts/${d.FuelContractID}`}
                        className="text-xs font-500 text-brand-500 hover:text-brand-400 transition-colors whitespace-nowrap"
                      >
                        {d.contract?.ContractNo || `#${d.FuelContractID}`}
                      </Link>
                    </td>
                    <td className="text-xs text-[var(--text-secondary)]">
                      {d.package?.PackageName || <span className="text-[var(--text-muted)]">—</span>}
                    </td>
                    <td className="text-xs text-[var(--text-secondary)]">{d.PlantName || '—'}</td>
                    <td className="text-xs text-[var(--text-secondary)]">{d.FunctionalGroup || '—'}</td>
                    <td className="text-xs text-[var(--text-secondary)] whitespace-nowrap">{formatDate(d.DeliveryDate)}</td>
                    <td className="text-xs text-right font-mono">{formatNumber(d.VolumeOrdered)}</td>
                    <td className="text-xs text-right font-mono">{formatNumber(d.VolumeValidated)}</td>
                    <td className="text-xs text-right font-mono">{formatCurrency(d.ContractPrice)}</td>
                    <td className="text-xs text-[var(--text-secondary)]">{d.InvoiceNo || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination page={page} total={total} pageSize={20} onChange={setPage} />
      </div>
    </div>
  )
}
