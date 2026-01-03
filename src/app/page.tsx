import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DocumentRequirementsCarousel } from '@/components/home/DocumentRequirementsCarousel'
import { 
  FileText, 
  CheckCircle, 
  ClipboardList,
  UserCheck,
  FileCheck,
  Stamp,
  BadgeCheck,
  Download,
  Shield,
  Zap,
  HeadphonesIcon
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/30">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white rounded-full translate-x-1/3 translate-y-1/3"></div>
            <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-400 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
          </div>
        </div>
        
        <div className="container relative z-10 py-20 md:py-32">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm mb-6">
                <Shield className="h-4 w-4" />
                Layanan Resmi Inspektorat Kab. Bintan
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                e-Nihil
                <span className="block text-2xl md:text-3xl font-normal text-blue-200 mt-2">
                  Surat Keterangan Bebas Temuan
                </span>
              </h1>
              <p className="text-lg text-blue-100 mb-8 max-w-xl mx-auto lg:mx-0">
                Layanan penerbitan Surat Keterangan Bebas Temuan secara online, 
                cepat, transparan, dan tanpa biaya dari Inspektorat Daerah Kabupaten Bintan
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/pengajuan">
                  <Button size="lg" className="w-full sm:w-auto bg-white text-blue-700 hover:bg-blue-50 shadow-lg shadow-blue-900/20 font-semibold px-8">
                    <FileText className="mr-2 h-5 w-5" />
                    Ajukan Permohonan
                  </Button>
                </Link>
                <Link href="/tracking">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-2 border-white/50 text-white hover:bg-white/10 hover:border-white px-8">
                    <ClipboardList className="mr-2 h-5 w-5" />
                    Cek Status Permohonan
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex-1 hidden lg:flex justify-center">
              <div className="relative">
                <div className="w-80 h-80 bg-white/10 backdrop-blur-sm rounded-3xl rotate-6 absolute"></div>
                <div className="w-80 h-80 bg-white rounded-3xl shadow-2xl flex items-center justify-center relative z-10">
                  <Image 
                    src="/logo-inspektorat.png" 
                    alt="Logo Inspektorat" 
                    width={200} 
                    height={200}
                    className="opacity-90"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Mengapa Menggunakan e-Nihil?</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Layanan digital yang memudahkan proses pengajuan Surat Keterangan Bebas Temuan
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-blue-50">
              <CardContent className="pt-8 pb-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Cepat & Efisien</h3>
                <p className="text-slate-600">Proses pengajuan hanya membutuhkan waktu 3 hari kerja</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-green-50">
              <CardContent className="pt-8 pb-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">100% Gratis</h3>
                <p className="text-slate-600">Tidak dipungut biaya apapun untuk layanan ini</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-white to-purple-50">
              <CardContent className="pt-8 pb-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <HeadphonesIcon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Transparan</h3>
                <p className="text-slate-600">Pantau status permohonan Anda secara real-time</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">3</div>
              <div className="text-blue-200 text-sm md:text-base">Hari Kerja</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">7</div>
              <div className="text-blue-200 text-sm md:text-base">Dokumen Persyaratan</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">6</div>
              <div className="text-blue-200 text-sm md:text-base">Tahap Verifikasi</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">24/7</div>
              <div className="text-blue-200 text-sm md:text-base">Akses Online</div>
            </div>
          </div>
        </div>
      </section>

      {/* Persyaratan Section */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Persyaratan Dokumen</h2>
            <p className="text-slate-600">Dokumen yang diperlukan berbeda berdasarkan tujuan permohonan</p>
          </div>
          <DocumentRequirementsCarousel />
        </div>
      </section>

      {/* Prosedur Section */}
      <section className="py-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Alur Prosedur Online</h2>
            <p className="text-slate-600">Proses pengajuan yang mudah dan transparan</p>
          </div>
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: FileText,
                  title: 'Pengajuan',
                  desc: 'Pemohon mengisi form dan upload dokumen persyaratan',
                  color: 'from-blue-500 to-blue-600',
                  shadow: 'shadow-blue-500/30',
                  step: 1
                },
                {
                  icon: UserCheck,
                  title: 'Verifikasi Admin',
                  desc: 'Admin memverifikasi kelengkapan dokumen',
                  color: 'from-cyan-500 to-cyan-600',
                  shadow: 'shadow-cyan-500/30',
                  step: 2
                },
                {
                  icon: FileCheck,
                  title: 'Review Kasubbag',
                  desc: 'Kasubbag Anev memverifikasi dan membubuhkan paraf',
                  color: 'from-teal-500 to-teal-600',
                  shadow: 'shadow-teal-500/30',
                  step: 3
                },
                {
                  icon: Stamp,
                  title: 'Proses Sekretaris',
                  desc: 'Sekretaris menyampaikan ke Inspektur',
                  color: 'from-indigo-500 to-indigo-600',
                  shadow: 'shadow-indigo-500/30',
                  step: 4
                },
                {
                  icon: BadgeCheck,
                  title: 'Tanda Tangan',
                  desc: 'Inspektur menandatangani surat',
                  color: 'from-violet-500 to-violet-600',
                  shadow: 'shadow-violet-500/30',
                  step: 5
                },
                {
                  icon: Download,
                  title: 'Pengambilan',
                  desc: 'Pemohon mengambil surat yang sudah selesai',
                  color: 'from-green-500 to-green-600',
                  shadow: 'shadow-green-500/30',
                  step: 6
                },
              ].map((step, index) => (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg ${step.shadow} group-hover:scale-110 transition-transform`}>
                        <step.icon className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-slate-400">LANGKAH {step.step}</span>
                        </div>
                        <h3 className="font-semibold text-slate-800 mb-1">{step.title}</h3>
                        <p className="text-sm text-slate-600">{step.desc}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 translate-y-1/2"></div>
        </div>
        <div className="container relative z-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Siap Mengajukan Permohonan?</h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto text-lg">
            Pastikan Anda telah menyiapkan semua dokumen persyaratan dalam format PDF 
            sebelum memulai pengajuan.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pengajuan">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 shadow-lg shadow-blue-900/30 font-semibold px-10">
                <FileText className="mr-2 h-5 w-5" />
                Mulai Pengajuan Sekarang
              </Button>
            </Link>
            <Link href="/tracking">
              <Button size="lg" variant="outline" className="border-2 border-white/50 text-white hover:bg-white/10 hover:border-white px-10">
                <ClipboardList className="mr-2 h-5 w-5" />
                Cek Status
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image 
                  src="/logo-inspektorat.png" 
                  alt="Logo" 
                  width={40} 
                  height={40}
                  className="brightness-0 invert"
                />
                <div>
                  <h3 className="font-bold text-lg">e-Nihil</h3>
                  <p className="text-slate-400 text-sm">Inspektorat Kab. Bintan</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm">
                Sistem Layanan Keterangan Bebas Temuan secara online dari Inspektorat Daerah Kabupaten Bintan
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Layanan</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link href="/pengajuan" className="hover:text-white transition-colors">Ajukan Permohonan</Link></li>
                <li><Link href="/tracking" className="hover:text-white transition-colors">Cek Status</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Login Admin</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Kontak</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>Inspektorat Daerah Kabupaten Bintan</li>
                <li>Jl. Bintan Buyu, Bandar Seri Bentan</li>
                <li>Kabupaten Bintan, Kepulauan Riau</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-500 text-sm">
            © {new Date().getFullYear()} e-Nihil - Inspektorat Daerah Kabupaten Bintan. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
