import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getDocumentsWithRejections } from '@/lib/services/documentRejectionService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingNumber: string }> }
) {
  try {
    const { trackingNumber } = await params

    if (!trackingNumber) {
      return NextResponse.json(
        { success: false, message: 'Nomor tracking harus diisi' },
        { status: 400 }
      )
    }

    // Get application by tracking number
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('*')
      .eq('tracking_number', trackingNumber)
      .single()

    if (appError || !application) {
      return NextResponse.json(
        { success: false, message: 'Permohonan tidak ditemukan' },
        { status: 404 }
      )
    }

    // Get documents with rejection info
    const documents = await getDocumentsWithRejections(application.id)

    // Filter only rejected documents
    const rejectedDocuments = documents.filter(doc => doc.rejection)

    // Check if user can reupload (status must be "Dokumen Ditolak")
    const canReupload = application.status === 'Dokumen Ditolak'

    return NextResponse.json({
      success: true,
      data: {
        applicationId: application.id,
        trackingNumber: application.tracking_number,
        status: application.status,
        documents: rejectedDocuments,
        canReupload,
      },
    })
  } catch (error) {
    console.error('Error getting rejected documents:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat mengambil data dokumen' },
      { status: 500 }
    )
  }
}
