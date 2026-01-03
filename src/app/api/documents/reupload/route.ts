import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { resolveRejection, checkAllRejectionsResolved } from '@/lib/services/documentRejectionService'
import type { Document } from '@/types/database'

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const documentId = formData.get('documentId') as string
    const applicationId = formData.get('applicationId') as string
    const trackingNumber = formData.get('trackingNumber') as string
    const file = formData.get('file') as File

    // Validate required fields
    if (!documentId || !applicationId || !trackingNumber || !file) {
      return NextResponse.json(
        { success: false, message: 'documentId, applicationId, trackingNumber, dan file harus diisi' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Format file tidak didukung. Gunakan PDF, JPG, atau PNG' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: 'Ukuran file maksimal 10MB' },
        { status: 400 }
      )
    }

    // Verify application exists and matches tracking number
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .eq('tracking_number', trackingNumber)
      .single()

    if (appError || !application) {
      return NextResponse.json(
        { success: false, message: 'Permohonan tidak ditemukan' },
        { status: 404 }
      )
    }

    // Verify document exists
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('application_id', applicationId)
      .single()

    if (docError || !document) {
      return NextResponse.json(
        { success: false, message: 'Dokumen tidak ditemukan' },
        { status: 404 }
      )
    }

    const doc = document as Document

    // Upload new file to storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${trackingNumber}/${doc.document_type}_${Date.now()}.${fileExt}`
    const fileBuffer = await file.arrayBuffer()

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      return NextResponse.json(
        { success: false, message: 'Gagal mengupload file. Silakan coba lagi' },
        { status: 500 }
      )
    }

    // Delete old file from storage (optional, ignore errors)
    if (doc.file_path) {
      await supabase.storage.from('documents').remove([doc.file_path])
    }

    // Update document record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateDocError } = await (supabase as any)
      .from('documents')
      .update({
        file_name: file.name,
        file_path: fileName,
        file_size: file.size,
        uploaded_at: new Date().toISOString(),
      })
      .eq('id', documentId)

    if (updateDocError) {
      console.error('Error updating document:', updateDocError)
      return NextResponse.json(
        { success: false, message: 'Gagal memperbarui data dokumen' },
        { status: 500 }
      )
    }

    // Resolve the rejection
    await resolveRejection({ documentId, applicationId })

    // Check if all rejections are resolved
    const allResolved = await checkAllRejectionsResolved(applicationId)

    if (allResolved) {
      // Update application status back to "Menunggu Verifikasi Admin"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('applications')
        .update({ status: 'Menunggu Verifikasi Admin' })
        .eq('id', applicationId)

      // Add status history
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('status_history').insert({
        application_id: applicationId,
        status: 'Menunggu Verifikasi Admin',
        notes: 'Semua dokumen yang ditolak telah diperbaiki dan diupload ulang',
      })
    }

    return NextResponse.json({
      success: true,
      message: allResolved 
        ? 'Dokumen berhasil diupload ulang. Permohonan akan diverifikasi kembali.'
        : 'Dokumen berhasil diupload ulang. Masih ada dokumen lain yang perlu diperbaiki.',
      allResolved,
    })
  } catch (error) {
    console.error('Error reuploading document:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat mengupload dokumen' },
      { status: 500 }
    )
  }
}
