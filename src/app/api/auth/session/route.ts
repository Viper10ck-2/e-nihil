import { NextRequest, NextResponse } from 'next/server'
import { SECURE_COOKIE_OPTIONS } from '@/lib/security'

// Session timeout in milliseconds (8 hours)
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get('e-nihil-auth')
  const sessionExpiry = request.cookies.get('e-nihil-session-expiry')

  if (!sessionToken || !sessionExpiry) {
    return NextResponse.json({ valid: false })
  }

  const expiryTime = parseInt(sessionExpiry.value, 10)
  const now = Date.now()

  if (isNaN(expiryTime) || now >= expiryTime) {
    // Session expired, clear cookies
    const response = NextResponse.json({ valid: false })
    response.cookies.delete('e-nihil-auth')
    response.cookies.delete('e-nihil-session-expiry')
    response.cookies.delete('e-nihil-session-valid')
    return response
  }

  return NextResponse.json({
    valid: true,
    expiresAt: expiryTime,
    remainingMinutes: Math.floor((expiryTime - now) / 60000),
  })
}

// Extend session
export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get('e-nihil-auth')
  const sessionExpiry = request.cookies.get('e-nihil-session-expiry')

  if (!sessionToken || !sessionExpiry) {
    return NextResponse.json({ success: false, error: 'No session' }, { status: 401 })
  }

  const expiryTime = parseInt(sessionExpiry.value, 10)
  const now = Date.now()

  if (isNaN(expiryTime) || now >= expiryTime) {
    return NextResponse.json({ success: false, error: 'Session expired' }, { status: 401 })
  }

  // Extend session
  const newExpiryTime = now + SESSION_TIMEOUT
  const cookieMaxAge = Math.floor(SESSION_TIMEOUT / 1000)

  const response = NextResponse.json({
    success: true,
    expiresAt: newExpiryTime,
  })

  response.cookies.set('e-nihil-session-expiry', newExpiryTime.toString(), {
    ...SECURE_COOKIE_OPTIONS,
    maxAge: cookieMaxAge,
  })

  response.cookies.set('e-nihil-session-valid', 'true', {
    ...SECURE_COOKIE_OPTIONS,
    httpOnly: false,
    maxAge: cookieMaxAge,
  })

  return response
}
