'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <div className="min-h-screen bg-muted/30">
          <DashboardHeader />
          <div className="flex">
            <DashboardSidebar />
            <main className="flex-1 p-6">{children}</main>
          </div>
        </div>
      </ProtectedRoute>
    </AuthProvider>
  )
}
