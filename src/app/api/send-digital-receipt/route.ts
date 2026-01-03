import { NextRequest, NextResponse } from 'next/server'
import { sendDigitalReceiptEmail } from '@/lib/services/emailService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { trackingNumber, nomorSurat, namaLengkap, nip, tujuanPermohonan, email, tanggalTTD, downloadUrl } = body

    if (!trackingNumber || !nomorSurat || !namaLengkap || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = await sendDigitalReceiptEmail({
      trackingNumber,
      nomorSurat,
      namaLengkap,
      nip,
      tujuanPermohonan,
      email,
      tanggalTTD,
      downloadUrl,
    })

    if (result.success) {
      return NextResponse.json({ success: true, data: result.data })
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to send email' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in send-digital-receipt API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
