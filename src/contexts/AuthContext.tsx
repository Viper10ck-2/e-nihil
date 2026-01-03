'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [currentRole, setCurrentRoleState] = useState<UserRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const storedUser = getCurrentUser()
    const storedRole = getCurrentRole()

    if (storedUser) {
      setUser(storedUser)
      setCurrentRoleState(storedRole || storedUser.roles[0] || null)
    }

    setIsLoading(false)
  }, [])

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
