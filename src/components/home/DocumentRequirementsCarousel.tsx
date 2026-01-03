'use client'

import { useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  ChevronLeft, 
  ChevronRight,
  ArrowRightLeft,
  TrendingUp,
  Users,
  UserX
} from 'lucide-react'

const TUJUAN_DOCUMENTS = [
  {
    id: 'mutasi',
    title: 'Mutasi',
    subtitle: 'Perpindahan Antar Instansi',
    icon: ArrowRightLeft,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'from-blue-50 to-white',
    documents: [
      'Surat Permohonan yang ditujukan kepada Inspektur',
      'Surat Pengantar dari Kepala Dinas/Badan',
      'Surat Keterangan/Rekomendasi menerima dari Instansi yang dituju',
      'SK PNS',
      'SK Pangkat Terakhir',
      'Daftar Riwayat Pekerjaan',
      'SKP satu tahun terakhir',
    ]
  },
  {
    id: 'promosi',
    title: 'Promosi Jabatan',
    subtitle: 'Kenaikan Jabatan',
    icon: TrendingUp,
    color: 'from-green-500 to-green-600',
    bgColor: 'from-green-50 to-white',
    documents: [
      'Surat Permohonan yang ditujukan kepada Inspektur',
      'Surat Pengantar dari Kepala Dinas/Badan',
      'SK PNS',
      'SK Pangkat Terakhir',
      'Daftar Riwayat Pekerjaan',
      'SKP satu tahun terakhir',
    ]
  },
  {
    id: 'lainnya_asn',
    title: 'Lainnya (ASN)',
    subtitle: 'Tujuan Lain untuk ASN',
    icon: Users,
    color: 'from-purple-500 to-purple-600',
    bgColor: 'from-purple-50 to-white',
    documents: [
      'Surat Permohonan yang ditujukan kepada Inspektur',
      'Surat Pengantar dari Kepala Dinas/Badan',
      'SK PNS',
      'SK Pangkat Terakhir',
      'Daftar Riwayat Pekerjaan',
      'SKP satu tahun terakhir',
    ]
  },
  {
    id: 'lainnya_non_asn',
    title: 'Lainnya (Non-ASN)',
    subtitle: 'Tujuan Lain untuk Non-ASN',
    icon: UserX,
    color: 'from-orange-500 to-orange-600',
    bgColor: 'from-orange-50 to-white',
    documents: [
      'Surat Permohonan yang ditujukan kepada Inspektur',
      'Daftar Riwayat Pekerjaan',
    ]
  },
]

export function DocumentRequirementsCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [direction, setDirection] = useState<'left' | 'right' | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleNavigate = (newIndex: number, dir: 'left' | 'right') => {
    if (isAnimating) return
    setDirection(dir)
    setIsAnimating(true)
    
    setTimeout(() => {
      setActiveIndex(newIndex)
      setTimeout(() => {
        setIsAnimating(false)
        setDirection(null)
      }, 50)
    }, 150)
  }

  const handlePrev = () => {
    const newIndex = activeIndex === 0 ? TUJUAN_DOCUMENTS.length - 1 : activeIndex - 1
    handleNavigate(newIndex, 'right')
  }

  const handleNext = () => {
    const newIndex = activeIndex === TUJUAN_DOCUMENTS.length - 1 ? 0 : activeIndex + 1
    handleNavigate(newIndex, 'left')
  }

  const handleTabClick = (index: number) => {
    if (index === activeIndex || isAnimating) return
    const dir = index > activeIndex ? 'left' : 'right'
    handleNavigate(index, dir)
  }

  const activeTujuan = TUJUAN_DOCUMENTS[activeIndex]
  const ActiveIcon = activeTujuan.icon

  // Animation classes
  const getAnimationClass = () => {
    if (!direction) return 'opacity-100 translate-x-0'
    if (isAnimating) {
      return direction === 'left' 
        ? 'opacity-0 -translate-x-8' 
        : 'opacity-0 translate-x-8'
    }
    return 'opacity-100 translate-x-0'
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Tab Navigation */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {TUJUAN_DOCUMENTS.map((tujuan, index) => {
          const Icon = tujuan.icon
          return (
            <button
              key={tujuan.id}
              onClick={() => handleTabClick(index)}
              disabled={isAnimating}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                index === activeIndex
                  ? `bg-gradient-to-r ${tujuan.color} text-white shadow-lg scale-105`
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:scale-102'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tujuan.title}</span>
            </button>
          )
        })}
      </div>

      {/* Card with Swipe Animation */}
      <div className="relative" ref={containerRef}>
        {/* Navigation Buttons */}
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 rounded-full bg-white shadow-lg border-slate-200 hover:bg-slate-50 hidden md:flex transition-transform hover:scale-110"
          onClick={handlePrev}
          disabled={isAnimating}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 rounded-full bg-white shadow-lg border-slate-200 hover:bg-slate-50 hidden md:flex transition-transform hover:scale-110"
          onClick={handleNext}
          disabled={isAnimating}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>

        {/* Animated Card Container */}
        <div className="overflow-hidden">
          <div 
            className={`transform transition-all duration-300 ease-out ${getAnimationClass()}`}
          >
            <Card className={`border-0 shadow-xl overflow-hidden bg-gradient-to-br ${activeTujuan.bgColor}`}>
              {/* Header */}
              <div className={`bg-gradient-to-r ${activeTujuan.color} p-6 transition-all duration-500`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center transition-transform duration-300 hover:scale-110">
                    <ActiveIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{activeTujuan.title}</h3>
                    <p className="text-white/80 text-sm">{activeTujuan.subtitle}</p>
                  </div>
                  <div className="ml-auto text-white/60 text-sm">
                    {activeIndex + 1} / {TUJUAN_DOCUMENTS.length}
                  </div>
                </div>
              </div>

              {/* Content */}
              <CardContent className="p-6 md:p-8">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-slate-500" />
                  <span className="font-medium text-slate-700">Dokumen yang Diperlukan ({activeTujuan.documents.length})</span>
                </div>
                <div className="grid gap-3">
                  {activeTujuan.documents.map((doc, index) => (
                    <div 
                      key={index} 
                      className="flex items-start gap-3 p-3 rounded-lg bg-white border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all duration-200 hover:shadow-sm"
                      style={{ 
                        animationDelay: `${index * 50}ms`,
                      }}
                    >
                      <span className={`flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br ${activeTujuan.color} text-white text-xs font-semibold flex items-center justify-center shadow-sm`}>
                        {index + 1}
                      </span>
                      <span className="text-slate-700 text-sm pt-0.5">{doc}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm text-amber-800 flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">⚠️</span>
                    Semua dokumen dalam format PDF dengan ukuran maksimal 10MB per file
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex justify-center gap-4 mt-4 md:hidden">
          <Button variant="outline" size="sm" onClick={handlePrev} disabled={isAnimating}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Sebelumnya
          </Button>
          <Button variant="outline" size="sm" onClick={handleNext} disabled={isAnimating}>
            Selanjutnya
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-2 mt-6">
        {TUJUAN_DOCUMENTS.map((_, index) => (
          <button
            key={index}
            onClick={() => handleTabClick(index)}
            disabled={isAnimating}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === activeIndex 
                ? 'w-6 bg-blue-600' 
                : 'w-2 bg-slate-300 hover:bg-slate-400'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
