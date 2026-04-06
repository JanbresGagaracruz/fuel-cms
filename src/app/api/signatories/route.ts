import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logActivity, ACTIONS, MODULES } from '@/lib/activity'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const contractId = req.nextUrl.searchParams.get('contractId')
  const where: any = contractId ? { FuelContractID: parseInt(contractId) } : {}

  const data = await prisma.lst_ContractSignatories.findMany({
    where,
    orderBy: { CreatedAt: 'desc' },
  })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const record = await prisma.lst_ContractSignatories.create({
    data: {
      FuelContractID:  body.FuelContractID ? parseInt(body.FuelContractID) : null,
      Title:           body.Title           || null,
      PreparedByName:  body.PreparedByName  || null,
      PreparedByPos:   body.PreparedByPos   || null,
      ReviewedByName:  body.ReviewedByName  || null,
      ReviewedByPos:   body.ReviewedByPos   || null,
      NotedByName:     body.NotedByName     || null,
      NotedByPos:      body.NotedByPos      || null,
      CreatedBy:       parseInt(session.user.id),
    },
  })

  await logActivity({
    userId: parseInt(session.user.id),
    action: ACTIONS.CREATE,
    module: MODULES.SIGNATORIES,
    entityId: record.SignatoryID || 0,
    entityName: record.Title || `Signatory #${record.SignatoryID}`,
    details: `Created signatories ${record.SignatoryID}`,
  })

  return NextResponse.json(record, { status: 201 })
}