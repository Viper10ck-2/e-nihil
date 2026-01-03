import type { DocumentType, TujuanPermohonan } from '@/types/database'
import { DOCUMENT_TYPES } from './constants'

// Konfigurasi field per tujuan permohonan
export const TUJUAN_FIELD_CONFIG: Record<TujuanPermohonan, { hiddenFields: string[]; showTujuanLainnya: boolean }> = {
  mutasi: {
    hiddenFields: [],
    showTujuanLainnya: false
  },
  promosi: {
    hiddenFields: ['instansi_tujuan', 'alasan_permohonan'],
    showTujuanLainnya: false
  },
  lainnya_asn: {
    hiddenFields: ['instansi_tujuan', 'alasan_permohonan'],
    showTujuanLainnya: true
  },
  lainnya_non_asn: {
    hiddenFields: ['nip', 'pangkat_golongan', 'jabatan', 'unit_kerja_asal', 'instansi_tujuan', 'alasan_permohonan'],
    showTujuanLainnya: true
  }
}

// Konfigurasi dokumen per tujuan permohonan
export const TUJUAN_DOCUMENT_CONFIG: Record<TujuanPermohonan, { requiredDocuments: DocumentType[]; optionalDocuments: DocumentType[] }> = {
  mutasi: {
    requiredDocuments: [
      'surat_permohonan',
      'surat_pernyataan_bebas_temuan',
      'surat_rekomendasi',
      'sk_pns',
      'sk_pangkat_terakhir',
      'daftar_riwayat_pekerjaan',
      'skp'
    ],
    optionalDocuments: []
  },
  promosi: {
    requiredDocuments: [
      'surat_permohonan',
      'surat_pernyataan_bebas_temuan',
      'sk_pns',
      'sk_pangkat_terakhir',
      'daftar_riwayat_pekerjaan',
      'skp'
    ],
    optionalDocuments: []
  },
  lainnya_asn: {
    requiredDocuments: [
      'surat_permohonan',
      'surat_pernyataan_bebas_temuan',
      'sk_pns',
      'sk_pangkat_terakhir',
      'daftar_riwayat_pekerjaan',
      'skp'
    ],
    optionalDocuments: []
  },
  lainnya_non_asn: {
    requiredDocuments: [
      'surat_permohonan',
      'daftar_riwayat_pekerjaan'
    ],
    optionalDocuments: []
  }
}

/**
 * Check if a field should be hidden based on tujuan permohonan
 */
export function isFieldHidden(fieldName: string, tujuan: TujuanPermohonan | ''): boolean {
  if (!tujuan) return false
  return TUJUAN_FIELD_CONFIG[tujuan].hiddenFields.includes(fieldName)
}

/**
 * Check if tujuan lainnya field should be shown
 */
export function shouldShowTujuanLainnya(tujuan: TujuanPermohonan | ''): boolean {
  if (!tujuan) return false
  return TUJUAN_FIELD_CONFIG[tujuan].showTujuanLainnya
}

/**
 * Check if a document should be hidden based on tujuan permohonan
 */
export function isDocumentHidden(docType: DocumentType, tujuan: TujuanPermohonan | ''): boolean {
  if (!tujuan) return false
  
  const config = TUJUAN_DOCUMENT_CONFIG[tujuan]
  const allVisibleDocs = [...config.requiredDocuments, ...config.optionalDocuments]
  return !allVisibleDocs.includes(docType)
}

/**
 * Get visible documents based on tujuan permohonan
 */
export function getVisibleDocuments(tujuan: TujuanPermohonan | ''): { type: DocumentType; label: string }[] {
  if (!tujuan) return []
  
  const config = TUJUAN_DOCUMENT_CONFIG[tujuan]
  const allVisibleDocTypes = [...config.requiredDocuments, ...config.optionalDocuments]
  
  return DOCUMENT_TYPES.filter(doc => allVisibleDocTypes.includes(doc.type))
}

/**
 * Get required documents for a tujuan permohonan
 */
export function getRequiredDocuments(tujuan: TujuanPermohonan | ''): DocumentType[] {
  if (!tujuan) return []
  return TUJUAN_DOCUMENT_CONFIG[tujuan].requiredDocuments
}

/**
 * Get optional documents for a tujuan permohonan
 */
export function getOptionalDocuments(tujuan: TujuanPermohonan | ''): DocumentType[] {
  if (!tujuan) return []
  return TUJUAN_DOCUMENT_CONFIG[tujuan].optionalDocuments
}

/**
 * Check if all required documents are uploaded
 */
export function areAllRequiredDocumentsUploaded(
  uploadedFiles: Record<DocumentType, File | null>,
  tujuan: TujuanPermohonan | ''
): boolean {
  if (!tujuan) return false
  const required = getRequiredDocuments(tujuan)
  return required.every(docType => uploadedFiles[docType] !== null)
}

/**
 * Validate form based on tujuan permohonan
 * Returns an object with validation results
 */
export function validateDynamicForm(
  tujuan: TujuanPermohonan | '',
  tujuanLainnya: string,
  uploadedFiles: Record<DocumentType, File | null>
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!tujuan) {
    errors.push('Pilih tujuan permohonan terlebih dahulu')
    return { isValid: false, errors }
  }
  
  // Check tujuan lainnya field if required
  if (shouldShowTujuanLainnya(tujuan) && !tujuanLainnya.trim()) {
    errors.push('Tuliskan tujuan permohonan Anda')
  }
  
  // Check required documents
  if (!areAllRequiredDocumentsUploaded(uploadedFiles, tujuan)) {
    errors.push('Lengkapi semua dokumen wajib')
  }
  
  return { isValid: errors.length === 0, errors }
}
