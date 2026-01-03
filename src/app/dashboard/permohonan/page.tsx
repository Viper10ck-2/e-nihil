'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/ui/status-badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Search, ArrowRight, CheckCircle, Upload, FileText, X, Send, HandCoins } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { updateApplicationStatus } from '@/lib/services/applicationService'
import { useAuth } from '@/contexts/AuthContext'
import type { Application, ApplicationStatus } from '@/types/database'

const allStatuses: ApplicationStatus[] = [
  'Menunggu Verifikasi Admin',
  'Diverifikasi Admin',
  'Diparaf Kasubbag Anev',
  'Diproses Sekretaris',
  'Ditandatangani Inspektur',
  'Diambil',
  'Selesai', // Legacy status
  'Ditolak',
]

export default function PermohonanPage() {
  const { user } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [showPickupDialog, setShowPickupDialog] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [tandaTerimaFile, setTandaTerimaFile] = useState<File | null>(null)

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setApplications((data as Application[]) || [])
    } catch (error) {
      console.error('Error loading applications:', error)
      toast.error('Gagal memuat data permohonan')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter applications
  const filteredApplications = applications.filter((app) => {
    // Filter by status
    if (statusFilter !== 'all' && app.status !== statusFilter) return false

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        app.tracking_number.toLowerCase().includes(query) ||
        app.nama_lengkap.toLowerCase().includes(query) ||
        app.nip.includes(query)
      )
    }

    return true
  })

  const handleConfirmPickup = async () => {
    if (!selectedApp) return
    
    const isOnline = selectedApp.pickup_method === 'online'
    
    // For offline pickup, require tanda terima upload
    if (!isOnline && !tandaTerimaFile) {
      toast.error('Upload tanda terima terlebih dahulu')
      return
    }

    setIsConfirming(true)
    try {
      let notes = ''
      
      if (isOnline) {
        // For online: send email with SKBT and generate proof automatically
        const response = await fetch('/api/send-skbt-online', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            applicationId: selectedApp.id,
            trackingNumber: selectedApp.tracking_number,
            nomorSurat: selectedApp.nomor_surat,
            namaLengkap: selectedApp.nama_lengkap,
            nip: selectedApp.nip,
            email: selectedApp.email,
            tujuanPermohonan: selectedApp.tujuan_permohonan,
          }),
        })
        
        const result = await response.json()
        if (!result.success) throw new Error(result.error || 'Gagal mengirim email')
        
        notes = `SKBT dikirim via email ke ${selectedApp.email}. Bukti pengiriman: ${result.proofPath || 'tersimpan'}`
      } else {
        // For offline: upload tanda terima file
        const fileExt = tandaTerimaFile!.name.split('.').pop()
        const fileName = `tanda_terima_${selectedApp.id}_${Date.now()}.${fileExt}`
        const filePath = `tanda-terima/${fileName}`
        
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, tandaTerimaFile!)
        
        if (uploadError) throw uploadError
        
        notes = `Dokumen telah diambil oleh pemohon. Tanda terima: ${filePath}`
      }
      
      await updateApplicationStatus(selectedApp.id, 'Diambil', notes, user?.id)
      
      // Reload applications
      await loadApplications()
      
      toast.success(isOnline ? 'SKBT berhasil dikirim via email' : 'Pengambilan dokumen dikonfirmasi')
      setShowPickupDialog(false)
      setSelectedApp(null)
      setTandaTerimaFile(null)
    } catch (error) {
      console.error('Error confirming pickup:', error)
      toast.error(selectedApp.pickup_method === 'online' ? 'Gagal mengirim SKBT' : 'Gagal mengkonfirmasi pengambilan')
    } finally {
      setIsConfirming(false)
    }
  }

  const openPickupDialog = (app: Application) => {
    setSelectedApp(app)
    setTandaTerimaFile(null)
    setShowPickupDialog(true)
  }

  const handleTandaTerimaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type (PDF or image)
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
      if (!allowedTypes.includes(file.type)) {
        toast.error('File harus berformat PDF atau gambar (JPG/PNG)')
        return
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 10MB')
        return
      }
      setTandaTerimaFile(file)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Semua Permohonan</h1>
        <p className="text-slate-500 mt-1">
          Daftar semua permohonan SKBT yang masuk
        </p>
      </div>

      {/* Filters */}
      <Card className="border border-slate-200 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari berdasarkan nama, NIP, atau no. tracking..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[250px]">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {allStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-800 flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-500" />
            Riwayat Permohonan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">No. Tracking</TableHead>
                <TableHead className="w-[200px]">Nama Pemohon</TableHead>
                <TableHead className="w-[120px]">Unit Kerja</TableHead>
                <TableHead className="w-[100px]">Tanggal</TableHead>
                <TableHead className="w-[140px]">Status</TableHead>
                <TableHead className="w-[120px]">No. Surat</TableHead>
                <TableHead className="w-[140px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Tidak ada permohonan yang ditemukan
                  </TableCell>
                </TableRow>
              ) : (
                filteredApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-mono text-sm">
                      {app.tracking_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{app.nama_lengkap}</p>
                        <p className="text-sm text-muted-foreground">
                          NIP: {app.nip}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{app.unit_kerja_asal || '-'}</TableCell>
                    <TableCell>
                      {format(new Date(app.created_at), 'dd MMM yyyy', { locale: id })}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={app.status} />
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {app.nomor_surat || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {app.status === 'Ditandatangani Inspektur' && app.pickup_method && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPickupDialog(app)}
                            className={app.pickup_method === 'online' ? 'border-blue-200 text-blue-700 hover:bg-blue-50' : 'border-amber-200 text-amber-700 hover:bg-amber-50'}
                          >
                            {app.pickup_method === 'online' ? (
                              <>
                                <Send className="h-4 w-4 mr-1" />
                                Kirim
                              </>
                            ) : (
                              <>
                                <HandCoins className="h-4 w-4 mr-1" />
                                Diambil
                              </>
                            )}
                          </Button>
                        )}
                        <Link href={`/dashboard/permohonan/${app.id}`}>
                          <Button variant="ghost" size="sm">
                            Detail
                            <ArrowRight className="ml-1 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pickup Confirmation Dialog */}
      <Dialog open={showPickupDialog} onOpenChange={setShowPickupDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                selectedApp?.pickup_method === 'online' ? 'bg-blue-100' : 'bg-emerald-100'
              }`}>
                {selectedApp?.pickup_method === 'online' ? (
                  <Send className="h-6 w-6 text-blue-600" />
                ) : (
                  <HandCoins className="h-6 w-6 text-emerald-600" />
                )}
              </div>
              <div>
                <DialogTitle className="text-lg">
                  {selectedApp?.pickup_method === 'online' ? 'Konfirmasi Pengiriman Online' : 'Konfirmasi Pengambilan'}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  {selectedApp?.pickup_method === 'online' 
                    ? 'Kirim SKBT via email ke pemohon' 
                    : 'Konfirmasi pengambilan Surat Keterangan Bebas Temuan'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">No. Tracking</span>
                  <span className="font-mono font-semibold text-slate-800">{selectedApp.tracking_number}</span>
                </div>
                <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                  <span className="text-sm text-slate-500">Nama</span>
                  <span className="font-medium text-slate-800">{selectedApp.nama_lengkap}</span>
                </div>
                <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                  <span className="text-sm text-slate-500">No. Surat</span>
                  <span className="font-mono font-semibold text-slate-800">{selectedApp.nomor_surat}</span>
                </div>
                {selectedApp.pickup_method === 'online' && (
                  <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                    <span className="text-sm text-slate-500">Email Tujuan</span>
                    <span className="font-medium text-blue-600">{selectedApp.email}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                  <span className="text-sm text-slate-500">Metode</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedApp.pickup_method === 'online' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {selectedApp.pickup_method === 'online' ? 'Kirim Online' : 'Ambil Langsung'}
                  </span>
                </div>
              </div>
              
              {/* For Online: Show auto-generated proof info */}
              {selectedApp.pickup_method === 'online' ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-800">Bukti Pengiriman Otomatis</p>
                      <p className="text-xs text-blue-600 mt-1">
                        Sistem akan otomatis membuat bukti pengiriman berupa email konfirmasi yang dikirim ke pemohon.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* For Offline: Upload Tanda Terima */
                <div className="space-y-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Upload className="h-4 w-4 text-slate-500" />
                    Upload Bukti Pengambilan <span className="text-red-500">*</span>
                  </label>
                  {tandaTerimaFile ? (
                    <div className="flex items-center justify-between p-4 border-2 rounded-xl bg-emerald-50 border-emerald-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-emerald-800 block truncate max-w-[180px]">
                            {tandaTerimaFile.name}
                          </span>
                          <span className="text-xs text-emerald-600">
                            {(tandaTerimaFile.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTandaTerimaFile(null)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-slate-400 hover:bg-slate-50 transition-all cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleTandaTerimaChange}
                        className="hidden"
                        id="tanda-terima-upload"
                      />
                      <label htmlFor="tanda-terima-upload" className="cursor-pointer">
                        <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Upload className="h-7 w-7 text-slate-500" />
                        </div>
                        <p className="text-sm font-medium text-slate-700">
                          Klik untuk upload bukti pengambilan
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          PDF atau gambar (maks. 10MB)
                        </p>
                      </label>
                    </div>
                  )}
                </div>
              )}
              
              <div className={`border rounded-lg p-3 ${
                selectedApp.pickup_method === 'online' 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-amber-50 border-amber-200'
              }`}>
                <p className={`text-sm ${
                  selectedApp.pickup_method === 'online' ? 'text-blue-800' : 'text-amber-800'
                }`}>
                  {selectedApp.pickup_method === 'online' ? (
                    <>
                      <strong>Info:</strong> SKBT akan dikirim ke email pemohon beserta tanda terima digital.
                    </>
                  ) : (
                    <>
                      <strong>Penting:</strong> Pastikan pemohon telah menunjukkan identitas diri (KTP/Kartu Pegawai) 
                      dan menandatangani tanda terima.
                    </>
                  )}
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setShowPickupDialog(false)}
              className="border-slate-300"
            >
              Batal
            </Button>
            <Button 
              onClick={handleConfirmPickup} 
              disabled={isConfirming || (selectedApp?.pickup_method === 'offline' && !tandaTerimaFile)}
              className={selectedApp?.pickup_method === 'online' 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-emerald-600 hover:bg-emerald-700'}
            >
              {isConfirming && <LoadingSpinner size="sm" className="mr-2" />}
              {selectedApp?.pickup_method === 'online' ? (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Kirim SKBT
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Konfirmasi Diambil
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
