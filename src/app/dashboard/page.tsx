'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { InfoCard } from '@/components/ui/info-card'
import {
  Inbox,
  Clock,
  CheckCircle,
  FileCheck,
  ArrowRight,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import type { Application } from '@/types/database'

export default function DashboardPage() {
  const { user, currentRole } = useAuth()
  const [stats, setStats] = useState({ masuk: 0, diproses: 0, diverifikasi: 0, selesai: 0 })
  const [monthlyData, setMonthlyData] = useState<{ month: string; masuk: number; diproses: number; selesai: number }[]>([])
  const [pendingApplications, setPendingApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [currentRole])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      // Load statistics
      const [masukRes, diprosesRes, diverifikasiRes, selesaiRes] = await Promise.all([
        supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'Menunggu Verifikasi Admin'),
        supabase.from('applications').select('*', { count: 'exact', head: true }).in('status', ['Diverifikasi Admin', 'Diparaf Kasubbag Anev', 'Diproses Sekretaris']),
        supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'Ditandatangani Inspektur'),
        supabase.from('applications').select('*', { count: 'exact', head: true }).in('status', ['Selesai', 'Diambil']),
      ])

      setStats({
        masuk: masukRes.count || 0,
        diproses: diprosesRes.count || 0,
        diverifikasi: diverifikasiRes.count || 0,
        selesai: selesaiRes.count || 0,
      })

      // Load pending applications based on role
      const pendingStatus = getPendingStatus()
      const { data: pending } = await supabase
        .from('applications')
        .select('*')
        .eq('status', pendingStatus)
        .order('created_at', { ascending: false })
        .limit(5)

      setPendingApplications((pending as Application[]) || [])

      // Load monthly data for chart (last 6 months)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
      const currentMonth = new Date().getMonth()
      const chartData = []
      
      for (let i = 5; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12
        const year = new Date().getFullYear() - (currentMonth - i < 0 ? 1 : 0)
        const startDate = new Date(year, monthIndex, 1).toISOString()
        const endDate = new Date(year, monthIndex + 1, 0).toISOString()

        const [masuk, selesai] = await Promise.all([
          supabase.from('applications').select('*', { count: 'exact', head: true })
            .gte('created_at', startDate).lte('created_at', endDate),
          supabase.from('applications').select('*', { count: 'exact', head: true })
            .in('status', ['Selesai', 'Diambil'])
            .gte('updated_at', startDate).lte('updated_at', endDate),
        ])

        chartData.push({
          month: months[monthIndex],
          masuk: masuk.count || 0,
          diproses: Math.floor((masuk.count || 0) * 0.8),
          selesai: selesai.count || 0,
        })
      }
      setMonthlyData(chartData)

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Get role-specific title
  const getRoleTitle = () => {
    switch (currentRole) {
      case 'admin':
        return 'Dashboard Admin'
      case 'kasubbag_anev':
        return 'Dashboard Kasubbag Anev'
      case 'sekretaris':
        return 'Dashboard Sekretaris'
      case 'inspektur':
        return 'Dashboard Inspektur'
      default:
        return 'Dashboard'
    }
  }

  // Get role-specific pending status
  const getPendingStatus = () => {
    switch (currentRole) {
      case 'admin':
        return 'Menunggu Verifikasi Admin'
      case 'kasubbag_anev':
        return 'Diverifikasi Admin'
      case 'sekretaris':
        return 'Diparaf Kasubbag Anev'
      case 'inspektur':
        return 'Diproses Sekretaris'
      default:
        return 'Menunggu Verifikasi Admin'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{getRoleTitle()}</h1>
        <p className="text-slate-500">
          Selamat datang, {user?.nama}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoCard
          title="Permohonan Masuk"
          value={stats.masuk}
          icon={Inbox}
          iconClassName="text-amber-500"
        />
        <InfoCard
          title="Sedang Diproses"
          value={stats.diproses}
          icon={Clock}
          iconClassName="text-sky-500"
        />
        <InfoCard
          title="Diverifikasi"
          value={stats.diverifikasi}
          icon={FileCheck}
          iconClassName="text-violet-500"
        />
        <InfoCard
          title="Selesai"
          value={stats.selesai}
          icon={CheckCircle}
          iconClassName="text-emerald-500"
        />
      </div>

      {/* Chart */}
      {currentRole === 'admin' && (
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-800">Statistik Permohonan Bulanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="masuk" name="Masuk" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="diproses" name="Diproses" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="selesai" name="Selesai" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Applications Table */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-slate-800">Permohonan Menunggu Verifikasi</CardTitle>
          <Link href="/dashboard/verifikasi">
            <Button variant="outline" size="sm">
              Lihat Semua
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Tracking</TableHead>
                <TableHead>Nama Pemohon</TableHead>
                <TableHead>Unit Kerja</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Tidak ada permohonan yang menunggu verifikasi
                  </TableCell>
                </TableRow>
              ) : (
                pendingApplications.map((app) => (
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
