'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Menu, X, LogOut, LayoutDashboard, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

const MENU_ITEMS = [
  { href: '/', label: 'Beranda' },
  { href: '/pengajuan', label: 'Pengajuan' },
  { href: '/tracking', label: 'Cek Status' },
]

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <header className="bg-[#0f172a]/70 backdrop-blur-[16px] sticky top-0 z-50 border-b border-white/[0.08]">
      {/* Top Bar */}
      <div className="bg-[#080d17]/70 backdrop-blur-[16px] text-white/40 text-[10px] sm:text-xs py-1 sm:py-1.5 border-b border-white/5">
        <div className="container px-4 flex justify-between items-center">
          <span className="truncate mr-2">Pemerintah Daerah Kabupaten Bintan</span>
          <div className="hidden sm:flex items-center gap-3 sm:gap-4 shrink-0">
            <span>Telp (0771) 8080223</span>
            <span className="hidden md:inline">inspektorat.bintan@gmail.com</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container px-4">
        <div className="flex items-center py-2 sm:py-3">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0 flex-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/header-halaman-depan.png"
              alt="Logo Kabupaten Bintan"
              className="h-10 sm:h-12 w-auto"
            />
            <div className="hidden xs:block">
              <h1 className="text-sm sm:text-base font-bold text-white leading-tight">
                e-Nihil
              </h1>
              <p className="text-[9px] sm:text-[11px] text-amber-400/80 uppercase tracking-wider hidden sm:block">
                Inspektorat Kab. Bintan
              </p>
            </div>
          </Link>

          {/* Desktop Navigation - centered */}
          <nav className="hidden lg:flex items-center gap-1 justify-center">
            {MENU_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-4 py-2 text-sm font-medium text-white/80 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            {user ? (
              <div className="flex items-center gap-3">
                <Link href="/dashboard">
                  <Button size="sm" variant="outline" className="border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-[#0f1729]">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleLogout}
                  className="text-white/60 hover:text-red-400 hover:bg-white/5"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-400 text-[#0f1729] font-bold shadow-md"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Button>
              </Link>
            )}

            <button
              className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="lg:hidden pb-4 border-t border-white/10 pt-4 animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-1">
              {MENU_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-3 text-sm font-medium text-white/80 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
