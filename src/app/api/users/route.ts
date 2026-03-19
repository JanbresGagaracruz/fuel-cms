import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Only admins can view user list
  if ((session.user.accessLevel ?? 0) < 3) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '15')
  const search = searchParams.get('search') || ''

  const where: any = {}
  if (search) {
    where.OR = [
      { UsrNam: { contains: search } },
      { DisplayName: { contains: search } },
      { Email: { contains: search } },
      { Firstname: { contains: search } },
      { Lastname: { contains: search } },
    ]
  }

  const [data, total] = await Promise.all([
    prisma.lst_User.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { dtEntered: 'desc' },
      select: {
        UserID: true,
        UsrNam: true,
        DisplayName: true,
        Firstname: true,
        Lastname: true,
        Email: true,
        PositionName: true,
        PlantID: true,
        dtEntered: true,
        enable: true,
        access_level: true,
      },
    }),
    prisma.lst_User.count({ where }),
  ])

  return NextResponse.json({ data, total, page, pageSize })
}
