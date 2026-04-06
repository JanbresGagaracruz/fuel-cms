import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canDelete } from '@/lib/permissions'
import { unlink } from 'fs/promises'
import { join } from 'path'

// GET — redirect to the static file URL (no need to stream through API)
export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { docId } = await params
  const doc = await prisma.lst_ContractDocuments.findUnique({
    where: { DocumentID: parseInt(docId) },
  })

  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Return metadata + public URL — client opens doc.FilePath directly
  return NextResponse.json(doc)
}

// DELETE — remove DB record and the file from disk
export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!canDelete(session.user.accessLevel ?? 1))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, docId } = await params
  const doc = await prisma.lst_ContractDocuments.findUnique({
    where: { DocumentID: parseInt(docId) },
  })
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Delete file from disk (ignore error if already gone)
  try {
    const fullPath = join(process.cwd(), 'public', 'uploads', 'contracts', id, doc.StoredName)
    await unlink(fullPath)
  } catch { /* file already removed — continue */ }

  await prisma.lst_ContractDocuments.delete({
    where: { DocumentID: parseInt(docId) },
  })

  return NextResponse.json({ success: true })
}
