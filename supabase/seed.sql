-- Seed data untuk development
-- Password: ipdn12345 (bcrypt hash)

INSERT INTO users (nip, nama, pangkat, jabatan, instansi, email, password_hash, roles, is_active)
VALUES
(
  '200212312024091001',
  'Administrator',
  'Penata Muda, III/a',
  'Administrator Sistem',
  'Inspektorat Daerah Kabupaten Bintan',
  'admin@bintankab.go.id',
  '$2a$12$LJ3m4ys3Gql.ZkG0xGxJSObQvqGqGqGqGqGqGqGqGqGqGqGqGqGqG', -- ganti dengan hash yang valid
  ARRAY['admin'],
  true
),
(
  '200212312024091002',
  'Kasubbag Anev',
  'Penata, III/c',
  'Kepala Sub Bagian Analisis dan Evaluasi',
  'Inspektorat Daerah Kabupaten Bintan',
  'kasubbag@bintankab.go.id',
  '$2a$12$LJ3m4ys3Gql.ZkG0xGxJSObQvqGqGqGqGqGqGqGqGqGqGqGqGqG',
  ARRAY['kasubbag_anev'],
  true
),
(
  '200212312024091003',
  'Sekretaris',
  'Pembina, IV/a',
  'Sekretaris Inspektorat',
  'Inspektorat Daerah Kabupaten Bintan',
  'sekretaris@bintankab.go.id',
  '$2a$12$LJ3m4ys3Gql.ZkG0xGxJSObQvqGqGqGqGqGqGqGqGqGqGqGqGqG',
  ARRAY['sekretaris'],
  true
),
(
  '200212312024091004',
  'Inspektur',
  'Pembina Utama Muda, IV/c',
  'Inspektur Daerah',
  'Inspektorat Daerah Kabupaten Bintan',
  'inspektur@bintankab.go.id',
  '$2a$12$LJ3m4ys3Gql.ZkG0xGxJSObQvqGqGqGqGqGqGqGqGqGqGqGqGqG',
  ARRAY['inspektur'],
  true
);
