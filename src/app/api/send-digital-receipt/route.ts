import { NextRequest, NextResponse } from 'next/server'
import { sendDigitalReceiptEmail } from '@/lib/services/emailService'
import { supabase } from '@/lib/supabase'
import { withAuth } from '@/lib/api-middleware'

export async function POST(request: NextRequest) {
  return withAuth(request, async (request, userId) => {
    const body = await request.json()
    const { trackingNumber, nomorSurat, namaLengkap, nip, tujuanPermohonan, email, tanggalTTD, downloadUrl, sentBy } = body

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
      // Save proof of sending to storage
      const proofPath = `bukti-pengiriman/online_${trackingNumber}_${Date.now()}.json`
      
      const proofData = {
        type: 'online_delivery',
        trackingNumber,
        nomorSurat,
        namaLengkap,
        nip,
        email,
        sentAt: new Date().toISOString(),
        messageId: result.data?.messageId,
        downloadUrl,
        sentBy: sentBy || 'Admin',
      }

      await supabase.storage
        .from('documents')
        .upload(proofPath, JSON.stringify(proofData, null, 2), {
          contentType: 'application/json',
        })

      return NextResponse.json({ success: true, data: result.data, proofPath })
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to send email' },
        { status: 500 }
      )
    }
  })
}
