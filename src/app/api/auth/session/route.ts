import { NextRequest, NextResponse } from 'next/server'
import { validateSession, SECURE_COOKIE_OPTIONS } from '@/lib/security'
import { createServerClient } from '@/lib/supabase'
import type { UserRole } from '@/types/database'

// Session timeout in milliseconds (8 hours)
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get('e-nihil-auth')?.value
  const sessionExpiry = request.cookies.get('e-nihil-session-expiry')?.value

  // Quick expiry check first
  if (sessionExpiry) {
    const expiryTime = parseInt(sessionExpiry, 10)
    if (!isNaN(expiryTime) && Date.now() >= expiryTime) {
      const response = NextResponse.json({ valid: false })
      response.cookies.delete('e-nihil-auth')
      response.cookies.delete('e-nihil-session-expiry')
      response.cookies.delete('e-nihil-session-valid')
      response.cookies.delete('e-nihil-csrf')
      return response
    }
  }

  // Validasi session ke database
  const userId = await validateSession(sessionToken || '')

  if (!userId) {
    const response = NextResponse.json({ valid: false })
    response.cookies.delete('e-nihil-auth')
    response.cookies.delete('e-nihil-session-expiry')
    response.cookies.delete('e-nihil-session-valid')
    response.cookies.delete('e-nihil-csrf')
    return response
  }

  // Ambil data user dari database
  const supabase = createServerClient()
  const { data: user } = await supabase
    .from('users')
    .select('id, nip, nama, pangkat, jabatan, instansi, email, roles')
    .eq('id', userId)
    .single()

  return NextResponse.json({
    valid: true,
    expiresAt: sessionExpiry ? parseInt(sessionExpiry, 10) : Date.now() + SESSION_TIMEOUT,
    remainingMinutes: sessionExpiry 
      ? Math.max(0, Math.floor((parseInt(sessionExpiry, 10) - Date.now()) / 60000))
      : 480,
    user: user || null,
  })
}
