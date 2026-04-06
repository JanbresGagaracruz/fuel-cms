import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logActivity, ACTIONS, MODULES } from '@/lib/activity'
import {  canDelete } from '@/lib/permissions'

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canDelete(session.user.accessLevel ?? 1))
    return NextResponse.json({ error: 'Forbidden: insufficient permissions' }, { status: 403 })

  const id = parseInt((await params).id)
  const contract = await prisma.lst_FuelContracts.findUnique({ where: { FuelContractID: id } })

  if (contract){
      const pkg = await prisma.lst_FuelContractPackages.findMany({ where: { FuelContractID: id } })
      if (!pkg || pkg.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

      if (pkg.some(p => p.isCertified)) {
        return NextResponse.json(
          { error: 'Cannot delete a Contract with certified package' },
          { status: 403 }
        )
      }
  }else {return NextResponse.json({ error: 'Not found' }, { status: 404 })}

  await logActivity({
    userId: parseInt(session.user.id),
    action: ACTIONS.DELETE,
    module: MODULES.CONTRACTS,
    entityId: id,
    entityName: contract.ContractNo,
    details: `Deleted contract ${contract.ContractNo} including its packages and delivery details`,
  })

  await prisma.lst_FuelContractDetail.deleteMany({ where: { FuelContractID: id } })
  await prisma.lst_FuelContractPackages.deleteMany({ where: { FuelContractID: id } })
  await prisma.lst_FuelContracts.delete({ where: { FuelContractID: id } })

  return NextResponse.json({ success: true })
}
