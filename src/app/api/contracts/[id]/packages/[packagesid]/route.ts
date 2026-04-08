import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logActivity, ACTIONS, MODULES } from '@/lib/activity'
import { canUpdate, canDelete } from '@/lib/permissions'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string, packagesid: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = parseInt((await params).id)
  const packagesid = parseInt((await params).packagesid)

  const contract = await prisma.lst_FuelContracts.findUnique({
    where: { FuelContractID: id },
    include: {
      supplier: true,
      packages: {
        where: packagesid ? { FuelContractPackageId: packagesid } : undefined, 
        include: {
          details: { orderBy: { date_entry: 'desc' } }, 
          _count: { select: { details: true } },
        },
        orderBy: { CreatedAt: 'desc' },
      },
      details: {
        where: packagesid ? { FuelContractPackageId: packagesid } : undefined,
        orderBy: { date_entry: 'desc' },
      },
      _count: { select: { packages: true, details: true } },
    },
  })

  if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await logActivity({
    userId: parseInt(session.user.id),
    action: ACTIONS.VIEW,
    module: MODULES.CONTRACTS,
    entityId: id,
    entityName: contract.ContractNo,
  })

  return NextResponse.json(contract)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canUpdate(session.user.accessLevel ?? 1))
    return NextResponse.json({ error: 'Forbidden: insufficient permissions' }, { status: 403 })

  const id = parseInt((await params).id)
  const body = await req.json()

  const updated = await prisma.lst_FuelContracts.update({
    where: { FuelContractID: id },
    data: {
      ContractNo: body.ContractNo,
      SupplierID:  parseInt(body.SupplierID) ,
      Representative: body.Representative,
      EffectivityFrom: body.EffectivityFrom ? new Date(body.EffectivityFrom) : null,
      EffectivityTo: body.EffectivityTo ? new Date(body.EffectivityTo) : null,
      DocumentName: body.DocumentName,
      ExpiredDate: body.ExpiredDate ? new Date(body.ExpiredDate) : null,
      isActive: body.isActive,
      isMiniGrid: body.isMiniGrid === true,
    },
  })

  await logActivity({
    userId: parseInt(session.user.id),
    action: ACTIONS.UPDATE,
    module: MODULES.CONTRACTS,
    entityId: id,
    entityName: updated.ContractNo,
    details: `Updated contract ${updated.ContractNo}`,
  })

  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canDelete(session.user.accessLevel ?? 1))
    return NextResponse.json({ error: 'Forbidden: insufficient permissions' }, { status: 403 })

  const id = parseInt((await params).id)
  const contract = await prisma.lst_FuelContracts.findUnique({ where: { FuelContractID: id } })
  if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await logActivity({
    userId: parseInt(session.user.id),
    action: ACTIONS.DELETE,
    module: MODULES.CONTRACTS,
    entityId: id,
    entityName: contract.ContractNo,
    details: `Deleted contract ${contract.ContractNo}`,
  })

  await prisma.lst_FuelContracts.delete({ where: { FuelContractID: id } })

  return NextResponse.json({ success: true })
}
