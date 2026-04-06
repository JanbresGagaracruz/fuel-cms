import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id   = parseInt((await params).id)
  const body = await req.json()

  const updated = await prisma.lst_ContractSignatories.update({
    where: { SignatoryID: id },
    data: {
      FuelContractID:  body.FuelContractID ? parseInt(body.FuelContractID) : null,
      Title:           body.Title,
      PreparedByName:  body.PreparedByName,
      PreparedByPos:   body.PreparedByPos,
      ReviewedByName:  body.ReviewedByName,
      ReviewedByPos:   body.ReviewedByPos,
      NotedByName:     body.NotedByName,
      NotedByPos:      body.NotedByPos,
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = parseInt((await params).id)
  await prisma.lst_ContractSignatories.delete({ where: { SignatoryID: id } })
  return NextResponse.json({ success: true })
}