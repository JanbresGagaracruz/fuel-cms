'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { RefreshCw, Search, BarChart2, TrendingDown, TrendingUp, Droplets } from 'lucide-react'
import { SectionHeader, Skeleton, EmptyState, Pagination } from '@/components/ui/index'
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils'

function DeltaBadge({ beg, end, isAmount }: { beg: number; end: number; isAmount?: boolean }) {
  const delta   = end - beg
  const pct     = beg !== 0 ? (Math.abs(delta) / beg) * 100 : 0
  const consumed = beg - end   // how much was used
  const pctUsed  = beg !== 0 ? (consumed / beg) * 100 : 0

  return (
    <div className="text-right">
      <p className={`text-xs font-600 ${end < 0 ? 'text-red-500' : 'text-[var(--text-primary)]'}`}>
        {isAmount ? formatCurrency(end) : `${formatNumber(end)} L`}
      </p>
      <p className={`text-xs mt-0.5 ${consumed > 0 ? 'text-amber-500' : 'text-green-500'}`}>
        {consumed >= 0 ? '▼' : '▲'} {isAmount ? formatCurrency(Math.abs(consumed)) : `${formatNumber(Math.abs(consumed))} L`}
        {' '}({pctUsed.toFixed(1)}% used)
      </p>
    </div>
  )
}

export default function RunningBalancePage() {
  const [summaries, setSummaries] = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [page,      setPage]      = useState(1)
  const [total,     setTotal]     = useState(0)
  const PAGE_SIZE = 20

  const load = useCallback(async () => {
    setLoading(true)
    const res  = await fetch('/api/package-summary')
    const data = await res.json()
    const all: any[] = Array.isArray(data) ? data : []
    setSummaries(all)
    setTotal(all.length)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Client-side filter by contract no. or package name
  const filtered = summaries.filter(s =>
    !search ||
    s.ContractNo?.toLowerCase().includes(search.toLowerCase()) ||
    s.PackageName?.toLowerCase().includes(search.toLowerCase())
  )

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Aggregate stats
  const totalBegBudget  = summaries.reduce((s, r) => s + Number(r.BegRunningBalance ?? 0), 0)
  const totalEndBudget  = summaries.reduce((s, r) => s + Number(r.EndRunningBalance  ?? 0), 0)
  const totalBegVol     = summaries.reduce((s, r) => s + Number(r.BegVolumeBalance   ?? 0), 0)
  const totalEndVol     = summaries.reduce((s, r) => s + Number(r.EndVolumeBalance   ?? 0), 0)
  const totalValVol     = summaries.reduce((s, r) => s + Number(r.TotalVolumeValidated ?? 0), 0)

  return (
    <div className="space-y-5 w-full">
      <SectionHeader
        title="Running Balance Summary"
        subtitle="Beginning and ending budget/volume balance per package — generated from report"
        actions={
          <button onClick={load} className="btn-secondary p-2">
            <RefreshCw size={15} />
          </button>
        }
      />

      {/* Aggregate stat strip */}
      {!loading && summaries.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: 'Total Beginning Budget',
              value: formatCurrency(totalBegBudget),
              icon: <TrendingUp size={16} />,
              sub: `${summaries.length} package${summaries.length !== 1 ? 's' : ''}`,
            },
            {
              label: 'Total Ending Budget',
              value: formatCurrency(totalEndBudget),
              icon: <TrendingDown size={16} />,
              sub: `${formatCurrency(totalBegBudget - totalEndBudget)} consumed`,
              warn: totalEndBudget < 0,
            },
            {
              label: 'Total Beginning Volume',
              value: `${formatNumber(totalBegVol)} L`,
              icon: <Droplets size={16} />,
              sub: 'contracted',
            },
            {
              label: 'Total Ending Volume',
              value: `${formatNumber(totalEndVol)} L`,
              icon: <BarChart2 size={16} />,
              sub: `${formatNumber(totalValVol)} L validated`,
              warn: totalEndVol < 0,
            },
          ].map(({ label, value, icon, sub, warn }) => (
            <div key={label} className="card p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-500 text-[var(--text-muted)] uppercase tracking-wide">{label}</p>
                <div className="text-[var(--text-muted)]">{icon}</div>
              </div>
              <p className={`text-lg font-display font-700 ${warn ? 'text-red-500' : 'text-[var(--text-primary)]'}`}>
                {value}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <input
          type="text"
          placeholder="Search by contract no. or package…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="input-field pl-11"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden w-full">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="space-y-0">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex gap-4 px-4 py-3 border-b border-[var(--border)]">
                  {[...Array(8)].map((_, j) => (
                    <Skeleton key={j} className={`h-4 ${j === 0 ? 'w-28' : 'flex-1'}`} />
                  ))}
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No summaries yet"
              description="Generate a report from a contract package to save the running balance summary."
            />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Contract No.</th>
                  <th>Package</th>
                  {/* Budget columns */}
                  <th className="text-right">Beg. Running Balance (₱)</th>
                  <th className="text-right">End Running Balance (₱)</th>
                  {/* Volume columns */}
                  <th className="text-right">Beg. Volume Balance (L)</th>
                  <th className="text-right">End Volume Balance (L)</th>
                  {/* Delivery summary */}
                  <th className="text-right">Vol. Ordered (L)</th>
                  <th className="text-right">Vol. Validated (L)</th>
                  <th className="text-right">Amt. Ordered (₱)</th>
                  <th className="text-right">Amt. Validated (₱)</th>
                  <th className="text-center">Rows</th>
                  <th>Generated</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((s: any) => {
                  const budgetConsumed = Number(s.BegRunningBalance) - Number(s.EndRunningBalance)
                  const volConsumed    = Number(s.BegVolumeBalance)  - Number(s.EndVolumeBalance)
                  const endBudget      = Number(s.EndRunningBalance)
                  const endVol         = Number(s.EndVolumeBalance)

                  return (
                    <tr key={s.SummaryID}>
                      <td>
                        <Link
                          href={`/contracts/${s.FuelContractID}`}
                          className="font-500 text-brand-500 hover:text-brand-400 transition-colors text-sm"
                        >
                          {s.ContractNo}
                        </Link>
                      </td>
                      <td className="text-sm text-[var(--text-primary)] max-w-[180px] truncate">
                        {s.PackageName}
                      </td>

                      {/* Budget */}
                      <td className="text-right text-sm font-mono text-[var(--text-secondary)]">
                        {formatCurrency(Number(s.BegRunningBalance))}
                      </td>
                      <td className="text-right">
                        <p className={`text-sm font-600 font-mono ${endBudget < 0 ? 'text-red-500' : 'text-[var(--text-primary)]'}`}>
                          {formatCurrency(endBudget)}
                        </p>
                        <p className="text-xs text-amber-500 mt-0.5">
                          ▼ {formatCurrency(budgetConsumed)} used
                        </p>
                      </td>

                      {/* Volume */}
                      <td className="text-right text-sm font-mono text-[var(--text-secondary)]">
                        {formatNumber(Number(s.BegVolumeBalance))} L
                      </td>
                      <td className="text-right">
                        <p className={`text-sm font-600 font-mono ${endVol < 0 ? 'text-red-500' : 'text-[var(--text-primary)]'}`}>
                          {formatNumber(endVol)} L
                        </p>
                        <p className="text-xs text-amber-500 mt-0.5">
                          ▼ {formatNumber(volConsumed)} L used
                        </p>
                      </td>

                      {/* Delivery totals */}
                      <td className="text-right text-sm font-mono text-[var(--text-secondary)]">
                        {formatNumber(Number(s.TotalVolumeOrdered))} L
                      </td>
                      <td className="text-right text-sm font-mono text-[var(--text-secondary)]">
                        {formatNumber(Number(s.TotalVolumeValidated))} L
                      </td>
                      <td className="text-right text-sm font-mono text-[var(--text-secondary)]">
                        {formatCurrency(Number(s.TotalAmountOrdered))}
                      </td>
                      <td className="text-right text-sm font-mono text-[var(--text-secondary)]">
                        {formatCurrency(Number(s.TotalAmountValidated))}
                      </td>

                      <td className="text-center">
                        <span className="badge bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-xs">
                          {s.RunningRowCount ?? 0}
                        </span>
                      </td>
                      <td className="text-xs text-[var(--text-muted)] whitespace-nowrap">
                        {formatDate(s.GeneratedAt)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
        <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>

      {!loading && summaries.length > 0 && (
        <p className="text-xs text-[var(--text-muted)]">
          Summaries are updated each time a report is generated from the contract package page.
        </p>
      )}
    </div>
  )
}
