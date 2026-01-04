'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { PageLoader } from '@/components/ui/loading-spinner'
import type { UserRole } from '@/types/database'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter()
  const { user, currentRole, isLoading } = useAuth()
  const [isMounted, setIsMounted] = useState(false)

  // Wait for client-side mount before making auth decisions
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    // Only redirect after mounted and not loading
    if (isMounted && !isLoading && !user) {
      // Check if we're not already on login page to prevent loop
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        console.log('[ProtectedRoute] No user, redirecting to login')
        router.replace('/login')
      }
    }
  }, [user, isLoading, router, isMounted])

  useEffect(() => {
    if (isMounted && !isLoading && user && allowedRoles && currentRole) {
      if (!allowedRoles.includes(currentRole)) {
        console.log('[ProtectedRoute] Role not allowed, redirecting to dashboard')
        router.replace('/dashboard')
      }
    }
  }, [user, currentRole, allowedRoles, isLoading, router, isMounted])

  // Show loader while mounting or loading
  if (!isMounted || isLoading) {
    return <PageLoader />
  }

  // Show loader while redirecting (no user)
  if (!user) {
    return <PageLoader />
  }

  // Show loader while redirecting (wrong role)
  if (allowedRoles && currentRole && !allowedRoles.includes(currentRole)) {
    return <PageLoader />
  }

  return <>{children}</>
}
