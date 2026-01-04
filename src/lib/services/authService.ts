import { supabase } from '@/lib/supabase'
import type { User, UserRole } from '@/types/database'
import { hashPassword } from '@/lib/security'

export type { User }

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
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nip, password }),
      credentials: 'include', // Important for cookies
    })

    const result = await response.json()

    if (!result.success) {
      console.error('Login failed:', result.error)
      return null
    }

    // Store user data in localStorage (non-sensitive data only)
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(result.user))
      localStorage.setItem('sessionExpiresAt', result.expiresAt.toString())
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
    return role as UserRole
  }

  const user = getCurrentUser()
  if (user && user.roles.length > 0) {
    return user.roles[0]
  }

  return null
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

// User Management Functions
export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error)
    throw error
  }

  return (data as unknown as User[]) || []
}

export async function createUser(userData: {
  nip: string
  nama: string
  password: string
  pangkat?: string
  jabatan?: string
  instansi?: string
  email?: string
  roles: UserRole[]
}): Promise<User> {
  // Hash password before storing
  const hashedPassword = await hashPassword(userData.password)

  const { data, error } = await supabase
    .from('users')
    .insert({
      nip: userData.nip,
      nama: userData.nama,
      pangkat: userData.pangkat || null,
      jabatan: userData.jabatan || null,
      instansi: userData.instansi || 'Inspektorat Daerah Kabupaten Bintan',
      email: userData.email || null,
      password_hash: hashedPassword,
      roles: userData.roles,
      is_active: true,
    } as never)
    .select()
    .single()

  if (error) {
    console.error('Error creating user:', error)
    throw error
  }

  return data as User
}

export async function updateUser(
  userId: string,
  userData: {
    nama: string
    pangkat?: string
    jabatan?: string
    instansi?: string
    email?: string
    roles: UserRole[]
  }
): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .update({
      nama: userData.nama,
      pangkat: userData.pangkat || null,
      jabatan: userData.jabatan || null,
      instansi: userData.instansi || null,
      email: userData.email || null,
      roles: userData.roles,
    } as never)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating user:', error)
    throw error
  }

  return data as User
}

export async function toggleUserActive(userId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ is_active: isActive } as never)
    .eq('id', userId)

  if (error) {
    console.error('Error toggling user status:', error)
    throw error
  }
}

export async function updateUserPassword(userId: string, newPassword: string): Promise<void> {
  // Hash password before storing
  const hashedPassword = await hashPassword(newPassword)

  const { error } = await supabase
    .from('users')
    .update({ password_hash: hashedPassword } as never)
    .eq('id', userId)

  if (error) {
    console.error('Error updating password:', error)
    throw error
  }
}
