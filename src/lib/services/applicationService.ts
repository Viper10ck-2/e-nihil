import { supabase } from '@/lib/supabase'
import type { Application, ApplicationStatus, DocumentType } from '@/types/database'
import type { ApplicationFormData } from '@/lib/validations'

export async function generateUniqueTrackingNumber(): Promise<string> {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const datePrefix = `SKBT-${year}${month}${day}`
  
  // Get count of applications today to generate sequential number
  const { count } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .like('tracking_number', `${datePrefix}%`)
  
  const sequence = String((count || 0) + 1).padStart(4, '0')
  return `${datePrefix}-${sequence}`
}

// Nama bulan dalam Bahasa Indonesia
const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

// Konversi bulan ke angka romawi
function toRomanMonth(month: number): string {
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
  return romanNumerals[month - 1] || ''
}

/**
 * Format tanggal untuk surat dalam format Indonesia
 * Contoh output: "5 Januari 2026"
 * @param date - Date object atau ISO string timestamp
 * @returns string dalam format "tanggal NamaBulan tahun"
 */
export function formatTanggalSurat(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const tanggal = d.getDate()
  const bulan = NAMA_BULAN[d.getMonth()]
  const tahun = d.getFullYear()
  return `${tanggal} ${bulan} ${tahun}`
}

// Generate nomor surat: XXX/800.1.4/BULAN-ROMAWI/TAHUN
export async function generateNomorSurat(): Promise<string> {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const romanMonth = toRomanMonth(month)
  
  // Get count of applications with nomor_surat in current year
  const { count, error } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .not('nomor_surat', 'is', null)
    .neq('nomor_surat', '')
  
  if (error) {
    console.error('Error counting nomor surat:', error)
  }
  
  const sequence = String((count || 0) + 1).padStart(3, '0')
  return `${sequence}/800.1.4/${romanMonth}/${year}`
}

// Update nomor surat pada aplikasi
export async function updateNomorSurat(applicationId: string, nomorSurat: string): Promise<void> {
  const { error } = await supabase
    .from('applications')
    .update({ nomor_surat: nomorSurat } as never)
    .eq('id', applicationId)

  if (error) {
    console.error('Error updating nomor surat:', error)
    throw new Error('Gagal mengupdate nomor surat')
  }
}

export async function createApplication(
  data: ApplicationFormData,
  trackingNumber: string,
  tujuanPermohonan: string = 'mutasi'
): Promise<Application> {
  const insertData = {
    tracking_number: trackingNumber,
    tujuan_permohonan: tujuanPermohonan,
    nama_lengkap: data.nama_lengkap,
    nip: data.nip,
    pangkat_golongan: data.pangkat_golongan,
    jabatan: data.jabatan || '-',
    unit_kerja_asal: data.unit_kerja_asal || '-',
    instansi_tujuan: data.instansi_tujuan || '-',
    alasan_permohonan: data.alasan_permohonan || '-',
    email: data.email,
    nomor_hp: data.nomor_hp,
    status: 'Menunggu Verifikasi Admin' as ApplicationStatus,
  }

  const { data: application, error } = await supabase
    .from('applications')
    .insert(insertData as never)
    .select()
    .single()

  if (error) {
    console.error('Error creating application:', error)
    throw new Error(`Gagal membuat permohonan: ${error.message}`)
  }

  // Create initial status history (don't fail if this fails)
  try {
    await supabase.from('status_history').insert({
      application_id: (application as Application).id,
      status: 'Menunggu Verifikasi Admin',
      notes: 'Permohonan baru diajukan',
    } as never)
  } catch (historyError) {
    console.warn('Warning: Could not create status history:', historyError)
    // Don't throw - application was created successfully
  }

  return application as unknown as Application
}

export async function uploadDocument(
  applicationId: string,
  documentType: DocumentType,
  file: File
): Promise<string> {
  const fileName = `${applicationId}/${documentType}_${Date.now()}.pdf`
  
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(fileName, file, {
      contentType: 'application/pdf',
      upsert: false,
    })

  if (uploadError) {
    console.error('Error uploading file:', uploadError)
    throw new Error(`Gagal mengupload dokumen: ${uploadError.message}`)
  }

  // Save document record
  const { error: dbError } = await supabase.from('documents').insert({
    application_id: applicationId,
    document_type: documentType,
    file_name: file.name,
    file_path: fileName,
    file_size: file.size,
  } as never)

  if (dbError) {
    console.error('Error saving document record:', dbError)
    throw new Error(`Gagal menyimpan data dokumen: ${dbError.message}`)
  }

  return fileName
}

export async function getApplicationByTrackingNumber(
  trackingNumber: string
): Promise<Application | null> {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('tracking_number', trackingNumber)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Not found
    }
    console.error('Error fetching application:', error)
    throw new Error('Gagal mengambil data permohonan')
  }

  return data
}

export async function getStatusHistory(applicationId: string) {
  const { data, error } = await supabase
    .from('status_history')
    .select('*')
    .eq('application_id', applicationId)
    .order('changed_at', { ascending: true })

  if (error) {
    console.error('Error fetching status history:', error)
    throw new Error('Gagal mengambil riwayat status')
  }

  return data as unknown[]
}

export async function getApplicationDocuments(applicationId: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('application_id', applicationId)

  if (error) {
    console.error('Error fetching documents:', error)
    throw new Error('Gagal mengambil data dokumen')
  }

  return data as unknown[]
}

export async function updateApplicationStatus(
  applicationId: string,
  newStatus: ApplicationStatus,
  notes?: string,
  userId?: string
): Promise<void> {
  const { error: updateError } = await supabase
    .from('applications')
    .update({ status: newStatus } as never)
    .eq('id', applicationId)

  if (updateError) {
    console.error('Error updating status:', updateError)
    throw new Error('Gagal mengupdate status')
  }

  // Add to status history
  const { error: historyError } = await supabase.from('status_history').insert({
    application_id: applicationId,
    status: newStatus,
    notes,
    changed_by: userId,
  } as never)

  if (historyError) {
    console.error('Error adding status history:', historyError)
  }
}

export async function getApplicationsByStatus(status: ApplicationStatus) {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching applications:', error)
    throw new Error('Gagal mengambil data permohonan')
  }

  return data as Application[]
}

export async function getAllApplications() {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching applications:', error)
    throw new Error('Gagal mengambil data permohonan')
  }

  return data as Application[]
}

/**
 * Mendapatkan timestamp saat status berubah ke "Diverifikasi Admin"
 * @param applicationId - ID aplikasi
 * @returns timestamp dalam format tanggal surat atau null jika belum diverifikasi
 */
export async function getTimestampVerifikasiAdmin(applicationId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('status_history')
    .select('changed_at')
    .eq('application_id', applicationId)
    .eq('status', 'Diverifikasi Admin')
    .order('changed_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return null
  }

  const statusData = data as { changed_at: string }
  return formatTanggalSurat(statusData.changed_at)
}

/**
 * Format tujuan permohonan untuk ditampilkan di surat
 * @param tujuanPermohonan - nilai dari database (mutasi, promosi, lainnya_asn, lainnya_non_asn)
 * @param alasanPermohonan - alasan permohonan (untuk tujuan lainnya)
 * @returns string tujuan yang sudah diformat untuk surat
 */
export function formatTujuanPermohonan(
  tujuanPermohonan: string,
  alasanPermohonan?: string
): string {
  switch (tujuanPermohonan) {
    case 'mutasi':
      return 'Mutasi/Pindah Instansi'
    case 'promosi':
      return 'Promosi Jabatan'
    case 'lainnya_asn':
    case 'lainnya_non_asn':
      // Untuk lainnya, ambil dari alasan_permohonan
      // Format di database: "[Lainnya (ASN)] alasan detail"
      if (alasanPermohonan && alasanPermohonan !== '-') {
        // Hapus prefix [Lainnya (ASN)] atau [Lainnya (Non-ASN)] jika ada
        const cleaned = alasanPermohonan.replace(/^\[Lainnya \((ASN|Non-ASN)\)\]\s*/i, '')
        return cleaned || 'Keperluan Lainnya'
      }
      return 'Keperluan Lainnya'
    default:
      return 'Keperluan Dinas'
  }
}

/**
 * Mendapatkan data lengkap untuk generate surat SKBT
 * @param applicationId - ID aplikasi
 * @returns Object berisi semua data yang diperlukan untuk template surat
 */
export async function getDataForSuratSKBT(applicationId: string): Promise<{
  nomor_surat: string
  nama_lengkap: string
  nip: string
  pangkat_golongan: string
  jabatan: string
  unit_kerja_asal: string
  tujuan_pembuatan: string
  tanggal_surat: string
} | null> {
  // Get application data
  const { data: app, error: appError } = await supabase
    .from('applications')
    .select('*')
    .eq('id', applicationId)
    .single()

  if (appError || !app) {
    console.error('Error fetching application for surat:', appError)
    return null
  }

  const application = app as unknown as Application

  // Get timestamp verifikasi admin
  const tanggalSurat = await getTimestampVerifikasiAdmin(applicationId)

  if (!tanggalSurat) {
    console.error('Application belum diverifikasi admin')
    return null
  }

  return {
    nomor_surat: application.nomor_surat || '',
    nama_lengkap: application.nama_lengkap,
    nip: application.nip,
    pangkat_golongan: application.pangkat_golongan,
    jabatan: application.jabatan || '-',
    unit_kerja_asal: application.unit_kerja_asal || '-',
    tujuan_pembuatan: formatTujuanPermohonan(
      application.tujuan_permohonan,
      application.alasan_permohonan
    ),
    tanggal_surat: tanggalSurat,
  }
}
