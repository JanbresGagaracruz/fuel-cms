import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await prisma.lst_Plant.findMany({
    where:   { isActive: true },
    orderBy: { PlantName: 'asc' },
    select: {
      PlantID:   true,
      PlantName: true,
      ElecCoop:  true,
      isActive:  true,
    },
  })

  return NextResponse.json(data)
}
