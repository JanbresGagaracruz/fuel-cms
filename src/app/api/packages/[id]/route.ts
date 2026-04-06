import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logActivity, ACTIONS, MODULES } from '@/lib/activity'
import { canUpdate, canDelete } from '@/lib/permissions'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canUpdate(session.user.accessLevel ?? 1))
    return NextResponse.json({ error: 'Forbidden: insufficient permissions' }, { status: 403 })

  const id   = parseInt((await params).id)
  const body = await req.json()

  const data: any = {}

  // Rename update
  if (body.PackageName !== undefined) data.PackageName = body.PackageName

  // Certify action
  if (body.isCertified === true) {
    data.isCertified  = true
    data.CertifiedBy  = parseInt(session.user.id)
    data.CertifiedAt  = new Date()
  }
  // Uncertify (admin only — edge case)
  if (body.isCertified === false) {
    data.isCertified = false
    data.CertifiedBy = null
    data.CertifiedAt = null
  }

  const updated = await prisma.lst_FuelContractPackages.update({
    where: { FuelContractPackageId: id },
    data,
  })

  await logActivity({
    userId: parseInt(session.user.id),
    action: ACTIONS.UPDATE,
    module: MODULES.PACKAGES,
    entityId: id,
    entityName: updated.PackageName,
    details: body.isCertified === true
      ? `Certified package "${updated.PackageName}"`
      : `Updated package "${updated.PackageName}"`,
  })

  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canDelete(session.user.accessLevel ?? 1))
    return NextResponse.json({ error: 'Forbidden: insufficient permissions' }, { status: 403 })

  const id  = parseInt((await params).id)
  const pkg = await prisma.lst_FuelContractPackages.findUnique({ 
    where: { FuelContractPackageId: id }
  })
  if (!pkg) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (pkg.isCertified) {
    return NextResponse.json({ error: 'Cannot delete a certified package' }, { status: 403 })
  }

  await logActivity({
    userId: parseInt(session.user.id),
    action: ACTIONS.DELETE,
    module: MODULES.PACKAGES,
    entityId: id,
    entityName: pkg.PackageName,
  })

  await prisma.lst_FuelContractPackages.delete({ where: { FuelContractPackageId: id } })

  return NextResponse.json({ success: true })
}
