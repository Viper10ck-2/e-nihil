import { NextRequest, NextResponse } from 'next/server'
import { readFile, getPublicUrl } from '@/lib/storage/supabase-storage'

export async function GET(request: NextRequest) {
  const filePath = request.nextUrl.searchParams.get('path')
  if (!filePath) {
    return NextResponse.json({ error: 'Path is required' }, { status: 400 })
  }

  // Prevent path traversal
  if (filePath.includes('..')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  // Redirect ke Supabase public URL untuk efisiensi (tidak perlu proxy)
  const publicUrl = getPublicUrl(filePath)
  if (publicUrl) {
    return NextResponse.redirect(publicUrl, { status: 302 })
  }

  // Fallback: baca file dari Supabase Storage dan stream
  const { data, mimeType, error } = await readFile(filePath)
  if (error || !data) {
    return NextResponse.json({ error: error || 'File not found' }, { status: 404 })
  }

  return new NextResponse(new Uint8Array(data), {
    headers: {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=31536000',
    },
  })
}
