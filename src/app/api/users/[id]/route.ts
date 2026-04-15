import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageUsers } from '@/lib/permissions'
import bcrypt from 'bcryptjs'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canManageUsers(session.user.accessLevel ?? 1))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const userId = parseInt((await params).id)
  const body   = await req.json()
  const data: any = {}

  // Reset password
  if (body.newPassword) {
    if (body.newPassword.length < 6)
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    const hashed   = await bcrypt.hash(body.newPassword, 12)
    data.password  = hashed
    data.Psswrd    = hashed
  }

  // Toggle enabled/disabled
  if (body.enable !== undefined) data.enable = body.enable

  // Update access level
  if (body.access_level !== undefined) data.access_level = parseInt(body.access_level)

  const updated = await prisma.lst_User.update({
    where: { UserID: userId },
    data,
  })

  return NextResponse.json({
    UserID:       updated.UserID,
    UsrNam:       updated.UsrNam,
    DisplayName:  updated.DisplayName,
    enable:       updated.enable,
    access_level: updated.access_level,
  })
}