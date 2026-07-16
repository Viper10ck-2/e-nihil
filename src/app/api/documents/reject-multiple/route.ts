import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { rejectDocument } from '@/lib/services/documentRejectionService'
import { sendMultipleDocumentRejectionEmail } from '@/lib/services/emailService'
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

interface RejectionItem {
  documentId: string
  rejectionReason: string
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (request, userId) => {
    const body = await request.json()
    const { applicationId, rejections, rejectedBy } = body as {
      applicationId: string
      rejections: RejectionItem[]
      rejectedBy?: string
    }

    // Validate required fields
    if (!applicationId || !rejections || !Array.isArray(rejections) || rejections.length === 0) {
      return NextResponse.json(
        { success: false, message: 'applicationId dan rejections array harus diisi' },
        { status: 400 }
      )
    }

    // Validate each rejection has reason
    for (const item of rejections) {
      if (!item.documentId || !item.rejectionReason?.trim()) {
        return NextResponse.json(
          { success: false, message: 'Setiap dokumen harus memiliki documentId dan rejectionReason' },
          { status: 400 }
        )
      }
    }

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

    // Get all documents info
    const documentIds = rejections.map(r => r.documentId)
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .in('id', documentIds)

    if (docsError || !documents || (documents as unknown[]).length === 0) {
      return NextResponse.json(
        { success: false, message: 'Dokumen tidak ditemukan' },
        { status: 404 }
      )
    }

    const docs = documents as unknown as Document[]
    const docMap = new Map(docs.map(d => [d.id, d]))

    // Create rejection records for each document
    const rejectedDocs: { name: string; reason: string }[] = []
    
    for (const item of rejections) {
      const doc = docMap.get(item.documentId)
      if (!doc) continue

      await rejectDocument({
        documentId: item.documentId,
        applicationId,
        rejectionReason: item.rejectionReason.trim(),
        rejectedBy,
      })

      rejectedDocs.push({
        name: documentTypeLabels[doc.document_type] || doc.document_type,
        reason: item.rejectionReason.trim(),
      })
    }

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
    const docNames = rejectedDocs.map(d => d.name).join(', ')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('status_history').insert({
      application_id: applicationId,
      status: 'Dokumen Ditolak',
      notes: `${rejectedDocs.length} dokumen ditolak: ${docNames}`,
      changed_by: rejectedBy,
    })

    // Send single email notification with all rejected documents
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://e-nihil.vercel.app'
    const trackingUrl = `${baseUrl}/tracking?no=${app.tracking_number}`

    await sendMultipleDocumentRejectionEmail({
      trackingNumber: app.tracking_number,
      namaLengkap: app.nama_lengkap,
      email: app.email,
      rejectedDocuments: rejectedDocs,
      trackingUrl,
    })

    return NextResponse.json({
      success: true,
      message: `${rejectedDocs.length} dokumen berhasil ditolak dan notifikasi telah dikirim`,
      rejectedCount: rejectedDocs.length,
    })
  })
}
