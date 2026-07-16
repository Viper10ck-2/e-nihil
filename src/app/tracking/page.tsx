'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { StatusTimeline } from '@/components/tracking/StatusTimeline'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Search, User, Building, MapPin, Calendar, Target, FileSearch, CheckCircle, Clock, Sparkles, AlertTriangle, Upload, FileText, Send, HandCoins } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { getTrackingApplication } from '@/lib/actions'
import { toast } from 'sonner'
import type { Application, StatusHistory, DocumentWithRejection, PickupMethod } from '@/types/database'

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  surat_permohonan: 'Surat Permohonan',
  surat_pernyataan_bebas_temuan: 'Surat Pernyataan Bebas Temuan',
  surat_rekomendasi: 'Surat Rekomendasi',
  sk_pns: 'SK PNS',
  sk_pangkat_terakhir: 'SK Pangkat Terakhir',
  daftar_riwayat_pekerjaan: 'Daftar Riwayat Pekerjaan',
  skp: 'SKP',
}

// Wrapper component with Suspense for useSearchParams
export default function TrackingPage() {
  return (
    <Suspense fallback={<TrackingPageLoading />}>
      <TrackingPageContent />
    </Suspense>
  )
}

// Loading fallback component
function TrackingPageLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )
}

// Main content component
function TrackingPageContent() {
  const searchParams = useSearchParams()
  const [trackingNumber, setTrackingNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [application, setApplication] = useState<Application | null>(null)
  const [history, setHistory] = useState<StatusHistory[]>([])
  const [rejectedDocuments, setRejectedDocuments] = useState<DocumentWithRejection[]>([])
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null)
  const [initialSearchDone, setInitialSearchDone] = useState(false)
  const [isSendingPickupChoice, setIsSendingPickupChoice] = useState(false)
  const [pickupChoiceSent, setPickupChoiceSent] = useState(false)
  const [savedPickupMethod, setSavedPickupMethod] = useState<PickupMethod | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingPickupMethod, setPendingPickupMethod] = useState<'online' | 'offline' | null>(null)

  // Function to search by tracking number
  const searchByTrackingNumber = useCallback(async (trackingNo: string) => {
    if (!trackingNo.trim()) return

    setIsLoading(true)
    setError(null)
    setApplication(null)
    setSavedPickupMethod(null)
    setPickupChoiceSent(false)

    try {
      const result = await getTrackingApplication(trackingNo.toUpperCase())
      
      if (result.application) {
        setApplication(result.application)
        
        // Check if pickup method already selected
        if (result.application.pickup_method) {
          setSavedPickupMethod(result.application.pickup_method as unknown as PickupMethod)
          setPickupChoiceSent(true)
        }
        
        setHistory(result.statusHistory as unknown as StatusHistory[])
        
        // Load rejected documents if status is "Dokumen Ditolak"
        if (result.application.status === 'Dokumen Ditolak') {
          try {
            const response = await fetch(`/api/applications/${trackingNo.toUpperCase()}/rejected-documents`)
            const result = await response.json()
            if (result.success) {
              setRejectedDocuments(result.data.documents || [])
            }
          } catch (err) {
            console.error('Error loading rejected documents:', err)
          }
        } else {
          setRejectedDocuments([])
        }
      } else {
        setError('Nomor tracking tidak ditemukan')
      }
    } catch (err) {
      console.error('Error searching:', err)
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Check for query parameter on mount
  useEffect(() => {
    if (initialSearchDone) return
    
    const noParam = searchParams.get('no')
    if (noParam) {
      setTrackingNumber(noParam.toUpperCase())
      searchByTrackingNumber(noParam)
      setInitialSearchDone(true)
    }
  }, [searchParams, searchByTrackingNumber, initialSearchDone])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!trackingNumber.trim()) {
      setError('Masukkan nomor tracking')
      return
    }

    await searchByTrackingNumber(trackingNumber)
  }

  const handleReuploadDocument = async (doc: DocumentWithRejection, file: File) => {
    if (!application) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Format file tidak didukung. Gunakan PDF, JPG, atau PNG')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 10MB')
      return
    }

    setUploadingDocId(doc.id)
    try {
      const formData = new FormData()
      formData.append('documentId', doc.id)
      formData.append('applicationId', application.id)
      formData.append('trackingNumber', application.tracking_number)
      formData.append('file', file)

      const response = await fetch('/api/documents/reupload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      if (!result.success) throw new Error(result.message)

      toast.success(result.message)
      
      // Reload application data
      const reloaded = await getTrackingApplication(trackingNumber.toUpperCase())
      if (reloaded.application) {
        setApplication(reloaded.application)
        setHistory(reloaded.statusHistory as unknown as StatusHistory[])
        
        // Reload rejected documents
        if (reloaded.application.status === 'Dokumen Ditolak') {
          const rejResponse = await fetch(`/api/applications/${trackingNumber.toUpperCase()}/rejected-documents`)
          const rejResult = await rejResponse.json()
          if (rejResult.success) {
            setRejectedDocuments(rejResult.data.documents || [])
          }
        } else {
          setRejectedDocuments([])
        }
      }
    } catch (error) {
      console.error('Error reuploading document:', error)
      toast.error('Gagal mengupload dokumen. Silakan coba lagi.')
    } finally {
      setUploadingDocId(null)
    }
  }

  // Handler untuk pilihan pengambilan SKBT
  const handlePickupChoice = async (method: 'online' | 'offline') => {
    setPendingPickupMethod(method)
    setShowConfirmDialog(true)
  }

  // Handler untuk konfirmasi pilihan
  const confirmPickupChoice = async () => {
    if (!application || !pendingPickupMethod) return

    setShowConfirmDialog(false)
    setIsSendingPickupChoice(true)
    try {
      const response = await fetch('/api/send-pickup-choice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingNumber: application.tracking_number,
          nomorSurat: application.nomor_surat,
          namaLengkap: application.nama_lengkap,
          nip: application.nip,
          email: application.email,
          nomorHp: application.nomor_hp,
          pickupMethod: pendingPickupMethod,
        }),
      })

      const result = await response.json()
      
      if (result.alreadySelected) {
        toast.error('Pilihan pengambilan sudah dipilih sebelumnya dan tidak dapat diubah.')
        setSavedPickupMethod(pendingPickupMethod)
        setPickupChoiceSent(true)
        return
      }
      
      if (!result.success) throw new Error('Gagal mengirim pilihan')

      setSavedPickupMethod(pendingPickupMethod)
      setPickupChoiceSent(true)
      const methodLabel = pendingPickupMethod === 'online' ? 'dikirim via email' : 'diproses di kantor'
      toast.success(`Pilihan pengambilan berhasil dikirim! Admin akan segera memproses berkas untuk ${methodLabel}.`)
    } catch (error) {
      console.error('Error sending pickup choice:', error)
      toast.error('Gagal mengirim pilihan. Silakan coba lagi.')
    } finally {
      setIsSendingPickupChoice(false)
      setPendingPickupMethod(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-blue-500 to-cyan-500"></div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4"></div>
        <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-white/5 rounded-full"></div>
        
        <div className="relative container py-12">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <FileSearch className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Cek Status Permohonan</h1>
            <p className="text-blue-100 text-base md:text-lg max-w-xl mx-auto">
              Masukkan nomor tracking untuk melihat status permohonan SKBT Anda secara real-time
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-6 text-sm">
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <Clock className="h-4 w-4 text-blue-100" /> <span className="text-white">Update Real-time</span>
              </div>
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <Sparkles className="h-4 w-4 text-blue-100" /> <span className="text-white">Mudah & Cepat</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60V30C240 50 480 10 720 30C960 50 1200 10 1440 30V60H0Z" className="fill-slate-50/50"/>
            <path d="M0 60V40C240 55 480 25 720 40C960 55 1200 25 1440 40V60H0Z" className="fill-blue-50"/>
          </svg>
        </div>
      </div>

      <div className="container py-8">
        <div className="max-w-3xl mx-auto">
          {/* Search Form */}
          <Card className="mb-8 border-0 shadow-xl shadow-blue-100/50 bg-white/80 backdrop-blur-sm overflow-hidden -mt-8 relative z-10">
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    placeholder="Masukkan nomor tracking (contoh: SKBT-20260103-0001)"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value.toUpperCase().replace(/\s/g, ''))}
                    onKeyDown={(e) => {
                      if (e.key === ' ') {
                        e.preventDefault()
                      }
                    }}
                    className="font-mono uppercase pl-12 h-12 bg-slate-50/50 border-slate-200 focus:border-blue-400 focus:bg-white transition-colors rounded-xl text-base"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="h-12 px-8 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-200/50 rounded-xl transition-all duration-300 hover:scale-[1.02]"
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Cari
                    </>
                  )}
                </Button>
              </form>
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl">
                  <p className="text-sm text-red-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400"></span>
                    {error}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Result */}
          {application && (
            <div className="space-y-6">
              {/* Application Info */}
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-blue-400 to-blue-300 rounded-full"></div>
                <Card className="ml-4 border-0 shadow-xl shadow-blue-100/50 bg-white/80 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200/50">
                          <FileSearch className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-mono text-slate-800">
                            {application.tracking_number}
                          </CardTitle>
                          <CardDescription className="text-slate-500">
                            Diajukan pada {format(new Date(application.created_at), 'dd MMMM yyyy', { locale: id })}
                          </CardDescription>
                        </div>
                      </div>
                      <StatusBadge status={application.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="p-5">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50/50">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Pemohon</p>
                          <p className="font-semibold text-sm text-slate-800 truncate">{application.nama_lengkap}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50/50">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <Target className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Tujuan</p>
                          <p className="font-semibold text-sm text-slate-800 truncate">
                            {application.tujuan_permohonan === 'mutasi' && 'Mutasi'}
                            {application.tujuan_permohonan === 'promosi' && 'Promosi'}
                            {application.tujuan_permohonan === 'lainnya_asn' && 'Lainnya (ASN)'}
                            {application.tujuan_permohonan === 'lainnya_non_asn' && 'Lainnya (Non-ASN)'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50/50">
                        <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                          <Building className="h-4 w-4 text-violet-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Unit Kerja</p>
                          <p className="font-semibold text-sm text-slate-800 truncate">{application.unit_kerja_asal || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50/50">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-4 w-4 text-amber-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Instansi Tujuan</p>
                          <p className="font-semibold text-sm text-slate-800 truncate">{application.instansi_tujuan || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50/50 col-span-2 md:col-span-2">
                        <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-4 w-4 text-cyan-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Terakhir Update</p>
                          <p className="font-semibold text-sm text-slate-800">
                            {format(new Date(application.updated_at), 'dd MMM yyyy, HH:mm', { locale: id })} WIB
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Status Timeline */}
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 via-indigo-400 to-indigo-300 rounded-full"></div>
                <Card className="ml-4 border-0 shadow-xl shadow-indigo-100/50 bg-white/80 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200/50">
                        <Clock className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-lg text-slate-800">Riwayat Status</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5">
                    <StatusTimeline
                      currentStatus={application.status}
                      history={history}
                      rejectionReason={application.rejection_reason}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Rejected Documents Section */}
              {application.status === 'Dokumen Ditolak' && rejectedDocuments.length > 0 && (
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500 via-amber-400 to-amber-300 rounded-full"></div>
                  <Card className="ml-4 border-0 shadow-xl shadow-amber-100/50 bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200/50">
                          <AlertTriangle className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg text-amber-700">Dokumen Perlu Diperbaiki</CardTitle>
                          <CardDescription className="text-amber-600">
                            Upload ulang dokumen yang ditolak untuk melanjutkan proses
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                      {rejectedDocuments.map((doc) => (
                        <div key={doc.id} className="p-4 bg-white/80 rounded-xl border border-amber-200">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                              <FileText className="h-5 w-5 text-amber-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-800">
                                {DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}
                              </p>
                              {doc.rejection && (
                                <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-100">
                                  <p className="text-xs text-amber-600 font-medium">Alasan Penolakan:</p>
                                  <p className="text-sm text-amber-700 mt-1">{doc.rejection.rejection_reason}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Upload Form */}
                          <div className="mt-3">
                            <label className="block">
                              <div className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                                uploadingDocId === doc.id 
                                  ? 'border-amber-300 bg-amber-50' 
                                  : 'border-amber-200 hover:border-amber-400 hover:bg-amber-50/50'
                              }`}>
                                {uploadingDocId === doc.id ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <LoadingSpinner size="sm" />
                                    <span className="text-sm text-amber-600">Mengupload...</span>
                                  </div>
                                ) : (
                                  <>
                                    <Upload className="h-6 w-6 mx-auto text-amber-500 mb-2" />
                                    <p className="text-sm text-amber-700 font-medium">Klik untuk upload dokumen baru</p>
                                    <p className="text-xs text-amber-500 mt-1">PDF, JPG, PNG (Maks. 10MB)</p>
                                  </>
                                )}
                              </div>
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="hidden"
                                disabled={uploadingDocId !== null}
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    handleReuploadDocument(doc, file)
                                  }
                                  e.target.value = ''
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      ))}
                      
                      <div className="p-3 bg-white/60 rounded-xl border border-amber-100">
                        <p className="text-xs text-amber-700">
                          <strong>Informasi:</strong> Setelah semua dokumen diperbaiki, permohonan Anda akan diverifikasi kembali oleh Admin.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Pickup Choice Section - Status Ditandatangani Inspektur */}
              {application.status === 'Ditandatangani Inspektur' && (
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 via-emerald-400 to-emerald-300 rounded-full"></div>
                  <Card className="ml-4 border-0 shadow-xl shadow-emerald-100/50 bg-gradient-to-br from-emerald-50 to-green-50 overflow-hidden">
                    <CardHeader className="pb-2 pt-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-md">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-base text-emerald-700">SKBT telah selesai diproses!</CardTitle>
                          <CardDescription className="text-xs text-emerald-600">
                            {pickupChoiceSent ? 'Pilihan telah dikonfirmasi' : 'Pilih metode pengambilan'}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      {/* Pickup Info */}
                      <div className="mb-4 p-3 bg-white/60 rounded-xl border border-emerald-100">
                        <p className="text-sm text-emerald-700">
                          Surat Keterangan Bebas Temuan Anda telah ditandatangani oleh Inspektur dan siap untuk diselesaikan.
                        </p>
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="p-3 bg-emerald-50/50 rounded-lg">
                            <p className="font-semibold text-emerald-800 text-xs mb-1 flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> Lokasi
                            </p>
                            <p className="text-xs text-emerald-700">
                              Kantor Inspektorat Daerah Kabupaten Bintan
                            </p>
                          </div>
                          <div className="p-3 bg-emerald-50/50 rounded-lg">
                            <p className="font-semibold text-emerald-800 text-xs mb-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" /> Jam Operasional
                            </p>
                            <p className="text-xs text-emerald-700">
                              Senin - Jumat: 08.00 - 16.00 WIB
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {pickupChoiceSent ? (
                        <div className="flex items-center justify-between p-3 bg-white/70 rounded-lg border border-emerald-200">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-emerald-600" />
                            <span className="text-sm text-emerald-700 font-medium">Pilihan Terkirim</span>
                          </div>
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                            savedPickupMethod === 'online' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {savedPickupMethod === 'online' ? <Send className="h-3 w-3" /> : <HandCoins className="h-3 w-3" />}
                            {savedPickupMethod === 'online' ? 'Online' : 'Ambil Langsung'}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex gap-2 mb-3">
                            <button
                              onClick={() => handlePickupChoice('online')}
                              disabled={isSendingPickupChoice}
                              className="flex-1 flex items-center gap-2 p-3 bg-white/80 rounded-lg border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all disabled:opacity-50"
                            >
                              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <Send className="h-4 w-4 text-blue-600" />
                              </div>
                              <div className="text-left min-w-0">
                                <p className="font-semibold text-sm text-blue-700">Kirim Online</p>
                                <p className="text-[10px] text-slate-500 truncate">Dikirim via email</p>
                              </div>
                            </button>
                            <button
                              onClick={() => handlePickupChoice('offline')}
                              disabled={isSendingPickupChoice}
                              className="flex-1 flex items-center gap-2 p-3 bg-white/80 rounded-lg border-2 border-amber-200 hover:border-amber-400 hover:bg-amber-50/50 transition-all disabled:opacity-50"
                            >
                              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                                <HandCoins className="h-4 w-4 text-amber-600" />
                              </div>
                              <div className="text-left min-w-0">
                                <p className="font-semibold text-sm text-amber-700">Ambil Langsung</p>
                                <p className="text-[10px] text-slate-500 truncate">Di kantor Inspektorat</p>
                              </div>
                            </button>
                          </div>
                          {isSendingPickupChoice && (
                            <div className="flex items-center justify-center gap-2 text-emerald-600 py-2">
                              <LoadingSpinner size="sm" />
                              <span className="text-xs">Mengirim...</span>
                            </div>
                          )}
                          <p className="text-[10px] text-amber-700 bg-amber-50/50 p-2 rounded-lg">
                            ⚠️ Pilihan hanya dapat dipilih 1 kali dan tidak dapat diubah
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Pickup Completed - Status Selesai */}
              {application.status === 'Selesai' && (
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 via-emerald-400 to-emerald-300 rounded-full"></div>
                  <Card className="ml-4 border-0 shadow-xl shadow-emerald-100/50 bg-gradient-to-br from-emerald-50 to-green-50 overflow-hidden">
                    <CardHeader className="pb-2 pt-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-md">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-base text-emerald-700">Permohonan Selesai</CardTitle>
                          <CardDescription className="text-xs text-emerald-600">
                            SKBT telah selesai diproses
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <div className="p-3 bg-white/70 rounded-lg border border-emerald-200">
                        <div className="flex items-center gap-2 text-emerald-700">
                          <CheckCircle className="h-5 w-5" />
                          <span className="text-sm font-medium">Surat Keterangan Bebas Temuan telah selesai</span>
                        </div>
                        <p className="text-xs text-emerald-600 mt-2">
                          Terima kasih telah menggunakan layanan e-Nihil Inspektorat Daerah Kabupaten Bintan.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!application && !isLoading && !error && (
            <div className="text-center py-16 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-100">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                <FileSearch className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">Lacak Permohonan Anda</h3>
              <p className="text-slate-500 max-w-sm mx-auto">
                Masukkan nomor tracking yang Anda terima saat mengajukan permohonan SKBT
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Konfirmasi Pilihan Pengambilan
            </DialogTitle>
            <DialogDescription>
              Pilihan ini tidak dapat diubah setelah dikonfirmasi.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className={`p-4 rounded-xl border-2 ${
              pendingPickupMethod === 'online' 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  pendingPickupMethod === 'online' ? 'bg-blue-100' : 'bg-amber-100'
                }`}>
                  {pendingPickupMethod === 'online' ? (
                    <Send className="h-6 w-6 text-blue-600" />
                  ) : (
                    <HandCoins className="h-6 w-6 text-amber-600" />
                  )}
                </div>
                <div>
                  <p className={`font-semibold ${
                    pendingPickupMethod === 'online' ? 'text-blue-700' : 'text-amber-700'
                  }`}>
                    {pendingPickupMethod === 'online' ? 'Kirim Online (Email)' : 'Ambil Langsung di Kantor'}
                  </p>
                  <p className="text-sm text-slate-600">
                    {pendingPickupMethod === 'online' 
                      ? 'Berkas SKBT akan dikirim ke email Anda' 
                      : 'Ambil berkas fisik di Kantor Inspektorat'}
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
              <strong className="text-amber-700">⚠️ Perhatian:</strong> Setelah mengklik &quot;Konfirmasi&quot;, pilihan Anda akan disimpan dan <strong>tidak dapat diubah</strong>.
            </p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowConfirmDialog(false)
                setPendingPickupMethod(null)
              }}
              className="w-full sm:w-auto rounded-xl"
            >
              Batal
            </Button>
            <Button 
              onClick={confirmPickupChoice}
              disabled={isSendingPickupChoice}
              className={`w-full sm:w-auto rounded-xl ${
                pendingPickupMethod === 'online'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {isSendingPickupChoice ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Memproses...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Konfirmasi
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
