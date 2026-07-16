import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function DashboardLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-muted-foreground">Memuat dashboard...</p>
      </div>
    </div>
  )
}
