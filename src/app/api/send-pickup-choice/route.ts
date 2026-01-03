import { NextRequest, NextResponse } from 'next/server'
import { sendPickupChoiceEmail } from '@/lib/services/emailService'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { trackingNumber, nomorSurat, namaLengkap, nip, email, nomorHp, pickupMethod } = body

    if (!trackingNumber || !nomorSurat || !namaLengkap || !email || !pickupMethod) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!['online', 'offline'].includes(pickupMethod)) {
      return NextResponse.json(
        { success: false, error: 'Invalid pickup method' },
        { status: 400 }
      )
    }

    const result = await sendPickupChoiceEmail({
      trackingNumber,
      nomorSurat,
      namaLengkap,
      nip: nip || '-',
      email,
      nomorHp: nomorHp || '-',
      pickupMethod,
      timestamp: format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: id }) + ' WIB',
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
    console.error('Error in send-pickup-choice API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
