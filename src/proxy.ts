import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { validateSession } from '@/lib/security'

// Routes that require authentication
const protectedRoutes = ['/dashboard']

// Routes that should redirect to dashboard if already logged in
const authRoutes = ['/login']

// Content Security Policy
const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ')

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Note: DB session validation is async, but proxy() must be sync in Next.js 16.
  // For production, use the /api/auth/session endpoint for full DB validation.
  // Here we do a fast cookie-expiry check as first line of defense.
  const sessionToken = request.cookies.get('e-nihil-auth')?.value
  const sessionExpiry = request.cookies.get('e-nihil-session-expiry')?.value

  let isValidSession = false
  if (sessionToken && sessionExpiry) {
    const expiryTime = parseInt(sessionExpiry, 10)
    isValidSession = !isNaN(expiryTime) && Date.now() < expiryTime
  }

  // Protected route without valid session → redirect to login
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  if (isProtectedRoute && !isValidSession) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    
    const response = NextResponse.redirect(loginUrl)
    response.cookies.delete('e-nihil-auth')
    response.cookies.delete('e-nihil-session-expiry')
    response.cookies.delete('e-nihil-session-valid')
    response.cookies.delete('e-nihil-csrf')
    return response
  }

  // Auth route with valid session → redirect to dashboard
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
  if (isAuthRoute && isValidSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Apply security headers to all responses
  const response = NextResponse.next()

  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  response.headers.set('Content-Security-Policy', CSP_DIRECTIVES)

  // Prevent caching of protected pages
  if (isProtectedRoute) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, private')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.jpg$|.*\\.ico$|.*\\.mp4$).*)',
  ],
}
