'use client'

import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

// ─── Badge ───────────────────────────────────────────────
export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'original' | 'amendment' | 'renewal' | 'addendum'
  className?: string
}) {
  const variants = {
    default: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
    success: 'status-active',
    warning: 'status-warning',
    danger: 'status-expired',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    original: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    amendment: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    renewal: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    addendum: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  }
  return (
    <span className={cn('badge', variants[variant], className)}>
      {children}
    </span>
  )
}

// ─── Stat Card ───────────────────────────────────────────
export function StatCard({
  label,
  value,
  icon,
  trend,
  trendLabel,
  accent,
}: {
  label: string
  value: string | number
  icon: ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendLabel?: string
  accent?: boolean
}) {
  return (
    <div className={cn('card p-5', accent && 'border-brand-500/30 bg-brand-500/5')}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-500 text-[var(--text-muted)] uppercase tracking-wide mb-2">{label}</p>
          <p className="text-2xl font-display font-700 text-[var(--text-primary)]">{value}</p>
          {trendLabel && (
            <p className={cn(
              'text-xs mt-1',
              trend === 'up' && 'text-green-500',
              trend === 'down' && 'text-red-500',
              trend === 'neutral' && 'text-[var(--text-muted)]',
            )}>
              {trendLabel}
            </p>
          )}
        </div>
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center',
          accent ? 'bg-brand-500/20 text-brand-500' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
        )}>
          {icon}
        </div>
      </div>
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center mb-4">
        <span className="text-2xl">📄</span>
      </div>
      <h3 className="font-600 text-[var(--text-primary)] mb-1">{title}</h3>
      {description && <p className="text-sm text-[var(--text-muted)] max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  )
}

// ─── Loading Skeleton ─────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('shimmer rounded', className)} />
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-0">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b border-[var(--border)]">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className={cn('h-4', j === 0 ? 'w-24' : 'flex-1')} />
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────
export function SectionHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h1 className="text-xl font-display font-700 text-[var(--text-primary)]">{title}</h1>
        {subtitle && <p className="text-sm text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  )
}

// ─── Modal ────────────────────────────────────────────────
export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  if (!open) return null
  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[size]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative card w-full animate-fade-up', sizeClass)}>
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <h2 className="font-display font-600 text-[var(--text-primary)]">{title}</h2>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// ─── Confirm Dialog ───────────────────────────────────────
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  danger = false,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  danger?: boolean
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full max-w-sm animate-fade-up p-6">
        <h3 className="font-display font-600 text-[var(--text-primary)] mb-2">{title}</h3>
        <p className="text-sm text-[var(--text-muted)] mb-6">{description}</p>
        <div className="flex justify-end gap-2">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className={danger ? 'btn-danger' : 'btn-primary'}
            onClick={() => { onConfirm(); onClose() }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────
export function Pagination({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number
  total: number
  pageSize: number
  onChange: (page: number) => void
}) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
      <p className="text-xs text-[var(--text-muted)]">
        Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="px-2 py-1 text-xs rounded btn-secondary disabled:opacity-40"
        >
          ← Prev
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const p = i + 1
          return (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={cn(
                'px-2.5 py-1 text-xs rounded transition-colors',
                p === page ? 'bg-brand-500 text-white' : 'btn-secondary'
              )}
            >
              {p}
            </button>
          )
        })}
        <button
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="px-2 py-1 text-xs rounded btn-secondary disabled:opacity-40"
        >
          Next →
        </button>
      </div>
    </div>
  )
}

// ─── Select Field ─────────────────────────────────────────
export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { label: string; value: string }[]
  placeholder?: string
  required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-500 text-[var(--text-secondary)] uppercase tracking-wide">
        {label}{required && ' *'}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field"
        required={required}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

// ─── Input Field ──────────────────────────────────────────
export function InputField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-500 text-[var(--text-secondary)] uppercase tracking-wide">
        {label}{required && ' *'}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="input-field disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  )
}
