import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, differenceInDays } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null | undefined, fmt = 'MMM dd, yyyy') {
  if (!date) return '—'
  return format(new Date(date), fmt)
}

export function formatRelative(date: Date | string | null | undefined) {
  if (!date) return '—'
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatCurrency(value: number | null | undefined, currency = 'PHP') {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value)
}

export function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('en-PH').format(value)
}

export function getDaysUntilExpiry(expiredDate: Date | string | null | undefined) {
  if (!expiredDate) return null
  return differenceInDays(new Date(expiredDate), new Date())
}

export function getExpiryStatus(expiredDate: Date | string | null | undefined) {
  const days = getDaysUntilExpiry(expiredDate)
  if (days === null) return 'none'
  if (days < 0) return 'expired'
  if (days <= 30) return 'critical'
  if (days <= 90) return 'warning'
  return 'good'
}

export function getContractTypeColor(type: string | null) {
  switch (type) {
    case 'ORIGINAL':  return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case 'RUNNING':   return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'
    case 'AMENDMENT': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    case 'RENEWAL':   return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    case 'ADDENDUM':  return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    default:          return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  }
}

export function getActivityIcon(action: string) {
  switch (action) {
    case 'CREATE': return '+'
    case 'UPDATE': return '~'
    case 'DELETE': return '-'
    case 'LOGIN': return '→'
    case 'LOGOUT': return '←'
    default: return '·'
  }
}

export function getActivityColor(action: string) {
  switch (action) {
    case 'CREATE': return 'text-green-500'
    case 'UPDATE': return 'text-amber-500'
    case 'DELETE': return 'text-red-500'
    case 'LOGIN': return 'text-blue-500'
    case 'LOGOUT': return 'text-gray-500'
    default: return 'text-gray-400'
  }
}
