-- e-Nihil Database Schema
-- Sistem Layanan Keterangan Bebas Temuan - Inspektorat Kabupaten Bintan

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (staff only)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Status history table
CREATE TABLE IF NOT EXISTS status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  notes TEXT,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_applications_tracking_number ON applications(tracking_number);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at);
CREATE INDEX IF NOT EXISTS idx_documents_application_id ON documents(application_id);
CREATE INDEX IF NOT EXISTS idx_status_history_application_id ON status_history(application_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read applications (for tracking)
CREATE POLICY "Anyone can read applications by tracking number"
  ON applications FOR SELECT
  USING (true);

-- Policy: Anyone can insert applications (public form)
CREATE POLICY "Anyone can insert applications"
  ON applications FOR INSERT
  WITH CHECK (true);

-- Policy: Only authenticated staff can update applications
CREATE POLICY "Staff can update applications"
  ON applications FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Policy: Anyone can read documents for their application
CREATE POLICY "Anyone can read documents"
  ON documents FOR SELECT
  USING (true);

-- Policy: Anyone can insert documents
CREATE POLICY "Anyone can insert documents"
  ON documents FOR INSERT
  WITH CHECK (true);

-- Policy: Anyone can read status history
CREATE POLICY "Anyone can read status history"
  ON status_history FOR SELECT
  USING (true);

-- Policy: Anyone can insert status history (for initial submission)
CREATE POLICY "Anyone can insert status history"
  ON status_history FOR INSERT
  WITH CHECK (true);

-- Policy: Only authenticated staff can update status history
CREATE POLICY "Staff can update status history"
  ON status_history FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Policy: Only authenticated users can read users table
CREATE POLICY "Authenticated users can read users"
  ON users FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Only admin can manage users
CREATE POLICY "Admin can manage users"
  ON users FOR ALL
  USING (auth.role() = 'authenticated');

-- Insert default admin user (password: ipdn12345)
INSERT INTO users (nip, nama, pangkat, jabatan, instansi, email, password_hash, roles, is_active)
VALUES (
  '200212312024091001',
  'Administrator',
  'Penata Muda',
  'Administrator Sistem',
  'Inspektorat Daerah Kabupaten Bintan',
  'admin@inspektorat.bintankab.go.id',
  'ipdn12345',
  ARRAY['admin', 'kasubbag_anev', 'sekretaris', 'inspektur'],
  true
)
ON CONFLICT (nip) DO NOTHING;

-- Create storage bucket for documents
-- Note: Run this in Supabase Dashboard > Storage
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- =====================================================
-- IMPORTANT: Run these SQL commands in Supabase Dashboard
-- to fix RLS policies for public application submission
-- =====================================================

-- Option 1: Disable RLS (simpler, for development)
-- ALTER TABLE applications DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE status_history DISABLE ROW LEVEL SECURITY;

-- Option 2: Fix existing policies (for production)
-- Drop old restrictive policy and create new one
-- DROP POLICY IF EXISTS "Staff can insert status history" ON status_history;
-- CREATE POLICY "Anyone can insert status history" ON status_history FOR INSERT WITH CHECK (true);

-- Storage bucket policies (run in Supabase Dashboard > Storage > Policies)
-- Allow public uploads to documents bucket:
-- CREATE POLICY "Allow public uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents');
-- CREATE POLICY "Allow public reads" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
