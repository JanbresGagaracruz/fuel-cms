import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logActivity, ACTIONS, MODULES } from '@/lib/activity'
import { canCreate } from '@/lib/permissions'
import { de } from 'date-fns/locale'
import { TheaterIcon } from 'lucide-react'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const contractId = searchParams.get('contractId')
  const packageId = searchParams.get('packageId')
  const contractType = searchParams.get('contractType')
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')

  const where: any = {}
  if (contractId) where.FuelContractID = parseInt(contractId)
  if (packageId) where.FuelContractPackageId = parseInt(packageId)
  if (contractType) where.ContractType = contractType

  const [data, total] = await Promise.all([
    prisma.lst_FuelContractDetail.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { date_entry: 'desc' },
      include: {
        contract: { select: { ContractNo: true } },
        package: { select: { PackageName: true } },
      },
    }),
    prisma.lst_FuelContractDetail.count({ where }),
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
    FuelContractID, FunctionalGroup, LocationGroup, PlantID, PlantName,
    FuelTypeID, DeliveryDate, VolumeOrdered, VolumeValidated,
    ContractPrice, InvoiceNo, FuelContractPackageId, ContractType,
  } = body

  if (!FuelContractID) {
    return NextResponse.json({ error: 'FuelContractID is required' }, { status: 400 })
  }

  const detail = await prisma.lst_FuelContractDetail.create({
    data: {
      FuelContractID: parseInt(FuelContractID),
      FunctionalGroup,
      LocationGroup,
      PlantID: PlantID ? parseInt(PlantID) : null,
      PlantName,
      FuelTypeID: FuelTypeID ? parseInt(FuelTypeID) : null,
      DeliveryDate: DeliveryDate ? new Date(DeliveryDate) : null,
      VolumeOrdered: VolumeOrdered ? parseFloat(VolumeOrdered) : null,
      VolumeValidated: VolumeValidated ? parseFloat(VolumeValidated) : null,
      ContractPrice: ContractPrice ? parseFloat(ContractPrice) : null,
      InvoiceNo,
      FuelContractPackageId: FuelContractPackageId ? parseInt(FuelContractPackageId) : null,
      ContractType: ContractType || 'ORIGINAL',
    },
  })

  await logActivity({
    userId: parseInt(session.user.id),
    action: ACTIONS.CREATE,
    module: MODULES.DETAILS,
    entityId: detail.FuelContractDetailID,
    entityName: detail.InvoiceNo || `Detail #${detail.FuelContractDetailID}`,
    details: `Added ${ContractType || 'ORIGINAL'} detail to contract ID ${FuelContractID}`,
  })

  return NextResponse.json(detail, { status: 201 })
}
