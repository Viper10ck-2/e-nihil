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
import { getDashboardStats, getMonthlyData, getPendingApplications } from '@/lib/actions'
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
      // Load statistics via server actions
      const statsData = await getDashboardStats()
      setStats(statsData)

      // Load pending applications
      const pendingStatus = getPendingStatus()
      const pending = await getPendingApplications(pendingStatus, 5)
      setPendingApplications(pending)

      // Load chart data (admin only)
      if (currentRole === 'admin') {
        const chartData = await getMonthlyData()
        setMonthlyData(chartData)
      }

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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg sm:text-2xl font-bold text-slate-800">{getRoleTitle()}</h1>
        <p className="text-sm text-slate-500">
          Selamat datang, {user?.nama}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-sm sm:text-base text-slate-800">Statistik Permohonan Bulanan</CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="h-[200px] sm:h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '12px'
                    }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="masuk" name="Masuk" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="diproses" name="Diproses" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="selesai" name="Selesai" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Applications */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 sm:pb-4">
          <CardTitle className="text-sm sm:text-base text-slate-800">Permohonan Menunggu Verifikasi</CardTitle>
          <Link href="/dashboard/verifikasi">
            <Button variant="outline" size="sm" className="text-xs sm:text-sm">
              Lihat Semua
              <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          {/* Mobile: card list */}
          <div className="block md:hidden divide-y">
            {pendingApplications.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 text-sm">
                Tidak ada permohonan yang menunggu verifikasi
              </div>
            ) : (
              pendingApplications.map((app) => (
                <Link
                  key={app.id}
                  href={`/dashboard/verifikasi/${app.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="font-medium text-sm truncate">{app.nama_lengkap}</p>
                    <p className="text-xs text-gray-500 truncate">{app.unit_kerja_asal}</p>
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
          {/* Desktop: table */}
          <div className="hidden md:block overflow-x-auto">
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
