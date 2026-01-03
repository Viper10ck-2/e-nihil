import type { DocumentType } from '@/types/database'

// Daftar Pangkat dan Golongan PNS (PP No. 99 Tahun 2000)
export const PANGKAT_GOLONGAN = [
  // Golongan I (Juru)
  { value: 'Juru Muda, I/a', label: 'Juru Muda, I/a' },
  { value: 'Juru Muda Tingkat I, I/b', label: 'Juru Muda Tingkat I, I/b' },
  { value: 'Juru, I/c', label: 'Juru, I/c' },
  { value: 'Juru Tingkat I, I/d', label: 'Juru Tingkat I, I/d' },
  
  // Golongan II (Pengatur)
  { value: 'Pengatur Muda, II/a', label: 'Pengatur Muda, II/a' },
  { value: 'Pengatur Muda Tingkat I, II/b', label: 'Pengatur Muda Tingkat I, II/b' },
  { value: 'Pengatur, II/c', label: 'Pengatur, II/c' },
  { value: 'Pengatur Tingkat I, II/d', label: 'Pengatur Tingkat I, II/d' },
  
  // Golongan III (Penata)
  { value: 'Penata Muda, III/a', label: 'Penata Muda, III/a' },
  { value: 'Penata Muda Tingkat I, III/b', label: 'Penata Muda Tingkat I, III/b' },
  { value: 'Penata, III/c', label: 'Penata, III/c' },
  { value: 'Penata Tingkat I, III/d', label: 'Penata Tingkat I, III/d' },
  
  // Golongan IV (Pembina)
  { value: 'Pembina, IV/a', label: 'Pembina, IV/a' },
  { value: 'Pembina Tingkat I, IV/b', label: 'Pembina Tingkat I, IV/b' },
  { value: 'Pembina Utama Muda, IV/c', label: 'Pembina Utama Muda, IV/c' },
  { value: 'Pembina Utama Madya, IV/d', label: 'Pembina Utama Madya, IV/d' },
  { value: 'Pembina Utama, IV/e', label: 'Pembina Utama, IV/e' },
] as const

// Daftar Unit Kerja/OPD Kabupaten Bintan (sumber: bintankab.go.id/instansi)
export const UNIT_KERJA = [
  // Sekretariat
  { value: 'Sekretariat Daerah Kabupaten Bintan', label: 'Sekretariat Daerah Kabupaten Bintan' },
  { value: 'Sekretariat DPRD Kabupaten Bintan', label: 'Sekretariat DPRD Kabupaten Bintan' },
  
  // Inspektorat
  { value: 'Inspektorat Daerah Kabupaten Bintan', label: 'Inspektorat Daerah Kabupaten Bintan' },
  
  // Dinas-Dinas
  { value: 'Dinas Pendidikan', label: 'Dinas Pendidikan' },
  { value: 'Dinas Kesehatan', label: 'Dinas Kesehatan' },
  { value: 'Dinas Pekerjaan Umum dan Penataan Ruang', label: 'Dinas Pekerjaan Umum dan Penataan Ruang' },
  { value: 'Dinas Perumahan dan Kawasan Permukiman', label: 'Dinas Perumahan dan Kawasan Permukiman' },
  { value: 'Dinas Sosial', label: 'Dinas Sosial' },
  { value: 'Dinas Tenaga Kerja', label: 'Dinas Tenaga Kerja' },
  { value: 'Dinas Ketahanan Pangan dan Pertanian', label: 'Dinas Ketahanan Pangan dan Pertanian' },
  { value: 'Dinas Lingkungan Hidup', label: 'Dinas Lingkungan Hidup' },
  { value: 'Dinas Kependudukan dan Pencatatan Sipil', label: 'Dinas Kependudukan dan Pencatatan Sipil' },
  { value: 'Dinas Pemberdayaan Masyarakat dan Desa', label: 'Dinas Pemberdayaan Masyarakat dan Desa' },
  { value: 'Dinas Pemberdayaan Perempuan, Perlindungan Anak, Pengendalian Penduduk dan KB', label: 'Dinas Pemberdayaan Perempuan, Perlindungan Anak, Pengendalian Penduduk dan KB' },
  { value: 'Dinas Perhubungan', label: 'Dinas Perhubungan' },
  { value: 'Dinas Komunikasi dan Informatika', label: 'Dinas Komunikasi dan Informatika' },
  { value: 'Dinas Koperasi, Usaha Mikro dan Perindag', label: 'Dinas Koperasi, Usaha Mikro dan Perindag' },
  { value: 'Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu', label: 'Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu' },
  { value: 'Dinas Pemuda dan Olahraga', label: 'Dinas Pemuda dan Olahraga' },
  { value: 'Dinas Kebudayaan dan Pariwisata', label: 'Dinas Kebudayaan dan Pariwisata' },
  { value: 'Dinas Perpustakaan dan Arsip', label: 'Dinas Perpustakaan dan Arsip' },
  { value: 'Dinas Perikanan', label: 'Dinas Perikanan' },
  
  // Badan-Badan
  { value: 'Badan Perencanaan Pembangunan Riset dan Inovasi Daerah', label: 'Badan Perencanaan Pembangunan Riset dan Inovasi Daerah' },
  { value: 'Badan Keuangan dan Aset Daerah', label: 'Badan Keuangan dan Aset Daerah' },
  { value: 'Badan Pendapatan Daerah', label: 'Badan Pendapatan Daerah' },
  { value: 'Badan Kepegawaian dan Pengembangan Sumber Daya Manusia', label: 'Badan Kepegawaian dan Pengembangan Sumber Daya Manusia' },
  { value: 'Badan Penanggulangan Bencana Daerah', label: 'Badan Penanggulangan Bencana Daerah' },
  { value: 'Badan Kesatuan Bangsa dan Politik', label: 'Badan Kesatuan Bangsa dan Politik' },
  
  // Satuan Polisi Pamong Praja
  { value: 'Satuan Polisi Pamong Praja', label: 'Satuan Polisi Pamong Praja' },
  
  // RSUD
  { value: 'RSUD Kabupaten Bintan', label: 'RSUD Kabupaten Bintan' },
  
  // Kecamatan
  { value: 'Kecamatan Bintan Timur', label: 'Kecamatan Bintan Timur' },
  { value: 'Kecamatan Bintan Utara', label: 'Kecamatan Bintan Utara' },
  { value: 'Kecamatan Bintan Pesisir', label: 'Kecamatan Bintan Pesisir' },
  { value: 'Kecamatan Teluk Bintan', label: 'Kecamatan Teluk Bintan' },
  { value: 'Kecamatan Teluk Sebong', label: 'Kecamatan Teluk Sebong' },
  { value: 'Kecamatan Seri Kuala Lobam', label: 'Kecamatan Seri Kuala Lobam' },
  { value: 'Kecamatan Gunung Kijang', label: 'Kecamatan Gunung Kijang' },
  { value: 'Kecamatan Mantang', label: 'Kecamatan Mantang' },
  { value: 'Kecamatan Tambelan', label: 'Kecamatan Tambelan' },
  { value: 'Kecamatan Toapaya', label: 'Kecamatan Toapaya' },
  
  // Kelurahan di Kecamatan Bintan Timur
  { value: 'Kelurahan Kijang Kota', label: 'Kelurahan Kijang Kota' },
  { value: 'Kelurahan Sei Enam', label: 'Kelurahan Sei Enam' },
  { value: 'Kelurahan Sei Lekop', label: 'Kelurahan Sei Lekop' },
  { value: 'Kelurahan Gunung Lengkuas', label: 'Kelurahan Gunung Lengkuas' },
  
  // Kelurahan di Kecamatan Seri Kuala Lobam
  { value: 'Kelurahan Tanjung Uban Utara', label: 'Kelurahan Tanjung Uban Utara' },
  { value: 'Kelurahan Tanjung Uban Selatan', label: 'Kelurahan Tanjung Uban Selatan' },
  { value: 'Kelurahan Tanjung Uban Timur', label: 'Kelurahan Tanjung Uban Timur' },
  { value: 'Kelurahan Tanjung Uban Kota', label: 'Kelurahan Tanjung Uban Kota' },
  
  // Kelurahan di Kecamatan Teluk Sebong
  { value: 'Kelurahan Kota Baru', label: 'Kelurahan Kota Baru' },

  // Kelurahan di Kecamatan Teluk Bintan
  { value: 'Kelurahan Tembeling Tanjung', label: 'Kelurahan Tembeling Tanjung' },

  // Kelurahan di Kecamatan Gunung Kijang
  { value: 'Kelurahan Kawal', label: 'Kelurahan Kawal' },

  // Kelurahan di Kecamatan Tambelan
  { value: 'Kelurahan Teluk Sekuni', label: 'Kelurahan Teluk Sekuni' },

  // Kelurahan di Kecamatan Toapaya
  { value: 'Kelurahan Toapaya Asri', label: 'Kelurahan Toapaya Asri' },

  // Kelurahan di Kecamatan Sri Koala Lobam
  { value: 'Kelurahan Teluk Lobam', label: 'Kelurahan Teluk Lobam' },
  { value: 'Kelurahan Tanjung Permai', label: 'Kelurahan Tanjung Permai' },

] as const

export const DOCUMENT_TYPES: { type: DocumentType; label: string }[] = [
  { type: 'surat_permohonan', label: 'Surat Permohonan kepada Inspektur' },
  { type: 'surat_pernyataan_bebas_temuan', label: 'Surat Pengantar dari Kepala Dinas/Badan' },
  { type: 'surat_rekomendasi', label: 'Surat Keterangan/Rekomendasi Terima dari Instansi Tujuan' },
  { type: 'sk_pns', label: 'SK PNS' },
  { type: 'sk_pangkat_terakhir', label: 'SK Pangkat Terakhir' },
  { type: 'daftar_riwayat_pekerjaan', label: 'Daftar Riwayat Pekerjaan' },
  { type: 'skp', label: 'SKP Satu Tahun Terakhir' },
]

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB in bytes

export const ACCEPTED_FILE_TYPES = ['application/pdf']

export const STATUS_FLOW = [
  'Menunggu Verifikasi Admin',
  'Diverifikasi Admin',
  'Diparaf Kasubbag Anev',
  'Diproses Sekretaris',
  'Ditandatangani Inspektur',
  'Selesai',
  'Diambil',
] as const
