import { NextRequest, NextResponse } from 'next/server'
import { sendNewApplicationEmail } from '@/lib/services/emailService'

export async function POST(request: NextRequest) {
  try {
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
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
