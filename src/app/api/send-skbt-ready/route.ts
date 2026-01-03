import { NextRequest, NextResponse } from 'next/server'
import { sendSkbtReadyEmail } from '@/lib/services/emailService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { trackingNumber, nomorSurat, namaLengkap, email, trackingUrl } = body

    if (!trackingNumber || !nomorSurat || !namaLengkap || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = await sendSkbtReadyEmail({
      trackingNumber,
      nomorSurat,
      namaLengkap,
      email,
      trackingUrl: trackingUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://e-nihil.vercel.app'}/tracking?no=${trackingNumber}`,
      adminWhatsApp: process.env.ADMIN_WHATSAPP,
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
    console.error('Error in send-skbt-ready API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
