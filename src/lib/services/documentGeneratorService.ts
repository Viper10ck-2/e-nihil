import createReport from 'docx-templates'
import path from 'path'
import fs from 'fs'
import { supabase } from '@/lib/supabase'
import type { Application } from '@/types/database'

// Nama bulan dalam Bahasa Indonesia
const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

function toRomanMonth(month: number): string {
  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
  return romanNumerals[month - 1] || ''
}

export function formatTanggalSurat(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return `${d.getDate()} ${NAMA_BULAN[d.getMonth()]} ${d.getFullYear()}`
}

export function formatTujuanPermohonan(tujuan: string, alasan?: string): string {
  switch (tujuan) {
    case 'mutasi': return 'Mutasi/Pindah Instansi'
    case 'promosi': return 'Promosi Jabatan'
    case 'lainnya_asn':
    case 'lainnya_non_asn':
      if (alasan && alasan !== '-') {
        return alasan.replace(/^\[Lainnya \((ASN|Non-ASN)\)\]\s*/i, '') || 'Keperluan Lainnya'
      }
      return 'Keperluan Lainnya'
    default: return 'Keperluan Dinas'
  }
}

async function getTimestampVerifikasiAdmin(applicationId: string): Promise<string | null> {
  const { data } = await supabase
    .from('status_history').select('changed_at')
    .eq('application_id', applicationId).eq('status', 'Diverifikasi Admin')
    .order('changed_at', { ascending: false }).limit(1).single()
  if (!data) return null
  return formatTanggalSurat((data as Record<string, string>).changed_at)
}

async function getDataForSuratSKBT(applicationId: string) {
  const { data: app } = await supabase
    .from('applications').select('*').eq('id', applicationId).single()
  if (!app) return null

  const application = app as unknown as Application
  const tanggalSurat = await getTimestampVerifikasiAdmin(applicationId)

  return {
    nomor_surat: application.nomor_surat || '',
    nama_lengkap: application.nama_lengkap,
    nip: application.nip,
    pangkat_golongan: application.pangkat_golongan,
    jabatan: application.jabatan || '-',
    unit_kerja_asal: application.unit_kerja_asal || '-',
    tujuan_pembuatan: formatTujuanPermohonan(application.tujuan_permohonan, application.alasan_permohonan || undefined),
    tanggal_surat: tanggalSurat || formatTanggalSurat(new Date()),
  }
}

/**
 * Generate surat SKBT dari template DOCX
 * @param applicationId - ID aplikasi
 * @returns Buffer file DOCX yang sudah di-generate atau null jika gagal
 */
export async function generateSuratSKBT(applicationId: string): Promise<Buffer | null> {
  try {
    // Get data untuk surat
    const data = await getDataForSuratSKBT(applicationId)
    
    if (!data) {
      console.error('Gagal mendapatkan data untuk surat SKBT')
      return null
    }

    console.log('Data untuk surat SKBT:', data)

    // Baca template file
    const templatePath = path.resolve(process.cwd(), 'src', 'templates', 'SKBT.docx')
    
    console.log('Template path:', templatePath)
    
    if (!fs.existsSync(templatePath)) {
      console.error('Template file tidak ditemukan:', templatePath)
      return null
    }

    const template = fs.readFileSync(templatePath)

    // Generate document menggunakan docx-templates
    // Library ini menggunakan format {placeholder} bukan {{placeholder}}
    const buffer = await createReport({
      template,
      data,
      cmdDelimiter: ['{{', '}}'], // Gunakan delimiter {{ }}
    })

    return Buffer.from(buffer)
  } catch (error) {
    console.error('Error generating surat SKBT:', error)
    return null
  }
}

/**
 * Generate nama file untuk surat SKBT
 * @param trackingNumber - Nomor tracking aplikasi
 * @returns Nama file dengan format SKBT_[tracking_number].docx
 */
export function generateFileName(trackingNumber: string): string {
  // Sanitize tracking number untuk nama file
  const sanitized = trackingNumber.replace(/[^a-zA-Z0-9-]/g, '_')
  return `SKBT_${sanitized}.docx`
}
