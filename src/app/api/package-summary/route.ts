import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { summary } = body as { summary: any }

  if (!summary) return NextResponse.json({ error: 'No summary provided' }, { status: 400 })

  const userId = parseInt(session.user.id)

  // Insert-once: if a summary already exists for this package, do NOT overwrite it.
  // The only way to update balances is via PATCH (used when amendment zeroes a package).
  // This prevents re-generating a report from resetting a balance that was already amended.
  const existing = await prisma.rpt_PackageSummary.findFirst({
    where: { FuelContractPackageId: summary.FuelContractPackageId },
  })

  if (existing) {
    // Already saved — return it without modifying
    return NextResponse.json({ saved: 0, id: existing.SummaryID, skipped: true }, { status: 200 })
  }

  const created = await prisma.rpt_PackageSummary.create({
    data: {
      FuelContractID:        summary.FuelContractID,
      FuelContractPackageId: summary.FuelContractPackageId,
      ContractNo:            summary.ContractNo,
      PackageName:           summary.PackageName,
      BegRunningBalance:     summary.BegRunningBalance,
      EndRunningBalance:     summary.EndRunningBalance,
      BegVolumeBalance:      summary.BegVolumeBalance,
      EndVolumeBalance:      summary.EndVolumeBalance,
      TotalVolumeOrdered:    summary.TotalVolumeOrdered,
      TotalVolumeValidated:  summary.TotalVolumeValidated,
      TotalAmountOrdered:    summary.TotalAmountOrdered,
      TotalAmountValidated:  summary.TotalAmountValidated,
      RunningRowCount:       summary.RunningRowCount,
      GeneratedBy:           userId,
    },
  })

  return NextResponse.json({ saved: 1, id: created.SummaryID, skipped: false }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const contractId = searchParams.get('contractId')
  const packageId  = searchParams.get('packageId')

  const where: any = {}
  if (contractId) where.FuelContractID        = parseInt(contractId)
  if (packageId)  where.FuelContractPackageId = parseInt(packageId)

  const data = await prisma.rpt_PackageSummary.findMany({
    where,
    orderBy: [{ FuelContractID: 'asc' }, { FuelContractPackageId: 'asc' }],
  })

  return NextResponse.json(data)
}
