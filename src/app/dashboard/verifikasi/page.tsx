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
import { Search, ArrowRight } from 'lucide-react'
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Verifikasi Permohonan</h1>
        <p className="text-muted-foreground">
          Daftar permohonan yang perlu diverifikasi
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nama, NIP, atau no. tracking..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
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

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Permohonan</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Tracking</TableHead>
                <TableHead>Nama Pemohon</TableHead>
                <TableHead>Unit Kerja</TableHead>
                <TableHead>Instansi Tujuan</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
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
                    <TableCell>{app.unit_kerja_asal}</TableCell>
                    <TableCell>{app.instansi_tujuan}</TableCell>
                    <TableCell>
                      {format(new Date(app.created_at), 'dd MMM yyyy', { locale: id })}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={app.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/verifikasi/${app.id}`}>
                        <Button variant="ghost" size="sm">
                          Detail
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
