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
import { CheckCircle, Copy } from 'lucide-react'
import type { DocumentType } from '@/types/database'

// Tipe tujuan permohonan
type TujuanPermohonan = 'mutasi' | 'promosi' | 'lainnya_asn' | 'lainnya_non_asn' | ''

const TUJUAN_PERMOHONAN_OPTIONS = [
  { value: 'mutasi', label: 'Perpindahan Antar Instansi (Mutasi)' },
  { value: 'promosi', label: 'Promosi Jabatan' },
  { value: 'lainnya_asn', label: 'Tujuan Lainnya (ASN)' },
  { value: 'lainnya_non_asn', label: 'Tujuan Lainnya (Non-ASN)' },
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
      nama_lengkap: '',
      nip: '',
      pangkat_golongan: '',
      jabatan: '',
      unit_kerja_asal: '',
      instansi_tujuan: '',
      alasan_permohonan: '',
      email: '',
      nomor_hp: '',
    },
  })

  // Reset dan set default values berdasarkan tujuan permohonan
  useEffect(() => {
    if (tujuanPermohonan === 'promosi') {
      form.setValue('instansi_tujuan', '-')
      form.setValue('alasan_permohonan', '-')
      // Reset field yang mungkin di-hide sebelumnya
      const currentValues = form.getValues()
      if (currentValues.nip === '-') form.setValue('nip', '')
      if (currentValues.pangkat_golongan === '-') form.setValue('pangkat_golongan', '')
      if (currentValues.jabatan === '-') form.setValue('jabatan', '')
      if (currentValues.unit_kerja_asal === '-') form.setValue('unit_kerja_asal', '')
    } else if (tujuanPermohonan === 'lainnya_asn') {
      form.setValue('instansi_tujuan', '-')
      form.setValue('alasan_permohonan', '-')
      // Reset field yang mungkin di-hide sebelumnya
      const currentValues = form.getValues()
      if (currentValues.nip === '-') form.setValue('nip', '')
      if (currentValues.pangkat_golongan === '-') form.setValue('pangkat_golongan', '')
      if (currentValues.jabatan === '-') form.setValue('jabatan', '')
      if (currentValues.unit_kerja_asal === '-') form.setValue('unit_kerja_asal', '')
    } else if (tujuanPermohonan === 'lainnya_non_asn') {
      form.setValue('nip', '-')
      form.setValue('pangkat_golongan', '-')
      form.setValue('jabatan', '-')
      form.setValue('unit_kerja_asal', '-')
      form.setValue('instansi_tujuan', '-')
      form.setValue('alasan_permohonan', '-')
    } else if (tujuanPermohonan === 'mutasi') {
      // Reset semua field jika sebelumnya ada yang di-hide
      const currentValues = form.getValues()
      if (currentValues.nip === '-') form.setValue('nip', '')
      if (currentValues.pangkat_golongan === '-') form.setValue('pangkat_golongan', '')
      if (currentValues.instansi_tujuan === '-') form.setValue('instansi_tujuan', '')
      if (currentValues.alasan_permohonan === '-') form.setValue('alasan_permohonan', '')
      if (currentValues.jabatan === '-') form.setValue('jabatan', '')
      if (currentValues.unit_kerja_asal === '-') form.setValue('unit_kerja_asal', '')
    }
  }, [tujuanPermohonan, form])

  // Helper untuk cek apakah field harus disembunyikan
  const isFieldHidden = (fieldName: string): boolean => {
    if (!tujuanPermohonan) return false
    
    switch (tujuanPermohonan) {
      case 'promosi':
        return ['instansi_tujuan', 'alasan_permohonan'].includes(fieldName)
      case 'lainnya_asn':
        return ['instansi_tujuan', 'alasan_permohonan'].includes(fieldName)
      case 'lainnya_non_asn':
        return ['nip', 'pangkat_golongan', 'jabatan', 'unit_kerja_asal', 'instansi_tujuan', 'alasan_permohonan'].includes(fieldName)
      default:
        return false
    }
  }

  // Helper untuk cek apakah dokumen harus disembunyikan
  const isDocumentHidden = (docType: DocumentType): boolean => {
    if (!tujuanPermohonan) return false
    
    switch (tujuanPermohonan) {
      case 'promosi':
        // Sembunyikan: Surat Rekomendasi Instansi Tujuan
        return docType === 'surat_rekomendasi'
      case 'lainnya_asn':
        // Sembunyikan: Surat Rekomendasi Instansi Tujuan
        return docType === 'surat_rekomendasi'
      case 'lainnya_non_asn':
        // Sembunyikan: Surat Pernyataan Bebas Temuan, Surat Rekomendasi, SK PNS, SK Pangkat Terakhir, SKP
        return ['surat_pernyataan_bebas_temuan', 'surat_rekomendasi', 'sk_pns', 'sk_pangkat_terakhir', 'skp'].includes(docType)
      default:
        return false
    }
  }

  // Dapatkan dokumen yang harus ditampilkan berdasarkan tujuan
  const getVisibleDocuments = () => {
    return DOCUMENT_TYPES.filter(doc => !isDocumentHidden(doc.type))
  }

  // Cek apakah perlu menampilkan kolom tujuan lainnya
  const showTujuanLainnya = tujuanPermohonan === 'lainnya_asn' || tujuanPermohonan === 'lainnya_non_asn'

  const handleFileSelect = (type: DocumentType, file: File | null) => {
    setUploadedFiles(prev => ({ ...prev, [type]: file }))
  }

  // Cek apakah semua dokumen wajib (yang ditampilkan) sudah diupload
  const visibleDocuments = getVisibleDocuments()
  const allDocumentsUploaded = tujuanPermohonan 
    ? visibleDocuments.every(doc => uploadedFiles[doc.type] !== null)
    : false

  const onSubmit = async (data: ApplicationFormData) => {
    if (!allDocumentsUploaded) {
      toast.error('Semua dokumen wajib diupload')
      return
    }

    if (!tujuanPermohonan) {
      toast.error('Pilih tujuan permohonan terlebih dahulu')
      return
    }

    if (showTujuanLainnya && !tujuanLainnya.trim()) {
      toast.error('Tuliskan tujuan permohonan Anda')
      return
    }

    setIsSubmitting(true)

    try {
      // Modifikasi data berdasarkan tujuan
      const submitData = { ...data }
      
      // Tambahkan info tujuan ke alasan permohonan jika tujuan lainnya
      if (showTujuanLainnya) {
        const tujuanLabel = TUJUAN_PERMOHONAN_OPTIONS.find(t => t.value === tujuanPermohonan)?.label
        submitData.alasan_permohonan = `[${tujuanLabel}] ${tujuanLainnya}`
      }

      // Generate unique tracking number from database
      const newTrackingNumber = await generateUniqueTrackingNumber()
      
      // Create application in database with tujuan_permohonan
      const application = await createApplication(submitData, newTrackingNumber, tujuanPermohonan)
      
      // Upload only visible documents to Supabase Storage
      for (const doc of visibleDocuments) {
        const file = uploadedFiles[doc.type]
        if (file) {
          await uploadDocument(application.id, doc.type, file)
        }
      }
      
      // Send email notification to admin (don't fail if email fails)
      try {
        await fetch('/api/send-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tracking_number: newTrackingNumber,
            nama_lengkap: submitData.nama_lengkap,
            nip: submitData.nip,
            pangkat_golongan: submitData.pangkat_golongan,
            tujuan_permohonan: tujuanPermohonan,
            jabatan: submitData.jabatan,
            unit_kerja_asal: submitData.unit_kerja_asal,
            instansi_tujuan: submitData.instansi_tujuan,
            alasan_permohonan: submitData.alasan_permohonan,
            email: submitData.email,
            nomor_hp: submitData.nomor_hp,
            created_at: new Date().toISOString(),
          }),
        })
      } catch (emailError) {
        console.warn('Email notification failed:', emailError)
        // Don't fail the submission if email fails
      }
      
      setTrackingNumber(newTrackingNumber)
      toast.success('Permohonan berhasil diajukan!')
    } catch (error) {
      console.error('Error submitting application:', error)
      toast.error('Gagal mengajukan permohonan. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyTrackingNumber = () => {
    if (trackingNumber) {
      navigator.clipboard.writeText(trackingNumber)
      toast.success('Nomor tracking disalin!')
    }
  }

  // Success state
  if (trackingNumber) {
    return (
      <div className="container py-12">
        <Card className="max-w-lg mx-auto text-center">
          <CardHeader>
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-2xl text-green-600">Permohonan Berhasil!</CardTitle>
            <CardDescription>
              Permohonan Anda telah berhasil diajukan dan sedang menunggu verifikasi.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Nomor Tracking Anda:</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-bold font-mono">{trackingNumber}</span>
                <Button variant="ghost" size="sm" onClick={copyTrackingNumber}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Simpan nomor tracking ini untuk memantau status permohonan Anda.
              Notifikasi juga akan dikirim ke email yang Anda daftarkan.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" onClick={() => window.location.href = '/tracking'}>
                Cek Status
              </Button>
              <Button onClick={() => window.location.href = '/'}>
                Kembali ke Beranda
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Form Pengajuan SKBT</h1>
          <p className="text-muted-foreground">
            Surat Keterangan Bebas Temuan - Inspektorat Kabupaten Bintan
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Data Pemohon */}
            <Card>
              <CardHeader>
                <CardTitle>Data Pemohon</CardTitle>
                <CardDescription>
                  Isi data diri sesuai dengan SK yang berlaku
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="nama_lengkap"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Lengkap (dengan gelar)</FormLabel>
                      <FormControl>
                        <Input placeholder="Dr. Nama Lengkap, S.H., M.H." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {!isFieldHidden('nip') && (
                    <FormField
                      control={form.control}
                      name="nip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>NIP</FormLabel>
                          <FormControl>
                            <Input placeholder="198501012010011001" maxLength={18} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {!isFieldHidden('pangkat_golongan') && (
                    <FormField
                      control={form.control}
                      name="pangkat_golongan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pangkat/Golongan</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              if (value === 'lainnya') {
                                setShowPangkatLainnya(true)
                                field.onChange('')
                              } else {
                                setShowPangkatLainnya(false)
                                setPangkatLainnya('')
                                field.onChange(value)
                              }
                            }} 
                            value={showPangkatLainnya ? 'lainnya' : field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih Pangkat/Golongan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PANGKAT_GOLONGAN.map((pg) => (
                                <SelectItem key={pg.value} value={pg.value}>
                                  {pg.label}
                                </SelectItem>
                              ))}
                              <SelectItem value="lainnya">Lainnya</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Input Pangkat/Golongan Lainnya */}
                {showPangkatLainnya && !isFieldHidden('pangkat_golongan') && (
                  <FormField
                    control={form.control}
                    name="pangkat_golongan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Isi Sendiri Pangkat/Golongan</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Masukkan pangkat/golongan Anda..." 
                            value={pangkatLainnya}
                            onChange={(e) => {
                              setPangkatLainnya(e.target.value)
                              field.onChange(e.target.value)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Tujuan Permohonan - NEW */}
                <div className="space-y-2">
                  <FormLabel>Tujuan Permohonan <span className="text-destructive">*</span></FormLabel>
                  <Select 
                    value={tujuanPermohonan} 
                    onValueChange={(value) => setTujuanPermohonan(value as TujuanPermohonan)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Tujuan Permohonan" />
                    </SelectTrigger>
                    <SelectContent>
                      {TUJUAN_PERMOHONAN_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Kolom Tujuan Lainnya - muncul jika pilih Lainnya ASN/Non-ASN */}
                {showTujuanLainnya && (
                  <div className="space-y-2">
                    <FormLabel>Tuliskan Tujuan dan Alasan Anda <span className="text-destructive">*</span></FormLabel>
                    <Textarea
                      placeholder="Jelaskan tujuan dan alasan permohonan SKBT Anda..."
                      value={tujuanLainnya}
                      onChange={(e) => setTujuanLainnya(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}

                {!isFieldHidden('jabatan') && (
                  <FormField
                    control={form.control}
                    name="jabatan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jabatan</FormLabel>
                        <FormControl>
                          <Input placeholder="Kepala Seksi..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {!isFieldHidden('unit_kerja_asal') && (
                  <FormField
                    control={form.control}
                    name="unit_kerja_asal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Kerja Asal</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih Unit Kerja" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {UNIT_KERJA.map((uk) => (
                              <SelectItem key={uk.value} value={uk.value}>
                                {uk.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {!isFieldHidden('instansi_tujuan') && (
                  <FormField
                    control={form.control}
                    name="instansi_tujuan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instansi Tujuan</FormLabel>
                        <FormControl>
                          <Input placeholder="Instansi yang dituju..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {!isFieldHidden('alasan_permohonan') && (
                  <FormField
                    control={form.control}
                    name="alasan_permohonan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alasan Permohonan</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Jelaskan alasan pengajuan SKBT..." 
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nomor_hp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nomor HP</FormLabel>
                        <FormControl>
                          <Input placeholder="08123456789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Upload Dokumen */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Dokumen</CardTitle>
                <CardDescription>
                  Upload semua dokumen persyaratan dalam format PDF (maks. 10MB per file)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {visibleDocuments.map((doc) => (
                  <DocumentUpload
                    key={doc.type}
                    documentType={doc.type}
                    label={doc.label}
                    selectedFile={uploadedFiles[doc.type]}
                    onFileSelect={(file) => handleFileSelect(doc.type, file)}
                  />
                ))}
                {!tujuanPermohonan && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Pilih tujuan permohonan terlebih dahulu untuk melihat dokumen yang diperlukan
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button 
                type="submit" 
                size="lg" 
                disabled={isSubmitting || !allDocumentsUploaded}
                className="w-full md:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Mengirim...
                  </>
                ) : (
                  'Ajukan Permohonan'
                )}
              </Button>
            </div>

            {!tujuanPermohonan && (
              <p className="text-sm text-center text-muted-foreground">
                * Pilih tujuan permohonan terlebih dahulu
              </p>
            )}

            {tujuanPermohonan && !allDocumentsUploaded && (
              <p className="text-sm text-center text-muted-foreground">
                * Lengkapi semua dokumen untuk mengajukan permohonan
              </p>
            )}
          </form>
        </Form>
      </div>
    </div>
  )
}
