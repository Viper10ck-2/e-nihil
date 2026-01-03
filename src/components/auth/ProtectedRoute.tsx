'use client'

import { useEffect } from 'react'
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

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    if (!isLoading && user && allowedRoles && currentRole) {
      if (!allowedRoles.includes(currentRole)) {
        router.push('/dashboard')
      }
    }
  }, [user, currentRole, allowedRoles, isLoading, router])

  if (isLoading) {
    return <PageLoader />
  }

  if (!user) {
    return <PageLoader />
  }

  if (allowedRoles && currentRole && !allowedRoles.includes(currentRole)) {
    return <PageLoader />
  }

  return <>{children}</>
}
