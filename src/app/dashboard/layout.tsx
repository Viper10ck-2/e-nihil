'use client'

import { useState } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar'
import { Menu, X } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-muted/30">
        <DashboardHeader onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex relative">
          {/* Desktop sidebar */}
          <div className="hidden lg:block shrink-0">
            <DashboardSidebar />
          </div>
          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div 
                className="absolute inset-0 bg-black/50"
                onClick={() => setSidebarOpen(false)}
              />
              <div className="absolute left-0 top-0 bottom-0 z-50">
                <DashboardSidebar onClose={() => setSidebarOpen(false)} mobile />
              </div>
            </div>
          )}
          <main className="flex-1 p-4 sm:p-6 min-w-0">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
