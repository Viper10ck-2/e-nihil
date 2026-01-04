import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cek Status Permohonan SKBT',
  description: 'Lacak dan pantau status permohonan Surat Keterangan Bebas Temuan (SKBT) Anda secara real-time. Masukkan nomor tracking untuk melihat progress.',
  keywords: ['cek status SKBT', 'tracking SKBT', 'lacak permohonan', 'status bebas temuan', 'e-nihil tracking'],
  openGraph: {
    title: 'Cek Status Permohonan SKBT | e-Nihil Bintan',
    description: 'Lacak dan pantau status permohonan Surat Keterangan Bebas Temuan (SKBT) Anda secara real-time.',
  },
}

export default function TrackingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
