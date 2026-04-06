import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canCreate } from '@/lib/permissions'
import { writeFile, mkdir } from 'fs/promises'
import { join, extname } from 'path'
import { randomUUID } from 'crypto'

// Upload directory — lives inside /public so Next.js serves it statically
const UPLOAD_ROOT = join(process.cwd(), 'public', 'uploads', 'contracts')
const MAX_BYTES   = 50 * 1024 * 1024  // 50 MB

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const contractId = parseInt((await params).id)

  const docs = await prisma.lst_ContractDocuments.findMany({
    where:   { FuelContractID: contractId },
    orderBy: { UploadedAt: 'desc' },
    select: {
      DocumentID:     true,
      FuelContractID: true,
      FileName:       true,
      StoredName:     true,
      FileType:       true,
      FileSizeBytes:  true,
      FilePath:       true,
      UploadedBy:     true,
      UploadedAt:     true,
    },
  })

  return NextResponse.json(docs)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canCreate(session.user.accessLevel ?? 1))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const contractId = parseInt((await params).id)

  // Parse multipart form data
  const formData = await req.formData()
  const file     = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: `File exceeds 50 MB limit` }, { status: 413 })
  }

  // Build a unique stored name to avoid collisions
  const ext        = extname(file.name) || ''
  const storedName = `${randomUUID()}${ext}`
  const dir        = join(UPLOAD_ROOT, String(contractId))
  const fullPath   = join(dir, storedName)

  // Ensure directory exists
  await mkdir(dir, { recursive: true })

  // Write file to disk
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(fullPath, buffer)

  // Relative URL path for serving
  const filePath = `/uploads/contracts/${contractId}/${storedName}`

  const doc = await prisma.lst_ContractDocuments.create({
    data: {
      FuelContractID: contractId,
      FileName:       file.name,
      StoredName:     storedName,
      FileType:       file.type || 'application/octet-stream',
      FileSizeBytes:  file.size,
      FilePath:       filePath,
      UploadedBy:     parseInt(session.user.id),
    },
  })

  return NextResponse.json(doc, { status: 201 })
}
