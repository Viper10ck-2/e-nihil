import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })

  // Clear all auth cookies
  response.cookies.delete('e-nihil-auth')
  response.cookies.delete('e-nihil-session-expiry')
  response.cookies.delete('e-nihil-session-valid')

  return response
}
