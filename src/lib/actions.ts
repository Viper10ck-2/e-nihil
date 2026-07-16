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

  return (data || []) as unknown as Application[]
}

// All applications for verifikasi/permohonan pages
export async function getAllApplications() {
  const { data } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false })

  return (data || []) as unknown as Application[]
}

// Users management
export async function getAllUsers() {
  const { data } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
  return (data || []) as unknown as User[]
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

// Pengajuan
export async function generateUniqueTrackingNumber() {
  const now = new Date()
  const datePrefix = `SKBT-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`
  const { count } = await supabase.from('applications').select('*', { count: 'exact', head: true }).like('tracking_number', `${datePrefix}%`)
  return `${datePrefix}-${String((count||0)+1).padStart(4,'0')}`
}

export async function createApplication(data: Record<string, string>, trackingNumber: string, tujuan: string) {
  const { data: app } = await supabase.from('applications').insert({
    tracking_number: trackingNumber, tujuan_permohonan: tujuan,
    nama_lengkap: data.nama_lengkap, nip: data.nip, pangkat_golongan: data.pangkat_golongan,
    jabatan: data.jabatan||'-', unit_kerja_asal: data.unit_kerja_asal||'-',
    instansi_tujuan: data.instansi_tujuan||'-', alasan_permohonan: data.alasan_permohonan||'-',
    email: data.email, nomor_hp: data.nomor_hp,
    status: 'Menunggu Verifikasi Admin',
  } as never).select().single()
  return app as unknown as Application
}

// ============== Tracking Page Actions ==============

export async function getTrackingApplication(trackingNumber: string) {
  const { data: app } = await supabase
    .from('applications').select('*')
    .eq('tracking_number', trackingNumber).single()
  
  if (!app) return { application: null, statusHistory: [] }

  const { data: history } = await supabase
    .from('status_history').select('*')
    .eq('application_id', (app as unknown as Application).id)
    .order('changed_at', { ascending: true })

  return { application: app as unknown as Application, statusHistory: (history || []) as unknown[] }
}

// ============== Detail Page Actions ==============

export async function getApplicationDetail(applicationId: string) {
  const { data: app } = await supabase
    .from('applications').select('*').eq('id', applicationId).single()
  if (!app) throw new Error('Permohonan tidak ditemukan')

  const { data: docs } = await supabase
    .from('documents').select('*').eq('application_id', applicationId)

  return { application: app as unknown as Application, documents: (docs || []) as Record<string, unknown>[] }
}

export async function getApplicationDetailWithRejections(applicationId: string) {
  const base = await getApplicationDetail(applicationId)
  
  // Get unresolved rejections
  const { data: rejections } = await supabase
    .from('document_rejections').select('*')
    .eq('application_id', applicationId).eq('is_resolved', false)

  const rejectionMap = new Map<string, Record<string, unknown>>()
  for (const r of (rejections || [])) {
    rejectionMap.set((r as Record<string, string>).document_id, r as Record<string, unknown>)
  }

  const docsWithRejections = base.documents.map(doc => ({
    ...doc,
    rejection: rejectionMap.get(doc.id as string) || null,
  }))

  return { ...base, documents: docsWithRejections }
}

// ============== Verification Actions ==============

export async function approveVerification(
  applicationId: string,
  nextStatus: string,
  notes: string,
  userId?: string,
  generateNomor?: boolean
) {
  await supabase.from('applications').update({ status: nextStatus } as never).eq('id', applicationId)
  
  await supabase.from('status_history').insert({
    application_id: applicationId, status: nextStatus, notes, changed_by: userId,
  } as never)

  let nomorSurat: string | null = null
  if (generateNomor) {
    nomorSurat = await generateNomorSuratServer(applicationId)
  }

  return { success: true, nomorSurat }
}

async function generateNomorSuratServer(applicationId: string): Promise<string> {
  const now = new Date()
  const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
  const romanMonth = romanMonths[now.getMonth()]
  const year = now.getFullYear()

  const { count } = await supabase
    .from('applications').select('*', { count: 'exact', head: true })
    .not('nomor_surat', 'is', null).neq('nomor_surat', '')

  const sequence = String((count || 0) + 1).padStart(3, '0')
  const nomorSurat = `${sequence}/800.1.4/${romanMonth}/${year}`

  await supabase.from('applications').update({ nomor_surat: nomorSurat } as never).eq('id', applicationId)

  return nomorSurat
}

export async function rejectVerification(applicationId: string, reason: string, userId?: string) {
  await supabase.from('applications').update({
    status: 'Ditolak', rejection_reason: reason, nomor_surat: null
  } as never).eq('id', applicationId)

  await supabase.from('status_history').insert({
    application_id: applicationId, status: 'Ditolak', notes: reason, changed_by: userId,
  } as never)

  return { success: true }
}

export async function updatePickupMethod(applicationId: string, method: string) {
  await supabase.from('applications').update({
    pickup_method: method, pickup_method_selected_at: new Date().toISOString()
  } as never).eq('id', applicationId)
  return { success: true }
}
