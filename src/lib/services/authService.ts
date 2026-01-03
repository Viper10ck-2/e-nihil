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

  // Store session
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

  // Store in localStorage and set cookie for middleware
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(authUser))
    // Set cookie for middleware auth check (expires in 7 days)
    document.cookie = `e-nihil-auth=${authUser.id}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`
  }

  return authUser
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user')
    localStorage.removeItem('currentRole')
    // Remove auth cookie
    document.cookie = 'e-nihil-auth=; path=/; max-age=0; SameSite=Strict'
  }
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') {
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
  return getCurrentUser() !== null
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
