import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { User } from 'lucide-react'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')
  const userId = searchParams.get('userId')
  const module = searchParams.get('module')
  const action = searchParams.get('action')

  const where: any = {}
  if (userId) where.userId = parseInt(userId)
  if (module) where.module = module
  if (action) where.action = action

  const [data, total] = await Promise.all([
    prisma.activityTrail.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            Firstname: true,
            Lastname: true,
          },
        },
      },
    }),
    prisma.activityTrail.count({ where }),
  ])

  return NextResponse.json({ data, total, page, pageSize })
}
