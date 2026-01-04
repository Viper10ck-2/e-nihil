import { supabase } from '@/lib/supabase'
import type { User, UserRole } from '@/types/database'

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

interface SessionData {
  user: AuthUser
  sessionToken: string
  expiresAt: number // timestamp
  createdAt: number
}

// Session timeout in milliseconds (8 hours)
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000

// Generate a random session token
function generateSessionToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function login(nip: string, password: string): Promise<AuthUser | null> {
  console.log('Attempting login for NIP:', nip)
  
  // Query user by NIP
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('nip', nip)
    .eq('is_active', true)
    .single()

  console.log('Query result:', { user, error })

  if (error || !user) {
    console.error('User not found or error:', error)
    return null
  }

  const userData = user as unknown as User
  console.log('User data:', { nip: userData.nip, password_hash: userData.password_hash })

  // Compare password with stored password_hash
  // Note: In production, use bcrypt for proper password hashing
  const isValidPassword = password === userData.password_hash
  console.log('Password check:', { inputPassword: password, storedHash: userData.password_hash, isValid: isValidPassword })

  if (!isValidPassword) {
    console.error('Invalid password')
    return null
  }

  // Create auth user object
  const authUser: AuthUser = {
    id: userData.id,
    nip: userData.nip,
    nama: userData.nama,
    pangkat: userData.pangkat || undefined,
    jabatan: userData.jabatan || undefined,
    instansi: userData.instansi || undefined,
    email: userData.email || undefined,
    roles: userData.roles as UserRole[],
  }

  // Generate session token and set expiry
  const sessionToken = generateSessionToken()
  const now = Date.now()
  const expiresAt = now + SESSION_TIMEOUT

  const sessionData: SessionData = {
    user: authUser,
    sessionToken,
    expiresAt,
    createdAt: now,
  }

  // Store session in localStorage
  if (typeof window !== 'undefined') {
    // Clear any existing session first
    localStorage.removeItem('user')
    localStorage.removeItem('session')
    localStorage.removeItem('currentRole')
    
    localStorage.setItem('session', JSON.stringify(sessionData))
    localStorage.setItem('user', JSON.stringify(authUser))
    
    // Set cookie for middleware auth check (with session token)
    const cookieExpiry = Math.floor((expiresAt - now) / 1000) // in seconds
    document.cookie = `e-nihil-auth=${sessionToken}; path=/; max-age=${cookieExpiry}; SameSite=Strict; Secure`
    document.cookie = `e-nihil-session-expiry=${expiresAt}; path=/; max-age=${cookieExpiry}; SameSite=Strict; Secure`
  }

  // Update last login time in database
  await supabase
    .from('users')
    .update({ updated_at: new Date().toISOString() } as never)
    .eq('id', userData.id)

  return authUser
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user')
    localStorage.removeItem('session')
    localStorage.removeItem('currentRole')
    // Remove auth cookies
    document.cookie = 'e-nihil-auth=; path=/; max-age=0; SameSite=Strict'
    document.cookie = 'e-nihil-session-expiry=; path=/; max-age=0; SameSite=Strict'
  }
}

// Check if session is valid and not expired
export function isSessionValid(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const sessionStr = localStorage.getItem('session')
  if (!sessionStr) {
    return false
  }

  try {
    const session = JSON.parse(sessionStr) as SessionData
    const now = Date.now()
    
    // Check if session has expired
    if (now >= session.expiresAt) {
      // Session expired, clean up
      logout()
      return false
    }
    
    return true
  } catch {
    return false
  }
}

// Get remaining session time in minutes
export function getSessionTimeRemaining(): number {
  if (typeof window === 'undefined') {
    return 0
  }

  const sessionStr = localStorage.getItem('session')
  if (!sessionStr) {
    return 0
  }

  try {
    const session = JSON.parse(sessionStr) as SessionData
    const remaining = session.expiresAt - Date.now()
    return Math.max(0, Math.floor(remaining / 60000)) // in minutes
  } catch {
    return 0
  }
}

// Extend session (refresh timeout)
export function extendSession(): void {
  if (typeof window === 'undefined') {
    return
  }

  const sessionStr = localStorage.getItem('session')
  if (!sessionStr) {
    return
  }

  try {
    const session = JSON.parse(sessionStr) as SessionData
    const now = Date.now()
    
    // Only extend if session is still valid
    if (now < session.expiresAt) {
      session.expiresAt = now + SESSION_TIMEOUT
      localStorage.setItem('session', JSON.stringify(session))
      
      // Update cookie expiry
      const cookieExpiry = Math.floor(SESSION_TIMEOUT / 1000)
      document.cookie = `e-nihil-auth=${session.sessionToken}; path=/; max-age=${cookieExpiry}; SameSite=Strict; Secure`
      document.cookie = `e-nihil-session-expiry=${session.expiresAt}; path=/; max-age=${cookieExpiry}; SameSite=Strict; Secure`
    }
  } catch {
    // Ignore errors
  }
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') {
    return null
  }

  // First check if session is valid
  if (!isSessionValid()) {
    return null
  }

  const userStr = localStorage.getItem('user')
  if (!userStr) {
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

  // Default to first role
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
  const { data, error } = await supabase
    .from('users')
    .insert({
      nip: userData.nip,
      nama: userData.nama,
      pangkat: userData.pangkat || null,
      jabatan: userData.jabatan || null,
      instansi: userData.instansi || 'Inspektorat Daerah Kabupaten Bintan',
      email: userData.email || null,
      password_hash: userData.password,
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
  const { error } = await supabase
    .from('users')
    .update({ password_hash: newPassword } as never)
    .eq('id', userId)

  if (error) {
    console.error('Error updating password:', error)
    throw error
  }
}
