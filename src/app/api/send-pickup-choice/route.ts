import { NextRequest, NextResponse } from 'next/server'
import { sendPickupChoiceEmail } from '@/lib/services/emailService'
import { supabase } from '@/lib/supabase'
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

    if (existingApp?.pickup_method) {
      return NextResponse.json(
        { success: false, error: 'Pickup method already selected', alreadySelected: true },
        { status: 400 }
      )
    }

    // Save pickup method to database
    const { error: updateError } = await supabase
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
      // Even if email fails, pickup method is saved
      return NextResponse.json({ success: true, data: { emailFailed: true } })
    }
  } catch (error) {
    console.error('Error in send-pickup-choice API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
