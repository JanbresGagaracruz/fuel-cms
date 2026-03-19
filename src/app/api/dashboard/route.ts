import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { addDays } from 'date-fns'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const in90Days = addDays(now, 90)

  const [totalContracts, activeContracts, expiringSoon, totalPackages, volumeAgg, recentActivity] =
    await Promise.all([
      prisma.lst_FuelContracts.count(),
      prisma.lst_FuelContracts.count({ where: { isActive: true } }),
      prisma.lst_FuelContracts.count({
        where: {
          isActive: true,
          ExpiredDate: { gte: now, lte: in90Days },
        },
      }),
      prisma.lst_FuelContractPackages.count(),
      prisma.lst_FuelContractDetail.aggregate({
        _sum: { VolumeOrdered: true, ContractPrice: true },
      }),
      prisma.activityTrail.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ])

  // Monthly contract counts for chart (last 6 months)
  const monthlyData = await prisma.$queryRaw<{ month: string; count: number }[]>`
    SELECT 
      FORMAT(date_entry, 'MMM yyyy') as month,
      COUNT(*) as count
    FROM lst_FuelContracts
    WHERE date_entry >= DATEADD(MONTH, -6, GETDATE())
    GROUP BY FORMAT(date_entry, 'MMM yyyy'), YEAR(date_entry), MONTH(date_entry)
    ORDER BY YEAR(date_entry), MONTH(date_entry)
  `.catch(() => [])

  // Top contracts by package count
  const topContracts = await prisma.lst_FuelContracts.findMany({
    take: 5,
    orderBy: { date_entry: 'desc' },
    include: {
      _count: { select: { packages: true, details: true } },
    },
  })

  return NextResponse.json({
    stats: {
      totalContracts,
      activeContracts,
      expiringSoon,
      totalPackages,
      totalVolume: Number(volumeAgg._sum.VolumeOrdered ?? 0),
      totalContractValue: Number(volumeAgg._sum.ContractPrice ?? 0),
    },
    recentActivity,
    monthlyData,
    topContracts,
  })
}
