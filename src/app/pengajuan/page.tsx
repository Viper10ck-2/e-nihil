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
  ArrowRightLeft, TrendingUp, Users, UserX
} from 'lucide-react'
import type { DocumentType } from '@/types/database'

type TujuanPermohonan = 'mutasi' | 'promosi' | 'lainnya_asn' | 'lainnya_non_asn' | ''

const TUJUAN_PERMOHONAN_OPTIONS = [
  { value: 'mutasi', label: 'Mutasi', fullLabel: 'Perpindahan Antar Instansi', icon: ArrowRightLeft, color: 'blue' },
  { value: 'promosi', label: 'Promosi', fullLabel: 'Promosi Jabatan', icon: TrendingUp, color: 'green' },
  { value: 'lainnya_asn', label: 'Lainnya (ASN)', fullLabel: 'Tujuan Lain untuk ASN', icon: Users, color: 'purple' },
  { value: 'lainnya_non_asn', label: 'Lainnya (Non-ASN)', fullLabel: 'Tujuan Lain untuk Non-ASN', icon: UserX, color: 'orange' },
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
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-12">
        <div className="container">
          <Card className="max-w-lg mx-auto text-center border-0 shadow-2xl">
            <CardHeader className="pb-4">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-200">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-2xl text-green-700">Permohonan Berhasil!</CardTitle>
              <CardDescription>Permohonan Anda telah berhasil diajukan dan sedang menunggu verifikasi.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                <p className="text-sm text-muted-foreground mb-2">Nomor Tracking Anda:</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-bold font-mono text-blue-700">{trackingNumber}</span>
                  <Button variant="ghost" size="sm" onClick={copyTrackingNumber} className="hover:bg-blue-100">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Simpan nomor tracking ini untuk memantau status permohonan Anda.
                Notifikasi juga akan dikirim ke email yang Anda daftarkan.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" onClick={() => window.location.href = '/tracking'}>Cek Status</Button>
                <Button onClick={() => window.location.href = '/'} className="bg-gradient-to-r from-blue-600 to-blue-700">Kembali ke Beranda</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white py-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full -translate-x-1/2 translate-y-1/2"></div>
        </div>
        <div className="container relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Form Pengajuan SKBT</h1>
              <p className="text-blue-200 text-sm">Surat Keterangan Bebas Temuan - Inspektorat Kabupaten Bintan</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
              <Shield className="h-4 w-4" /> <span>Aman & Terpercaya</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
              <CheckCircle className="h-4 w-4" /> <span>100% Gratis</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tujuan Permohonan Selection */}
      <div className="container py-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">Pilih Tujuan Permohonan</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TUJUAN_PERMOHONAN_OPTIONS.map((option) => {
              const Icon = option.icon
              const isSelected = tujuanPermohonan === option.value
              const colorClasses = {
                blue: isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-blue-200' : 'bg-white hover:bg-blue-50 border-blue-200 text-blue-700',
                green: isSelected ? 'bg-green-600 text-white border-green-600 shadow-green-200' : 'bg-white hover:bg-green-50 border-green-200 text-green-700',
                purple: isSelected ? 'bg-purple-600 text-white border-purple-600 shadow-purple-200' : 'bg-white hover:bg-purple-50 border-purple-200 text-purple-700',
                orange: isSelected ? 'bg-orange-600 text-white border-orange-600 shadow-orange-200' : 'bg-white hover:bg-orange-50 border-orange-200 text-orange-700',
              }
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTujuanPermohonan(option.value as TujuanPermohonan)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${colorClasses[option.color as keyof typeof colorClasses]} ${isSelected ? 'shadow-lg scale-[1.02]' : 'shadow-sm hover:shadow-md'}`}
                >
                  <Icon className={`h-6 w-6 mx-auto mb-2 ${isSelected ? 'text-white' : ''}`} />
                  <p className="font-medium text-sm">{option.label}</p>
                  <p className={`text-xs mt-1 ${isSelected ? 'text-white/80' : 'text-muted-foreground'}`}>{option.fullLabel}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Main Form - Horizontal Layout */}
        {tujuanPermohonan && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Data Pemohon */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-t-lg border-b border-blue-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-200">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base text-blue-900">Data Pemohon</CardTitle>
                        <CardDescription className="text-xs text-blue-600">Isi data diri sesuai SK yang berlaku</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <FormField control={form.control} name="nama_lengkap" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm">Nama Lengkap (dengan gelar)</FormLabel>
                        <FormControl><Input placeholder="Dr. Nama Lengkap, S.H., M.H." className="bg-slate-50 border-slate-200" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {!isFieldHidden('nip') && (
                        <FormField control={form.control} name="nip" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">NIP</FormLabel>
                            <FormControl><Input placeholder="198501012010011001" maxLength={18} className="bg-slate-50 border-slate-200" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      )}
                      {!isFieldHidden('pangkat_golongan') && (
                        <FormField control={form.control} name="pangkat_golongan" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Pangkat/Golongan</FormLabel>
                            <Select onValueChange={(value) => {
                              if (value === 'lainnya') { setShowPangkatLainnya(true); field.onChange('') }
                              else { setShowPangkatLainnya(false); setPangkatLainnya(''); field.onChange(value) }
                            }} value={showPangkatLainnya ? 'lainnya' : field.value}>
                              <FormControl><SelectTrigger className="bg-slate-50 border-slate-200"><SelectValue placeholder="Pilih Pangkat" /></SelectTrigger></FormControl>
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
                          <FormLabel className="text-sm">Isi Sendiri Pangkat/Golongan</FormLabel>
                          <FormControl>
                            <Input placeholder="Masukkan pangkat/golongan..." className="bg-slate-50 border-slate-200"
                              value={pangkatLainnya} onChange={(e) => { setPangkatLainnya(e.target.value); field.onChange(e.target.value) }} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    )}

                    {showTujuanLainnya && (
                      <div className="space-y-2">
                        <FormLabel className="text-sm">Tuliskan Tujuan dan Alasan <span className="text-destructive">*</span></FormLabel>
                        <Textarea placeholder="Jelaskan tujuan dan alasan permohonan SKBT Anda..." className="bg-slate-50 border-slate-200"
                          value={tujuanLainnya} onChange={(e) => setTujuanLainnya(e.target.value)} rows={3} />
                      </div>
                    )}

                    {!isFieldHidden('jabatan') && (
                      <FormField control={form.control} name="jabatan" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Jabatan</FormLabel>
                          <FormControl><Input placeholder="Kepala Seksi..." className="bg-slate-50 border-slate-200" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    )}

                    {!isFieldHidden('unit_kerja_asal') && (
                      <FormField control={form.control} name="unit_kerja_asal" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Unit Kerja Asal</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger className="bg-slate-50 border-slate-200"><SelectValue placeholder="Pilih Unit Kerja" /></SelectTrigger></FormControl>
                            <SelectContent>{UNIT_KERJA.map((uk) => (<SelectItem key={uk.value} value={uk.value}>{uk.label}</SelectItem>))}</SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    )}

                    {!isFieldHidden('instansi_tujuan') && (
                      <FormField control={form.control} name="instansi_tujuan" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Instansi Tujuan</FormLabel>
                          <FormControl><Input placeholder="Instansi yang dituju..." className="bg-slate-50 border-slate-200" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    )}

                    {!isFieldHidden('alasan_permohonan') && (
                      <FormField control={form.control} name="alasan_permohonan" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Alasan Permohonan</FormLabel>
                          <FormControl><Textarea placeholder="Jelaskan alasan pengajuan SKBT..." className="bg-slate-50 border-slate-200" rows={3} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Email</FormLabel>
                          <FormControl><Input type="email" placeholder="email@example.com" className="bg-slate-50 border-slate-200" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="nomor_hp" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Nomor HP</FormLabel>
                          <FormControl><Input placeholder="08123456789" className="bg-slate-50 border-slate-200" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </CardContent>
                </Card>

                {/* Right Column - Upload Dokumen */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-green-100/50 rounded-t-lg border-b border-green-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md shadow-green-200">
                        <Upload className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base text-green-900">Upload Dokumen</CardTitle>
                        <CardDescription className="text-xs text-green-600">Format PDF, maks. 10MB per file</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    {visibleDocuments.map((doc) => (
                      <DocumentUpload key={doc.type} documentType={doc.type} label={doc.label}
                        selectedFile={uploadedFiles[doc.type]} onFileSelect={(file) => handleFileSelect(doc.type, file)} />
                    ))}
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-xs text-amber-800 flex items-start gap-2">
                        <span className="text-amber-500">⚠️</span>
                        Pastikan semua dokumen sudah lengkap dan jelas terbaca
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Submit Button */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white rounded-xl shadow-lg border">
                <div className="text-sm text-muted-foreground">
                  {!allDocumentsUploaded ? (
                    <span className="text-amber-600">⚠️ Lengkapi semua dokumen untuk mengajukan</span>
                  ) : (
                    <span className="text-green-600">✓ Semua dokumen sudah lengkap</span>
                  )}
                </div>
                <Button type="submit" size="lg" disabled={isSubmitting || !allDocumentsUploaded}
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg">
                  {isSubmitting ? (<><LoadingSpinner size="sm" className="mr-2" />Mengirim...</>) : 'Ajukan Permohonan'}
                </Button>
              </div>
            </form>
          </Form>
        )}

        {!tujuanPermohonan && (
          <div className="text-center py-12 bg-white rounded-xl shadow-lg border">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-muted-foreground">Pilih tujuan permohonan di atas untuk melanjutkan</p>
          </div>
        )}
      </div>
    </div>
  )
}
