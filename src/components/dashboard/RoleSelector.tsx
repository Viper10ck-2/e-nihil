'use client'

import { useAuth } from '@/contexts/AuthContext'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { UserRole } from '@/types/database'

const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  kasubbag_anev: 'Kasubbag Anev',
  sekretaris: 'Sekretaris',
  inspektur: 'Inspektur',
}

export function RoleSelector() {
  const { user, currentRole, setCurrentRole } = useAuth()

  if (!user || user.roles.length <= 1) {
    return currentRole ? (
      <span className="text-sm font-medium">{roleLabels[currentRole]}</span>
    ) : null
  }

  return (
    <Select value={currentRole || undefined} onValueChange={(value) => setCurrentRole(value as UserRole)}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Pilih Role" />
      </SelectTrigger>
      <SelectContent>
        {user.roles.map((role) => (
          <SelectItem key={role} value={role}>
            {roleLabels[role]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
