'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/ui/status-badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { PDFViewer } from '@/components/ui/pdf-viewer'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { DOCUMENT_TYPES } from '@/lib/constants'
import { supabase } from '@/lib/supabase'
import { updateApplicationStatus, getApplicationDocuments, generateNomorSurat, updateNomorSurat } from '@/lib/services/applicationService'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Check,
  X,
  FileText,
  Download,
  Eye,
  User,
  Building,
  MapPin,
  Mail,
  Phone,
} from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import type { Application, Document, ApplicationStatus } from '@/types/database'

export default function VerifikasiDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user, currentRole } = useAuth()
  
  const [application, setApplication] = useState<Application | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string; filePath: string } | null>(null)


  useEffect(() => {
    if (params.id) {
      loadApplication()
    }
  }, [params.id])

  const loadApplication = async () => {
    setIsLoading(true)
    try {
      const applicationId = params.id as string
      const { data: app, error } = await supabase
        .from('applications')
        .select('*')
        .eq('id', applicationId)
        .single()

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

  const getDocumentLabel = (type: string) => {
    return DOCUMENT_TYPES.find(d => d.type === type)?.label || type
  }

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB'
  }

  const canApprove = () => {
    if (!application) return false
    
    // Admin sebagai superuser bisa approve semua status kecuali yang sudah selesai
    if (currentRole === 'admin') {
      return !['Selesai', 'Diambil', 'Ditolak'].includes(application.status)
    }
    
    switch (currentRole) {
      case 'kasubbag_anev':
        return application.status === 'Diverifikasi Admin'
      case 'sekretaris':
        return application.status === 'Diparaf Kasubbag Anev'
      case 'inspektur':
        return application.status === 'Diproses Sekretaris'
      default:
        return false
    }
  }

  const getNextStatus = (): ApplicationStatus => {
    if (!application) return 'Menunggu Verifikasi Admin'
    
    // Admin sebagai superuser - lanjutkan ke status berikutnya sesuai flow
    if (currentRole === 'admin') {
      switch (application.status) {
        case 'Menunggu Verifikasi Admin':
          return 'Diverifikasi Admin'
        case 'Diverifikasi Admin':
          return 'Diparaf Kasubbag Anev'
        case 'Diparaf Kasubbag Anev':
          return 'Diproses Sekretaris'
        case 'Diproses Sekretaris':
          return 'Ditandatangani Inspektur'
        default:
          return application.status
      }
    }
    
    switch (currentRole) {
      case 'kasubbag_anev':
        return 'Diparaf Kasubbag Anev'
      case 'sekretaris':
        return 'Diproses Sekretaris'
      case 'inspektur':
        return 'Ditandatangani Inspektur'
      default:
        return application?.status || 'Menunggu Verifikasi Admin'
    }
  }

  const getApproveLabel = () => {
    if (!application) return 'Setujui'
    
    // Admin sebagai superuser - label sesuai status saat ini
    if (currentRole === 'admin') {
      switch (application.status) {
        case 'Menunggu Verifikasi Admin':
          return 'Verifikasi'
        case 'Diverifikasi Admin':
          return 'Paraf (Kasubbag)'
        case 'Diparaf Kasubbag Anev':
          return 'Teruskan (Sekretaris)'
        case 'Diproses Sekretaris':
          return 'TTD (Inspektur)'
        default:
          return 'Setujui'
      }
    }
    
    switch (currentRole) {
      case 'kasubbag_anev':
        return 'Paraf'
      case 'sekretaris':
        return 'Teruskan'
      case 'inspektur':
        return 'TTD'
      default:
        return 'Setujui'
    }
  }

  const handleApprove = async () => {
    if (!application) return
    setIsApproving(true)
    try {
      const nextStatus = getNextStatus()
      await updateApplicationStatus(application.id, nextStatus, `Disetujui oleh ${currentRole}`, user?.id)
      
      // Generate nomor surat saat status berubah ke "Diverifikasi Admin"
      if (nextStatus === 'Diverifikasi Admin') {
        const nomorSurat = await generateNomorSurat()
        await updateNomorSurat(application.id, nomorSurat)
        toast.success(`Nomor surat: ${nomorSurat}`)
      }
      
      // Jika inspektur atau admin yang approve ke status Ditandatangani Inspektur, langsung selesai
      if (currentRole === 'inspektur' || (currentRole === 'admin' && nextStatus === 'Ditandatangani Inspektur')) {
        await updateApplicationStatus(application.id, 'Selesai', 'Surat siap diambil', user?.id)
      }
      
      toast.success('Permohonan berhasil disetujui')
      router.push('/dashboard/verifikasi')
    } catch (error) {
      console.error('Error approving:', error)
      toast.error('Gagal menyetujui permohonan')
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    if (!application) return
    if (!rejectionReason.trim()) {
      toast.error('Alasan penolakan wajib diisi')
      return
    }

    setIsRejecting(true)
    try {
      await updateApplicationStatus(application.id, 'Ditolak', rejectionReason, user?.id)
      
      // Hapus nomor surat jika ada (agar nomor bisa dipakai lagi)
      const updateData: { rejection_reason: string; nomor_surat?: null } = { 
        rejection_reason: rejectionReason 
      }
      if (application.nomor_surat) {
        updateData.nomor_surat = null
      }
      
      await supabase
        .from('applications')
        .update(updateData as never)
        .eq('id', application.id)
      
      toast.success('Permohonan ditolak')
      setShowRejectDialog(false)
      router.push('/dashboard/verifikasi')
    } catch (error) {
      console.error('Error rejecting:', error)
      toast.error('Gagal menolak permohonan')
    } finally {
      setIsRejecting(false)
    }
  }

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
      a.href = url
      a.download = doc.file_name
      a.click()
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
      a.href = url
      a.download = previewDoc.name
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error('Gagal mengunduh dokumen')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Permohonan tidak ditemukan</p>
      </div>
    )
  }


  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="px-2 sm:px-3">
          <ArrowLeft className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Kembali</span>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold break-all">{application.tracking_number}</h1>
          {application.nomor_surat && (
            <p className="text-xs sm:text-sm font-medium text-primary">
              No. Surat: {application.nomor_surat}
            </p>
          )}
          <p className="text-xs sm:text-sm text-muted-foreground">
            {format(new Date(application.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}
          </p>
        </div>
        <StatusBadge status={application.status} />
      </div>

      {/* Mobile Action Buttons */}
      {canApprove() && (
        <div className="flex gap-2 lg:hidden">
          <Button className="flex-1" size="sm" onClick={handleApprove} disabled={isApproving}>
            {isApproving ? <LoadingSpinner size="sm" /> : <Check className="h-4 w-4 mr-1" />}
            {getApproveLabel()}
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setShowRejectDialog(true)}>
            <X className="h-4 w-4 mr-1" />
            Tolak
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Applicant Info */}
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
                Data Pemohon
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label className="text-xs sm:text-sm text-muted-foreground">Nama Lengkap</Label>
                  <p className="font-medium text-sm sm:text-base">{application.nama_lengkap}</p>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm text-muted-foreground">NIP</Label>
                  <p className="font-medium font-mono text-xs sm:text-sm break-all">{application.nip}</p>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm text-muted-foreground">Pangkat/Golongan</Label>
                  <p className="font-medium text-sm sm:text-base">{application.pangkat_golongan}</p>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm text-muted-foreground">Tujuan Permohonan</Label>
                  <p className="font-medium text-sm sm:text-base">
                    {application.tujuan_permohonan === 'mutasi' && 'Perpindahan Antar Instansi (Mutasi)'}
                    {application.tujuan_permohonan === 'promosi' && 'Promosi Jabatan'}
                    {application.tujuan_permohonan === 'lainnya_asn' && 'Tujuan Lainnya (ASN)'}
                    {application.tujuan_permohonan === 'lainnya_non_asn' && 'Tujuan Lainnya (Non-ASN)'}
                    {!application.tujuan_permohonan && 'Perpindahan Antar Instansi (Mutasi)'}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Jabatan - hidden for lainnya_non_asn */}
              {application.tujuan_permohonan !== 'lainnya_non_asn' && application.jabatan && application.jabatan !== '-' && (
                <div>
                  <Label className="text-xs sm:text-sm text-muted-foreground">Jabatan</Label>
                  <p className="font-medium text-sm sm:text-base">{application.jabatan}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Unit Kerja Asal - hidden for lainnya_non_asn */}
                {application.tujuan_permohonan !== 'lainnya_non_asn' && application.unit_kerja_asal && application.unit_kerja_asal !== '-' && (
                  <div className="flex items-start gap-2">
                    <Building className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <Label className="text-xs sm:text-sm text-muted-foreground">Unit Kerja Asal</Label>
                      <p className="font-medium text-sm sm:text-base break-words">{application.unit_kerja_asal}</p>
                    </div>
                  </div>
                )}
                {/* Instansi Tujuan - hidden for promosi, lainnya_asn, lainnya_non_asn */}
                {application.tujuan_permohonan === 'mutasi' && application.instansi_tujuan && application.instansi_tujuan !== '-' && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <Label className="text-xs sm:text-sm text-muted-foreground">Instansi Tujuan</Label>
                      <p className="font-medium text-sm sm:text-base break-words">{application.instansi_tujuan}</p>
                    </div>
                  </div>
                )}
                {/* For old data without tujuan_permohonan */}
                {!application.tujuan_permohonan && application.instansi_tujuan && application.instansi_tujuan !== '-' && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <Label className="text-xs sm:text-sm text-muted-foreground">Instansi Tujuan</Label>
                      <p className="font-medium text-sm sm:text-base break-words">{application.instansi_tujuan}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Alasan Permohonan - always show, contains tujuan lainnya info */}
              {application.alasan_permohonan && application.alasan_permohonan !== '-' && (
                <div>
                  <Label className="text-xs sm:text-sm text-muted-foreground">
                    {(application.tujuan_permohonan === 'lainnya_asn' || application.tujuan_permohonan === 'lainnya_non_asn') 
                      ? 'Tujuan dan Alasan Permohonan' 
                      : 'Alasan Permohonan'}
                  </Label>
                  <p className="font-medium text-sm sm:text-base">{application.alasan_permohonan}</p>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{application.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span>{application.nomor_hp}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                Dokumen ({documents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 sm:space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-2 sm:p-3 bg-muted/50 rounded-lg gap-2"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="h-6 w-6 sm:h-8 sm:w-8 rounded bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-xs sm:text-sm truncate">
                          {getDocumentLabel(doc.document_type)}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                          {formatFileSize(doc.file_size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => handleViewDocument(doc)} className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDownloadDocument(doc)} className="h-8 w-8 p-0">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Actions (Desktop) */}
        <div className="hidden lg:block space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Aksi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {canApprove() ? (
                <>
                  <Button className="w-full" onClick={handleApprove} disabled={isApproving}>
                    {isApproving ? <LoadingSpinner size="sm" className="mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                    {getApproveLabel()}
                  </Button>
                  <Button variant="destructive" className="w-full" onClick={() => setShowRejectDialog(true)}>
                    <X className="h-4 w-4 mr-2" />
                    Tolak
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center">
                  Tidak ada aksi yang diperlukan.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tolak Permohonan</DialogTitle>
            <DialogDescription>
              Berikan alasan penolakan permohonan ini.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Alasan Penolakan</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Jelaskan alasan penolakan..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} className="w-full sm:w-auto">
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isRejecting || !rejectionReason.trim()}
              className="w-full sm:w-auto"
            >
              {isRejecting && <LoadingSpinner size="sm" className="mr-2" />}
              Tolak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="max-w-[98vw] sm:max-w-4xl h-[95vh] sm:h-[90vh] p-0 gap-0">
          <DialogHeader className="p-3 sm:p-4 pb-0 border-b">
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base pr-8">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="truncate">{previewDoc?.name}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {previewDoc && (
              <PDFViewer 
                url={previewDoc.url} 
                fileName={previewDoc.name}
                onDownload={handleDownloadPreview}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
