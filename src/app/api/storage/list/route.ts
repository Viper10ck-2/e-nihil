import { NextRequest, NextResponse } from 'next/server'
import { listFiles } from '@/lib/storage/supabase-storage'

export async function GET(request: NextRequest) {
  const prefix = request.nextUrl.searchParams.get('prefix') || ''
  const search = request.nextUrl.searchParams.get('search') || ''

  // Prevent path traversal
  if (prefix.includes('..')) {
    return NextResponse.json({ files: [] })
  }

  try {
    const { files, error } = await listFiles(prefix, search || undefined)
    if (error) {
      return NextResponse.json({ files: [], error }, { status: 500 })
    }
    return NextResponse.json({ files })
  } catch {
    return NextResponse.json({ files: [] })
  }
}
