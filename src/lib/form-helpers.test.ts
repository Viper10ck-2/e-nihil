import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  isFieldHidden,
  shouldShowTujuanLainnya,
  isDocumentHidden,
  getVisibleDocuments,
  getRequiredDocuments,
  getOptionalDocuments,
  areAllRequiredDocumentsUploaded,
  validateDynamicForm,
  TUJUAN_FIELD_CONFIG,
  TUJUAN_DOCUMENT_CONFIG,
} from './form-helpers'
import type { DocumentType, TujuanPermohonan } from '@/types/database'
import { DOCUMENT_TYPES } from './constants'

// All valid tujuan permohonan values
const ALL_TUJUAN: TujuanPermohonan[] = ['mutasi', 'promosi', 'lainnya_asn', 'lainnya_non_asn']

// All field names that can be hidden
const ALL_FIELDS = ['pangkat_golongan', 'jabatan', 'unit_kerja_asal', 'instansi_tujuan', 'alasan_permohonan']

// All document types
const ALL_DOCUMENT_TYPES: DocumentType[] = [
  'surat_permohonan',
  'surat_pernyataan_bebas_temuan',
  'surat_rekomendasi',
  'sk_pns',
  'sk_pangkat_terakhir',
  'daftar_riwayat_pekerjaan',
  'skp'
]

// Arbitraries for property-based testing
const tujuanArbitrary = fc.constantFrom(...ALL_TUJUAN)
const fieldArbitrary = fc.constantFrom(...ALL_FIELDS)
const documentTypeArbitrary = fc.constantFrom(...ALL_DOCUMENT_TYPES)

/**
 * Task 4.1: Test isFieldHidden() untuk semua kombinasi field dan tujuan
 * Property 1: Field Visibility Consistency
 * Validates: Requirements 1.1, 2.1, 3.2-3.4, 4.2-4.6
 */
describe('isFieldHidden - Property 1: Field Visibility Consistency', () => {
  it('should return false when tujuan is empty', () => {
    ALL_FIELDS.forEach(field => {
      expect(isFieldHidden(field, '')).toBe(false)
    })
  })

  // Property test: isFieldHidden should be consistent with TUJUAN_FIELD_CONFIG
  it('Property 1: For any tujuan and field, isFieldHidden matches configuration', () => {
    fc.assert(
      fc.property(tujuanArbitrary, fieldArbitrary, (tujuan, field) => {
        const result = isFieldHidden(field, tujuan)
        const expected = TUJUAN_FIELD_CONFIG[tujuan].hiddenFields.includes(field)
        return result === expected
      }),
      { numRuns: 100 }
    )
  })

  // Specific tests for each tujuan permohonan
  describe('Mutasi - shows all fields', () => {
    it('should not hide any field for mutasi', () => {
      ALL_FIELDS.forEach(field => {
        expect(isFieldHidden(field, 'mutasi')).toBe(false)
      })
    })
  })

  describe('Promosi - hides instansi_tujuan and alasan_permohonan', () => {
    it('should hide instansi_tujuan and alasan_permohonan', () => {
      expect(isFieldHidden('instansi_tujuan', 'promosi')).toBe(true)
      expect(isFieldHidden('alasan_permohonan', 'promosi')).toBe(true)
    })

    it('should show other fields', () => {
      expect(isFieldHidden('pangkat_golongan', 'promosi')).toBe(false)
      expect(isFieldHidden('jabatan', 'promosi')).toBe(false)
      expect(isFieldHidden('unit_kerja_asal', 'promosi')).toBe(false)
    })
  })

  describe('Lainnya ASN - hides instansi_tujuan and alasan_permohonan', () => {
    it('should hide instansi_tujuan and alasan_permohonan', () => {
      expect(isFieldHidden('instansi_tujuan', 'lainnya_asn')).toBe(true)
      expect(isFieldHidden('alasan_permohonan', 'lainnya_asn')).toBe(true)
    })

    it('should show other fields', () => {
      expect(isFieldHidden('pangkat_golongan', 'lainnya_asn')).toBe(false)
      expect(isFieldHidden('jabatan', 'lainnya_asn')).toBe(false)
      expect(isFieldHidden('unit_kerja_asal', 'lainnya_asn')).toBe(false)
    })
  })

  describe('Lainnya Non-ASN - hides most fields', () => {
    it('should hide pangkat_golongan, jabatan, unit_kerja_asal, instansi_tujuan, alasan_permohonan', () => {
      expect(isFieldHidden('pangkat_golongan', 'lainnya_non_asn')).toBe(true)
      expect(isFieldHidden('jabatan', 'lainnya_non_asn')).toBe(true)
      expect(isFieldHidden('unit_kerja_asal', 'lainnya_non_asn')).toBe(true)
      expect(isFieldHidden('instansi_tujuan', 'lainnya_non_asn')).toBe(true)
      expect(isFieldHidden('alasan_permohonan', 'lainnya_non_asn')).toBe(true)
    })
  })
})

describe('shouldShowTujuanLainnya', () => {
  it('should return false when tujuan is empty', () => {
    expect(shouldShowTujuanLainnya('')).toBe(false)
  })

  it('should return false for mutasi', () => {
    expect(shouldShowTujuanLainnya('mutasi')).toBe(false)
  })

  it('should return false for promosi', () => {
    expect(shouldShowTujuanLainnya('promosi')).toBe(false)
  })

  it('should return true for lainnya_asn', () => {
    expect(shouldShowTujuanLainnya('lainnya_asn')).toBe(true)
  })

  it('should return true for lainnya_non_asn', () => {
    expect(shouldShowTujuanLainnya('lainnya_non_asn')).toBe(true)
  })
})


/**
 * Task 4.2: Test getVisibleDocuments() untuk semua tujuan permohonan
 * Property 2: Document Visibility Consistency
 * Validates: Requirements 1.2, 2.2, 3.5-3.6, 4.7-4.8
 */
describe('getVisibleDocuments - Property 2: Document Visibility Consistency', () => {
  it('should return empty array when tujuan is empty', () => {
    expect(getVisibleDocuments('')).toEqual([])
  })

  // Property test: visible documents should be subset of all documents
  it('Property 2: For any tujuan, visible documents are subset of all available documents', () => {
    fc.assert(
      fc.property(tujuanArbitrary, (tujuan) => {
        const visibleDocs = getVisibleDocuments(tujuan)
        const allDocTypes = DOCUMENT_TYPES.map(d => d.type)
        
        // All visible document types should be in the master list
        return visibleDocs.every(doc => allDocTypes.includes(doc.type))
      }),
      { numRuns: 100 }
    )
  })

  // Property test: visible documents should match configuration
  it('Property 2: For any tujuan, visible documents match required + optional from config', () => {
    fc.assert(
      fc.property(tujuanArbitrary, (tujuan) => {
        const visibleDocs = getVisibleDocuments(tujuan)
        const config = TUJUAN_DOCUMENT_CONFIG[tujuan]
        const expectedTypes = [...config.requiredDocuments, ...config.optionalDocuments]
        
        // Visible docs should have exactly the types from config
        const visibleTypes = visibleDocs.map(d => d.type)
        return visibleTypes.length === expectedTypes.length &&
               visibleTypes.every(t => expectedTypes.includes(t))
      }),
      { numRuns: 100 }
    )
  })

  describe('Mutasi - shows all 7 documents', () => {
    it('should show all required documents', () => {
      const docs = getVisibleDocuments('mutasi')
      expect(docs.length).toBe(7)
      expect(docs.map(d => d.type)).toContain('surat_permohonan')
      expect(docs.map(d => d.type)).toContain('surat_pernyataan_bebas_temuan')
      expect(docs.map(d => d.type)).toContain('surat_rekomendasi')
      expect(docs.map(d => d.type)).toContain('sk_pns')
      expect(docs.map(d => d.type)).toContain('sk_pangkat_terakhir')
      expect(docs.map(d => d.type)).toContain('daftar_riwayat_pekerjaan')
      expect(docs.map(d => d.type)).toContain('skp')
    })
  })

  describe('Promosi - hides surat_rekomendasi', () => {
    it('should show 6 documents (without surat_rekomendasi)', () => {
      const docs = getVisibleDocuments('promosi')
      expect(docs.length).toBe(6)
      expect(docs.map(d => d.type)).not.toContain('surat_rekomendasi')
    })
  })

  describe('Lainnya ASN - hides surat_rekomendasi', () => {
    it('should show 6 documents (without surat_rekomendasi)', () => {
      const docs = getVisibleDocuments('lainnya_asn')
      expect(docs.length).toBe(6)
      expect(docs.map(d => d.type)).not.toContain('surat_rekomendasi')
    })
  })

  describe('Lainnya Non-ASN - shows only 2 required documents', () => {
    it('should show only surat_permohonan and daftar_riwayat_pekerjaan', () => {
      const docs = getVisibleDocuments('lainnya_non_asn')
      expect(docs.length).toBe(2)
      expect(docs.map(d => d.type)).toContain('surat_permohonan')
      expect(docs.map(d => d.type)).toContain('daftar_riwayat_pekerjaan')
    })

    it('should not show ASN-specific documents', () => {
      const docs = getVisibleDocuments('lainnya_non_asn')
      const docTypes = docs.map(d => d.type)
      expect(docTypes).not.toContain('surat_pernyataan_bebas_temuan')
      expect(docTypes).not.toContain('surat_rekomendasi')
      expect(docTypes).not.toContain('sk_pns')
      expect(docTypes).not.toContain('sk_pangkat_terakhir')
      expect(docTypes).not.toContain('skp')
    })
  })
})

describe('isDocumentHidden', () => {
  it('should return false when tujuan is empty', () => {
    ALL_DOCUMENT_TYPES.forEach(docType => {
      expect(isDocumentHidden(docType, '')).toBe(false)
    })
  })

  // Property test: isDocumentHidden should be inverse of visible documents
  it('Property: isDocumentHidden is consistent with getVisibleDocuments', () => {
    fc.assert(
      fc.property(tujuanArbitrary, documentTypeArbitrary, (tujuan, docType) => {
        const isHidden = isDocumentHidden(docType, tujuan)
        const visibleDocs = getVisibleDocuments(tujuan)
        const isVisible = visibleDocs.some(d => d.type === docType)
        
        return isHidden !== isVisible
      }),
      { numRuns: 100 }
    )
  })
})

describe('getRequiredDocuments', () => {
  it('should return empty array when tujuan is empty', () => {
    expect(getRequiredDocuments('')).toEqual([])
  })

  it('should return correct required documents for each tujuan', () => {
    expect(getRequiredDocuments('mutasi').length).toBe(7)
    expect(getRequiredDocuments('promosi').length).toBe(6)
    expect(getRequiredDocuments('lainnya_asn').length).toBe(6)
    expect(getRequiredDocuments('lainnya_non_asn').length).toBe(2)
  })
})

describe('getOptionalDocuments', () => {
  it('should return empty array when tujuan is empty', () => {
    expect(getOptionalDocuments('')).toEqual([])
  })

  it('should return empty array for all current tujuan (no optional docs configured)', () => {
    ALL_TUJUAN.forEach(tujuan => {
      expect(getOptionalDocuments(tujuan)).toEqual([])
    })
  })
})


/**
 * Task 4.3: Test validasi form dinamis
 * Property 3: Validation Scope Correctness
 * Validates: Requirements 5.1, 5.2
 */
describe('validateDynamicForm - Property 3: Validation Scope Correctness', () => {
  // Helper to create mock uploaded files
  const createMockFile = () => new File(['test'], 'test.pdf', { type: 'application/pdf' })
  
  const createEmptyUploadedFiles = (): Record<DocumentType, File | null> => ({
    surat_permohonan: null,
    surat_pernyataan_bebas_temuan: null,
    surat_rekomendasi: null,
    sk_pns: null,
    sk_pangkat_terakhir: null,
    daftar_riwayat_pekerjaan: null,
    skp: null,
  })

  const createFullUploadedFiles = (): Record<DocumentType, File | null> => ({
    surat_permohonan: createMockFile(),
    surat_pernyataan_bebas_temuan: createMockFile(),
    surat_rekomendasi: createMockFile(),
    sk_pns: createMockFile(),
    sk_pangkat_terakhir: createMockFile(),
    daftar_riwayat_pekerjaan: createMockFile(),
    skp: createMockFile(),
  })

  describe('Empty tujuan validation', () => {
    it('should return error when tujuan is empty', () => {
      const result = validateDynamicForm('', '', createEmptyUploadedFiles())
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Pilih tujuan permohonan terlebih dahulu')
    })
  })

  describe('Tujuan lainnya validation', () => {
    it('should require tujuan lainnya text for lainnya_asn', () => {
      const files = createFullUploadedFiles()
      const result = validateDynamicForm('lainnya_asn', '', files)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Tuliskan tujuan permohonan Anda')
    })

    it('should require tujuan lainnya text for lainnya_non_asn', () => {
      const files = {
        ...createEmptyUploadedFiles(),
        surat_permohonan: createMockFile(),
        daftar_riwayat_pekerjaan: createMockFile(),
      }
      const result = validateDynamicForm('lainnya_non_asn', '', files)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Tuliskan tujuan permohonan Anda')
    })

    it('should not require tujuan lainnya text for mutasi', () => {
      const files = createFullUploadedFiles()
      const result = validateDynamicForm('mutasi', '', files)
      expect(result.errors).not.toContain('Tuliskan tujuan permohonan Anda')
    })

    it('should not require tujuan lainnya text for promosi', () => {
      const files = createFullUploadedFiles()
      const result = validateDynamicForm('promosi', '', files)
      expect(result.errors).not.toContain('Tuliskan tujuan permohonan Anda')
    })
  })

  describe('Document validation scope', () => {
    // Property test: validation only checks required documents for the selected tujuan
    it('Property 3: Validation only checks documents required for the selected tujuan', () => {
      fc.assert(
        fc.property(tujuanArbitrary, (tujuan) => {
          const requiredDocs = getRequiredDocuments(tujuan)
          
          // Create files with only required documents uploaded
          const files = createEmptyUploadedFiles()
          requiredDocs.forEach(docType => {
            files[docType] = createMockFile()
          })
          
          // For lainnya types, provide tujuan text
          const tujuanText = shouldShowTujuanLainnya(tujuan) ? 'Test tujuan' : ''
          
          const result = validateDynamicForm(tujuan, tujuanText, files)
          
          // Should be valid when all required docs are uploaded
          return result.isValid === true
        }),
        { numRuns: 100 }
      )
    })

    it('should be valid for mutasi with all 7 documents', () => {
      const files = createFullUploadedFiles()
      const result = validateDynamicForm('mutasi', '', files)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should be valid for promosi with 6 documents (without surat_rekomendasi)', () => {
      const files = {
        ...createEmptyUploadedFiles(),
        surat_permohonan: createMockFile(),
        surat_pernyataan_bebas_temuan: createMockFile(),
        sk_pns: createMockFile(),
        sk_pangkat_terakhir: createMockFile(),
        daftar_riwayat_pekerjaan: createMockFile(),
        skp: createMockFile(),
      }
      const result = validateDynamicForm('promosi', '', files)
      expect(result.isValid).toBe(true)
    })

    it('should be valid for lainnya_non_asn with only 2 documents', () => {
      const files = {
        ...createEmptyUploadedFiles(),
        surat_permohonan: createMockFile(),
        daftar_riwayat_pekerjaan: createMockFile(),
      }
      const result = validateDynamicForm('lainnya_non_asn', 'Tujuan saya adalah...', files)
      expect(result.isValid).toBe(true)
    })

    it('should be invalid when required documents are missing', () => {
      const files = createEmptyUploadedFiles()
      const result = validateDynamicForm('mutasi', '', files)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Lengkapi semua dokumen wajib')
    })
  })
})

describe('areAllRequiredDocumentsUploaded', () => {
  const createMockFile = () => new File(['test'], 'test.pdf', { type: 'application/pdf' })
  
  const createEmptyUploadedFiles = (): Record<DocumentType, File | null> => ({
    surat_permohonan: null,
    surat_pernyataan_bebas_temuan: null,
    surat_rekomendasi: null,
    sk_pns: null,
    sk_pangkat_terakhir: null,
    daftar_riwayat_pekerjaan: null,
    skp: null,
  })

  it('should return false when tujuan is empty', () => {
    expect(areAllRequiredDocumentsUploaded(createEmptyUploadedFiles(), '')).toBe(false)
  })

  it('should return false when no documents are uploaded', () => {
    expect(areAllRequiredDocumentsUploaded(createEmptyUploadedFiles(), 'mutasi')).toBe(false)
  })

  // Property test: returns true only when all required docs are uploaded
  it('Property: Returns true iff all required documents are uploaded', () => {
    fc.assert(
      fc.property(tujuanArbitrary, (tujuan) => {
        const requiredDocs = getRequiredDocuments(tujuan)
        
        // Test with all required docs uploaded
        const fullFiles = createEmptyUploadedFiles()
        requiredDocs.forEach(docType => {
          fullFiles[docType] = createMockFile()
        })
        const resultFull = areAllRequiredDocumentsUploaded(fullFiles, tujuan)
        
        // Test with one required doc missing (if there are any)
        if (requiredDocs.length > 0) {
          const partialFiles = createEmptyUploadedFiles()
          requiredDocs.slice(1).forEach(docType => {
            partialFiles[docType] = createMockFile()
          })
          const resultPartial = areAllRequiredDocumentsUploaded(partialFiles, tujuan)
          
          return resultFull === true && resultPartial === false
        }
        
        return resultFull === true
      }),
      { numRuns: 100 }
    )
  })
})
