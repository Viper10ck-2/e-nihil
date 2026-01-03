import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const protectedRoutes = ['/dashboard']

// Routes that should redirect to dashboard if already logged in
const authRoutes = ['/login']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if user is logged in by looking for user data in cookies
  // Note: We use a simple cookie check since we're using localStorage for auth
  // In production, use proper session tokens/JWT
  const userCookie = request.cookies.get('e-nihil-auth')

  // Check protected routes
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  // If accessing protected route without auth, redirect to login
  if (isProtectedRoute && !userCookie) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If accessing auth route while logged in, redirect to dashboard
  if (isAuthRoute && userCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Add security headers
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')

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
