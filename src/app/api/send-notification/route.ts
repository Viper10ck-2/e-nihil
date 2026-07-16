import { NextRequest, NextResponse } from 'next/server'
import { sendNewApplicationEmail } from '@/lib/services/emailService'
import { withAuth } from '@/lib/api-middleware'
import { checkRateLimit, getClientIP } from '@/lib/security'

export async function POST(request: NextRequest) {
  return withAuth(request, async (request, userId) => {
    // Rate limiting for email sending (prevent abuse)
    const clientIP = getClientIP(request.headers)
    const rateLimit = checkRateLimit(`email:${clientIP}`, 10, 60000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Terlalu banyak permintaan. Coba lagi.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    
    const result = await sendNewApplicationEmail({
      trackingNumber: body.tracking_number,
      namaLengkap: body.nama_lengkap,
      nip: body.nip,
      pangkatGolongan: body.pangkat_golongan,
      tujuanPermohonan: body.tujuan_permohonan || 'mutasi',
      jabatan: body.jabatan,
      unitKerjaAsal: body.unit_kerja_asal,
      instansiTujuan: body.instansi_tujuan,
      alasanPermohonan: body.alasan_permohonan,
      email: body.email,
      nomorHp: body.nomor_hp,
      createdAt: body.created_at || new Date().toISOString(),
    })

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Email sent successfully' })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }
  })
}
