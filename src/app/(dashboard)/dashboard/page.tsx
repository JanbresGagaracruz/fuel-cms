'use client'

import { useEffect, useState } from 'react'
import {
  FileText, Package, TrendingUp, AlertTriangle,
  CheckCircle, Clock, Activity, BarChart3
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts'
import { StatCard, Badge, Skeleton, SectionHeader } from '@/components/ui/index'
import { formatDate, formatNumber, formatRelative, getActivityColor } from '@/lib/utils'

interface DashboardData {
  stats: {
    totalContracts: number
    activeContracts: number
    expiringSoon: number
    totalPackages: number
    totalVolume: number
    totalContractValue: number
  }
  recentActivity: any[]
  monthlyData: any[]
  topContracts: any[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardSkeleton />

  const { stats, recentActivity, monthlyData, topContracts } = data!

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Dashboard"
        subtitle={`Overview as of ${formatDate(new Date())}`}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Contracts"
          value={formatNumber(stats?.totalContracts)}
          icon={<FileText size={18} />}
          accent
        />
        <StatCard
          label="Active Contracts"
          value={formatNumber(stats?.activeContracts)}
          icon={<CheckCircle size={18} />}
          trend="up"
          trendLabel="Currently in effect"
        />
        <StatCard
          label="Expiring Soon"
          value={formatNumber(stats?.expiringSoon)}
          icon={<AlertTriangle size={18} />}
          trend={stats.expiringSoon > 0 ? 'down' : 'neutral'}
          trendLabel="Within 90 days"
        />
        <StatCard
          label="Total Packages"
          value={formatNumber(stats?.totalPackages)}
          icon={<Package size={18} />}
        />
      </div>

      {/* Second row of stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={15} className="text-[var(--text-muted)]" />
            <span className="text-xs font-500 text-[var(--text-muted)] uppercase tracking-wide">
              Total Volume Ordered
            </span>
          </div>
          <p className="text-2xl font-display font-700 text-[var(--text-primary)]">
            {formatNumber(stats.totalVolume)} <span className="text-sm font-400 text-[var(--text-muted)]">L</span>
          </p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={15} className="text-[var(--text-muted)]" />
            <span className="text-xs font-500 text-[var(--text-muted)] uppercase tracking-wide">
              Total Contract Value
            </span>
          </div>
          <p className="text-2xl font-display font-700 text-[var(--text-primary)]">
            ₱{formatNumber(stats.totalContractValue)}
          </p>
        </div>
      </div>

      {/* Charts + Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Monthly chart */}
        <div className="xl:col-span-2 card p-5">
          <h3 className="font-display font-600 text-[var(--text-primary)] mb-4 text-sm">
            Contracts Created — Last 6 Months
          </h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Contracts"
                  stroke="#f97316"
                  strokeWidth={2}
                  fill="url(#colorCount)"
                  dot={{ r: 3, fill: '#f97316', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-[var(--text-muted)] text-sm">
              No data available
            </div>
          )}
        </div>

        {/* Activity trail */}
        <div className="card p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={15} className="text-[var(--text-muted)]" />
            <h3 className="font-display font-600 text-[var(--text-primary)] text-sm">Recent Activity</h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 max-h-[260px]">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] text-center py-8">No recent activity</p>
            ) : recentActivity.map((a: any) => (
              <div key={a.id} className="flex gap-3">
                <div className={`activity-dot bg-current ${getActivityColor(a.action)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[var(--text-primary)] leading-snug truncate">
                    <span className={`font-600 ${getActivityColor(a.action)}`}>{a.action}</span>
                    {' · '}{a.module}
                    {a.entityName && <span className="text-[var(--text-muted)]"> — {a.entityName}</span>}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{formatRelative(a.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
          <a href="/activity" className="mt-3 text-xs text-brand-500 hover:text-brand-400 transition-colors pt-3 border-t border-[var(--border)]">
            View all activity →
          </a>
        </div>
      </div>

      {/* Top contracts table */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-[var(--border)]">
          <h3 className="font-display font-600 text-[var(--text-primary)] text-sm">Recent Fuel Contracts</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Contract No.</th>
                <th>Representative</th>
                <th>Effectivity</th>
                <th>Expiry</th>
                <th>Packages</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {topContracts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-[var(--text-muted)] py-8">
                    No contracts found
                  </td>
                </tr>
              ) : topContracts.map((c: any) => (
                <tr key={c.FuelContractID}>
                  <td>
                    <a href={`/contracts/${c.FuelContractID}`} className="font-500 text-brand-500 hover:text-brand-400">
                      {c.ContractNo}
                    </a>
                  </td>
                  <td className="text-[var(--text-secondary)]">{c.Representative || '—'}</td>
                  <td className="text-[var(--text-secondary)] text-xs">
                    {formatDate(c.EffectivityFrom)} – {formatDate(c.EffectivityTo)}
                  </td>
                  <td className="text-[var(--text-secondary)] text-xs">{formatDate(c.ExpiredDate)}</td>
                  <td>
                    <span className="text-xs font-500 text-[var(--text-primary)]">
                      {c._count?.packages ?? 0} pkg · {c._count?.details ?? 0} det
                    </span>
                  </td>
                  <td>
                    <Badge variant={c.isActive ? 'success' : 'default'}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-[var(--border)]">
          <a href="/contracts" className="text-xs text-brand-500 hover:text-brand-400 transition-colors">
            View all contracts →
          </a>
        </div>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 shimmer rounded mb-6" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5 space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 card p-5">
          <Skeleton className="h-4 w-48 mb-4" />
          <Skeleton className="h-[220px] w-full" />
        </div>
        <div className="card p-5 space-y-3">
          <Skeleton className="h-4 w-32 mb-4" />
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
        </div>
      </div>
    </div>
  )
}
