import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { rows } = body as { rows: any[] }

  if (!rows || rows.length === 0) {
    return NextResponse.json({ error: 'No rows provided' }, { status: 400 })
  }

  const userId = parseInt(session.user.id)

  // Delete existing records for this package before inserting fresh ones
  const firstRow = rows[0]
  if (firstRow?.FuelContractPackageId) {
    await prisma.rpt_fcms.deleteMany({
      where: { FuelContractPackageId: firstRow.FuelContractPackageId },
    })
  }

  const created = await prisma.rpt_fcms.createMany({
    data: rows.map((r: any) => ({
      FuelContractID:        r.FuelContractID,
      FuelContractPackageId: r.FuelContractPackageId,
      ContractNo:            r.ContractNo,
      PackageName:           r.PackageName,
      FuelContractDetailID:  r.FuelContractDetailID,
      RowNo:                 r.RowNo ?? null,
      ContractType:          r.ContractType ?? null,
      DeliveryDate:          r.DeliveryDate ? new Date(r.DeliveryDate) : null,
      EstPrice:              r.EstPrice     != null ? r.EstPrice     : null,
      VolumeOrdered:         r.VolumeOrdered   != null ? r.VolumeOrdered   : null,
      AmountPeso:            r.AmountPeso      != null ? r.AmountPeso      : null,
      EVatOrdered:           r.EVatOrdered     != null ? r.EVatOrdered     : null,
      TotalOrdered:          r.TotalOrdered    != null ? r.TotalOrdered    : null,
      VolumeValidated:       r.VolumeValidated != null ? r.VolumeValidated : null,
      AdjAmount:             r.AdjAmount       != null ? r.AdjAmount       : null,
      EVatValidated:         r.EVatValidated   != null ? r.EVatValidated   : null,
      TotalValidated:        r.TotalValidated  != null ? r.TotalValidated  : null,
      CumulativeVolume:      r.CumulativeVolume != null ? r.CumulativeVolume : null,
      CumulativeAmount:      r.CumulativeAmount != null ? r.CumulativeAmount : null,
      RemainingBudget:       r.RemainingBudget != null ? r.RemainingBudget : null,
      EquivalentVolume:      r.EquivalentVolume != null ? r.EquivalentVolume : null,
      VolumeBalance:         r.VolumeBalance   != null ? r.VolumeBalance   : null,
      InvoiceNo:             r.InvoiceNo       ?? null,
      PlantName:             r.PlantName       ?? null,
      FunctionalGroup:       r.FunctionalGroup ?? null,
      LocationGroup:         r.LocationGroup   ?? null,
      GeneratedBy:           userId,
    })),
  })

  return NextResponse.json({ saved: created.count }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const packageId  = searchParams.get('packageId')
  const contractId = searchParams.get('contractId')

  const where: any = {}
  if (packageId)  where.FuelContractPackageId = parseInt(packageId)
  if (contractId) where.FuelContractID        = parseInt(contractId)

  const data = await prisma.rpt_fcms.findMany({
    where,
    orderBy: [{ FuelContractPackageId: 'asc' }, { RowNo: 'asc' }],
  })

  return NextResponse.json(data)
}
