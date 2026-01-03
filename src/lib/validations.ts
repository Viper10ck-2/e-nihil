import { z } from 'zod'
import { MAX_FILE_SIZE, ACCEPTED_FILE_TYPES } from './constants'

export const applicationFormSchema = z.object({
  nama_lengkap: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
  nip: z.string().min(1, 'NIP wajib diisi'),
  pangkat_golongan: z.string().min(1, 'Pangkat/Golongan wajib diisi'),
  jabatan: z.string().min(1, 'Jabatan wajib diisi'),
  unit_kerja_asal: z.string().min(1, 'Unit kerja asal wajib diisi'),
  instansi_tujuan: z.string().min(1, 'Instansi tujuan wajib diisi'),
  alasan_permohonan: z.string().min(1, 'Alasan permohonan wajib diisi'),
  email: z.string().email('Format email tidak valid'),
  nomor_hp: z.string().min(10, 'Nomor HP minimal 10 digit').max(15, 'Nomor HP maksimal 15 digit'),
})

export type ApplicationFormData = z.infer<typeof applicationFormSchema>

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
    return { valid: false, error: 'File harus berformat PDF' }
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Ukuran file maksimal 10MB' }
  }
  
  return { valid: true }
}

export function generateTrackingNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
  
  return `SKBT-${year}${month}${day}-${random}`
}
