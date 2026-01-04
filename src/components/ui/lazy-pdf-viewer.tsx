'use client'

import dynamic from 'next/dynamic'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

// Lazy load PDF viewer - only loads when component is rendered
const PDFViewer = dynamic(
  () => import('./pdf-viewer').then(mod => ({ default: mod.PDFViewer })),
  {
    loading: () => (
      <div className="flex items-center justify-center py-12 h-full">
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-muted-foreground">Memuat PDF viewer...</span>
      </div>
    ),
    ssr: false, // PDF viewer doesn't work on server
  }
)

interface LazyPDFViewerProps {
  url: string
  fileName: string
  onDownload?: () => void
}

export function LazyPDFViewer(props: LazyPDFViewerProps) {
  return <PDFViewer {...props} />
}
