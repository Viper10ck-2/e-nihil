-- PostgreSQL 16 Schema untuk e-Nihil (Home Server)
-- Jalankan: sudo -u postgres psql -d "e-nihil" -f postgresql-schema.sql

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nip VARCHAR(18) UNIQUE NOT NULL,
  nama VARCHAR(255) NOT NULL,
  pangkat VARCHAR(100),
  jabatan VARCHAR(255),
  instansi VARCHAR(255),
  email VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  roles TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number VARCHAR(20) UNIQUE NOT NULL,
  tujuan_permohonan VARCHAR(50) NOT NULL DEFAULT 'mutasi',
  nama_lengkap VARCHAR(255) NOT NULL,
  nip VARCHAR(18) NOT NULL,
  pangkat_golongan VARCHAR(100) NOT NULL,
  jabatan VARCHAR(255),
  unit_kerja_asal VARCHAR(255),
  instansi_tujuan VARCHAR(255),
  alasan_permohonan TEXT,
  email VARCHAR(255) NOT NULL,
  nomor_hp VARCHAR(20) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Menunggu Verifikasi Admin',
  nomor_surat VARCHAR(50),
  rejection_reason TEXT,
  pickup_method VARCHAR(20),
  pickup_method_selected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Status history table
CREATE TABLE IF NOT EXISTS status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  notes TEXT,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document rejections table
CREATE TABLE IF NOT EXISTS document_rejections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  rejection_reason TEXT NOT NULL,
  rejected_by UUID REFERENCES users(id),
  rejected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  is_resolved BOOLEAN DEFAULT false
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  token_hash VARCHAR(128) NOT NULL UNIQUE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_applications_tracking ON applications(tracking_number);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_date ON applications(created_at);
CREATE INDEX IF NOT EXISTS idx_documents_app ON documents(application_id);
CREATE INDEX IF NOT EXISTS idx_status_history_app ON status_history(application_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_doc_rejections_app ON document_rejections(application_id);

-- Default admin (password: ipdn12345)
INSERT INTO users (nip, nama, pangkat, jabatan, instansi, email, password_hash, roles, is_active)
VALUES (
  '200212312024091001',
  'Administrator',
  'Penata Muda, III/a',
  'Administrator Sistem',
  'Inspektorat Daerah Kabupaten Bintan',
  'inspektorat.bintan@gmail.com',
  'ipdn12345',
  ARRAY['admin'],
  true
) ON CONFLICT (nip) DO NOTHING;
