// import { NextRequest, NextResponse } from 'next/server'
// import { getServerSession } from 'next-auth'
// import { authOptions } from '@/lib/auth'
// import { prisma } from '@/lib/prisma'

// export async function GET(req: NextRequest) {
//   const session = await getServerSession(authOptions)
//   if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

//   // Only admins can view user list
//   if ((session.user.accessLevel ?? 0) < 3) {
//     return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
//   }

//   const { searchParams } = new URL(req.url)
//   const page = parseInt(searchParams.get('page') || '1')
//   const pageSize = parseInt(searchParams.get('pageSize') || '15')
//   const search = searchParams.get('search') || ''

//   const where: any = {}
//   if (search) {
//     where.OR = [
//       { UsrNam: { contains: search } },
//       { DisplayName: { contains: search } },
//       { Email: { contains: search } },
//       { Firstname: { contains: search } },
//       { Lastname: { contains: search } },
//     ]
//   }

//   const [data, total] = await Promise.all([
//     prisma.lst_User.findMany({
//       where,
//       skip: (page - 1) * pageSize,
//       take: pageSize,
//       orderBy: { dtEntered: 'desc' },
//       select: {
//         UserID: true,
//         UsrNam: true,
//         DisplayName: true,
//         Firstname: true,
//         Lastname: true,
//         Email: true,
//         PositionName: true,
//         PlantID: true,
//         dtEntered: true,
//         enable: true,
//         access_level: true,
//       },
//     }),
//     prisma.lst_User.count({ where }),
//   ])

//   return NextResponse.json({ data, total, page, pageSize })
// }
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageUsers } from '@/lib/permissions'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page     = parseInt(searchParams.get('page')     || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '15')
  const search   = searchParams.get('search') || ''

  const where: any = search ? {
    OR: [
      { UsrNam:      { contains: search } },
      { DisplayName: { contains: search } },
      { Email:       { contains: search } },
    ]
  } : {}

  const [data, total] = await Promise.all([
    prisma.lst_User.findMany({
      where,
      skip:    (page - 1) * pageSize,
      take:    pageSize,
      orderBy: { dtEntered: 'desc' },
    }),
    prisma.lst_User.count({ where }),
  ])

  return NextResponse.json({ data, total, page, pageSize })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canManageUsers(session.user.accessLevel ?? 1))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const {
    UsrNam, password, DisplayName, Firstname, Lastname,
    Email, PositionName, access_level, PlantID,
  } = body

  if (!UsrNam || !password)
    return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })

  // Check duplicate username
  const existing = await prisma.lst_User.findFirst({ where: { UsrNam } })
  if (existing)
    return NextResponse.json({ error: 'Username already exists' }, { status: 409 })

  const hashed = await bcrypt.hash(password, 12)

  const user = await prisma.lst_User.create({
    data: {
      UsrNam,
      password:     hashed,
      Psswrd:       hashed,
      DisplayName:  DisplayName  || `${Firstname || ''} ${Lastname || ''}`.trim() || UsrNam,
      Firstname:    Firstname    || null,
      Lastname:     Lastname     || null,
      Email:        Email        || null,
      PositionName: PositionName || null,
      access_level: access_level ? parseInt(access_level) : 1,
      PlantID:      PlantID      ? parseInt(PlantID)       : null,
      enable:       true,
    },
  })

  return NextResponse.json({
    UserID:      user.UserID,
    UsrNam:      user.UsrNam,
    DisplayName: user.DisplayName,
    Email:       user.Email,
    access_level: user.access_level,
  }, { status: 201 })
}