import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ packageId: string }>  }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const resolvedParams = await params
  const packageId = parseInt(resolvedParams.packageId)
  if (isNaN(packageId)) {
    return NextResponse.json({ error: 'Invalid packageId' }, { status: 400 })
  }

  const body = await req.json()

  // Only allow updating balance fields — never overwrite identity/baseline fields
  const data: any = {}
  if (body.EndRunningBalance !== undefined) data.EndRunningBalance = body.EndRunningBalance
  if (body.EndVolumeBalance  !== undefined) data.EndVolumeBalance  = body.EndVolumeBalance

  const existing = await prisma.rpt_PackageSummary.findFirst({
    where: { FuelContractPackageId: packageId },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Package summary not found. Generate a report first.' }, { status: 404 })
  }

  const updated = await prisma.rpt_PackageSummary.update({
    where: { SummaryID: existing.SummaryID },
    data,
  })

  return NextResponse.json(updated)
}
