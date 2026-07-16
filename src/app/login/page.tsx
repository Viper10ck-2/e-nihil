'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { login } from '@/lib/services/authService'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { Lock, User, Shield, Building2 } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
  const { refreshAuth, user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    nip: '',
    password: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loginSuccess, setLoginSuccess] = useState(false)

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      router.replace('/dashboard')
    }
  }, [user, router])

  // Handle redirect after successful login
  useEffect(() => {
    if (loginSuccess && user) {
      console.log('[LoginPage] Login successful, redirecting to dashboard')
      router.replace('/dashboard')
    }
  }, [loginSuccess, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const loggedInUser = await login(formData.nip, formData.password)

      if (loggedInUser) {
        console.log('[LoginPage] Login successful, refreshing auth')
        refreshAuth()
        setLoginSuccess(true)
        toast.success('Login berhasil!')
      } else {
        setError('NIP atau Password salah')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c1524] via-[#0f1729] to-[#1e3a5f]"></div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/5 rounded-full translate-y-1/2 -translate-x-1/4"></div>
        <div className="absolute top-1/3 left-1/4 w-48 h-48 bg-white/3 rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/3 w-32 h-32 bg-amber-400/5 rounded-full"></div>
        {/* Gold accent line */}
        <div className="absolute left-12 top-1/2 -translate-y-1/2 w-1 h-32 bg-gradient-to-b from-amber-500/40 via-amber-500/20 to-transparent rounded-full"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <div className="w-24 h-24 mb-6 rounded-2xl bg-amber-500/20 backdrop-blur-sm flex items-center justify-center border border-amber-400/30">
            <Image
              src="/logo-bintan.png"
              alt="Logo Kabupaten Bintan"
              width={64}
              height={64}
              className="object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold mb-2 text-center text-white">e-Nihil</h1>
          <p className="text-slate-300 text-center mb-8 max-w-sm">
            Sistem Permohonan Surat Keterangan Bebas Temuan Inspektorat Kabupaten Bintan
          </p>
          
          <div className="space-y-4 w-full max-w-sm">
            <div className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="font-medium text-sm text-white">Keamanan Terjamin</p>
                <p className="text-xs text-slate-400">Data terenkripsi dan aman</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="font-medium text-sm text-white">Akses Terbatas</p>
                <p className="text-xs text-slate-400">Khusus staff Inspektorat</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-white p-6">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-[#0f1729] to-[#1e3a5f] flex items-center justify-center shadow-lg shadow-slate-300/50 border border-amber-500/20">
              <Image
                src="/logo-bintan.png"
                alt="Logo Kabupaten Bintan"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <h1 className="text-xl font-bold text-slate-800">e-Nihil</h1>
            <p className="text-sm text-slate-500">Inspektorat Kabupaten Bintan</p>
          </div>

          <Card className="border border-slate-200 shadow-xl shadow-slate-200/50 bg-white overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-amber-500 to-amber-400"></div>
            <CardHeader className="text-center pb-2 pt-6">
              <div className="mx-auto w-14 h-14 bg-gradient-to-br from-[#0f1729] to-[#1e3a5f] rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-slate-300/50">
                <Lock className="h-7 w-7 text-amber-400" />
              </div>
              <CardTitle className="text-2xl text-slate-800">Login Staff</CardTitle>
              <CardDescription className="text-slate-500">
                Masuk ke sistem untuk memproses permohonan
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="nip" className="text-sm font-medium text-slate-600">NIP</Label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-slate-500" />
                    </div>
                    <Input
                      id="nip"
                      type="text"
                      placeholder="Masukkan NIP Anda"
                      value={formData.nip}
                      onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                      className="pl-14 h-12 bg-slate-50 border-slate-200 focus:border-amber-400 focus:bg-white transition-colors rounded-xl"
                      maxLength={18}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-600">Password</Label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Lock className="h-4 w-4 text-slate-500" />
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Masukkan password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-14 h-12 bg-slate-50 border-slate-200 focus:border-amber-400 focus:bg-white transition-colors rounded-xl"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                    <p className="text-sm text-red-600 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-400"></span>
                      {error}
                    </p>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-200/50 rounded-xl transition-all duration-300 hover:scale-[1.02] text-base font-medium text-white" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Memproses...
                    </>
                  ) : (
                    'Masuk'
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                  <Shield className="h-4 w-4 text-amber-500" />
                  <span>Hanya untuk staff Inspektorat Kabupaten Bintan</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-slate-400 mt-6">
            © 2025 Inspektorat Daerah Kabupaten Bintan
          </p>
        </div>
      </div>
    </div>
  )
}
