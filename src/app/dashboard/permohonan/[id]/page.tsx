'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { PDFViewer } from '@/components/ui/pdf-viewer'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DOCUMENT_TYPES } from '@/lib/constants'
import { supabase } from '@/lib/supabase'
import { getApplicationDocuments } from '@/lib/services/applicationService'
import { toast } from 'sonner'
import {
  ArrowLeft, Check, FileText, Download, Eye, User, Building, MapPin, Mail, Phone, Target, Calendar, Hash, Briefcase
} from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import type { Application, Document } from '@/types/database'

export default function PermohonanDetailPage() {
  const router = useRouter()
  const params = useParams()
  
  const [application, setApplication] = useState<Application | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string; filePath: string } | null>(null)

  useEffect(() => {
    if (params.id) loadApplication()
  }, [params.id])

  const loadApplication = async () => {
    setIsLoading(true)
    try {
      const applicationId = params.id as string
      const { data: app, error } = await supabase.from('applications').select('*').eq('id', applicationId).single()
      if (error) throw error
      setApplication(app as Application)
      const docs = await getApplicationDocuments(applicationId)
      setDocuments(docs as Document[])
    } catch (error) {
      console.error('Error loading application:', error)
      toast.error('Gagal memuat data permohonan')
    } finally {
      setIsLoading(false)
    }
  }

  const getDocumentLabel = (type: string) => DOCUMENT_TYPES.find(d => d.type === type)?.label || type
  const formatFileSize = (bytes: number) => (bytes / 1024 / 1024).toFixed(2) + ' MB'

  const handleViewDocument = async (doc: Document) => {
    try {
      const { data } = supabase.storage.from('documents').getPublicUrl(doc.file_path)
      setPreviewDoc({ url: data.publicUrl, name: doc.file_name, filePath: doc.file_path })
    } catch (error) {
      console.error('Error getting document URL:', error)
      toast.error('Gagal membuka dokumen')
    }
  }

  const handleDownloadDocument = async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage.from('documents').download(doc.file_path)
      if (error) throw error
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url; a.download = doc.file_name; a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error('Gagal mengunduh dokumen')
    }
  }

  const handleDownloadPreview = async () => {
    if (!previewDoc) return
    try {
      const { data, error } = await supabase.storage.from('documents').download(previewDoc.filePath)
      if (error) throw error
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url; a.download = previewDoc.name; a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error('Gagal mengunduh dokumen')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-slate-500">Memuat data...</p>
        </div>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
            <FileText className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-slate-500">Permohonan tidak ditemukan</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
      </div>

      {/* Info Header */}
      <Card className="border border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                <Hash className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-mono text-slate-800">{application.tracking_number}</h1>
                {application.nomor_surat && (
                  <p className="text-slate-500 text-sm">No. Surat: {application.nomor_surat}</p>
                )}
                <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                  <Calendar className="h-4 w-4" />
                  <span>Diajukan {format(new Date(application.created_at), 'dd MMMM yyyy, HH:mm', { locale: id })} WIB</span>
                </div>
              </div>
            </div>
            <StatusBadge status={application.status} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applicant Info */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle className="text-lg text-slate-800">Data Pemohon</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoItem icon={User} label="Nama Lengkap" value={application.nama_lengkap} />
            <InfoItem icon={Hash} label="NIP" value={application.nip} mono />
            <InfoItem icon={Briefcase} label="Pangkat/Golongan" value={application.pangkat_golongan} />
            <InfoItem icon={Target} label="Tujuan Permohonan" value={getTujuanLabel(application.tujuan_permohonan)} />
            
            {application.tujuan_permohonan !== 'lainnya_non_asn' && application.jabatan && application.jabatan !== '-' && (
              <InfoItem icon={Briefcase} label="Jabatan" value={application.jabatan} />
            )}

            {application.tujuan_permohonan !== 'lainnya_non_asn' && application.unit_kerja_asal && application.unit_kerja_asal !== '-' && (
              <InfoItem icon={Building} label="Unit Kerja Asal" value={application.unit_kerja_asal} />
            )}
            
            {(application.tujuan_permohonan === 'mutasi' || !application.tujuan_permohonan) && application.instansi_tujuan && application.instansi_tujuan !== '-' && (
              <InfoItem icon={MapPin} label="Instansi Tujuan" value={application.instansi_tujuan} />
            )}

            {application.alasan_permohonan && application.alasan_permohonan !== '-' && (
              <InfoItem 
                icon={FileText} 
                label={(application.tujuan_permohonan === 'lainnya_asn' || application.tujuan_permohonan === 'lainnya_non_asn') ? 'Tujuan dan Alasan' : 'Alasan Permohonan'} 
                value={application.alasan_permohonan} 
              />
            )}

            <div className="pt-4 border-t border-slate-100 space-y-4">
              <InfoItem icon={Mail} label="Email" value={application.email} />
              <InfoItem icon={Phone} label="Nomor HP" value={application.nomor_hp} />
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-emerald-600" />
              </div>
              <CardTitle className="text-lg text-slate-800">Dokumen Pendukung ({documents.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="group flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 transition-all duration-200">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Check className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-slate-800 truncate">{getDocumentLabel(doc.document_type)}</p>
                      <p className="text-xs text-slate-500">{formatFileSize(doc.file_size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => handleViewDocument(doc)} className="h-9 w-9 p-0 hover:bg-blue-100 hover:text-blue-600 rounded-lg">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDownloadDocument(doc)} className="h-9 w-9 p-0 hover:bg-emerald-100 hover:text-emerald-600 rounded-lg">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PDF Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="max-w-[98vw] sm:max-w-4xl h-[95vh] sm:h-[90vh] p-0 gap-0">
          <DialogHeader className="p-4 pb-0 border-b">
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base pr-8">
              <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
              <span className="truncate">{previewDoc?.name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {previewDoc && <PDFViewer url={previewDoc.url} fileName={previewDoc.name} onDownload={handleDownloadPreview} />}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Helper Components
function InfoItem({ icon: Icon, label, value, mono }: { 
  icon: React.ElementType; label: string; value: string; mono?: boolean 
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
        <p className={`text-slate-800 ${mono ? 'font-mono text-sm' : ''}`}>{value || '-'}</p>
      </div>
    </div>
  )
}

function getTujuanLabel(tujuan: string | null | undefined): string {
  switch (tujuan) {
    case 'mutasi': return 'Perpindahan Antar Instansi (Mutasi)'
    case 'promosi': return 'Promosi Jabatan'
    case 'lainnya_asn': return 'Tujuan Lainnya (ASN)'
    case 'lainnya_non_asn': return 'Tujuan Lainnya (Non-ASN)'
    default: return 'Perpindahan Antar Instansi (Mutasi)'
  }
}
