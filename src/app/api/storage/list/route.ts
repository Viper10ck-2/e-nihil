import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const STORAGE_PATH = process.env.LOCAL_STORAGE_PATH || '/opt/e-nihil/uploads'

export async function GET(request: NextRequest) {
  const prefix = request.nextUrl.searchParams.get('prefix') || ''
  const search = request.nextUrl.searchParams.get('search') || ''

  // Prevent path traversal
  if (prefix.includes('..')) {
    return NextResponse.json({ files: [] })
  }

  try {
    const dirPath = path.join(STORAGE_PATH, prefix)
    if (!fs.existsSync(dirPath)) {
      return NextResponse.json({ files: [] })
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    const files = entries
      .filter(e => e.isFile())
      .filter(e => !search || e.name.includes(search))
      .map(e => {
        const stat = fs.statSync(path.join(dirPath, e.name))
        return {
          name: e.name,
          created_at: stat.birthtime.toISOString(),
        }
      })

    return NextResponse.json({ files })
  } catch {
    return NextResponse.json({ files: [] })
  }
}
