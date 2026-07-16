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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-slate-800">{getRoleTitle()}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Selamat datang, <span className="text-amber-600 font-medium">{user?.nama}</span>
          </p>
        </div>
        <div className="hidden sm:block px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
          <span className="text-xs font-medium text-amber-700 uppercase tracking-wide">{currentRole?.replace(/_/g, ' ') || 'Admin'}</span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { title: 'Masuk', value: stats.masuk, icon: Inbox, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-600' },
          { title: 'Diproses', value: stats.diproses, icon: Clock, color: 'from-sky-500 to-blue-500', bg: 'bg-sky-50', text: 'text-sky-600' },
          { title: 'Diverifikasi', value: stats.diverifikasi, icon: FileCheck, color: 'from-violet-500 to-purple-500', bg: 'bg-violet-50', text: 'text-violet-600' },
          { title: 'Selesai', value: stats.selesai, icon: CheckCircle, color: 'from-emerald-500 to-green-500', bg: 'bg-emerald-50', text: 'text-emerald-600' },
        ].map((card) => (
          <div key={card.title} className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl blur-lg -z-10" 
              style={{ background: `linear-gradient(135deg, ${card.color.split(' ')[1]?.replace('to-', '#') || '#f59e0b'}15, transparent)` }} />
            <div className="relative bg-white border border-slate-200 rounded-xl p-4 sm:p-5 hover:border-slate-300 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{card.title}</span>
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`h-5 w-5 ${card.text}`} />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-slate-800 tabular-nums">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Pending Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Chart */}
        {currentRole === 'admin' && (
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm sm:text-base font-semibold text-slate-800">Statistik Bulanan</h3>
              <span className="text-[11px] text-slate-400">6 bulan terakhir</span>
            </div>
            <div className="h-[200px] sm:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                      fontSize: '13px',
                      padding: '12px'
                    }} 
                  />
                  <Bar dataKey="masuk" name="Masuk" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="diproses" name="Diproses" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="selesai" name="Selesai" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Pending Applications */}
        <div className={`${currentRole === 'admin' ? 'lg:col-span-1' : 'lg:col-span-3'} bg-white border border-slate-200 rounded-xl overflow-hidden`}>
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100">
            <h3 className="text-sm sm:text-base font-semibold text-slate-800">Menunggu Verifikasi</h3>
            <Link href="/dashboard/verifikasi">
              <Button variant="ghost" size="sm" className="text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 h-8">
                Semua <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-slate-50 max-h-[420px] overflow-y-auto">
            {pendingApplications.length === 0 ? (
              <div className="text-center py-12 text-sm text-slate-400">
                <Inbox className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                Tidak ada permohonan menunggu
              </div>
            ) : (
              pendingApplications.map((app) => (
                <Link
                  key={app.id}
                  href={`/dashboard/verifikasi/${app.id}`}
                  className="flex items-center justify-between px-4 sm:px-5 py-3.5 hover:bg-slate-50 active:bg-slate-100 transition-colors group"
                >
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="font-medium text-sm text-slate-700 group-hover:text-slate-900 truncate">{app.nama_lengkap}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{app.tracking_number}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{app.unit_kerja_asal || app.instansi_tujuan || '-'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <StatusBadge status={app.status} />
                    <p className="text-[10px] text-slate-400 mt-1">
                      {format(new Date(app.created_at), 'dd MMM', { locale: id })}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
