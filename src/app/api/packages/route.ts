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
  const contractId = searchParams.get('contractId')
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '15')

  const where: any = {}
  if (contractId) where.FuelContractID = parseInt(contractId)

  const [data, total] = await Promise.all([
    prisma.lst_FuelContractPackages.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { CreatedAt: 'desc' },
      include: {
        contract: { select: { ContractNo: true, FuelContractID: true } },
        _count: { select: { details: true } },
      },
    }),
    prisma.lst_FuelContractPackages.count({ where }),
  ])

  return NextResponse.json({ data, total, page, pageSize })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canCreate(session.user.accessLevel ?? 1))
    return NextResponse.json({ error: 'Forbidden: insufficient permissions' }, { status: 403 })

  const body = await req.json()
  const { PackageName, FuelContractID } = body

  if (!PackageName || !FuelContractID) {
    return NextResponse.json({ error: 'PackageName and FuelContractID are required' }, { status: 400 })
  }

  const pkg = await prisma.lst_FuelContractPackages.create({
    data: { PackageName, FuelContractID: parseInt(FuelContractID) },
  })

  await logActivity({
    userId: parseInt(session.user.id),
    action: ACTIONS.CREATE,
    module: MODULES.PACKAGES,
    entityId: pkg.FuelContractPackageId,
    entityName: pkg.PackageName,
    details: `Created package "${pkg.PackageName}" under contract ID ${FuelContractID}`,
  })

  return NextResponse.json(pkg, { status: 201 })
}
