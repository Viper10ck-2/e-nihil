'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { StatusTimeline } from '@/components/tracking/StatusTimeline'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Search, User, Building, MapPin, Calendar, Target } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { getApplicationByTrackingNumber, getStatusHistory } from '@/lib/services/applicationService'
import type { Application, StatusHistory } from '@/types/database'

export default function TrackingPage() {
  const [trackingNumber, setTrackingNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [application, setApplication] = useState<Application | null>(null)
  const [history, setHistory] = useState<StatusHistory[]>([])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!trackingNumber.trim()) {
      setError('Masukkan nomor tracking')
      return
    }

    setIsLoading(true)
    setError(null)
    setApplication(null)

    try {
      // Fetch from Supabase
      const app = await getApplicationByTrackingNumber(trackingNumber.toUpperCase())
      
      if (app) {
        setApplication(app)
        const statusHistory = await getStatusHistory(app.id)
        setHistory(statusHistory as StatusHistory[])
      } else {
        setError('Nomor tracking tidak ditemukan')
      }
    } catch (err) {
      console.error('Error searching:', err)
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container py-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Cek Status Permohonan</h1>
          <p className="text-muted-foreground">
            Masukkan nomor tracking untuk melihat status permohonan SKBT Anda
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Contoh: SKBT-20260103-0001"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value.toUpperCase().replace(/\s/g, ''))}
                  onKeyDown={(e) => {
                    if (e.key === ' ') {
                      e.preventDefault()
                    }
                  }}
                  className="font-mono uppercase"
                />
              </div>
              <Button type="submit" disabled={isLoading}>
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
              <p className="text-sm text-red-600 mt-2">{error}</p>
            )}
          </CardContent>
        </Card>

        {/* Result */}
        {application && (
          <div className="space-y-6">
            {/* Application Info */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {application.tracking_number}
                    </CardTitle>
                    <CardDescription>
                      Diajukan pada {format(new Date(application.created_at), 'dd MMMM yyyy', { locale: id })}
                    </CardDescription>
                  </div>
                  <StatusBadge status={application.status} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Nama Pemohon</p>
                      <p className="font-medium">{application.nama_lengkap}</p>
                      <p className="text-sm text-muted-foreground">NIP: {application.nip || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Tujuan Pengajuan</p>
                      <p className="font-medium">
                        {application.tujuan_permohonan === 'mutasi' && 'Mutasi'}
                        {application.tujuan_permohonan === 'promosi' && 'Promosi Jabatan'}
                        {application.tujuan_permohonan === 'lainnya_asn' && 'Lainnya (ASN)'}
                        {application.tujuan_permohonan === 'lainnya_non_asn' && 'Lainnya (Non-ASN)'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Unit Kerja Asal</p>
                      <p className="font-medium">{application.unit_kerja_asal || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Instansi Tujuan</p>
                      <p className="font-medium">{application.instansi_tujuan || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Terakhir Diupdate</p>
                      <p className="font-medium">
                        {format(new Date(application.updated_at), 'dd MMMM yyyy, HH:mm', { locale: id })}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Riwayat Status</CardTitle>
              </CardHeader>
              <CardContent>
                <StatusTimeline
                  currentStatus={application.status}
                  history={history}
                  rejectionReason={application.rejection_reason}
                />
              </CardContent>
            </Card>

            {/* Pickup Info (if completed) */}
            {application.status === 'Selesai' && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-lg text-green-700">
                    Surat Keterangan Bebas Temuan Siap Diambil
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-green-700 mb-4">
                    Silakan mengambil surat di kantor Inspektorat Daerah Kabupaten Bintan
                    dengan membawa identitas diri (KTP/Kartu Pegawai).
                  </p>
                  <div className="text-sm">
                    <p className="font-medium">Lokasi Pengambilan:</p>
                    <p className="text-muted-foreground">
                      Kantor Inspektorat Daerah Kabupaten Bintan<br />
                      Jl. Bintan Buyu, Kijang, Kec. Bintan Timur
                    </p>
                    <p className="font-medium mt-2">Jam Operasional:</p>
                    <p className="text-muted-foreground">
                      Senin - Jumat: 08.00 - 16.00 WIB
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
