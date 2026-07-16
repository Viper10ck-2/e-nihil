'use client'

import { Component, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Terjadi Kesalahan
            </h2>
            <p className="text-muted-foreground mb-6">
              Maaf, terjadi kesalahan yang tidak terduga. Silakan coba muat ulang halaman.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="text-left text-xs bg-muted p-3 rounded-md mb-4 overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <Button onClick={this.handleReset} variant="default">
              <RefreshCw className="h-4 w-4 mr-2" />
              Muat Ulang
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
