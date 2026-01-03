'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { validateFile } from '@/lib/validations'
import { Upload, FileText, X, Check, Eye } from 'lucide-react'
import type { DocumentType } from '@/types/database'

interface DocumentUploadProps {
  documentType: DocumentType
  label: string
  onFileSelect: (file: File | null) => void
  selectedFile: File | null
  error?: string
}

export function DocumentUpload({
  documentType,
  label,
  onFileSelect,
  selectedFile,
  error,
}: DocumentUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    const validation = validateFile(file)
    if (!validation.valid) {
      setValidationError(validation.error || 'File tidak valid')
      onFileSelect(null)
      return
    }
    setValidationError(null)
    onFileSelect(file)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleRemove = () => {
    onFileSelect(null)
    setValidationError(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handlePreview = () => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile)
      window.open(url, '_blank')
    }
  }

  const displayError = error || validationError

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {selectedFile ? (
          <Check className="h-5 w-5 text-green-600" />
        ) : (
          <div className="h-5 w-5 rounded border-2 border-muted-foreground/30" />
        )}
        <span className="text-sm font-medium">{label}</span>
      </div>

      {selectedFile ? (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <FileText className="h-5 w-5 text-green-600" />
          <span className="flex-1 text-sm truncate">{selectedFile.name}</span>
          <span className="text-xs text-muted-foreground">
            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handlePreview}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            'relative border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer',
            dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50',
            displayError && 'border-red-500'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleChange}
            className="hidden"
            id={`file-${documentType}`}
          />
          <div className="flex flex-col items-center gap-2 text-center">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="text-sm">
              <span className="text-primary font-medium">Klik untuk upload</span>
              <span className="text-muted-foreground"> atau drag & drop</span>
            </div>
            <p className="text-xs text-muted-foreground">PDF (maks. 10MB)</p>
          </div>
        </div>
      )}

      {displayError && (
        <p className="text-sm text-red-600">{displayError}</p>
      )}
    </div>
  )
}
