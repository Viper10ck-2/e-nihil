'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { StatusTimeline } from '@/components/tracking/StatusTimeline'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Search, User, Building, MapPin, Calendar, Target, FileSearch, CheckCircle, Clock, Sparkles } from 'lucide-react'
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Nama Pemohon</p>
                          <p className="font-semibold text-slate-800">{application.nama_lengkap}</p>
                          <p className="text-sm text-slate-500">NIP: {application.nip || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <Target className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Tujuan Pengajuan</p>
                          <p className="font-semibold text-slate-800">
                            {application.tujuan_permohonan === 'mutasi' && 'Mutasi'}
                            {application.tujuan_permohonan === 'promosi' && 'Promosi Jabatan'}
                            {application.tujuan_permohonan === 'lainnya_asn' && 'Lainnya (ASN)'}
                            {application.tujuan_permohonan === 'lainnya_non_asn' && 'Lainnya (Non-ASN)'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                          <Building className="h-5 w-5 text-violet-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Unit Kerja Asal</p>
                          <p className="font-semibold text-slate-800">{application.unit_kerja_asal || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Instansi Tujuan</p>
                          <p className="font-semibold text-slate-800">{application.instansi_tujuan || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors md:col-span-2">
                        <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-5 w-5 text-cyan-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Terakhir Diupdate</p>
                          <p className="font-semibold text-slate-800">
                            {format(new Date(application.updated_at), 'dd MMMM yyyy, HH:mm', { locale: id })} WIB
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

              {/* Pickup Info (if completed) */}
              {application.status === 'Selesai' && (
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 via-emerald-400 to-emerald-300 rounded-full"></div>
                  <Card className="ml-4 border-0 shadow-xl shadow-emerald-100/50 bg-gradient-to-br from-emerald-50 to-green-50 overflow-hidden">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-200/50">
                          <CheckCircle className="h-5 w-5 text-white" />
                        </div>
                        <CardTitle className="text-lg text-emerald-700">
                          Surat Keterangan Bebas Temuan Siap Diambil
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5">
                      <p className="text-sm text-emerald-700 mb-4 p-3 bg-white/60 rounded-xl border border-emerald-100">
                        Silakan mengambil surat di kantor Inspektorat Daerah Kabupaten Bintan
                        dengan membawa identitas diri (KTP/Kartu Pegawai).
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-white/60 rounded-xl border border-emerald-100">
                          <p className="font-semibold text-emerald-800 mb-1 flex items-center gap-2">
                            <MapPin className="h-4 w-4" /> Lokasi Pengambilan
                          </p>
                          <p className="text-sm text-emerald-700">
                            Kantor Inspektorat Daerah Kabupaten Bintan<br />
                            Jl. Bintan Buyu, Kijang, Kec. Bintan Timur
                          </p>
                        </div>
                        <div className="p-4 bg-white/60 rounded-xl border border-emerald-100">
                          <p className="font-semibold text-emerald-800 mb-1 flex items-center gap-2">
                            <Clock className="h-4 w-4" /> Jam Operasional
                          </p>
                          <p className="text-sm text-emerald-700">
                            Senin - Jumat: 08.00 - 16.00 WIB
                          </p>
                        </div>
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
    </div>
  )
}
