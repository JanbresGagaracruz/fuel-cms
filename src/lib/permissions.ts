// src/lib/permissions.ts
//
// Access Level definitions:
//   1 — Viewer      : read-only (GET only)
//   2 — Staff       : can view + create + update own records
//   3 — Admin       : full CRUD + user management
//   4 — Super Admin : all permissions, no restrictions

export const ACCESS = {
  VIEWER:       1,
  STAFF:        2,
  ADMIN:        3,
  SUPER_ADMIN:  4,
} as const

export type AccessLevel = typeof ACCESS[keyof typeof ACCESS]

/** Can the user read/view records? (all levels) */
export function canRead(level: number): boolean {
  return level >= ACCESS.VIEWER
}

/** Can the user create new records? */
export function canCreate(level: number): boolean {
  return level >= ACCESS.STAFF
}

/** Can the user edit/update existing records? */
export function canUpdate(level: number): boolean {
  return level >= ACCESS.STAFF
}

/** Can the user delete records? */
export function canDelete(level: number): boolean {
  return level >= ACCESS.ADMIN
}

/** Can the user manage users? */
export function canManageUsers(level: number): boolean {
  return level >= ACCESS.ADMIN
}

/** Human-readable label for an access level */
export function accessLevelLabel(level: number): string {
  switch (level) {
    case ACCESS.VIEWER:      return 'Viewer'
    case ACCESS.STAFF:       return 'Staff'
    case ACCESS.ADMIN:       return 'Admin'
    case ACCESS.SUPER_ADMIN: return 'Super Admin'
    default:                 return `Level ${level}`
  }
}

/** Tailwind badge variant for an access level */
export function accessLevelVariant(level: number): 'default' | 'info' | 'warning' | 'danger' {
  switch (level) {
    case ACCESS.VIEWER:      return 'default'
    case ACCESS.STAFF:       return 'info'
    case ACCESS.ADMIN:       return 'warning'
    case ACCESS.SUPER_ADMIN: return 'danger'
    default:                 return 'default'
  }
}
