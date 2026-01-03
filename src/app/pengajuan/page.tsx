'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DocumentUpload } from '@/components/forms/DocumentUpload'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { applicationFormSchema, type ApplicationFormData } from '@/lib/validations'
import { DOCUMENT_TYPES, PANGKAT_GOLONGAN, UNIT_KERJA } from '@/lib/constants'
import { createApplication, generateUniqueTrackingNumber, uploadDocument } from '@/lib/services/applicationService'
import { toast } from 'sonner'
import { 
  CheckCircle, Copy, FileText, User, Upload, Shield,
  ArrowRightLeft, TrendingUp, Users, UserX, Sparkles
} from 'lucide-react'
import type { DocumentType } from '@/types/database'

type TujuanPermohonan = 'mutasi' | 'promosi' | 'lainnya_asn' | 'lainnya_non_asn' | ''

const TUJUAN_PERMOHONAN_OPTIONS = [
  { value: 'mutasi', label: 'Mutasi', fullLabel: 'Perpindahan Antar Instansi', icon: ArrowRightLeft, color: 'blue' },
  { value: 'promosi', label: 'Promosi', fullLabel: 'Promosi Jabatan', icon: TrendingUp, color: 'emerald' },
  { value: 'lainnya_asn', label: 'Lainnya (ASN)', fullLabel: 'Tujuan Lain untuk ASN', icon: Users, color: 'violet' },
  { value: 'lainnya_non_asn', label: 'Lainnya (Non-ASN)', fullLabel: 'Tujuan Lain untuk Non-ASN', icon: UserX, color: 'amber' },
]

export default function PengajuanPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState<string | null>(null)
  const [tujuanPermohonan, setTujuanPermohonan] = useState<TujuanPermohonan>('')
  const [tujuanLainnya, setTujuanLainnya] = useState('')
  const [pangkatLainnya, setPangkatLainnya] = useState('')
  const [showPangkatLainnya, setShowPangkatLainnya] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<Record<DocumentType, File | null>>({
    surat_permohonan: null,
    surat_pernyataan_bebas_temuan: null,
    surat_rekomendasi: null,
    sk_pns: null,
    sk_pangkat_terakhir: null,
    daftar_riwayat_pekerjaan: null,
    skp: null,
  })

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: {
      nama_lengkap: '', nip: '', pangkat_golongan: '', jabatan: '',
      unit_kerja_asal: '', instansi_tujuan: '', alasan_permohonan: '',
      email: '', nomor_hp: '',
    },
  })

  useEffect(() => {
    if (tujuanPermohonan === 'promosi' || tujuanPermohonan === 'lainnya_asn') {
      form.setValue('instansi_tujuan', '-')
      form.setValue('alasan_permohonan', '-')
      const v = form.getValues()
      if (v.nip === '-') form.setValue('nip', '')
      if (v.pangkat_golongan === '-') form.setValue('pangkat_golongan', '')
      if (v.jabatan === '-') form.setValue('jabatan', '')
      if (v.unit_kerja_asal === '-') form.setValue('unit_kerja_asal', '')
    } else if (tujuanPermohonan === 'lainnya_non_asn') {
      form.setValue('nip', '-'); form.setValue('pangkat_golongan', '-')
      form.setValue('jabatan', '-'); form.setValue('unit_kerja_asal', '-')
      form.setValue('instansi_tujuan', '-'); form.setValue('alasan_permohonan', '-')
    } else if (tujuanPermohonan === 'mutasi') {
      const v = form.getValues()
      if (v.nip === '-') form.setValue('nip', '')
      if (v.pangkat_golongan === '-') form.setValue('pangkat_golongan', '')
      if (v.instansi_tujuan === '-') form.setValue('instansi_tujuan', '')
      if (v.alasan_permohonan === '-') form.setValue('alasan_permohonan', '')
      if (v.jabatan === '-') form.setValue('jabatan', '')
      if (v.unit_kerja_asal === '-') form.setValue('unit_kerja_asal', '')
    }
  }, [tujuanPermohonan, form])

  const isFieldHidden = (fieldName: string): boolean => {
    if (!tujuanPermohonan) return false
    switch (tujuanPermohonan) {
      case 'promosi': case 'lainnya_asn':
        return ['instansi_tujuan', 'alasan_permohonan'].includes(fieldName)
      case 'lainnya_non_asn':
        return ['nip', 'pangkat_golongan', 'jabatan', 'unit_kerja_asal', 'instansi_tujuan', 'alasan_permohonan'].includes(fieldName)
      default: return false
    }
  }

  const isDocumentHidden = (docType: DocumentType): boolean => {
    if (!tujuanPermohonan) return false
    switch (tujuanPermohonan) {
      case 'promosi': case 'lainnya_asn':
        return docType === 'surat_rekomendasi'
      case 'lainnya_non_asn':
        return ['surat_pernyataan_bebas_temuan', 'surat_rekomendasi', 'sk_pns', 'sk_pangkat_terakhir', 'skp'].includes(docType)
      default: return false
    }
  }

  const getVisibleDocuments = () => DOCUMENT_TYPES.filter(doc => !isDocumentHidden(doc.type))
  const showTujuanLainnya = tujuanPermohonan === 'lainnya_asn' || tujuanPermohonan === 'lainnya_non_asn'
  const handleFileSelect = (type: DocumentType, file: File | null) => {
    setUploadedFiles(prev => ({ ...prev, [type]: file }))
  }
  const visibleDocuments = getVisibleDocuments()
  const allDocumentsUploaded = tujuanPermohonan ? visibleDocuments.every(doc => uploadedFiles[doc.type] !== null) : false

  const onSubmit = async (data: ApplicationFormData) => {
    if (!allDocumentsUploaded) { toast.error('Semua dokumen wajib diupload'); return }
    if (!tujuanPermohonan) { toast.error('Pilih tujuan permohonan terlebih dahulu'); return }
    if (showTujuanLainnya && !tujuanLainnya.trim()) { toast.error('Tuliskan tujuan permohonan Anda'); return }

    setIsSubmitting(true)
    try {
      const submitData = { ...data }
      if (showTujuanLainnya) {
        const tujuanLabel = TUJUAN_PERMOHONAN_OPTIONS.find(t => t.value === tujuanPermohonan)?.label
        submitData.alasan_permohonan = `[${tujuanLabel}] ${tujuanLainnya}`
      }
      const newTrackingNumber = await generateUniqueTrackingNumber()
      const application = await createApplication(submitData, newTrackingNumber, tujuanPermohonan)
      
      for (const doc of visibleDocuments) {
        const file = uploadedFiles[doc.type]
        if (file) await uploadDocument(application.id, doc.type, file)
      }
      
      try {
        await fetch('/api/send-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tracking_number: newTrackingNumber, nama_lengkap: submitData.nama_lengkap,
            nip: submitData.nip, pangkat_golongan: submitData.pangkat_golongan,
            tujuan_permohonan: tujuanPermohonan, jabatan: submitData.jabatan,
            unit_kerja_asal: submitData.unit_kerja_asal, instansi_tujuan: submitData.instansi_tujuan,
            alasan_permohonan: submitData.alasan_permohonan, email: submitData.email,
            nomor_hp: submitData.nomor_hp, created_at: new Date().toISOString(),
          }),
        })
      } catch (emailError) { console.warn('Email notification failed:', emailError) }
      
      setTrackingNumber(newTrackingNumber)
      toast.success('Permohonan berhasil diajukan!')
    } catch (error) {
      console.error('Error submitting application:', error)
      toast.error('Gagal mengajukan permohonan. Silakan coba lagi.')
    } finally { setIsSubmitting(false) }
  }

  const copyTrackingNumber = () => {
    if (trackingNumber) { navigator.clipboard.writeText(trackingNumber); toast.success('Nomor tracking disalin!') }
  }

  // Success state
  if (trackingNumber) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 py-12">
        <div className="container">
          <Card className="max-w-lg mx-auto text-center border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-200/50">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-2xl text-emerald-700">Permohonan Berhasil!</CardTitle>
              <CardDescription>Permohonan Anda telah berhasil diajukan dan sedang menunggu verifikasi.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100/50">
                <p className="text-sm text-slate-500 mb-2">Nomor Tracking Anda:</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-bold font-mono text-blue-600">{trackingNumber}</span>
                  <Button variant="ghost" size="sm" onClick={copyTrackingNumber} className="hover:bg-blue-100 rounded-full">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-slate-500">
                Simpan nomor tracking ini untuk memantau status permohonan Anda.
                Notifikasi juga akan dikirim ke email yang Anda daftarkan.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" onClick={() => window.location.href = '/tracking'} className="rounded-full">Cek Status</Button>
                <Button onClick={() => window.location.href = '/'} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-full">Kembali ke Beranda</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Header - More Modern */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"30\" height=\"30\" viewBox=\"0 0 30 30\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M1.22676 0C1.91374 0 2.45351 0.539773 2.45351 1.22676C2.45351 1.91374 1.91374 2.45351 1.22676 2.45351C0.539773 2.45351 0 1.91374 0 1.22676C0 0.539773 0.539773 0 1.22676 0Z\" fill=\"rgba(255,255,255,0.07)\"%3E%3C/path%3E%3C/svg%3E')] opacity-100"></div>
        <div className="relative container py-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Form Pengajuan SKBT</h1>
              <p className="text-blue-100 text-sm md:text-base">Surat Keterangan Bebas Temuan - Inspektorat Kabupaten Bintan</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
              <Shield className="h-4 w-4 text-blue-100" /> <span className="text-white">Aman & Terpercaya</span>
            </div>
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
              <Sparkles className="h-4 w-4 text-blue-100" /> <span className="text-white">Proses Cepat</span>
            </div>
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
              <CheckCircle className="h-4 w-4 text-blue-100" /> <span className="text-white">100% Gratis</span>
            </div>
          </div>
        </div>
        {/* Decorative wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60V30C240 50 480 10 720 30C960 50 1200 10 1440 30V60H0Z" className="fill-slate-50/50"/>
            <path d="M0 60V40C240 55 480 25 720 40C960 55 1200 25 1440 40V60H0Z" className="fill-blue-50"/>
          </svg>
        </div>
      </div>

      {/* Tujuan Permohonan Selection */}
      <div className="container py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
            <h2 className="text-lg font-semibold text-slate-800">Pilih Tujuan Permohonan</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TUJUAN_PERMOHONAN_OPTIONS.map((option) => {
              const Icon = option.icon
              const isSelected = tujuanPermohonan === option.value
              const colorConfig = {
                blue: { bg: 'bg-blue-500', light: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', hover: 'hover:border-blue-300 hover:bg-blue-50/50' },
                emerald: { bg: 'bg-emerald-500', light: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', hover: 'hover:border-emerald-300 hover:bg-emerald-50/50' },
                violet: { bg: 'bg-violet-500', light: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-600', hover: 'hover:border-violet-300 hover:bg-violet-50/50' },
                amber: { bg: 'bg-amber-500', light: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', hover: 'hover:border-amber-300 hover:bg-amber-50/50' },
              }
              const colors = colorConfig[option.color as keyof typeof colorConfig]
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTujuanPermohonan(option.value as TujuanPermohonan)}
                  className={`relative p-5 rounded-2xl border-2 transition-all duration-300 bg-white group
                    ${isSelected 
                      ? `${colors.border} ${colors.light} shadow-lg scale-[1.02]` 
                      : `border-slate-200 ${colors.hover} shadow-sm hover:shadow-md`
                    }`}
                >
                  {isSelected && (
                    <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${colors.bg} animate-pulse`}></div>
                  )}
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center transition-colors
                    ${isSelected ? colors.bg : colors.light} ${isSelected ? '' : `group-hover:${colors.bg}`}`}>
                    <Icon className={`h-6 w-6 transition-colors ${isSelected ? 'text-white' : colors.text} ${isSelected ? '' : 'group-hover:text-white'}`} />
                  </div>
                  <p className={`font-semibold text-sm ${isSelected ? colors.text : 'text-slate-700'}`}>{option.label}</p>
                  <p className={`text-xs mt-1 ${isSelected ? colors.text + '/70' : 'text-slate-400'}`}>{option.fullLabel}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Main Form - Horizontal Layout */}
        {tujuanPermohonan && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Left Column - Data Pemohon */}
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-blue-400 to-blue-300 rounded-full"></div>
                  <Card className="ml-4 border-0 shadow-xl shadow-blue-100/50 bg-white/80 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-transparent">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200/50">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-base text-slate-800">Data Pemohon</CardTitle>
                          <CardDescription className="text-xs text-slate-500">Isi data diri sesuai SK yang berlaku</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                      <FormField control={form.control} name="nama_lengkap" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm text-slate-600 font-medium">Nama Lengkap (dengan gelar)</FormLabel>
                          <FormControl><Input placeholder="Dr. Nama Lengkap, S.H., M.H." className="bg-slate-50/50 border-slate-200 focus:border-blue-400 focus:bg-white transition-colors rounded-xl" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {!isFieldHidden('nip') && (
                          <FormField control={form.control} name="nip" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm text-slate-600 font-medium">NIP</FormLabel>
                              <FormControl><Input placeholder="198501012010011001" maxLength={18} className="bg-slate-50/50 border-slate-200 focus:border-blue-400 focus:bg-white transition-colors rounded-xl" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        )}
                        {!isFieldHidden('pangkat_golongan') && (
                          <FormField control={form.control} name="pangkat_golongan" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm text-slate-600 font-medium">Pangkat/Golongan</FormLabel>
                              <Select onValueChange={(value) => {
                                if (value === 'lainnya') { setShowPangkatLainnya(true); field.onChange('') }
                                else { setShowPangkatLainnya(false); setPangkatLainnya(''); field.onChange(value) }
                              }} value={showPangkatLainnya ? 'lainnya' : field.value}>
                                <FormControl><SelectTrigger className="bg-slate-50/50 border-slate-200 focus:border-blue-400 rounded-xl"><SelectValue placeholder="Pilih Pangkat" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  {PANGKAT_GOLONGAN.map((pg) => (<SelectItem key={pg.value} value={pg.value}>{pg.label}</SelectItem>))}
                                  <SelectItem value="lainnya">Lainnya</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )} />
                        )}
                      </div>

                      {showPangkatLainnya && !isFieldHidden('pangkat_golongan') && (
                        <FormField control={form.control} name="pangkat_golongan" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-slate-600 font-medium">Isi Sendiri Pangkat/Golongan</FormLabel>
                            <FormControl>
                              <Input placeholder="Masukkan pangkat/golongan..." className="bg-slate-50/50 border-slate-200 focus:border-blue-400 focus:bg-white transition-colors rounded-xl"
                                value={pangkatLainnya} onChange={(e) => { setPangkatLainnya(e.target.value); field.onChange(e.target.value) }} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      )}

                      {showTujuanLainnya && (
                        <div className="space-y-2">
                          <FormLabel className="text-sm text-slate-600 font-medium">Tuliskan Tujuan dan Alasan <span className="text-red-500">*</span></FormLabel>
                          <Textarea placeholder="Jelaskan tujuan dan alasan permohonan SKBT Anda..." className="bg-slate-50/50 border-slate-200 focus:border-blue-400 focus:bg-white transition-colors rounded-xl"
                            value={tujuanLainnya} onChange={(e) => setTujuanLainnya(e.target.value)} rows={3} />
                        </div>
                      )}

                      {!isFieldHidden('jabatan') && (
                        <FormField control={form.control} name="jabatan" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-slate-600 font-medium">Jabatan</FormLabel>
                            <FormControl><Input placeholder="Kepala Seksi..." className="bg-slate-50/50 border-slate-200 focus:border-blue-400 focus:bg-white transition-colors rounded-xl" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      )}

                      {!isFieldHidden('unit_kerja_asal') && (
                        <FormField control={form.control} name="unit_kerja_asal" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-slate-600 font-medium">Unit Kerja Asal</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger className="bg-slate-50/50 border-slate-200 focus:border-blue-400 rounded-xl"><SelectValue placeholder="Pilih Unit Kerja" /></SelectTrigger></FormControl>
                              <SelectContent>{UNIT_KERJA.map((uk) => (<SelectItem key={uk.value} value={uk.value}>{uk.label}</SelectItem>))}</SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                      )}

                      {!isFieldHidden('instansi_tujuan') && (
                        <FormField control={form.control} name="instansi_tujuan" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-slate-600 font-medium">Instansi Tujuan</FormLabel>
                            <FormControl><Input placeholder="Instansi yang dituju..." className="bg-slate-50/50 border-slate-200 focus:border-blue-400 focus:bg-white transition-colors rounded-xl" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      )}

                      {!isFieldHidden('alasan_permohonan') && (
                        <FormField control={form.control} name="alasan_permohonan" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-slate-600 font-medium">Alasan Permohonan</FormLabel>
                            <FormControl><Textarea placeholder="Jelaskan alasan pengajuan SKBT..." className="bg-slate-50/50 border-slate-200 focus:border-blue-400 focus:bg-white transition-colors rounded-xl" rows={3} {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="email" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-slate-600 font-medium">Email</FormLabel>
                            <FormControl><Input type="email" placeholder="email@example.com" className="bg-slate-50/50 border-slate-200 focus:border-blue-400 focus:bg-white transition-colors rounded-xl" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="nomor_hp" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm text-slate-600 font-medium">Nomor HP</FormLabel>
                            <FormControl><Input placeholder="08123456789" className="bg-slate-50/50 border-slate-200 focus:border-blue-400 focus:bg-white transition-colors rounded-xl" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Upload Dokumen */}
                <div className="relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 via-emerald-400 to-emerald-300 rounded-full"></div>
                  <Card className="ml-4 border-0 shadow-xl shadow-emerald-100/50 bg-white/80 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="pb-4 bg-gradient-to-r from-emerald-50 to-transparent">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200/50">
                          <Upload className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-base text-slate-800">Upload Dokumen</CardTitle>
                          <CardDescription className="text-xs text-slate-500">Format PDF, maks. 10MB per file</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                      {visibleDocuments.map((doc, index) => (
                        <div key={doc.type} className="relative">
                          {index > 0 && <div className="absolute -top-2 left-4 right-4 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>}
                          <DocumentUpload documentType={doc.type} label={doc.label}
                            selectedFile={uploadedFiles[doc.type]} onFileSelect={(file) => handleFileSelect(doc.type, file)} />
                        </div>
                      ))}
                      <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100 rounded-xl">
                        <p className="text-xs text-emerald-700 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                          Pastikan semua dokumen sudah lengkap dan jelas terbaca
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-100">
                <div className="text-sm">
                  {!allDocumentsUploaded ? (
                    <div className="flex items-center gap-2 text-amber-600">
                      <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                      <span>Lengkapi semua dokumen untuk mengajukan</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Semua dokumen sudah lengkap</span>
                    </div>
                  )}
                </div>
                <Button type="submit" size="lg" disabled={isSubmitting || !allDocumentsUploaded}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-200/50 rounded-xl px-8 transition-all duration-300 hover:scale-[1.02]">
                  {isSubmitting ? (<><LoadingSpinner size="sm" className="mr-2" />Mengirim...</>) : 'Ajukan Permohonan'}
                </Button>
              </div>
            </form>
          </Form>
        )}

        {!tujuanPermohonan && (
          <div className="text-center py-16 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-100">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
              <FileText className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-slate-500">Pilih tujuan permohonan di atas untuk melanjutkan</p>
          </div>
        )}
      </div>
    </div>
  )
}
