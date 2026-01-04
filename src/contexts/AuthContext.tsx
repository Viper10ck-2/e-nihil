'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { UserRole } from '@/types/database'
import {
  AuthUser,
  getCurrentUser,
  getCurrentRole,
  setCurrentRole as setStoredRole,
  logout as authLogout,
  isSessionValid,
  getSessionTimeRemaining,
  extendSession,
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

// Session check interval (every minute)
const SESSION_CHECK_INTERVAL = 60 * 1000
// Warning threshold (15 minutes before expiry)
const SESSION_WARNING_THRESHOLD = 15

// Helper function to get initial auth state
function getInitialAuthState(): { user: AuthUser | null; role: UserRole | null; remaining: number } {
  if (typeof window === 'undefined') {
    return { user: null, role: null, remaining: 0 }
  }
  
  if (!isSessionValid()) {
    return { user: null, role: null, remaining: 0 }
  }

  const storedUser = getCurrentUser()
  const storedRole = getCurrentRole()
  const remaining = getSessionTimeRemaining()

  if (storedUser) {
    return {
      user: storedUser,
      role: storedRole || storedUser.roles[0] || null,
      remaining,
    }
  }

  return { user: null, role: null, remaining: 0 }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  
  // Use lazy initialization to avoid useEffect for initial state
  const [user, setUser] = useState<AuthUser | null>(() => getInitialAuthState().user)
  const [currentRole, setCurrentRoleState] = useState<UserRole | null>(() => getInitialAuthState().role)
  const [isLoading] = useState(false)
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(() => getInitialAuthState().remaining)
  const warningShownRef = useRef(false)
  const sessionCheckRef = useRef<NodeJS.Timeout | null>(null)

  const refreshAuth = useCallback(() => {
    if (!isSessionValid()) {
      setUser(null)
      setCurrentRoleState(null)
      setSessionTimeRemaining(0)
      return
    }

    const storedUser = getCurrentUser()
    const storedRole = getCurrentRole()
    const remaining = getSessionTimeRemaining()

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

  // Session monitoring
  useEffect(() => {
    const checkSession = () => {
      if (!isSessionValid()) {
        // Session expired
        if (user) {
          toast.error('Sesi Anda telah berakhir. Silakan login kembali.')
          authLogout()
          setUser(null)
          setCurrentRoleState(null)
          setSessionTimeRemaining(0)
          router.push('/login')
        }
        return
      }

      const remaining = getSessionTimeRemaining()
      setSessionTimeRemaining(remaining)

      // Show warning when session is about to expire
      if (remaining <= SESSION_WARNING_THRESHOLD && remaining > 0 && !warningShownRef.current) {
        warningShownRef.current = true
        toast.warning(`Sesi Anda akan berakhir dalam ${remaining} menit. Lakukan aktivitas untuk memperpanjang sesi.`, {
          duration: 10000,
        })
      }

      // Reset warning flag when session is extended
      if (remaining > SESSION_WARNING_THRESHOLD) {
        warningShownRef.current = false
      }
    }

    // Set up periodic session check
    sessionCheckRef.current = setInterval(checkSession, SESSION_CHECK_INTERVAL)

    // Listen for storage changes (login from another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' || e.key === 'sessionExpiresAt' || e.key === 'currentRole') {
        refreshAuth()
      }
    }

    // Extend session on user activity
    const handleActivity = () => {
      if (isSessionValid()) {
        extendSession()
        const remaining = getSessionTimeRemaining()
        setSessionTimeRemaining(remaining)
        warningShownRef.current = false
      }
    }

    // Listen for user activity to extend session
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart']
    let activityTimeout: NodeJS.Timeout | null = null
    
    const throttledActivity = () => {
      if (activityTimeout) return
      activityTimeout = setTimeout(() => {
        handleActivity()
        activityTimeout = null
      }, 60000) // Throttle to once per minute
    }

    activityEvents.forEach(event => {
      window.addEventListener(event, throttledActivity, { passive: true })
    })

    window.addEventListener('storage', handleStorageChange)

    return () => {
      if (sessionCheckRef.current) {
        clearInterval(sessionCheckRef.current)
      }
      if (activityTimeout) {
        clearTimeout(activityTimeout)
      }
      activityEvents.forEach(event => {
        window.removeEventListener(event, throttledActivity)
      })
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [refreshAuth, router, user])

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
