import { NextRequest, NextResponse } from 'next/server'
import { sendPickupChoiceEmail } from '@/lib/services/emailService'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/lib/api-middleware'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

interface PickupMethodData {
  pickup_method: string | null
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (request, userId) => {
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

    // Check if pickup method already selected
    const { data: existingApp, error: fetchError } = await supabase
      .from('applications')
      .select('pickup_method')
      .eq('tracking_number', trackingNumber)
      .single()

    if (fetchError) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      )
    }

    const appData = existingApp as PickupMethodData

    if (appData?.pickup_method) {
      return NextResponse.json(
        { success: false, error: 'Pickup method already selected', alreadySelected: true },
        { status: 400 }
      )
    }

    // Save pickup method to database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('applications')
      .update({
        pickup_method: pickupMethod,
        pickup_method_selected_at: new Date().toISOString(),
      })
      .eq('tracking_number', trackingNumber)

    if (updateError) {
      console.error('Error updating pickup method:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to save pickup method' },
        { status: 500 }
      )
    }

    // Send email to admin
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
      return NextResponse.json({ success: true, data: { emailFailed: true } })
    }
  })
}
