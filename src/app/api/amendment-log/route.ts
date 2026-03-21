import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    FuelContractID, ContractNo,
    SourcePackageId, SourcePackageName,
    DestinationPackageId, DestinationPackageName,
    AmendedAmount, AmendedVolume, InvoiceNo,
  } = body

  const log = await prisma.rpt_AmendmentLog.create({
    data: {
      FuelContractID:         parseInt(FuelContractID),
      ContractNo,
      SourcePackageId:        parseInt(SourcePackageId),
      SourcePackageName,
      DestinationPackageId:   parseInt(DestinationPackageId),
      DestinationPackageName,
      AmendedAmount:          AmendedAmount   != null ? AmendedAmount   : null,
      AmendedVolume:          AmendedVolume   != null ? AmendedVolume   : null,
      InvoiceNo:              InvoiceNo       || null,
      CreatedBy:              parseInt(session.user.id),
    },
  })

  return NextResponse.json(log, { status: 201 })
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const contractId = searchParams.get('contractId')

  const where: any = {}
  if (contractId) where.FuelContractID = parseInt(contractId)

  const data = await prisma.rpt_AmendmentLog.findMany({
    where,
    orderBy: { CreatedAt: 'desc' },
  })

  return NextResponse.json(data)
}
