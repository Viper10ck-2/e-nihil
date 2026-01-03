import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ApplicationStatus } from '@/types/database'

interface StatusBadgeProps {
  status: ApplicationStatus
  className?: string
}

const statusConfig: Record<ApplicationStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  'Menunggu Verifikasi Admin': {
    label: 'Menunggu Verifikasi',
    variant: 'outline',
    className: 'border-orange-500 text-orange-600 bg-orange-50',
  },
  'Diverifikasi Admin': {
    label: 'Diverifikasi Admin',
    variant: 'secondary',
    className: 'bg-blue-100 text-blue-700',
  },
  'Diparaf Kasubbag Anev': {
    label: 'Diparaf Kasubbag',
    variant: 'secondary',
    className: 'bg-indigo-100 text-indigo-700',
  },
  'Diproses Sekretaris': {
    label: 'Diproses Sekretaris',
    variant: 'secondary',
    className: 'bg-purple-100 text-purple-700',
  },
  'Ditandatangani Inspektur': {
    label: 'Ditandatangani',
    variant: 'secondary',
    className: 'bg-teal-100 text-teal-700',
  },
  'Selesai': {
    label: 'Selesai',
    variant: 'default',
    className: 'bg-green-600 text-white',
  },
  'Diambil': {
    label: 'Diambil',
    variant: 'default',
    className: 'bg-green-700 text-white',
  },
  'Ditolak': {
    label: 'Ditolak',
    variant: 'destructive',
    className: 'bg-red-600 text-white',
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  
  return (
    <Badge 
      variant={config.variant} 
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
