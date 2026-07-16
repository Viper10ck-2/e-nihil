import { NextRequest, NextResponse } from 'next/server'
import { validateSession, hashToken } from '@/lib/security'

/**
 * API route authentication middleware.
 * Verifies session token from cookies against database.
 * Also validates CSRF token for mutating requests (POST, PUT, PATCH, DELETE).
 */
export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  // Validate session
  const sessionToken = request.cookies.get('e-nihil-auth')?.value
  const userId = await validateSession(sessionToken || '')

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // CSRF validation for mutating requests
  const method = request.method.toUpperCase()
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfCookie = request.cookies.get('e-nihil-csrf')?.value
    const csrfHeader = request.headers.get('x-csrf-token')

    if (!csrfCookie || !csrfHeader) {
      return NextResponse.json(
        { success: false, error: 'CSRF token missing' },
        { status: 403 }
      )
    }

    // The cookie stores the hash, the header stores the raw token
    // Validate by hashing the header token and comparing
    const headerHash = hashToken(csrfHeader)
    if (headerHash !== csrfCookie) {
      return NextResponse.json(
        { success: false, error: 'Invalid CSRF token' },
        { status: 403 }
      )
    }
  }

  // User is authenticated, proceed to handler
  return handler(request, userId)
}

/**
 * Simple auth check - returns userId if valid session, null otherwise
 */
export async function getAuthUserId(request: NextRequest): Promise<string | null> {
  const sessionToken = request.cookies.get('e-nihil-auth')?.value
  return validateSession(sessionToken || '')
}
