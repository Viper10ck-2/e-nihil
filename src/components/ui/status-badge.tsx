import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ApplicationStatus } from '@/types/database'
import { 
  Clock, 
  CheckCircle, 
  FileCheck, 
  FileText, 
  PenTool, 
  CheckCircle2, 
  Package, 
  XCircle 
} from 'lucide-react'

interface StatusBadgeProps {
  status: ApplicationStatus
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const statusConfig: Record<ApplicationStatus, { 
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
  className: string
  icon: React.ComponentType<{ className?: string }>
  emoji: string
}> = {
  'Menunggu Verifikasi Admin': {
    label: 'Menunggu Verifikasi',
    variant: 'outline',
    className: 'border-orange-500 text-orange-600 bg-orange-50',
    icon: Clock,
    emoji: '⏳',
  },
  'Diverifikasi Admin': {
    label: 'Diverifikasi Admin',
    variant: 'secondary',
    className: 'bg-blue-100 text-blue-700',
    icon: CheckCircle,
    emoji: '✓',
  },
  'Diparaf Kasubbag Anev': {
    label: 'Diparaf Kasubbag',
    variant: 'secondary',
    className: 'bg-indigo-100 text-indigo-700',
    icon: FileCheck,
    emoji: '✓✓',
  },
  'Diproses Sekretaris': {
    label: 'Diproses Sekretaris',
    variant: 'secondary',
    className: 'bg-purple-100 text-purple-700',
    icon: FileText,
    emoji: '📝',
  },
  'Ditandatangani Inspektur': {
    label: 'Ditandatangani',
    variant: 'secondary',
    className: 'bg-teal-100 text-teal-700',
    icon: PenTool,
    emoji: '✍️',
  },
  'Selesai': {
    label: 'Selesai',
    variant: 'default',
    className: 'bg-green-600 text-white',
    icon: CheckCircle2,
    emoji: '✅',
  },
  'Diambil': {
    label: 'Diambil',
    variant: 'default',
    className: 'bg-green-700 text-white',
    icon: Package,
    emoji: '📦',
  },
  'Ditolak': {
    label: 'Ditolak',
    variant: 'destructive',
    className: 'bg-red-600 text-white',
    icon: XCircle,
    emoji: '❌',
  },
}

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-sm px-3 py-1 gap-1.5',
  lg: 'text-base px-4 py-1.5 gap-2',
}

const iconSizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
}

export function StatusBadge({ status, className, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon
  
  return (
    <Badge 
      variant={config.variant} 
      className={cn(
        'inline-flex items-center font-medium',
        config.className, 
        sizeClasses[size],
        className
      )}
    >
      <Icon className={cn(iconSizeClasses[size], 'flex-shrink-0')} />
      <span>{config.label}</span>
    </Badge>
  )
}
