'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { LazyPDFViewer } from '@/components/ui/lazy-pdf-viewer'
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
  ArrowLeft, Check, FileText, Download, Eye, User, Building, MapPin, Mail, Phone, Target, Calendar, Hash, Briefcase, Send, HandCoins, Receipt
} from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { jsPDF } from 'jspdf'
import type { Application, Document } from '@/types/database'

interface DeliveryProof {
  type: string
  trackingNumber: string
  nomorSurat: string
  namaLengkap: string
  nip: string
  email: string
  sentAt: string
  messageId?: string
}

interface OfflinePickupProof {
  filePath: string
  fileName: string
  uploadedAt: string
}

export default function PermohonanDetailPage() {
  const router = useRouter()
  const params = useParams()
  
  const [application, setApplication] = useState<Application | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string; filePath: string } | null>(null)
  const [deliveryProof, setDeliveryProof] = useState<DeliveryProof | null>(null)
  const [offlineProof, setOfflineProof] = useState<OfflinePickupProof | null>(null)
  const [showProofDialog, setShowProofDialog] = useState(false)

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
      
      // Load delivery proof if status is Diambil/Selesai
      const appData = app as Application
      if (appData.status === 'Diambil' || appData.status === 'Selesai') {
        if (appData.pickup_method === 'online') {
          await loadDeliveryProof(appData.tracking_number)
        } else {
          // Load offline pickup proof
          await loadOfflineProof(appData.id, appData.tracking_number)
        }
      }
    } catch (error) {
      console.error('Error loading application:', error)
      toast.error('Gagal memuat data permohonan')
    } finally {
      setIsLoading(false)
    }
  }

  const loadDeliveryProof = async (trackingNumber: string) => {
    try {
      // List files in bukti-pengiriman folder
      const { data: files, error } = await supabase.storage
        .from('documents')
        .list('bukti-pengiriman', {
          search: `online_${trackingNumber}`
        })
      
      if (error || !files || files.length === 0) return
      
      // Get the proof file
      const proofFile = files[0]
      const { data, error: downloadError } = await supabase.storage
        .from('documents')
        .download(`bukti-pengiriman/${proofFile.name}`)
      
      if (downloadError) return
      
      const text = await data.text()
      const proofData = JSON.parse(text) as DeliveryProof
      setDeliveryProof(proofData)
    } catch (error) {
      console.error('Error loading delivery proof:', error)
    }
  }

  const loadOfflineProof = async (applicationId: string, _trackingNumber: string) => {
    try {
      // Try to find bukti penyerahan in storage
      const { data: files, error } = await supabase.storage
        .from('documents')
        .list(`bukti-penyerahan/${applicationId}`)
      
      if (error || !files || files.length === 0) {
        // Also try tanda-terima folder (legacy)
        const { data: tandaTerimaFiles, error: ttError } = await supabase.storage
          .from('documents')
          .list('tanda-terima', {
            search: applicationId
          })
        
        if (ttError || !tandaTerimaFiles || tandaTerimaFiles.length === 0) return
        
        const file = tandaTerimaFiles[0]
        setOfflineProof({
          filePath: `tanda-terima/${file.name}`,
          fileName: file.name,
          uploadedAt: file.created_at || new Date().toISOString()
        })
        return
      }
      
      const file = files[0]
      setOfflineProof({
        filePath: `bukti-penyerahan/${applicationId}/${file.name}`,
        fileName: file.name,
        uploadedAt: file.created_at || new Date().toISOString()
      })
    } catch (error) {
      console.error('Error loading offline proof:', error)
    }
  }

  const handleViewOfflineProof = async () => {
    if (!offlineProof) return
    try {
      const { data } = supabase.storage.from('documents').getPublicUrl(offlineProof.filePath)
      setPreviewDoc({ url: data.publicUrl, name: offlineProof.fileName, filePath: offlineProof.filePath })
    } catch (error) {
      console.error('Error viewing offline proof:', error)
      toast.error('Gagal membuka bukti pengambilan')
    }
  }

  const handleDownloadOfflineProof = async () => {
    if (!offlineProof) return
    try {
      const { data, error } = await supabase.storage.from('documents').download(offlineProof.filePath)
      if (error) throw error
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = offlineProof.fileName
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Bukti pengambilan berhasil diunduh')
    } catch (error) {
      console.error('Error downloading offline proof:', error)
      toast.error('Gagal mengunduh bukti pengambilan')
    }
  }

  const handleDownloadProof = () => {
    if (!deliveryProof || !application) return
    
    // Generate PDF
    const doc = new jsPDF()
    
    // Header
    doc.setFillColor(34, 197, 94) // green-500
    doc.rect(0, 0, 210, 40, 'F')
    
    // Checkmark circle
    doc.setFillColor(255, 255, 255)
    doc.circle(105, 25, 12, 'F')
    doc.setTextColor(34, 197, 94)
    doc.setFontSize(20)
    doc.text('✓', 102, 30)
    
    // Title
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.text('BUKTI PENGIRIMAN SKBT ONLINE', 105, 50, { align: 'center' })
    
    // Reset colors
    doc.setTextColor(0, 0, 0)
    
    // Receipt box
    doc.setDrawColor(34, 197, 94)
    doc.setLineWidth(0.5)
    doc.roundedRect(20, 60, 170, 120, 3, 3, 'S')
    
    // Receipt title
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text('BUKTI PENGIRIMAN DIGITAL', 105, 70, { align: 'center' })
    
    // Dashed line
    doc.setLineDashPattern([2, 2], 0)
    doc.line(30, 75, 180, 75)
    doc.setLineDashPattern([], 0)
    
    // Content
    doc.setFontSize(11)
    const startY = 85
    const lineHeight = 10
    const labelX = 30
    const valueX = 85
    
    const fields = [
      ['No. Registrasi', deliveryProof.trackingNumber],
      ['No. Surat', deliveryProof.nomorSurat],
      ['Nama Pemohon', deliveryProof.namaLengkap],
      ['NIP', deliveryProof.nip],
      ['Email Tujuan', deliveryProof.email],
      ['Metode Pengiriman', 'Online (Email)'],
      ['Tanggal Kirim', format(new Date(deliveryProof.sentAt), 'dd MMMM yyyy, HH:mm', { locale: id }) + ' WIB'],
      ['ID Pesan', deliveryProof.messageId || '-'],
    ]
    
    fields.forEach((field, index) => {
      const y = startY + (index * lineHeight)
      doc.setTextColor(100, 100, 100)
      doc.text(field[0], labelX, y)
      doc.setTextColor(30, 58, 95)
      doc.setFont('helvetica', index < 2 ? 'bold' : 'normal')
      doc.text(field[1], valueX, y)
      doc.setFont('helvetica', 'normal')
    })
    
    // Bottom dashed line
    doc.setLineDashPattern([2, 2], 0)
    doc.line(30, 165, 180, 165)
    doc.setLineDashPattern([], 0)
    
    // Note
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.text('Dokumen ini merupakan bukti sah pengiriman SKBT secara online', 105, 173, { align: 'center' })
    
    // Footer
    doc.setFontSize(10)
    doc.text('e-Nihil - Inspektorat Daerah Kabupaten Bintan', 105, 200, { align: 'center' })
    doc.setFontSize(8)
    doc.text('Jl. Bintan Buyu, Bandar Seri Bentan, Kabupaten Bintan, Kepulauan Riau', 105, 207, { align: 'center' })
    
    // Save
    doc.save(`Bukti_Pengiriman_${application.tracking_number}.pdf`)
    toast.success('Bukti pengiriman berhasil diunduh')
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

      {/* Delivery/Pickup Proof Section */}
      {(application.status === 'Diambil' || application.status === 'Selesai') && (
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                application.pickup_method === 'online' ? 'bg-blue-100' : 'bg-amber-100'
              }`}>
                {application.pickup_method === 'online' ? (
                  <Send className="h-5 w-5 text-blue-600" />
                ) : (
                  <HandCoins className="h-5 w-5 text-amber-600" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg text-slate-800">
                  {application.pickup_method === 'online' ? 'Bukti Pengiriman Online' : 'Bukti Pengambilan'}
                </CardTitle>
                <p className="text-sm text-slate-500">
                  {application.pickup_method === 'online' 
                    ? 'SKBT telah dikirim via email' 
                    : 'SKBT telah diambil langsung di kantor'}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {application.pickup_method === 'online' && deliveryProof ? (
              <div className="space-y-4">
                {/* Proof Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-blue-600 text-xs font-medium uppercase">Email Tujuan</p>
                      <p className="text-blue-800 font-medium">{deliveryProof.email}</p>
                    </div>
                    <div>
                      <p className="text-blue-600 text-xs font-medium uppercase">Tanggal Kirim</p>
                      <p className="text-blue-800 font-medium">
                        {format(new Date(deliveryProof.sentAt), 'dd MMM yyyy, HH:mm', { locale: id })} WIB
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-blue-600 text-xs font-medium uppercase">ID Pesan</p>
                      <p className="text-blue-800 font-mono text-xs">{deliveryProof.messageId || '-'}</p>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowProofDialog(true)}
                    className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Lihat Bukti
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleDownloadProof}
                    className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            ) : application.pickup_method === 'offline' || !application.pickup_method ? (
              offlineProof ? (
                <div className="space-y-4">
                  {/* Proof Summary */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-amber-800 font-medium">Bukti Pengambilan Tersimpan</p>
                        <p className="text-amber-600 text-sm">{offlineProof.fileName}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={handleViewOfflineProof}
                      className="flex-1 border-amber-200 text-amber-700 hover:bg-amber-50"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Lihat Bukti
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleDownloadOfflineProof}
                      className="flex-1 border-amber-200 text-amber-700 hover:bg-amber-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Receipt className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-amber-800 font-medium">Bukti Pengambilan</p>
                      <p className="text-amber-600 text-sm">Bukti pengambilan tidak tersedia</p>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="text-center py-4 text-slate-500">
                <p>Bukti pengiriman tidak tersedia</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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

      {/* Delivery Proof Preview Dialog */}
      <Dialog open={showProofDialog} onOpenChange={setShowProofDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-500" />
              Bukti Pengiriman Online
            </DialogTitle>
          </DialogHeader>
          {deliveryProof && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5">
                <div className="text-center mb-4">
                  <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check className="h-7 w-7 text-white" />
                  </div>
                  <p className="text-xs text-blue-600 uppercase tracking-wider font-medium">Bukti Pengiriman Digital</p>
                </div>
                
                <div className="border-t border-dashed border-blue-300 my-4"></div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">No. Registrasi</span>
                    <span className="font-mono font-semibold text-slate-800">{deliveryProof.trackingNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">No. Surat</span>
                    <span className="font-mono font-semibold text-slate-800">{deliveryProof.nomorSurat}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nama Pemohon</span>
                    <span className="font-medium text-slate-800">{deliveryProof.namaLengkap}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">NIP</span>
                    <span className="font-mono text-slate-800">{deliveryProof.nip}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email Tujuan</span>
                    <span className="text-blue-600">{deliveryProof.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Metode</span>
                    <span className="text-slate-800">Online (Email)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tanggal Kirim</span>
                    <span className="text-slate-800">
                      {format(new Date(deliveryProof.sentAt), 'dd MMM yyyy, HH:mm', { locale: id })} WIB
                    </span>
                  </div>
                </div>
                
                <div className="border-t border-dashed border-blue-300 my-4"></div>
                
                <div className="text-center">
                  <p className="text-xs text-slate-500">ID Pesan:</p>
                  <p className="font-mono text-xs text-slate-600 break-all">{deliveryProof.messageId || '-'}</p>
                </div>
              </div>
              
              <Button onClick={handleDownloadProof} className="w-full bg-blue-600 hover:bg-blue-700">
                <Download className="h-4 w-4 mr-2" />
                Download Bukti Pengiriman
              </Button>
            </div>
          )}
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
