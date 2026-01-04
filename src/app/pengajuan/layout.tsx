import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ajukan Permohonan SKBT Online',
  description: 'Form pengajuan Surat Keterangan Bebas Temuan (SKBT) online untuk mutasi, promosi jabatan, dan keperluan lainnya. Layanan gratis dari Inspektorat Kabupaten Bintan.',
  keywords: ['ajukan SKBT', 'form SKBT online', 'permohonan bebas temuan', 'SKBT mutasi', 'SKBT promosi', 'e-nihil pengajuan'],
  openGraph: {
    title: 'Ajukan Permohonan SKBT Online | e-Nihil Bintan',
    description: 'Form pengajuan Surat Keterangan Bebas Temuan (SKBT) online untuk mutasi, promosi jabatan, dan keperluan lainnya.',
  },
}

export default function PengajuanLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
