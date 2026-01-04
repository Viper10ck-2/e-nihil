'use client'

import { createContext, useContext, useEffect, useLayoutEffect, useState, ReactNode, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { UserRole } from '@/types/database'
import {
  AuthUser,
  setCurrentRole as setStoredRole,
  logout as authLogout,
} from '@/lib/services/authService'
import { toast } from 'sonner'

interface AuthContextType {
  user: AuthUser | null
  currentRole: UserRole | null
  isLoading: boolean
  sessionTimeRemaining: number
  setCurrentRole: (role: UserRole) => void
  logout: () => void
  refreshAuth: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper to get user from localStorage
function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  
  try {
    const userStr = localStorage.getItem('user')
    const expiryStr = localStorage.getItem('sessionExpiresAt')
    
    if (!userStr || !expiryStr) return null
    
    const expiryTime = parseInt(expiryStr, 10)
    if (isNaN(expiryTime) || Date.now() >= expiryTime) {
      // Session expired, clear data
      localStorage.removeItem('user')
      localStorage.removeItem('sessionExpiresAt')
      localStorage.removeItem('currentRole')
      return null
    }
    
    return JSON.parse(userStr) as AuthUser
  } catch {
    return null
  }
}

function getStoredRole(): UserRole | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('currentRole') as UserRole | null
}

function getTimeRemaining(): number {
  if (typeof window === 'undefined') return 0
  
  const expiryStr = localStorage.getItem('sessionExpiresAt')
  if (!expiryStr) return 0
  
  const expiryTime = parseInt(expiryStr, 10)
  if (isNaN(expiryTime)) return 0
  
  return Math.max(0, Math.floor((expiryTime - Date.now()) / 60000))
}

// Use this for SSR-safe useLayoutEffect
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  
  // Start with null/loading state - will be populated after mount
  const [user, setUser] = useState<AuthUser | null>(null)
  const [currentRole, setCurrentRoleState] = useState<UserRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(0)

  const refreshAuth = useCallback(() => {
    const storedUser = getStoredUser()
    const storedRole = getStoredRole()
    const remaining = getTimeRemaining()

    console.log('[AuthContext] refreshAuth - user:', storedUser?.nama || 'none')

    if (storedUser) {
      setUser(storedUser)
      setCurrentRoleState(storedRole || storedUser.roles[0] || null)
      setSessionTimeRemaining(remaining)
    } else {
      setUser(null)
      setCurrentRoleState(null)
      setSessionTimeRemaining(0)
    }
  }, [])

  // Initialize auth state after mount - use layout effect for earlier execution
  useIsomorphicLayoutEffect(() => {
    const storedUser = getStoredUser()
    const storedRole = getStoredRole()
    const remaining = getTimeRemaining()
    
    console.log('[AuthContext] Init - user:', storedUser?.nama || 'none', 'remaining:', remaining)

    if (storedUser) {
      setUser(storedUser)
      setCurrentRoleState(storedRole || storedUser.roles[0] || null)
      setSessionTimeRemaining(remaining)
    }
    
    setIsLoading(false)
  }, [])

  // Session monitoring - check every minute
  useEffect(() => {
    if (isLoading) return // Don't start monitoring until loaded

    const checkSession = () => {
      const storedUser = getStoredUser()
      
      if (!storedUser && user) {
        // Session expired
        toast.error('Sesi Anda telah berakhir. Silakan login kembali.')
        setUser(null)
        setCurrentRoleState(null)
        setSessionTimeRemaining(0)
        router.push('/login')
        return
      }

      const remaining = getTimeRemaining()
      setSessionTimeRemaining(remaining)

      // Show warning when session is about to expire (15 minutes)
      if (remaining <= 15 && remaining > 0 && user) {
        toast.warning(`Sesi Anda akan berakhir dalam ${remaining} menit.`, {
          duration: 10000,
          id: 'session-warning',
        })
      }
    }

    const interval = setInterval(checkSession, 60000)
    
    // Listen for storage changes (login from another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' || e.key === 'sessionExpiresAt') {
        refreshAuth()
      }
    }
    window.addEventListener('storage', handleStorageChange)

    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [refreshAuth, router, user, isLoading])

  const setCurrentRole = (role: UserRole) => {
    if (user?.roles.includes(role)) {
      setStoredRole(role)
      setCurrentRoleState(role)
    }
  }

  const logout = async () => {
    await authLogout()
    setUser(null)
    setCurrentRoleState(null)
    setSessionTimeRemaining(0)
    router.push('/login')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        currentRole,
        isLoading,
        sessionTimeRemaining,
        setCurrentRole,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
