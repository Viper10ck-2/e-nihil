import { NextRequest, NextResponse } from 'next/server'
import { saveFile } from '@/lib/storage/supabase-storage'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const filePath = formData.get('path') as string | null

    if (!file || !filePath) {
      return NextResponse.json({ error: 'File and path are required' }, { status: 400 })
    }

    // Prevent path traversal
    if (filePath.includes('..')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await saveFile(filePath, buffer, file.type || 'application/pdf')

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, path: filePath })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
