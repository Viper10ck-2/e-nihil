import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const protectedRoutes = ['/dashboard']

// Routes that should redirect to dashboard if already logged in
const authRoutes = ['/login']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if user is logged in by looking for session token in cookies
  const sessionToken = request.cookies.get('e-nihil-auth')
  const sessionExpiry = request.cookies.get('e-nihil-session-expiry')

  // Check if session is valid and not expired
  let isValidSession = false
  if (sessionToken && sessionExpiry) {
    const expiryTime = parseInt(sessionExpiry.value, 10)
    isValidSession = !isNaN(expiryTime) && Date.now() < expiryTime
  }

  // Check protected routes
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  // If accessing protected route without valid session, redirect to login
  if (isProtectedRoute && !isValidSession) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    
    // Clear expired cookies
    const response = NextResponse.redirect(loginUrl)
    response.cookies.delete('e-nihil-auth')
    response.cookies.delete('e-nihil-session-expiry')
    return response
  }

  // If accessing auth route while logged in with valid session, redirect to dashboard
  if (isAuthRoute && isValidSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Add security headers
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Prevent caching of protected pages
  if (isProtectedRoute) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.jpg$|.*\\.ico$).*)',
  ],
}
