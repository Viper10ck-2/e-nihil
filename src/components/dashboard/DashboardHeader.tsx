'use client'

import { useAuth } from '@/contexts/AuthContext'
import { RoleSelector } from './RoleSelector'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut, User, Menu } from 'lucide-react'

interface DashboardHeaderProps {
  onMenuClick: () => void
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const { user, logout } = useAuth()

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="h-14 sm:h-16 bg-white border-b flex items-center justify-between px-3 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
          aria-label="Buka menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-sm sm:text-lg font-semibold text-primary truncate">e-Nihil Dashboard</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden sm:block">
          <RoleSelector />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full">
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
                  {user ? getInitials(user.nama) : 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.nama}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  NIP: {user?.nip}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profil</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
