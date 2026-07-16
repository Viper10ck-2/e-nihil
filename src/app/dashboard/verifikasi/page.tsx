'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
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
import { Search, ArrowRight, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import type { Application, ApplicationStatus } from '@/types/database'

export default function VerifikasiPage() {
  const { currentRole } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    loadApplications()
  }, [currentRole])

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
    } finally {
      setIsLoading(false)
    }
  }

  // Get status to show based on role
  const getRelevantStatuses = (): ApplicationStatus[] => {
    switch (currentRole) {
      case 'admin':
        // Admin sebagai superuser bisa lihat semua status kecuali yang sudah selesai
        return [
          'Menunggu Verifikasi Admin',
          'Diverifikasi Admin',
          'Diparaf Kasubbag Anev',
          'Diproses Sekretaris',
          'Ditandatangani Inspektur'
        ]
      case 'kasubbag_anev':
        return ['Diverifikasi Admin', 'Diparaf Kasubbag Anev']
      case 'sekretaris':
        return ['Diparaf Kasubbag Anev', 'Diproses Sekretaris']
      case 'inspektur':
        return ['Diproses Sekretaris', 'Ditandatangani Inspektur']
      default:
        return []
    }
  }

  const relevantStatuses = getRelevantStatuses()

  // Cek apakah status sudah bisa download draft SKBT
  const canDownloadDraft = (status: ApplicationStatus): boolean => {
    const allowedStatuses: ApplicationStatus[] = [
      'Diverifikasi Admin',
      'Diparaf Kasubbag Anev',
      'Diproses Sekretaris',
      'Ditandatangani Inspektur',
      'Diambil',
      'Selesai'
    ]
    return allowedStatuses.includes(status)
  }

  // Handler download draft SKBT
  const handleDownloadDraft = async (app: Application) => {
    setDownloadingId(app.id)
    try {
      const response = await fetch('/api/generate-skbt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: app.id }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Gagal generate surat')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `SKBT_${app.tracking_number}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Draft surat SKBT berhasil diunduh')
    } catch (error) {
      console.error('Error downloading draft:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal mengunduh draft')
    } finally {
      setDownloadingId(null)
    }
  }

  // Filter applications
  const filteredApplications = applications.filter((app) => {
    // Filter by role-relevant status
    if (!relevantStatuses.includes(app.status)) return false

    // Filter by status dropdown
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

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-lg sm:text-2xl font-bold text-slate-800">Verifikasi Permohonan</h1>
        <p className="text-sm text-slate-500">
          Daftar permohonan yang perlu diverifikasi
        </p>
      </div>

      {/* Filters */}
      <Card className="border border-slate-200 shadow-sm">
        <CardContent className="p-3 sm:pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari nama, NIP, atau no. tracking..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px] text-sm">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {relevantStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-sm sm:text-base text-slate-800">Perlu Tindakan</CardTitle>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          {/* Mobile card list */}
          <div className="block md:hidden divide-y">
            {filteredApplications.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 text-sm">
                Tidak ada permohonan yang ditemukan
              </div>
            ) : (
              filteredApplications.map((app) => (
                <Link
                  key={app.id}
                  href={`/dashboard/verifikasi/${app.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="font-medium text-sm truncate">{app.nama_lengkap}</p>
                    <p className="text-xs text-gray-500 truncate">{app.unit_kerja_asal || '-'}</p>
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">{app.tracking_number}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <StatusBadge status={app.status} />
                    <p className="text-[11px] text-gray-400 mt-1">
                      {format(new Date(app.created_at), 'dd/MM/yy')}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">No. Tracking</TableHead>
                <TableHead className="w-[200px]">Nama Pemohon</TableHead>
                <TableHead className="w-[120px]">Unit Kerja</TableHead>
                <TableHead className="w-[120px]">Instansi Tujuan</TableHead>
                <TableHead className="w-[100px]">Tanggal</TableHead>
                <TableHead className="w-[140px]">Status</TableHead>
                <TableHead className="w-[100px]">Aksi</TableHead>
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
                    <TableCell>{app.instansi_tujuan || '-'}</TableCell>
                    <TableCell>
                      {format(new Date(app.created_at), 'dd MMM yyyy', { locale: id })}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={app.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {canDownloadDraft(app.status) && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDownloadDraft(app)}
                            disabled={downloadingId === app.id}
                            title="Download Draft SKBT"
                          >
                            {downloadingId === app.id ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <FileText className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Link href={`/dashboard/verifikasi/${app.id}`}>
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
