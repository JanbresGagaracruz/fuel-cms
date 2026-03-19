import { prisma } from './prisma'
import { headers } from 'next/headers'

export async function logActivity({
  userId,
  action,
  module,
  entityId,
  entityName,
  details,
}: {
  userId: number
  action: string
  module: string
  entityId?: number
  entityName?: string
  details?: string
}) {
  try {
    const headersList = headers()
    const ipAddress = (await headersList).get('x-forwarded-for') || (await headersList).get('x-real-ip') || 'unknown'

    await prisma.activityTrail.create({
      data: {
        userId,
        action,
        module,
        entityId,
        entityName,
        details,
        ipAddress: ipAddress.split(',')[0].trim(),
      },
    })
  } catch (error) {
    console.error('Failed to log activity:', error)
  }
}

export const ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  VIEW: 'VIEW',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  EXPORT: 'EXPORT',
  ACTIVATE: 'ACTIVATE',
  DEACTIVATE: 'DEACTIVATE',
} as const

export const MODULES = {
  AUTH: 'Authentication',
  CONTRACTS: 'Fuel Contracts',
  PACKAGES: 'Contract Packages',
  DETAILS: 'Contract Details',
  USERS: 'Users',
} as const
