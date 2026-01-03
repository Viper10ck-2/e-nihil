import { NextRequest, NextResponse } from 'next/server'
import { sendSkbtOnlineEmail } from '@/lib/services/emailService'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { applicationId, trackingNumber, nomorSurat, namaLengkap, nip, email, tujuanPermohonan } = body

    if (!applicationId || !trackingNumber || !nomorSurat || !namaLengkap || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const timestamp = format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: id }) + ' WIB'

    // Send email with SKBT to applicant
    const result = await sendSkbtOnlineEmail({
      trackingNumber,
      nomorSurat,
      namaLengkap,
      nip: nip || '-',
      email,
      tujuanPermohonan: tujuanPermohonan || 'mutasi',
      tanggalKirim: timestamp,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to send email' },
        { status: 500 }
      )
    }

    // Save proof of sending to database
    const proofPath = `bukti-pengiriman/online_${trackingNumber}_${Date.now()}.json`
    
    // Store proof data in Supabase storage as JSON
    const proofData = {
      type: 'online_delivery',
      trackingNumber,
      nomorSurat,
      namaLengkap,
      nip,
      email,
      sentAt: new Date().toISOString(),
      messageId: result.data?.messageId,
    }

    await supabase.storage
      .from('documents')
      .upload(proofPath, JSON.stringify(proofData, null, 2), {
        contentType: 'application/json',
      })

    return NextResponse.json({ 
      success: true, 
      data: result.data,
      proofPath,
    })
  } catch (error) {
    console.error('Error in send-skbt-online API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
