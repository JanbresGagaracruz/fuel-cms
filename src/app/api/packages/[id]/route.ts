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

  const id = parseInt((await params).id)
  const body = await req.json()

  const updated = await prisma.lst_FuelContractPackages.update({
    where: { FuelContractPackageId: id },
    data: { PackageName: body.PackageName },
  })

  await logActivity({
    userId: parseInt(session.user.id),
    action: ACTIONS.UPDATE,
    module: MODULES.PACKAGES,
    entityId: id,
    entityName: updated.PackageName,
    details: `Updated package name to "${updated.PackageName}"`,
  })

  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canDelete(session.user.accessLevel ?? 1))
    return NextResponse.json({ error: 'Forbidden: insufficient permissions' }, { status: 403 })

  const id = parseInt((await params).id)
  const pkg = await prisma.lst_FuelContractPackages.findUnique({ where: { FuelContractPackageId: id } })
  if (!pkg) return NextResponse.json({ error: 'Not found' }, { status: 404 })

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
