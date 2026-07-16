'use server'

import { supabase } from '@/lib/supabase'
import { hashPassword } from '@/lib/security'
import type { Application, User, UserRole } from '@/types/database'

// Dashboard stats
export async function getDashboardStats() {
  const [masuk, diproses, diverifikasi, selesai] = await Promise.all([
    supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'Menunggu Verifikasi Admin'),
    supabase.from('applications').select('*', { count: 'exact', head: true }).in('status', ['Diverifikasi Admin', 'Diparaf Kasubbag Anev', 'Diproses Sekretaris']),
    supabase.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'Ditandatangani Inspektur'),
    supabase.from('applications').select('*', { count: 'exact', head: true }).in('status', ['Selesai']),
  ])

  return {
    masuk: masuk.count || 0,
    diproses: diproses.count || 0,
    diverifikasi: diverifikasi.count || 0,
    selesai: selesai.count || 0,
  }
}

// Monthly chart data
export async function getMonthlyData() {
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
        .in('status', ['Selesai'])
        .gte('updated_at', startDate).lte('updated_at', endDate),
    ])

    chartData.push({
      month: months[monthIndex],
      masuk: masuk.count || 0,
      diproses: Math.floor((masuk.count || 0) * 0.8),
      selesai: selesai.count || 0,
    })
  }

  return chartData
}

// Pending applications by status
export async function getPendingApplications(status: string, limit = 5) {
  const { data } = await supabase
    .from('applications')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data || []) as Application[]
}

// All applications for verifikasi/permohonan pages
export async function getAllApplications() {
  const { data } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false })

  return (data || []) as Application[]
}

// Users management
export async function getAllUsers() {
  const { data } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
  return (data || []) as User[]
}

export async function createUser(userData: {
  nip: string; nama: string; password: string; pangkat?: string
  jabatan?: string; instansi?: string; email?: string; roles: UserRole[]
}) {
  const hashedPassword = await hashPassword(userData.password)
  const { data } = await supabase.from('users').insert({
    nip: userData.nip, nama: userData.nama,
    pangkat: userData.pangkat || null, jabatan: userData.jabatan || null,
    instansi: userData.instansi || 'Inspektorat Daerah Kabupaten Bintan',
    email: userData.email || null, password_hash: hashedPassword,
    roles: userData.roles, is_active: true,
  } as never).select().single()
  return data as unknown as User
}

export async function updateUser(userId: string, userData: {
  nama: string; pangkat?: string; jabatan?: string; instansi?: string
  email?: string; roles: UserRole[]
}) {
  const { data } = await supabase.from('users').update({
    nama: userData.nama, pangkat: userData.pangkat || null,
    jabatan: userData.jabatan || null, instansi: userData.instansi || null,
    email: userData.email || null, roles: userData.roles,
  } as never).eq('id', userId).select().single()
  return data as unknown as User
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  await supabase.from('users').update({ is_active: isActive } as never).eq('id', userId)
}

export async function updateUserPassword(userId: string, newPassword: string) {
  const hashed = await hashPassword(newPassword)
  await supabase.from('users').update({ password_hash: hashed } as never).eq('id', userId)
}
