import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logActivity, ACTIONS, MODULES } from '@/lib/activity'
import { canCreate } from '@/lib/permissions'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '15')
  const search = searchParams.get('search') || ''
  const active = searchParams.get('active')

  const where: any = {}
  if (search) {
    where.OR = [
      { ContractNo: { contains: search } },
      { Representative: { contains: search } },
    ]
  }
  if (active === 'true') where.isActive = true
  if (active === 'false') where.isActive = false

  const [data, total] = await Promise.all([
    prisma.lst_FuelContracts.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { date_entry: 'desc' },
      include: {
        _count: { select: { packages: true, details: true } },
      },
    }),
    prisma.lst_FuelContracts.count({ where }),
  ])

  return NextResponse.json({ data, total, page, pageSize })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canCreate(session.user.accessLevel ?? 1))
    return NextResponse.json({ error: 'Forbidden: insufficient permissions' }, { status: 403 })

  const body = await req.json()
  const {
    ContractNo, SupplierID, Representative,
    EffectivityFrom, EffectivityTo, DocumentName, ExpiredDate, isActive, isMiniGrid,
  } = body

  if (!ContractNo) return NextResponse.json({ error: 'ContractNo is required' }, { status: 400 })

  const contract = await prisma.lst_FuelContracts.create({
    data: {
      ContractNo,
      SupplierID: SupplierID ? parseInt(SupplierID) : null,
      Representative,
      EffectivityFrom: EffectivityFrom ? new Date(EffectivityFrom) : null,
      EffectivityTo: EffectivityTo ? new Date(EffectivityTo) : null,
      DocumentName,
      ExpiredDate: ExpiredDate ? new Date(ExpiredDate) : null,
      isActive: isActive !== undefined ? isActive : true,
      isMiniGrid: isMiniGrid === true,
    },
  })

  await logActivity({
    userId: parseInt(session.user.id),
    action: ACTIONS.CREATE,
    module: MODULES.CONTRACTS,
    entityId: contract.FuelContractID,
    entityName: contract.ContractNo,
    details: `Created fuel contract ${contract.ContractNo}`,
  })

  return NextResponse.json(contract, { status: 201 })
}
