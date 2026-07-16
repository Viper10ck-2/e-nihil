import type { User, UserRole } from '@/types/database'
export type { User }
export type { UserRole }

export interface AuthUser {
  id: string
  nip: string
  nama: string
  pangkat?: string
  jabatan?: string
  instansi?: string
  email?: string
  roles: UserRole[]
}

// Session timeout in milliseconds (8 hours)
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000

/**
 * Login using secure server-side API
 * Cookies are set by the server with HttpOnly flag
 */
export async function login(nip: string, password: string): Promise<AuthUser | null> {
  try {
    console.log('[authService] Attempting login for NIP:', nip)
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nip, password }),
      credentials: 'include', // Important for cookies
    })

    const result = await response.json()
    console.log('[authService] Login response:', result.success ? 'success' : 'failed')

    if (!result.success) {
      console.error('Login failed:', result.error)
      return null
    }

    // Store user data and CSRF token in localStorage (non-sensitive data only)
    if (typeof window !== 'undefined') {
      console.log('[authService] Storing user data to localStorage')
      console.log('[authService] User:', result.user?.nama)
      console.log('[authService] ExpiresAt:', result.expiresAt)
      
      localStorage.setItem('user', JSON.stringify(result.user))
      localStorage.setItem('sessionExpiresAt', result.expiresAt.toString())
      
      // Store CSRF token for mutating requests
      if (result.csrfToken) {
        localStorage.setItem('csrfToken', result.csrfToken)
      }
      
      // Verify storage
      const storedUser = localStorage.getItem('user')
      const storedExpiry = localStorage.getItem('sessionExpiresAt')
      console.log('[authService] Verified storage - user:', storedUser ? 'exists' : 'missing')
      console.log('[authService] Verified storage - expiry:', storedExpiry)
    }

    return result.user as AuthUser
  } catch (error) {
    console.error('Login error:', error instanceof Error ? error.message : 'Unknown error')
    return null
  }
}

/**
 * Logout using secure server-side API
 */
export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
  } catch (error) {
    console.error('Logout error:', error)
  }

  // Clear local storage
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user')
    localStorage.removeItem('sessionExpiresAt')
    localStorage.removeItem('currentRole')
    localStorage.removeItem('csrfToken')
  }
}

/**
 * Check if session is valid based on localStorage expiry
 * Cookie validation is done server-side for security
 */
export function isSessionValid(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  // Check local expiry time
  const expiryStr = localStorage.getItem('sessionExpiresAt')
  if (!expiryStr) {
    return false
  }

  const expiryTime = parseInt(expiryStr, 10)
  if (isNaN(expiryTime)) {
    return false
  }

  // Check if session has expired
  return Date.now() < expiryTime
}

/**
 * Get remaining session time in minutes
 */
export function getSessionTimeRemaining(): number {
  if (typeof window === 'undefined') {
    return 0
  }

  const expiryStr = localStorage.getItem('sessionExpiresAt')
  if (!expiryStr) {
    return 0
  }

  const expiryTime = parseInt(expiryStr, 10)
  if (isNaN(expiryTime)) {
    return 0
  }

  const remaining = expiryTime - Date.now()
  return Math.max(0, Math.floor(remaining / 60000))
}

/**
 * Extend session via server API
 */
export async function extendSession(): Promise<void> {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      credentials: 'include',
    })

    const result = await response.json()

    if (result.success) {
      localStorage.setItem('sessionExpiresAt', result.expiresAt.toString())
    }
  } catch (error) {
    console.error('Session extend error:', error)
  }
}

/**
 * Get current user from localStorage
 * Returns user data if exists and session is valid
 */
export function getCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') {
    return null
  }

  const userStr = localStorage.getItem('user')
  if (!userStr) {
    return null
  }

  // Check if session is still valid
  if (!isSessionValid()) {
    // Clear stale data
    localStorage.removeItem('user')
    localStorage.removeItem('sessionExpiresAt')
    localStorage.removeItem('currentRole')
    return null
  }

  try {
    return JSON.parse(userStr) as AuthUser
  } catch {
    return null
  }
}

export function getCurrentRole(): UserRole | null {
  if (typeof window === 'undefined') {
    return null
  }

  const role = localStorage.getItem('currentRole')
  if (role) {
    return role as unknown as UserRole
  }

  const user = getCurrentUser()
  if (user && user.roles.length > 0) {
    return user.roles[0]
  }

  return null
}

/**
 * Get CSRF token from localStorage
 */
export function getCSRFToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('csrfToken')
}

/**
 * Fetch wrapper that includes CSRF token for mutating requests
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers)
  
  // Add CSRF token for mutating requests
  const method = (options.method || 'GET').toUpperCase()
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const csrfToken = getCSRFToken()
    if (csrfToken) {
      headers.set('x-csrf-token', csrfToken)
    }
  }
  
  if (!headers.has('Content-Type') && method !== 'GET') {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  })
}

export function setCurrentRole(role: UserRole): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('currentRole', role)
  }
}

export function hasRole(role: UserRole): boolean {
  const user = getCurrentUser()
  return user?.roles.includes(role) ?? false
}

export function isAuthenticated(): boolean {
  return isSessionValid() && getCurrentUser() !== null
}
