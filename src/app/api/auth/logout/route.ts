import { NextRequest, NextResponse } from 'next/server'
import { revokeSession } from '@/lib/security'

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get('e-nihil-auth')?.value

  // Revoke session in database if it exists
  if (sessionToken) {
    await revokeSession(sessionToken)
  }

  const response = NextResponse.json({ success: true })

  // Clear all auth cookies
  response.cookies.delete('e-nihil-auth')
  response.cookies.delete('e-nihil-session-expiry')
  response.cookies.delete('e-nihil-session-valid')
  response.cookies.delete('e-nihil-csrf')

  return response
}
