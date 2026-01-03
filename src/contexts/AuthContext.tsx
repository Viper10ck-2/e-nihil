'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { UserRole } from '@/types/database'
import {
  AuthUser,
  getCurrentUser,
  getCurrentRole,
  setCurrentRole as setStoredRole,
  logout as authLogout,
} from '@/lib/services/authService'

interface AuthContextType {
  user: AuthUser | null
  currentRole: UserRole | null
  isLoading: boolean
  setCurrentRole: (role: UserRole) => void
  logout: () => void
  refreshAuth: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [currentRole, setCurrentRoleState] = useState<UserRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshAuth = useCallback(() => {
    const storedUser = getCurrentUser()
    const storedRole = getCurrentRole()

    if (storedUser) {
      setUser(storedUser)
      setCurrentRoleState(storedRole || storedUser.roles[0] || null)
    } else {
      setUser(null)
      setCurrentRoleState(null)
    }
  }, [])

  useEffect(() => {
    // Check for existing session
    refreshAuth()
    setIsLoading(false)

    // Listen for storage changes (login from another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_user' || e.key === 'current_role') {
        refreshAuth()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [refreshAuth])

  const setCurrentRole = (role: UserRole) => {
    if (user?.roles.includes(role)) {
      setStoredRole(role)
      setCurrentRoleState(role)
    }
  }

  const logout = () => {
    authLogout()
    setUser(null)
    setCurrentRoleState(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        currentRole,
        isLoading,
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
