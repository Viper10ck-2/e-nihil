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
import { toast } from 'sonner'
import { Search, ArrowRight, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { getAllApplications } from '@/lib/actions'
import type { Application, ApplicationStatus } from '@/types/database'

const allStatuses: ApplicationStatus[] = [
  'Menunggu Verifikasi Admin',
  'Diverifikasi Admin',
  'Diparaf Kasubbag Anev',
  'Diproses Sekretaris',
  'Ditandatangani Inspektur',
  'Selesai',
  'Selesai', // Legacy status
  'Ditolak',
]

export default function PermohonanPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    setIsLoading(true)
    try {
      const data = await getAllApplications()
      setApplications(data || [])
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div>
        <h1 className="text-lg sm:text-2xl font-bold text-slate-800">Semua Permohonan</h1>
        <p className="text-sm text-slate-500 mt-0.5 sm:mt-1">
          Daftar semua permohonan SKBT yang masuk
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
              <SelectTrigger className="w-full sm:w-[250px] text-sm">
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
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-sm sm:text-base text-slate-800 flex items-center gap-2">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500" />
            Riwayat Permohonan
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 sm:px-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[130px]">No. Tracking</TableHead>
                <TableHead>Pemohon</TableHead>
                <TableHead className="hidden sm:table-cell">Unit Kerja</TableHead>
                <TableHead className="w-[100px] hidden lg:table-cell">No. Surat</TableHead>
                <TableHead className="w-[90px] hidden sm:table-cell">Tanggal</TableHead>
                <TableHead className="w-[160px]">Status</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-400 py-12">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    Tidak ada permohonan
                  </TableCell>
                </TableRow>
              ) : (
                filteredApplications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-mono text-xs sm:text-sm">
                      <span className="block truncate max-w-[120px]">{app.tracking_number}</span>
                    </TableCell>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate max-w-[150px] sm:max-w-none">{app.nama_lengkap}</p>
                        <p className="text-xs text-slate-500 sm:hidden">{app.unit_kerja_asal || '-'}</p>
                        <p className="text-[11px] text-slate-400 sm:hidden">{format(new Date(app.created_at), 'dd/MM/yy')}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 hidden sm:table-cell">{app.unit_kerja_asal || '-'}</TableCell>
                    <TableCell className="text-xs font-mono text-slate-500 hidden lg:table-cell">{app.nomor_surat || '-'}</TableCell>
                    <TableCell className="text-sm hidden sm:table-cell">
                      {format(new Date(app.created_at), 'dd MMM yyyy', { locale: id })}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={app.status} />
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/permohonan/${app.id}`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
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
