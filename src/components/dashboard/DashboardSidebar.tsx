'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import {
  LayoutDashboard,
  FileCheck,
  Users,
  ClipboardList,
} from 'lucide-react'
import type { UserRole } from '@/types/database'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  roles?: UserRole[]
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/dashboard/verifikasi',
    label: 'Verifikasi',
    icon: FileCheck,
    roles: ['admin', 'kasubbag_anev', 'sekretaris', 'inspektur'],
  },
  {
    href: '/dashboard/permohonan',
    label: 'Semua Permohonan',
    icon: ClipboardList,
    roles: ['admin'],
  },
  {
    href: '/dashboard/users',
    label: 'Manajemen User',
    icon: Users,
    roles: ['admin'],
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { currentRole } = useAuth()

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true
    return currentRole && item.roles.includes(currentRole)
  })

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground min-h-[calc(100vh-64px)] p-4">
      <nav className="space-y-2">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'hover:bg-sidebar-accent/50'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
