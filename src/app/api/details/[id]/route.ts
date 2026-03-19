import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logActivity, ACTIONS, MODULES } from '@/lib/activity'
import { canUpdate, canDelete } from '@/lib/permissions'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canUpdate(session.user.accessLevel ?? 1))
    return NextResponse.json({ error: 'Forbidden: insufficient permissions' }, { status: 403 })

  const id = parseInt(params.id)
  const body = await req.json()

  const updated = await prisma.lst_FuelContractDetail.update({
    where: { FuelContractDetailID: id },
    data: {
      FunctionalGroup: body.FunctionalGroup,
      LocationGroup: body.LocationGroup,
      PlantID: body.PlantID ? parseInt(body.PlantID) : null,
      PlantName: body.PlantName,
      FuelTypeID: body.FuelTypeID ? parseInt(body.FuelTypeID) : null,
      DeliveryDate: body.DeliveryDate ? new Date(body.DeliveryDate) : null,
      VolumeOrdered: body.VolumeOrdered ? parseFloat(body.VolumeOrdered) : null,
      VolumeValidated: body.VolumeValidated ? parseFloat(body.VolumeValidated) : null,
      ContractPrice: body.ContractPrice ? parseFloat(body.ContractPrice) : null,
      InvoiceNo: body.InvoiceNo,
      FuelContractPackageId: body.FuelContractPackageId ? parseInt(body.FuelContractPackageId) : null,
      ContractType: body.ContractType,
    },
  })

  await logActivity({
    userId: parseInt(session.user.id),
    action: ACTIONS.UPDATE,
    module: MODULES.DETAILS,
    entityId: id,
    entityName: updated.InvoiceNo || `Detail #${id}`,
    details: `Updated contract detail #${id}`,
  })

  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canDelete(session.user.accessLevel ?? 1))
    return NextResponse.json({ error: 'Forbidden: insufficient permissions' }, { status: 403 })

  const id = parseInt(params.id)
  const detail = await prisma.lst_FuelContractDetail.findUnique({ where: { FuelContractDetailID: id } })
  if (!detail) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await logActivity({
    userId: parseInt(session.user.id),
    action: ACTIONS.DELETE,
    module: MODULES.DETAILS,
    entityId: id,
    entityName: detail.InvoiceNo || `Detail #${id}`,
  })

  await prisma.lst_FuelContractDetail.delete({ where: { FuelContractDetailID: id } })

  return NextResponse.json({ success: true })
}
