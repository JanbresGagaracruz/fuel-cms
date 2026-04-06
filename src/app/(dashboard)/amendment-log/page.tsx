'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { RefreshCw, Search, ArrowLeftRight, ArrowRight } from 'lucide-react'
import { SectionHeader, Pagination, EmptyState } from '@/components/ui/index'
import { formatDate, formatCurrency, formatNumber } from '@/lib/utils'

export default function AmendmentLogPage() {
  const [logs,    setLogs]    = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [page,    setPage]    = useState(1)
  const PAGE_SIZE = 20

  const load = useCallback(async () => {
    setLoading(true)
    const res  = await fetch('/api/amendment-log')
    const data = await res.json()
    setLogs(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = logs.filter(l =>
    !search ||
    l.ContractNo?.toLowerCase().includes(search.toLowerCase()) ||
    l.SourcePackageName?.toLowerCase().includes(search.toLowerCase()) ||
    l.DestinationPackageName?.toLowerCase().includes(search.toLowerCase())
  )

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-5 w-full">
      <SectionHeader
        title="Amendment Log"
        subtitle="History of amendment transfers between packages"
        actions={
          <button onClick={load} className="btn-secondary p-2">
            <RefreshCw size={15} />
          </button>
        }
      />

      {/* Search */}
      <div className="relative max-w-sm">
        <input
          type="text"
          placeholder="Search by contract no. or package…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="input-field pl-9"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden w-full">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="space-y-0">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex gap-4 px-4 py-3 border-b border-[var(--border)]">
                  {[...Array(7)].map((_, j) => (
                    <div key={j} className={`h-4 rounded bg-[var(--bg-tertiary)] animate-pulse ${j === 0 ? 'w-24' : 'flex-1'}`} />
                  ))}
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No amendment transfers yet"
              description="When an Amendment detail is saved with a source package, the transfer is logged here."
            />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Contract No.</th>
                  <th>Source Package</th>
                  <th className="text-center w-8"></th>
                  <th>Destination Package</th>
                  <th className="text-right">Amended Amount (₱)</th>
                  <th className="text-right">Amended Volume (L)</th>
                  <th>Invoice No.</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((l: any) => (
                  <tr key={l.LogID}>
                    <td>
                      <Link
                        href={`/contracts/${l.FuelContractID}`}
                        className="font-500 text-brand-500 hover:text-brand-400 transition-colors text-sm"
                      >
                        {l.ContractNo}
                      </Link>
                    </td>

                    {/* Source */}
                    <td>
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs font-500 text-amber-700 dark:text-amber-400">
                          {l.SourcePackageName}
                        </span>
                        {l.SourceContractNo && l.SourceContractNo !== l.ContractNo && (
                          <p className="text-xs text-[var(--text-muted)] pl-1">from {l.SourceContractNo}</p>
                        )}
                      </div>
                    </td>

                    {/* Arrow */}
                    <td className="text-center">
                      <ArrowRight size={14} className="text-[var(--text-muted)] mx-auto" />
                    </td>

                    {/* Destination */}
                    <td>
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800 text-xs font-500 text-brand-700 dark:text-brand-400">
                        {l.DestinationPackageName}
                      </span>
                    </td>

                    <td className="text-right font-mono text-sm text-[var(--text-primary)]">
                      {l.AmendedAmount != null ? formatCurrency(Number(l.AmendedAmount)) : '—'}
                    </td>
                    <td className="text-right font-mono text-sm text-[var(--text-secondary)]">
                      {l.AmendedVolume != null ? `${formatNumber(Number(l.AmendedVolume))} L` : '—'}
                    </td>
                    <td className="text-xs text-[var(--text-secondary)] font-mono">
                      {l.InvoiceNo || '—'}
                    </td>
                    <td className="text-xs text-[var(--text-muted)] whitespace-nowrap">
                      {formatDate(l.CreatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>
    </div>
  )
}
