import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface InfoCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  className?: string
  iconClassName?: string
}

export function InfoCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  className,
  iconClassName 
}: InfoCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && (
          <Icon className={cn('h-5 w-5 text-muted-foreground', iconClassName)} />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}
