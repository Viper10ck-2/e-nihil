import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DocumentRequirementsCarousel } from '@/components/home/DocumentRequirementsCarousel'
import { FileText, ClipboardList } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'e-Nihil Bintan | Layanan SKBT Online Inspektorat Kabupaten Bintan',
  description: 'e-Nihil adalah layanan penerbitan Surat Keterangan Bebas Temuan (SKBT) online dari Inspektorat Daerah Kabupaten Bintan. Ajukan permohonan SKBT untuk mutasi, promosi jabatan secara gratis, cepat, dan transparan.',
}

const prosedurSteps = [
  {
    title: 'Pengajuan Permohonan',
    desc: 'Pemohon mengisi formulir dan mengunggah dokumen persyaratan melalui sistem e-Nihil.',
  },
  {
    title: 'Verifikasi Admin',
    desc: 'Petugas admin memeriksa kelengkapan dan keabsahan seluruh dokumen yang diunggah.',
  },
  {
    title: 'Paraf Kasubbag Anev',
    desc: 'Kepala Sub Bagian Analisis dan Evaluasi memberikan paraf setelah verifikasi selesai.',
  },
  {
    title: 'Proses Sekretaris',
    desc: 'Sekretaris Inspektorat memproses dan meneruskan kepada Inspektur.',
  },
  {
    title: 'Tanda Tangan Inspektur',
    desc: 'Inspektur Daerah menandatangani Surat Keterangan Bebas Temuan.',
  },
  {
    title: 'Pengambilan SKBT',
    desc: 'Pemohon dapat mengambil surat yang telah selesai atau menerima melalui email.',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden" aria-label="Hero">
        <div className="container relative z-10 py-16 sm:py-24 md:py-32 px-4">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <span className="text-amber-400/90 text-[10px] sm:text-xs font-semibold tracking-[0.2em] sm:tracking-[0.25em] uppercase mb-6 sm:mb-8">
              Portal Resmi
            </span>

            <div className="mb-6 sm:mb-8">
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 mx-auto bg-white rounded-full flex items-center justify-center border-[3px] border-amber-400">
                <Image 
                  src="/logo-bintan.png" 
                  alt="Logo Inspektorat Kabupaten Bintan" 
                  width={72} 
                  height={72}
                  className="p-1 w-14 sm:w-[72px]"
                  priority
                />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-2 sm:mb-3 tracking-tight uppercase leading-tight">
              Inspektorat Daerah<br />Kabupaten Bintan
            </h1>

            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="h-px w-8 sm:w-10 bg-amber-400/50"></div>
              <span className="text-base sm:text-lg text-amber-400 font-medium">e-Nihil</span>
              <div className="h-px w-8 sm:w-10 bg-amber-400/50"></div>
            </div>
            
            <p className="text-sm sm:text-base text-white/65 mb-8 sm:mb-10 max-w-lg leading-relaxed px-2">
              Selamat Datang di layanan e-Nihil, sistem penerbitan Surat Keterangan Bebas Temuan secara elektronik dari Inspektorat Daerah Kabupaten Bintan.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto px-0 sm:px-0">
              <Link href="/pengajuan" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-[#0c1524] font-semibold px-6 sm:px-8 py-5 sm:py-6 sm:min-w-[200px] text-sm sm:text-base">
                  <FileText className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Layanan Publik
                </Button>
              </Link>
              <Link href="/tracking" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-transparent border border-amber-400/50 text-amber-400 hover:bg-amber-400/10 hover:border-amber-400 px-6 sm:px-8 py-5 sm:py-6 sm:min-w-[200px] text-sm sm:text-base">
                  <ClipboardList className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Cek Status
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Keunggulan */}
      <section className="py-12 sm:py-16 md:py-20 bg-white" aria-label="Keunggulan">
        <div className="container max-w-5xl px-4">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">Layanan SKBT Online</h2>
            <p className="text-sm sm:text-base text-gray-500 max-w-xl mx-auto">
              Proses penerbitan Surat Keterangan Bebas Temuan kini lebih mudah melalui sistem elektronik terintegrasi
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {[
              { label: 'Cepat', desc: 'Proses pengajuan dan verifikasi selesai dalam 3 hari kerja.', border: 'border-l-blue-600' },
              { label: 'Gratis', desc: 'Tidak dikenakan biaya apapun untuk seluruh proses penerbitan SKBT.', border: 'border-l-emerald-600' },
              { label: 'Transparan', desc: 'Pantau status permohonan secara langsung melalui nomor tracking.', border: 'border-l-amber-500' },
            ].map((item) => (
              <div key={item.label} className={`bg-white border border-gray-100 rounded-lg p-4 sm:p-6 border-l-4 ${item.border}`}>
                <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">{item.label}</h3>
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 sm:py-16 bg-[#0c1524]" aria-label="Statistik">
        <div className="container max-w-4xl px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 text-center gap-y-6">
            {[
              { value: '3', label: 'Hari Kerja' },
              { value: '7', label: 'Dokumen' },
              { value: '6', label: 'Tahap Verifikasi' },
              { value: '24/7', label: 'Akses Online' },
            ].map((stat) => (
              <div key={stat.label} className="py-2 sm:py-4">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-amber-400 mb-1">{stat.value}</div>
                <div className="text-[10px] sm:text-xs text-white/50 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Persyaratan */}
      <section className="py-12 sm:py-16 md:py-20 bg-white" aria-label="Persyaratan">
        <div className="container max-w-5xl px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">Persyaratan Dokumen</h2>
            <p className="text-sm sm:text-base text-gray-500 max-w-xl mx-auto">
              Dokumen yang diperlukan berbeda sesuai dengan tujuan permohonan Surat Keterangan Bebas Temuan
            </p>
          </div>
          <DocumentRequirementsCarousel />
        </div>
      </section>

      {/* Prosedur */}
      <section className="py-12 sm:py-16 md:py-20 bg-gray-50" aria-label="Prosedur">
        <div className="container max-w-5xl px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">Alur Prosedur</h2>
            <p className="text-sm sm:text-base text-gray-500">Tahapan proses penerbitan Surat Keterangan Bebas Temuan</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {prosedurSteps.map((step, i) => (
              <Card key={i} className="bg-white border-gray-100">
                <CardContent className="p-4 sm:p-6">
                  <span className="text-xs font-bold text-gray-300 mb-2 sm:mb-3 block">0{i + 1}</span>
                  <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">{step.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-16 md:py-20 bg-[#0c1524] text-center" aria-label="Ajukan Permohonan">
        <div className="container max-w-2xl px-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 sm:mb-3">Siap Mengajukan Permohonan?</h2>
          <p className="text-sm sm:text-base text-white/50 mb-6 sm:mb-8 leading-relaxed">
            Pastikan seluruh dokumen persyaratan telah disiapkan dalam format PDF sebelum memulai pengajuan.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/pengajuan" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-[#0c1524] font-semibold px-6 sm:px-8 py-5 sm:py-6 sm:min-w-[200px] text-sm sm:text-base">
                <FileText className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Ajukan Sekarang
              </Button>
            </Link>
            <Link href="/tracking" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-transparent border border-amber-400/40 text-amber-400 hover:bg-amber-400/10 hover:border-amber-400 px-6 sm:px-8 py-5 sm:py-6 sm:min-w-[200px] text-sm sm:text-base">
                <ClipboardList className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Cek Status
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
