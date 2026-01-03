export type UserRole = 'admin' | 'kasubbag_anev' | 'sekretaris' | 'inspektur'

export type ApplicationStatus =
  | 'Menunggu Verifikasi Admin'
  | 'Dokumen Ditolak'
  | 'Diverifikasi Admin'
  | 'Diparaf Kasubbag Anev'
  | 'Diproses Sekretaris'
  | 'Ditandatangani Inspektur'
  | 'Selesai'
  | 'Diambil'
  | 'Ditolak'

export type TujuanPermohonan = 'mutasi' | 'promosi' | 'lainnya_asn' | 'lainnya_non_asn'

export type DocumentType =
  | 'surat_permohonan'
  | 'surat_pernyataan_bebas_temuan'
  | 'surat_rekomendasi'
  | 'sk_pns'
  | 'sk_pangkat_terakhir'
  | 'daftar_riwayat_pekerjaan'
  | 'skp'

export interface User {
  id: string
  nip: string
  nama: string
  pangkat?: string
  jabatan?: string
  instansi?: string
  email?: string
  password_hash: string
  roles: UserRole[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Application {
  id: string
  tracking_number: string
  tujuan_permohonan: TujuanPermohonan
  nama_lengkap: string
  nip: string
  pangkat_golongan: string
  jabatan?: string
  unit_kerja_asal?: string
  instansi_tujuan?: string
  alasan_permohonan?: string
  email: string
  nomor_hp: string
  status: ApplicationStatus
  nomor_surat?: string
  rejection_reason?: string
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  application_id: string
  document_type: DocumentType
  file_name: string
  file_path: string
  file_size: number
  uploaded_at: string
}

export interface StatusHistory {
  id: string
  application_id: string
  status: ApplicationStatus
  notes?: string
  changed_by?: string
  changed_at: string
}

export interface AuditLog {
  id: string
  user_id?: string
  action: string
  entity_type: string
  entity_id?: string
  details?: Record<string, unknown>
  ip_address?: string
  created_at: string
}

export interface DocumentRejection {
  id: string
  document_id: string
  application_id: string
  rejection_reason: string
  rejected_by?: string
  rejected_at: string
  resolved_at?: string
  is_resolved: boolean
}

export interface DocumentWithRejection extends Document {
  rejection?: DocumentRejection
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Partial<User> & { nip: string; nama: string; password_hash: string; roles: UserRole[] }
        Update: Partial<User>
      }
      applications: {
        Row: Application
        Insert: Partial<Application> & { tracking_number: string; nama_lengkap: string; nip: string; pangkat_golongan: string; jabatan: string; unit_kerja_asal: string; instansi_tujuan: string; alasan_permohonan: string; email: string; nomor_hp: string }
        Update: Partial<Application>
      }
      documents: {
        Row: Document
        Insert: Partial<Document> & { application_id: string; document_type: DocumentType; file_name: string; file_path: string; file_size: number }
        Update: Partial<Document>
      }
      status_history: {
        Row: StatusHistory
        Insert: Partial<StatusHistory> & { application_id: string; status: ApplicationStatus }
        Update: Partial<StatusHistory>
      }
      audit_logs: {
        Row: AuditLog
        Insert: Partial<AuditLog> & { action: string; entity_type: string }
        Update: Partial<AuditLog>
      }
      document_rejections: {
        Row: DocumentRejection
        Insert: Partial<DocumentRejection> & { document_id: string; application_id: string; rejection_reason: string }
        Update: Partial<DocumentRejection>
      }
    }
  }
}
