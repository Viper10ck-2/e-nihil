'use client'

import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, ExternalLink } from 'lucide-react'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Set worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PDFViewerProps {
  url: string
  fileName: string
  onDownload?: () => void
}

export function PDFViewer({ url, fileName, onDownload }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [scale, setScale] = useState(1.0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setIsLoading(false)
    setError(null)
  }

  const onDocumentLoadError = (err: Error) => {
    console.error('PDF load error:', err)
    setError('Gagal memuat PDF')
    setIsLoading(false)
  }

  const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1))
  const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages))
  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 2.5))
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5))

  const openInNewTab = () => {
    window.open(url, '_blank')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-muted/50 border-b">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={goToPrevPage} disabled={pageNumber <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm px-2 min-w-[80px] text-center">
            {pageNumber} / {numPages || '?'}
          </span>
          <Button variant="ghost" size="sm" onClick={goToNextPage} disabled={pageNumber >= numPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={zoomOut} disabled={scale <= 0.5}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm px-2 min-w-[50px] text-center">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="sm" onClick={zoomIn} disabled={scale >= 2.5}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={openInNewTab} title="Buka di tab baru">
            <ExternalLink className="h-4 w-4" />
          </Button>
          {onDownload && (
            <Button variant="ghost" size="sm" onClick={onDownload} title="Download">
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto bg-gray-100 flex justify-center p-4">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}
        
        {error && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button variant="outline" onClick={openInNewTab}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Buka di Tab Baru
            </Button>
          </div>
        )}

        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={null}
          className={error ? 'hidden' : ''}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            className="shadow-lg"
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      </div>
    </div>
  )
}
