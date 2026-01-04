'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/ui/status-badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { LazyPDFViewer } from '@/components/ui/lazy-pdf-viewer'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DOCUMENT_TYPES } from '@/lib/constants'
import { supabase } from '@/lib/supabase'
import { updateApplicationStatus, getApplicationDocuments, generateNomorSurat, updateNomorSurat } from '@/lib/services/applicationService'
import { toast } from 'sonner'
import {
  ArrowLeft, Check, X, FileText, Download, Eye, User, Building, MapPin, Mail, Phone, Target, Calendar, Hash, Briefcase, Send, HandCoins, AlertTriangle, Clock
} from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import type { Application, Document, ApplicationStatus, DocumentRejection } from '@/types/database'
import { getDocumentsWithRejections } from '@/lib/services/documentRejectionService'

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
  
  // State untuk kirim berkas online
  const [showSendOnlineDialog, setShowSendOnlineDialog] = useState(false)
  const [skbtFile, setSkbtFile] = useState<File | null>(null)
  const [isSendingOnline, setIsSendingOnline] = useState(false)
  
  // State untuk berkas diterima langsung
  const [showOfflineDialog, setShowOfflineDialog] = useState(false)
  const [buktiPenyerahanFile, setBuktiPenyerahanFile] = useState<File | null>(null)
  const [isProcessingOffline, setIsProcessingOffline] = useState(false)
  
  // State untuk penolakan dokumen
  const [showDocRejectDialog, setShowDocRejectDialog] = useState(false)
  const [selectedDocForReject, setSelectedDocForReject] = useState<Document | null>(null)
  const [docRejectionReason, setDocRejectionReason] = useState('')
  const [isRejectingDoc, setIsRejectingDoc] = useState(false)
  const [documentRejections, setDocumentRejections] = useState<Map<string, DocumentRejection>>(new Map())
  
  // State untuk multi-select penolakan dokumen
  const [selectedDocsForReject, setSelectedDocsForReject] = useState<Set<string>>(new Set())
  const [showMultiRejectDialog, setShowMultiRejectDialog] = useState(false)
  const [multiRejectReasons, setMultiRejectReasons] = useState<Map<string, string>>(new Map())
  const [isRejectingMultiple, setIsRejectingMultiple] = useState(false)

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
      
      // Load document rejections
      const docsWithRejections = await getDocumentsWithRejections(applicationId)
      const rejectionMap = new Map<string, DocumentRejection>()
      docsWithRejections.forEach(doc => {
        if (doc.rejection) {
          rejectionMap.set(doc.id, doc.rejection)
        }
      })
      setDocumentRejections(rejectionMap)
    } catch (error) {
      console.error('Error loading application:', error)
      toast.error('Gagal memuat data permohonan')
    } finally {
      setIsLoading(false)
    }
  }

  const getDocumentLabel = (type: string) => DOCUMENT_TYPES.find(d => d.type === type)?.label || type
  const formatFileSize = (bytes: number) => (bytes / 1024 / 1024).toFixed(2) + ' MB'

  const canApprove = () => {
    if (!application) return false
    // Admin tidak bisa approve jika sudah Selesai, Diambil, Ditolak, atau Ditandatangani Inspektur
    if (currentRole === 'admin') return !['Selesai', 'Diambil', 'Ditolak', 'Ditandatangani Inspektur'].includes(application.status)
    switch (currentRole) {
      case 'kasubbag_anev': return application.status === 'Diverifikasi Admin'
      case 'sekretaris': return application.status === 'Diparaf Kasubbag Anev'
      case 'inspektur': return application.status === 'Diproses Sekretaris'
      default: return false
    }
  }

  const getNextStatus = (): ApplicationStatus => {
    if (!application) return 'Menunggu Verifikasi Admin'
    if (currentRole === 'admin') {
      switch (application.status) {
        case 'Menunggu Verifikasi Admin': return 'Diverifikasi Admin'
        case 'Diverifikasi Admin': return 'Diparaf Kasubbag Anev'
        case 'Diparaf Kasubbag Anev': return 'Diproses Sekretaris'
        case 'Diproses Sekretaris': return 'Ditandatangani Inspektur'
        default: return application.status
      }
    }
    switch (currentRole) {
      case 'kasubbag_anev': return 'Diparaf Kasubbag Anev'
      case 'sekretaris': return 'Diproses Sekretaris'
      case 'inspektur': return 'Ditandatangani Inspektur'
      default: return application?.status || 'Menunggu Verifikasi Admin'
    }
  }

  const getApproveLabel = () => {
    if (!application) return 'Setujui'
    if (currentRole === 'admin') {
      switch (application.status) {
        case 'Menunggu Verifikasi Admin': return 'Verifikasi'
        case 'Diverifikasi Admin': return 'Paraf (Kasubbag)'
        case 'Diparaf Kasubbag Anev': return 'Teruskan (Sekretaris)'
        case 'Diproses Sekretaris': return 'TTD (Inspektur)'
        default: return 'Setujui'
      }
    }
    switch (currentRole) {
      case 'kasubbag_anev': return 'Paraf'
      case 'sekretaris': return 'Teruskan'
      case 'inspektur': return 'TTD'
      default: return 'Setujui'
    }
  }

  const handleApprove = async () => {
    if (!application) return
    setIsApproving(true)
    try {
      const nextStatus = getNextStatus()
      await updateApplicationStatus(application.id, nextStatus, `Disetujui oleh ${currentRole}`, user?.id)
      if (nextStatus === 'Diverifikasi Admin') {
        const nomorSurat = await generateNomorSurat()
        await updateNomorSurat(application.id, nomorSurat)
        toast.success(`Nomor surat: ${nomorSurat}`)
      }
      
      // Kirim email notifikasi saat status berubah ke "Ditandatangani Inspektur"
      if (nextStatus === 'Ditandatangani Inspektur' && application.nomor_surat) {
        try {
          const response = await fetch('/api/send-skbt-ready', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              trackingNumber: application.tracking_number,
              nomorSurat: application.nomor_surat,
              namaLengkap: application.nama_lengkap,
              email: application.email,
              trackingUrl: `${window.location.origin}/tracking?no=${application.tracking_number}`,
            }),
          })
          const result = await response.json()
          if (result.success) {
            toast.success('Email notifikasi telah dikirim ke pemohon')
          }
        } catch (emailError) {
          console.error('Error sending SKBT ready email:', emailError)
          // Tidak gagalkan proses approve jika email gagal
        }
      }
      
      // Tidak langsung ke Selesai setelah TTD Inspektur
      // Status akan diubah ke Selesai saat Admin mengirim berkas online
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
    if (!rejectionReason.trim()) { toast.error('Alasan penolakan wajib diisi'); return }
    setIsRejecting(true)
    try {
      await updateApplicationStatus(application.id, 'Ditolak', rejectionReason, user?.id)
      const updateData: { rejection_reason: string; nomor_surat?: null } = { rejection_reason: rejectionReason }
      if (application.nomor_surat) updateData.nomor_surat = null
      await supabase.from('applications').update(updateData as never).eq('id', application.id)
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

  // Handler untuk file SKBT yang sudah di-TTD
  const handleSkbtFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validasi tipe file (hanya PDF)
    if (file.type !== 'application/pdf') {
      toast.error('Hanya file PDF yang diperbolehkan')
      e.target.value = ''
      return
    }
    
    // Validasi ukuran file (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 10MB')
      e.target.value = ''
      return
    }
    
    setSkbtFile(file)
  }

  // Handler untuk kirim berkas online
  const handleSendOnline = async () => {
    if (!application || !skbtFile) {
      toast.error('Pilih file SKBT yang sudah ditandatangani')
      return
    }

    if (!application.nomor_surat) {
      toast.error('Nomor surat belum tersedia')
      return
    }

    setIsSendingOnline(true)
    try {
      // 1. Upload file SKBT ke storage
      const fileExt = skbtFile.name.split('.').pop()
      const fileName = `skbt_${application.tracking_number}_${Date.now()}.${fileExt}`
      const filePath = `skbt/${application.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, skbtFile)

      if (uploadError) throw uploadError

      // 2. Get public URL untuk download
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)

      // 3. Kirim email notifikasi dengan tanda terima digital
      const response = await fetch('/api/send-digital-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingNumber: application.tracking_number,
          nomorSurat: application.nomor_surat,
          namaLengkap: application.nama_lengkap,
          nip: application.nip,
          tujuanPermohonan: application.tujuan_permohonan || 'mutasi',
          email: application.email,
          tanggalTTD: format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: id }) + ' WIB',
          downloadUrl: urlData.publicUrl,
          sentBy: user?.nama || 'Admin',
        }),
      })

      const result = await response.json()
      if (!result.success) throw new Error('Gagal mengirim email')

      // 4. Update status menjadi Diambil dan set pickup_method jika belum ada
      await updateApplicationStatus(application.id, 'Diambil', 'Berkas dikirim secara online', user?.id)
      
      // Set pickup_method ke 'online' jika belum dipilih oleh pemohon
      if (!application.pickup_method) {
        await supabase
          .from('applications')
          .update({ 
            pickup_method: 'online',
            pickup_method_selected_at: new Date().toISOString()
          } as never)
          .eq('id', application.id)
      }

      toast.success('Berkas berhasil dikirim! Email notifikasi telah dikirim ke pemohon.')
      setShowSendOnlineDialog(false)
      setSkbtFile(null)
      router.push('/dashboard/verifikasi')
    } catch (error) {
      console.error('Error sending online:', error)
      toast.error('Gagal mengirim berkas online')
    } finally {
      setIsSendingOnline(false)
    }
  }

  // Cek apakah bisa kirim berkas online (status sudah di-TTD Inspektur)
  const canSendOnline = () => {
    if (!application) return false
    return application.status === 'Ditandatangani Inspektur' && currentRole === 'admin'
  }

  // Handler untuk file bukti penyerahan
  const handleBuktiPenyerahanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validasi tipe file (PDF atau gambar)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Hanya file PDF atau gambar (JPG, PNG) yang diperbolehkan')
      e.target.value = ''
      return
    }
    
    // Validasi ukuran file (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 10MB')
      e.target.value = ''
      return
    }
    
    setBuktiPenyerahanFile(file)
  }

  // Handler untuk berkas diterima langsung
  const handleOfflineDelivery = async () => {
    if (!application || !buktiPenyerahanFile) {
      toast.error('Pilih file bukti penyerahan berkas')
      return
    }

    setIsProcessingOffline(true)
    try {
      // 1. Upload file bukti penyerahan ke storage
      const fileExt = buktiPenyerahanFile.name.split('.').pop()
      const fileName = `bukti_penyerahan_${application.tracking_number}_${Date.now()}.${fileExt}`
      const filePath = `bukti-penyerahan/${application.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, buktiPenyerahanFile)

      if (uploadError) throw uploadError

      // 2. Update status menjadi Diambil dan set pickup_method jika belum ada
      await updateApplicationStatus(application.id, 'Diambil', 'Berkas diserahkan secara langsung', user?.id)
      
      // Set pickup_method ke 'offline' jika belum dipilih oleh pemohon
      if (!application.pickup_method) {
        await supabase
          .from('applications')
          .update({ 
            pickup_method: 'offline',
            pickup_method_selected_at: new Date().toISOString()
          } as never)
          .eq('id', application.id)
      }

      toast.success('Berkas berhasil diserahkan! Status diperbarui menjadi Diambil.')
      setShowOfflineDialog(false)
      setBuktiPenyerahanFile(null)
      router.push('/dashboard/verifikasi')
    } catch (error) {
      console.error('Error processing offline delivery:', error)
      toast.error('Gagal memproses penyerahan berkas')
    } finally {
      setIsProcessingOffline(false)
    }
  }

  // Handler untuk menolak dokumen individual
  const handleRejectDocument = async () => {
    if (!application || !selectedDocForReject) return
    if (!docRejectionReason.trim()) {
      toast.error('Alasan penolakan wajib diisi')
      return
    }

    setIsRejectingDoc(true)
    try {
      const response = await fetch('/api/documents/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: selectedDocForReject.id,
          applicationId: application.id,
          rejectionReason: docRejectionReason.trim(),
          rejectedBy: user?.id,
        }),
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.message)

      toast.success('Dokumen berhasil ditolak. Notifikasi telah dikirim ke pemohon.')
      setShowDocRejectDialog(false)
      setSelectedDocForReject(null)
      setDocRejectionReason('')
      loadApplication() // Reload to get updated status
    } catch (error) {
      console.error('Error rejecting document:', error)
      toast.error('Gagal menolak dokumen')
    } finally {
      setIsRejectingDoc(false)
    }
  }

  // Cek apakah bisa menolak dokumen (admin saat status Menunggu Verifikasi atau Dokumen Ditolak)
  const canRejectDocument = () => {
    if (!application) return false
    return currentRole === 'admin' && ['Menunggu Verifikasi Admin', 'Dokumen Ditolak'].includes(application.status)
  }

  // Toggle select document for rejection
  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocsForReject(prev => {
      const newSet = new Set(prev)
      if (newSet.has(docId)) {
        newSet.delete(docId)
      } else {
        newSet.add(docId)
      }
      return newSet
    })
  }

  // Open multi-reject dialog
  const openMultiRejectDialog = () => {
    const reasons = new Map<string, string>()
    selectedDocsForReject.forEach(docId => {
      reasons.set(docId, '')
    })
    setMultiRejectReasons(reasons)
    setShowMultiRejectDialog(true)
  }

  // Handler untuk menolak multiple dokumen
  const handleRejectMultipleDocuments = async () => {
    if (!application || selectedDocsForReject.size === 0) return
    
    // Validate all reasons are filled
    for (const docId of selectedDocsForReject) {
      const reason = multiRejectReasons.get(docId)
      if (!reason?.trim()) {
        toast.error('Semua alasan penolakan harus diisi')
        return
      }
    }

    setIsRejectingMultiple(true)
    try {
      const rejections = Array.from(selectedDocsForReject).map(docId => ({
        documentId: docId,
        rejectionReason: multiRejectReasons.get(docId)?.trim() || '',
      }))

      const response = await fetch('/api/documents/reject-multiple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: application.id,
          rejections,
          rejectedBy: user?.id,
        }),
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.message)

      toast.success(`${result.rejectedCount} dokumen berhasil ditolak. Notifikasi telah dikirim ke pemohon.`)
      setShowMultiRejectDialog(false)
      setSelectedDocsForReject(new Set())
      setMultiRejectReasons(new Map())
      loadApplication()
    } catch (error) {
      console.error('Error rejecting multiple documents:', error)
      toast.error('Gagal menolak dokumen')
    } finally {
      setIsRejectingMultiple(false)
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
      {/* Header Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 p-6 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4"></div>
        
        <div className="relative z-10">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-4 text-white hover:bg-white/20 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Hash className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold font-mono">{application.tracking_number}</h1>
                  {application.nomor_surat && (
                    <p className="text-blue-100 text-sm">No. Surat: {application.nomor_surat}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-blue-100 text-sm mt-3">
                <Calendar className="h-4 w-4" />
                <span>Diajukan {format(new Date(application.created_at), 'dd MMMM yyyy, HH:mm', { locale: id })} WIB</span>
              </div>
            </div>
            <StatusBadge status={application.status} />
          </div>
        </div>
      </div>

      {/* Mobile Action Buttons */}
      {canApprove() && (
        <div className="flex gap-3 lg:hidden">
          <Button className="flex-1 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-xl shadow-lg" onClick={handleApprove} disabled={isApproving}>
            {isApproving ? <LoadingSpinner size="sm" /> : <Check className="h-4 w-4 mr-2" />}
            {getApproveLabel()}
          </Button>
          <Button variant="destructive" className="flex-1 h-12 rounded-xl shadow-lg" onClick={() => setShowRejectDialog(true)}>
            <X className="h-4 w-4 mr-2" />
            Tolak
          </Button>
        </div>
      )}
      
      {/* Mobile Send Online Button */}
      {canSendOnline() && (
        <div className="lg:hidden space-y-3">
          <Button 
            className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl shadow-lg" 
            onClick={() => setShowSendOnlineDialog(true)}
          >
            <Send className="h-4 w-4 mr-2" />
            Kirim Berkas Online
          </Button>
          <Button 
            variant="outline"
            className="w-full h-12 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 rounded-xl" 
            onClick={() => setShowOfflineDialog(true)}
          >
            <HandCoins className="h-4 w-4 mr-2" />
            Berkas Diterima Langsung
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Applicant Info */}
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-blue-400 to-blue-300 rounded-full"></div>
            <Card className="ml-4 border-0 shadow-xl shadow-blue-100/50 bg-white/80 backdrop-blur-sm overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200/50">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg text-slate-800">Data Pemohon</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoItem icon={User} label="Nama Lengkap" value={application.nama_lengkap} color="blue" />
                  <InfoItem icon={Hash} label="NIP" value={application.nip} color="indigo" mono />
                  <InfoItem icon={Briefcase} label="Pangkat/Golongan" value={application.pangkat_golongan} color="violet" />
                  <InfoItem icon={Target} label="Tujuan Permohonan" value={getTujuanLabel(application.tujuan_permohonan)} color="emerald" />
                </div>
                
                {application.tujuan_permohonan !== 'lainnya_non_asn' && application.jabatan && application.jabatan !== '-' && (
                  <InfoItem icon={Briefcase} label="Jabatan" value={application.jabatan} color="amber" fullWidth />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {application.tujuan_permohonan !== 'lainnya_non_asn' && application.unit_kerja_asal && application.unit_kerja_asal !== '-' && (
                    <InfoItem icon={Building} label="Unit Kerja Asal" value={application.unit_kerja_asal} color="cyan" />
                  )}
                  {(application.tujuan_permohonan === 'mutasi' || !application.tujuan_permohonan) && application.instansi_tujuan && application.instansi_tujuan !== '-' && (
                    <InfoItem icon={MapPin} label="Instansi Tujuan" value={application.instansi_tujuan} color="rose" />
                  )}
                </div>

                {application.alasan_permohonan && application.alasan_permohonan !== '-' && (
                  <InfoItem 
                    icon={FileText} 
                    label={(application.tujuan_permohonan === 'lainnya_asn' || application.tujuan_permohonan === 'lainnya_non_asn') ? 'Tujuan dan Alasan' : 'Alasan Permohonan'} 
                    value={application.alasan_permohonan} 
                    color="slate" 
                    fullWidth 
                  />
                )}

                <div className="pt-4 border-t border-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoItem icon={Mail} label="Email" value={application.email} color="blue" />
                    <InfoItem icon={Phone} label="Nomor HP" value={application.nomor_hp} color="emerald" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Documents */}
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 via-emerald-400 to-emerald-300 rounded-full"></div>
            <Card className="ml-4 border-0 shadow-xl shadow-emerald-100/50 bg-white/80 backdrop-blur-sm overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200/50">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-lg text-slate-800">Syarat Administrasi</CardTitle>
                  </div>
                  {canRejectDocument() && selectedDocsForReject.size > 0 && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={openMultiRejectDialog}
                      className="bg-amber-500 hover:bg-amber-600 rounded-lg"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Tolak ({selectedDocsForReject.size})
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-2">
                <div className="space-y-2">
                  {documents.map((doc) => {
                    const rejection = documentRejections.get(doc.id)
                    const isSelected = selectedDocsForReject.has(doc.id)
                    const canSelect = canRejectDocument() && !rejection
                    const isPending = application.status === 'Menunggu Verifikasi Admin' && !rejection
                    return (
                      <div 
                        key={doc.id} 
                        className={`group p-3 rounded-xl border transition-all duration-200 ${
                          rejection 
                            ? 'bg-amber-50 border-amber-200' 
                            : isSelected
                              ? 'bg-red-50 border-red-200'
                              : isPending
                                ? 'bg-blue-50 border-blue-100 hover:border-blue-200'
                                : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                        } ${canSelect ? 'cursor-pointer hover:shadow-sm' : ''}`}
                        onClick={() => canSelect && toggleDocumentSelection(doc.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                              rejection 
                                ? 'bg-amber-100' 
                                : isSelected
                                  ? 'bg-red-100'
                                  : isPending
                                    ? 'bg-blue-100'
                                    : 'bg-emerald-100'
                            }`}>
                              {rejection ? (
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                              ) : isSelected ? (
                                <Check className="h-4 w-4 text-red-600" />
                              ) : isPending ? (
                                <Clock className="h-4 w-4 text-blue-600" />
                              ) : (
                                <Check className="h-4 w-4 text-emerald-600" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm text-slate-800 truncate">{getDocumentLabel(doc.document_type)}</p>
                              <p className="text-xs text-slate-500">{formatFileSize(doc.file_size)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" onClick={() => handleViewDocument(doc)} className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600 rounded-lg">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDownloadDocument(doc)} className="h-8 w-8 p-0 hover:bg-emerald-100 hover:text-emerald-600 rounded-lg">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {rejection && (
                          <div className="mt-2 pt-2 border-t border-amber-200">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs font-medium text-amber-700">Ditolak</p>
                                <p className="text-xs text-amber-600">{rejection.rejection_reason}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar - Actions (Desktop) */}
        <div className="hidden lg:block space-y-6">
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-500 via-violet-400 to-violet-300 rounded-full"></div>
            <Card className="ml-4 border-0 shadow-xl shadow-violet-100/50 bg-white/80 backdrop-blur-sm overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-200/50">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg text-slate-800">Aksi</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5 pt-2 space-y-3">
                {canApprove() ? (
                  <>
                    <Button className="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-xl shadow-lg shadow-emerald-200/50 transition-all duration-300 hover:scale-[1.02]" onClick={handleApprove} disabled={isApproving}>
                      {isApproving ? <LoadingSpinner size="sm" className="mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                      {getApproveLabel()}
                    </Button>
                    <Button variant="destructive" className="w-full h-12 rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02]" onClick={() => setShowRejectDialog(true)}>
                      <X className="h-4 w-4 mr-2" />
                      Tolak Permohonan
                    </Button>
                  </>
                ) : canSendOnline() ? (
                  <>
                    <Button 
                      className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl shadow-lg shadow-blue-200/50 transition-all duration-300 hover:scale-[1.02]" 
                      onClick={() => setShowSendOnlineDialog(true)}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Kirim Berkas Online
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full h-12 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 rounded-xl transition-all duration-300 hover:scale-[1.02]" 
                      onClick={() => setShowOfflineDialog(true)}
                    >
                      <HandCoins className="h-4 w-4 mr-2" />
                      Berkas Diterima Langsung
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Check className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-500">Tidak ada aksi yang diperlukan</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Tolak Permohonan</DialogTitle>
            <DialogDescription>Berikan alasan penolakan permohonan ini.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason" className="text-sm font-medium text-slate-600">Alasan Penolakan</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Jelaskan alasan penolakan..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="mt-2 bg-slate-50/50 border-slate-200 focus:border-red-400 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowRejectDialog(false)} className="w-full sm:w-auto rounded-xl">Batal</Button>
            <Button variant="destructive" onClick={handleReject} disabled={isRejecting || !rejectionReason.trim()} className="w-full sm:w-auto rounded-xl">
              {isRejecting && <LoadingSpinner size="sm" className="mr-2" />}
              Tolak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            {previewDoc && <LazyPDFViewer url={previewDoc.url} fileName={previewDoc.name} onDownload={handleDownloadPreview} />}
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Online Dialog */}
      <Dialog open={showSendOnlineDialog} onOpenChange={setShowSendOnlineDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <Send className="h-5 w-5" />
              Kirim Berkas Online
            </DialogTitle>
            <DialogDescription>
              Upload berkas SKBT yang sudah ditandatangani untuk dikirim ke pemohon via email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {/* Info Pemohon - Table Layout */}
            <div className="bg-slate-50 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-3 px-4 text-slate-500 w-28">Nama</td>
                    <td className="py-3 px-4 font-medium text-slate-800 text-right">{application?.nama_lengkap}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-3 px-4 text-slate-500">Email</td>
                    <td className="py-3 px-4 font-medium text-slate-800 text-right">{application?.email}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-500">No. Surat</td>
                    <td className="py-3 px-4 font-medium text-slate-800 font-mono text-right">{application?.nomor_surat || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* File Upload */}
            <div className="space-y-3">
              <Label htmlFor="skbt-file" className="text-sm font-medium text-slate-700">
                Upload Berkas SKBT (PDF)
              </Label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
                <Input
                  id="skbt-file"
                  type="file"
                  accept=".pdf"
                  onChange={handleSkbtFileChange}
                  className="cursor-pointer border-0 p-0 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-500 file:text-white hover:file:bg-blue-600 file:cursor-pointer"
                />
              </div>
              {skbtFile && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-800 truncate">{skbtFile.name}</p>
                    <p className="text-xs text-blue-500">{(skbtFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              )}
              <p className="text-xs text-slate-500">
                Maksimal 10MB. Pastikan berkas sudah ditandatangani oleh Inspektur.
              </p>
            </div>

            {/* Info */}
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-sm text-amber-800">
                <strong>Perhatian:</strong> Setelah dikirim, pemohon akan menerima email berisi tanda terima digital dan link download berkas SKBT.
              </p>
            </div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowSendOnlineDialog(false)
                setSkbtFile(null)
              }} 
              className="w-full sm:w-auto h-11 rounded-xl"
            >
              Batal
            </Button>
            <Button 
              onClick={handleSendOnline} 
              disabled={isSendingOnline || !skbtFile} 
              className="w-full sm:w-auto h-11 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-200/50"
            >
              {isSendingOnline ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Kirim Sekarang
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Offline Delivery Dialog */}
      <Dialog open={showOfflineDialog} onOpenChange={setShowOfflineDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <HandCoins className="h-5 w-5" />
              Berkas Diterima Secara Langsung
            </DialogTitle>
            <DialogDescription>
              Upload bukti penyerahan berkas atau surat tanda terima berkas dari pemohon.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {/* Info Pemohon - Table Layout */}
            <div className="bg-slate-50 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-3 px-4 text-slate-500 w-28">Nama</td>
                    <td className="py-3 px-4 font-medium text-slate-800 text-right">{application?.nama_lengkap}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-3 px-4 text-slate-500">NIP</td>
                    <td className="py-3 px-4 font-medium text-slate-800 font-mono text-right">{application?.nip}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-500">No. Surat</td>
                    <td className="py-3 px-4 font-medium text-slate-800 font-mono text-right">{application?.nomor_surat || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* File Upload */}
            <div className="space-y-3">
              <Label htmlFor="bukti-file" className="text-sm font-medium text-slate-700">
                Upload Bukti Penyerahan / Tanda Terima
              </Label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 hover:border-emerald-300 transition-colors">
                <Input
                  id="bukti-file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleBuktiPenyerahanChange}
                  className="cursor-pointer border-0 p-0 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-500 file:text-white hover:file:bg-emerald-600 file:cursor-pointer"
                />
              </div>
              {buktiPenyerahanFile && (
                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-emerald-800 truncate">{buktiPenyerahanFile.name}</p>
                    <p className="text-xs text-emerald-500">{(buktiPenyerahanFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              )}
              <p className="text-xs text-slate-500">
                Format: PDF, JPG, PNG. Maksimal 10MB.
              </p>
            </div>

            {/* Info */}
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <p className="text-sm text-emerald-800">
                <strong>Informasi:</strong> Setelah dikonfirmasi, status permohonan akan berubah menjadi &quot;Diambil&quot; dan proses dinyatakan selesai.
              </p>
            </div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowOfflineDialog(false)
                setBuktiPenyerahanFile(null)
              }} 
              className="w-full sm:w-auto h-11 rounded-xl"
            >
              Batal
            </Button>
            <Button 
              onClick={handleOfflineDelivery} 
              disabled={isProcessingOffline || !buktiPenyerahanFile} 
              className="w-full sm:w-auto h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-200/50"
            >
              {isProcessingOffline ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Memproses...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Konfirmasi Penyerahan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Rejection Dialog */}
      <Dialog open={showDocRejectDialog} onOpenChange={setShowDocRejectDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Tolak Dokumen
            </DialogTitle>
            <DialogDescription>
              Dokumen yang ditolak akan memerlukan pemohon untuk mengupload ulang.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {selectedDocForReject && (
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">Dokumen yang akan ditolak:</p>
                <p className="font-medium text-slate-800">{getDocumentLabel(selectedDocForReject.document_type)}</p>
              </div>
            )}
            <div>
              <Label htmlFor="doc-rejection-reason" className="text-sm font-medium text-slate-600">
                Alasan Penolakan <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="doc-rejection-reason"
                placeholder="Jelaskan alasan penolakan dokumen ini..."
                value={docRejectionReason}
                onChange={(e) => setDocRejectionReason(e.target.value)}
                rows={3}
                className="mt-2 bg-slate-50/50 border-slate-200 focus:border-amber-400 rounded-xl"
              />
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-xs text-amber-700">
                <strong>Perhatian:</strong> Pemohon akan menerima email notifikasi dan dapat mengupload ulang dokumen melalui halaman tracking.
              </p>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDocRejectDialog(false)
                setSelectedDocForReject(null)
                setDocRejectionReason('')
              }} 
              className="w-full sm:w-auto rounded-xl"
            >
              Batal
            </Button>
            <Button 
              variant="destructive"
              onClick={handleRejectDocument} 
              disabled={isRejectingDoc || !docRejectionReason.trim()} 
              className="w-full sm:w-auto rounded-xl bg-amber-500 hover:bg-amber-600"
            >
              {isRejectingDoc ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Memproses...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Tolak Dokumen
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Multi Document Rejection Dialog */}
      <Dialog open={showMultiRejectDialog} onOpenChange={setShowMultiRejectDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Tolak {selectedDocsForReject.size} Dokumen
            </DialogTitle>
            <DialogDescription>
              Masukkan alasan penolakan untuk setiap dokumen. Pemohon akan menerima 1 email berisi semua dokumen yang ditolak.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-2">
            {Array.from(selectedDocsForReject).map((docId, index) => {
              const doc = documents.find(d => d.id === docId)
              if (!doc) return null
              return (
                <div key={docId} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <p className="font-medium text-slate-800">{getDocumentLabel(doc.document_type)}</p>
                  </div>
                  <Textarea
                    placeholder={`Alasan penolakan untuk ${getDocumentLabel(doc.document_type)}...`}
                    value={multiRejectReasons.get(docId) || ''}
                    onChange={(e) => {
                      setMultiRejectReasons(prev => {
                        const newMap = new Map(prev)
                        newMap.set(docId, e.target.value)
                        return newMap
                      })
                    }}
                    rows={2}
                    className="bg-white border-slate-200 focus:border-amber-400 rounded-lg text-sm"
                  />
                </div>
              )
            })}
          </div>
          <div className="pt-4 border-t border-slate-200">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 mb-4">
              <p className="text-xs text-amber-700">
                <strong>Perhatian:</strong> Pemohon akan menerima 1 email notifikasi berisi daftar semua dokumen yang ditolak beserta alasannya.
              </p>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowMultiRejectDialog(false)
                  setMultiRejectReasons(new Map())
                }} 
                className="w-full sm:w-auto rounded-xl"
              >
                Batal
              </Button>
              <Button 
                variant="destructive"
                onClick={handleRejectMultipleDocuments} 
                disabled={isRejectingMultiple || Array.from(multiRejectReasons.values()).some(r => !r?.trim())} 
                className="w-full sm:w-auto rounded-xl bg-amber-500 hover:bg-amber-600"
              >
                {isRejectingMultiple ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Tolak {selectedDocsForReject.size} Dokumen
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Helper Components
function InfoItem({ icon: Icon, label, value, color, mono, fullWidth }: { 
  icon: React.ElementType; label: string; value: string; color: string; mono?: boolean; fullWidth?: boolean 
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    violet: 'bg-violet-100 text-violet-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    cyan: 'bg-cyan-100 text-cyan-600',
    rose: 'bg-rose-100 text-rose-600',
    slate: 'bg-slate-100 text-slate-600',
  }
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors ${fullWidth ? 'md:col-span-2' : ''}`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
        <p className={`font-semibold text-slate-800 ${mono ? 'font-mono text-sm' : ''}`}>{value || '-'}</p>
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
