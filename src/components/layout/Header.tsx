'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Menu, X, LogOut, LayoutDashboard } from 'lucide-react'
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
    <header className="bg-primary text-primary-foreground shadow-lg">
      {/* Main header with logo centered */}
      <div className="container">
        <div className="flex items-center justify-between py-3">
          {/* Left: Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Left nav (desktop) */}
          <nav className="hidden md:flex items-center gap-6">
            {user ? (
              <Link href="/dashboard">
                <Button variant="secondary" size="sm">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            ) : (
              navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium hover:text-accent transition-colors"
                >
                  {link.label}
                </Link>
              ))
            )}
          </nav>

          {/* Center: Logo and Title - selalu ke halaman depan */}
          <Link href="/" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-bintan.png"
              alt="Logo Kabupaten Bintan"
              className="h-12 w-auto"
            />
            <div>
              <h1 className="text-lg font-bold leading-tight">e-Nihil</h1>
              <p className="text-xs opacity-80 hidden sm:block">Inspektorat Kab. Bintan</p>
            </div>
          </Link>

          {/* Right nav (desktop) */}
          <nav className="hidden md:flex items-center gap-6">
            {!user && (
              <Link
                href="/tracking"
                className="text-sm font-medium hover:text-accent transition-colors"
              >
                Cek Status
              </Link>
            )}
            {user ? (
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            ) : (
              <Link href="/login">
                <Button variant="secondary" size="sm">
                  Login Staff
                </Button>
              </Link>
            )}
          </nav>

          {/* Right: Login/Logout button (mobile) */}
          {user ? (
            <Button variant="secondary" size="sm" onClick={handleLogout} className="md:hidden">
              <LogOut className="h-4 w-4" />
            </Button>
          ) : (
            <Link href="/login" className="md:hidden">
              <Button variant="secondary" size="sm">
                Login
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden pb-4 border-t border-primary-foreground/20 pt-4">
            <div className="flex flex-col gap-3">
              {user ? (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-sm font-medium hover:text-accent transition-colors py-2"
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
                    className="text-sm font-medium hover:text-accent transition-colors py-2"
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
