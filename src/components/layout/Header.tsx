'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Menu, X, LogOut, LayoutDashboard, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const router = useRouter()

  // Different nav links for logged in vs public users
  const publicNavLinks = [
    { href: '/', label: 'Beranda' },
    { href: '/pengajuan', label: 'Pengajuan' },
    { href: '/tracking', label: 'Cek Status' },
  ]

  const adminNavLinks = [
    { href: '/dashboard', label: 'Dashboard' },
  ]

  const navLinks = user ? adminNavLinks : publicNavLinks

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <header className="bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 text-white shadow-xl relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-400/10 rounded-full blur-xl"></div>
      </div>
      
      {/* Main header with logo centered */}
      <div className="container relative z-10">
        <div className="flex items-center justify-between py-4">
          {/* Left: Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Left nav (desktop) */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {user ? (
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            ) : (
              publicNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                >
                  {link.label}
                </Link>
              ))
            )}
          </nav>

          {/* Center: Logo and Title */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-md group-hover:bg-white/30 transition-all"></div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-bintan.png"
                alt="Logo Kabupaten Bintan"
                className="h-12 w-auto relative z-10 drop-shadow-lg"
              />
            </div>
            <div className="text-center">
              <h1 className="text-xl font-bold leading-tight tracking-wide">e-Nihil</h1>
              <p className="text-[10px] text-blue-200 hidden sm:block tracking-wider uppercase">Inspektorat Kab. Bintan</p>
            </div>
          </Link>

          {/* Right nav (desktop) */}
          <nav className="hidden md:flex items-center gap-2 flex-1 justify-end">
            {user ? (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="text-white hover:bg-white/10 hover:text-white border border-white/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            ) : (
              <Link href="/login">
                <Button 
                  size="sm" 
                  className="bg-white text-blue-700 hover:bg-blue-50 shadow-lg font-medium"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Button>
              </Link>
            )}
          </nav>

          {/* Right: Login/Logout button (mobile) */}
          {user ? (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout} 
              className="md:hidden text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          ) : (
            <Link href="/login" className="md:hidden">
              <Button size="sm" className="bg-white text-blue-700 hover:bg-blue-50">
                <LogIn className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden pb-4 border-t border-white/10 pt-4 animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-1">
              {user ? (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-sm font-medium hover:bg-white/10 transition-colors py-3 px-3 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              ) : (
                navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm font-medium hover:bg-white/10 transition-colors py-3 px-3 rounded-lg"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
