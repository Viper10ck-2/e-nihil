'use client'

import { ErrorBoundary } from '@/components/ui/error-boundary'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorBoundary>
      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Gagal Memuat Dashboard
          </h2>
          <p className="text-muted-foreground mb-2">
            {error.message || 'Terjadi kesalahan saat memuat data dashboard.'}
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground mb-6">
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    </ErrorBoundary>
  )
}
