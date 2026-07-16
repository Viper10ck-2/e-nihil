import { NextRequest, NextResponse } from 'next/server'
import { generateSuratSKBT, generateFileName } from '@/lib/services/documentGeneratorService'
import { supabase } from '@/lib/supabase'
import type { Application } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { applicationId } = body

    if (!applicationId) {
      return NextResponse.json(
        { success: false, message: 'Application ID diperlukan' },
        { status: 400 }
      )
    }

    // Verifikasi aplikasi ada dan sudah diverifikasi admin
    const { data: app, error } = await supabase
      .from('applications')
      .select('tracking_number, status')
      .eq('id', applicationId)
      .single()

    if (error || !app) {
      return NextResponse.json(
        { success: false, message: 'Aplikasi tidak ditemukan' },
        { status: 404 }
      )
    }

    const application = app as unknown as Pick<Application, 'tracking_number' | 'status'>

    // Cek status minimal sudah diverifikasi admin
    const allowedStatuses = [
      'Diverifikasi Admin',
      'Diparaf Kasubbag Anev',
      'Diproses Sekretaris',
      'Ditandatangani Inspektur',
      'Diambil',
      'Selesai'
    ]

    if (!allowedStatuses.includes(application.status)) {
      return NextResponse.json(
        { success: false, message: 'Aplikasi belum diverifikasi admin' },
        { status: 400 }
      )
    }

    // Generate surat DOCX
    const docBuffer = await generateSuratSKBT(applicationId)

    if (!docBuffer) {
      return NextResponse.json(
        { success: false, message: 'Gagal generate surat SKBT' },
        { status: 500 }
      )
    }

    // Return file sebagai download
    const fileName = generateFileName(application.tracking_number)
    
    return new NextResponse(new Uint8Array(docBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': docBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error in generate-skbt API:', error)
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
