import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { rejectDocument } from '@/lib/services/documentRejectionService'
import { sendDocumentRejectionEmail } from '@/lib/services/emailService'
import { withAuth } from '@/lib/api-middleware'
import type { Application, Document } from '@/types/database'

const documentTypeLabels: Record<string, string> = {
  surat_permohonan: 'Surat Permohonan',
  surat_pernyataan_bebas_temuan: 'Surat Pernyataan Bebas Temuan',
  surat_rekomendasi: 'Surat Rekomendasi',
  sk_pns: 'SK PNS',
  sk_pangkat_terakhir: 'SK Pangkat Terakhir',
  daftar_riwayat_pekerjaan: 'Daftar Riwayat Pekerjaan',
  skp: 'SKP',
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (request, userId) => {
    const body = await request.json()
    const { documentId, applicationId, rejectionReason, rejectedBy } = body

    // Validate required fields
    if (!documentId || !applicationId || !rejectionReason) {
      return NextResponse.json(
        { success: false, message: 'documentId, applicationId, dan rejectionReason harus diisi' },
        { status: 400 }
      )
    }

    if (rejectionReason.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'Alasan penolakan harus diisi' },
        { status: 400 }
      )
    }

    // Get document info
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      return NextResponse.json(
        { success: false, message: 'Dokumen tidak ditemukan' },
        { status: 404 }
      )
    }

    const doc = document as unknown as Document

    // Get application info
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .single()

    if (appError || !application) {
      return NextResponse.json(
        { success: false, message: 'Permohonan tidak ditemukan' },
        { status: 404 }
      )
    }

    const app = application as unknown as Application

    // Create rejection record
    await rejectDocument({
      documentId,
      applicationId,
      rejectionReason: rejectionReason.trim(),
      rejectedBy,
    })

    // Update application status to "Dokumen Ditolak"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('applications')
      .update({ status: 'Dokumen Ditolak' })
      .eq('id', applicationId)

    if (updateError) {
      console.error('Error updating application status:', updateError)
    }

    // Add status history
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('status_history').insert({
      application_id: applicationId,
      status: 'Dokumen Ditolak',
      notes: `Dokumen "${documentTypeLabels[doc.document_type] || doc.document_type}" ditolak: ${rejectionReason}`,
      changed_by: rejectedBy,
    })

    // Send email notification
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://e-nihil.vercel.app'
    const trackingUrl = `${baseUrl}/tracking?no=${app.tracking_number}`

    await sendDocumentRejectionEmail({
      trackingNumber: app.tracking_number,
      namaLengkap: app.nama_lengkap,
      email: app.email,
      documentName: documentTypeLabels[doc.document_type] || doc.document_type,
      rejectionReason: rejectionReason.trim(),
      trackingUrl,
    })

    return NextResponse.json({
      success: true,
      message: 'Dokumen berhasil ditolak dan notifikasi telah dikirim',
    })
  })
}
