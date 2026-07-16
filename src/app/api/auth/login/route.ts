import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { verifyPassword, generateCSRFTokenPair, createSession, checkRateLimit, getClientIP, SECURE_COOKIE_OPTIONS, hashToken } from '@/lib/security'
import type { User, UserRole } from '@/types/database'

// Session timeout in milliseconds (8 hours)
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 5 attempts per minute per IP
    const clientIP = getClientIP(request.headers)
    const rateLimit = checkRateLimit(`login:${clientIP}`, 5, 60000)
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Terlalu banyak percobaan login. Coba lagi dalam beberapa menit.' },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(rateLimit.resetIn / 1000).toString(),
            'X-RateLimit-Remaining': '0',
          }
        }
      )
    }

    const body = await request.json()
    const { nip, password } = body

    // Validate input
    if (!nip || !password) {
      return NextResponse.json(
        { success: false, error: 'NIP dan password wajib diisi' },
        { status: 400 }
      )
    }

    // Use server client for secure database access
    const supabase = createServerClient()

    // Query user by NIP
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('nip', nip)
      .eq('is_active', true)
      .single()

    if (error || !user) {
      // Don't reveal if user exists or not
      return NextResponse.json(
        { success: false, error: 'NIP atau password salah' },
        { status: 401 }
      )
    }

    const userData = user as unknown as User

    // Verify password (supports both hashed and legacy plain text)
    const isValidPassword = await verifyPassword(password, userData.password_hash)

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'NIP atau password salah' },
        { status: 401 }
      )
    }

    // Generate secure session and store in database
    const { sessionToken, expiresAt } = await createSession(
      userData.id,
      clientIP,
      request.headers.get('user-agent') || undefined
    )

    // Generate CSRF token pair
    const csrf = generateCSRFTokenPair()

    // Create auth user object (without sensitive data)
    const authUser = {
      id: userData.id,
      nip: userData.nip,
      nama: userData.nama,
      pangkat: userData.pangkat || undefined,
      jabatan: userData.jabatan || undefined,
      instansi: userData.instansi || undefined,
      email: userData.email || undefined,
      roles: userData.roles as UserRole[],
    }

    // Update last login time
    await supabase
      .from('users')
      .update({ updated_at: new Date().toISOString() } as never)
      .eq('id', userData.id)

    // Create response with secure cookies
    const response = NextResponse.json({
      success: true,
      user: authUser,
      expiresAt,
      csrfToken: csrf.token,
    })

    // Set HttpOnly cookies (not accessible via JavaScript)
    const cookieMaxAge = Math.floor(SESSION_TIMEOUT / 1000)
    
    response.cookies.set('e-nihil-auth', sessionToken, {
      ...SECURE_COOKIE_OPTIONS,
      maxAge: cookieMaxAge,
    })
    
    response.cookies.set('e-nihil-session-expiry', expiresAt.toString(), {
      ...SECURE_COOKIE_OPTIONS,
      maxAge: cookieMaxAge,
    })

    // Store CSRF token hash for server-side validation
    response.cookies.set('e-nihil-csrf', csrf.hash, {
      ...SECURE_COOKIE_OPTIONS,
      maxAge: cookieMaxAge,
    })

    // Client-readable session flag
    response.cookies.set('e-nihil-session-valid', 'true', {
      ...SECURE_COOKIE_OPTIONS,
      httpOnly: false,
      maxAge: cookieMaxAge,
    })

    return response
  } catch (error) {
    console.error('Login error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
