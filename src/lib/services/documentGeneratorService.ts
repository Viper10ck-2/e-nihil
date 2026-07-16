import createReport from 'docx-templates'
import { getDataForSuratSKBT } from './applicationService'
import path from 'path'
import fs from 'fs'

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
