import { Mail, MapPin, Phone } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-bold mb-4">e-Nihil</h3>
            <p className="text-sm opacity-80">
              Sistem Layanan Keterangan Bebas Temuan Inspektorat Daerah Kabupaten Bintan.
              Melayani penerbitan Surat Keterangan Bebas Temuan secara online.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Tautan Cepat</h3>
            <ul className="space-y-2 text-sm opacity-80">
              <li>
                <a href="/pengajuan" className="hover:text-accent transition-colors">
                  Ajukan Permohonan
                </a>
              </li>
              <li>
                <a href="/tracking" className="hover:text-accent transition-colors">
                  Cek Status Permohonan
                </a>
              </li>
              <li>
                <a 
                  href="https://inspektorat.bintankab.go.id" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-accent transition-colors"
                >
                  Website Inspektorat
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-4">Kontak</h3>
            <ul className="space-y-3 text-sm opacity-80">
              <li className="flex items-start gap-2">
                <MapPin size={16} className="mt-1 flex-shrink-0" />
                <span>
                  Jl. Bintan Buyu, Bandar Seri Bentan,
                  Kabupaten Bintan, Kepulauan Riau
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="flex-shrink-0" />
                <span>(0771) 123456</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className="flex-shrink-0" />
                <span>inspektorat@bintankab.go.id</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-primary-foreground/20 mt-8 pt-6 text-center text-sm opacity-60">
          <p>
            © {new Date().getFullYear()} Inspektorat Daerah Kabupaten Bintan. 
            Hak Cipta Dilindungi.
          </p>
        </div>
      </div>
    </footer>
  )
}
