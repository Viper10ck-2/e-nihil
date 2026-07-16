import Link from 'next/link'
import { MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-[#0c1524] text-white border-t border-white/5">
      <div className="container px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-10">
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-bintan.png"
                alt="Logo Kabupaten Bintan"
                className="h-10 sm:h-12 w-auto"
              />
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white">e-Nihil</h3>
                <p className="text-[9px] sm:text-[10px] text-amber-400/80 uppercase tracking-wider">Inspektorat Kab. Bintan</p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-white/50 leading-relaxed">
              Sistem Layanan Surat Keterangan Bebas Temuan (SKBT) secara elektronik dari Inspektorat Daerah Kabupaten Bintan, Kepulauan Riau.
            </p>
          </div>

          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-white/80 mb-3 sm:mb-4">Layanan</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-white/50">
              <li><Link href="/pengajuan" className="hover:text-amber-400 transition-colors">Pengajuan SKBT</Link></li>
              <li><Link href="/tracking" className="hover:text-amber-400 transition-colors">Cek Status</Link></li>
              <li><Link href="/login" className="hover:text-amber-400 transition-colors">Login Admin</Link></li>
            </ul>
          </div>

          <div className="sm:col-span-2 md:col-span-1">
            <h4 className="text-xs sm:text-sm font-semibold text-white/80 mb-3 sm:mb-4">Hubungi Kami</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-white/50">
              <li className="flex items-start gap-2">
                <MapPin size={12} className="mt-0.5 flex-shrink-0 text-white/30 sm:size-[14px]" />
                <span>Jalan Raya Tanjungpinang-Tanjunguban KM.42<br />Bandar Seri Bentan, Kabupaten Bintan<br />Provinsi Kepulauan Riau, Indonesia</span>
              </li>
              <li>Telp: (0771) 8080223</li>
              <li>Email: inspektorat.bintan@gmail.com</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 mt-6 sm:mt-10 pt-4 sm:pt-6 text-center text-[10px] sm:text-xs text-white/30">
          <p>© {new Date().getFullYear()} Inspektorat Daerah Kabupaten Bintan</p>
        </div>
      </div>
    </footer>
  )
}
