import nodemailer from 'nodemailer'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

// Create transporter with Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

interface SendNewApplicationEmailParams {
  trackingNumber: string
  namaLengkap: string
  nip: string
  pangkatGolongan: string
  tujuanPermohonan: string
  jabatan?: string
  unitKerjaAsal?: string
  instansiTujuan?: string
  alasanPermohonan?: string
  email: string
  nomorHp: string
  createdAt: string
}

const getTujuanLabel = (tujuan: string) => {
  switch (tujuan) {
    case 'mutasi': return 'Perpindahan Antar Instansi (Mutasi)'
    case 'promosi': return 'Promosi Jabatan'
    case 'lainnya_asn': return 'Tujuan Lainnya (ASN)'
    case 'lainnya_non_asn': return 'Tujuan Lainnya (Non-ASN)'
    default: return 'Perpindahan Antar Instansi (Mutasi)'
  }
}

const generateEmailHTML = (params: SendNewApplicationEmailParams & { tanggalPengajuan: string }) => {
  const optionalField = (label: string, value?: string) => {
    if (!value || value === '-') return ''
    return `
      <tr>
        <td style="padding: 8px 0; color: #666666; font-size: 14px; width: 180px;">${label}</td>
        <td style="padding: 8px 0; color: #1e3a5f; font-size: 14px;">: ${value}</td>
      </tr>
    `
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: 'Times New Roman', Times, serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; font-size: 18px; font-weight: bold; color: #1e3a5f; text-transform: uppercase; letter-spacing: 1px;">
                ADA PERMOHONAN SKBT MASUK
              </h1>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 1px solid #e6ebf1; margin: 0;">
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 8px 0; color: #666666; font-size: 14px; width: 180px;">No. Tracking</td>
                  <td style="padding: 8px 0; color: #1e3a5f; font-size: 14px; font-weight: bold;">: ${params.trackingNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666666; font-size: 14px;">Tanggal Pengajuan</td>
                  <td style="padding: 8px 0; color: #1e3a5f; font-size: 14px;">: ${params.tanggalPengajuan}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666666; font-size: 14px;">Nama Lengkap</td>
                  <td style="padding: 8px 0; color: #1e3a5f; font-size: 14px;">: ${params.namaLengkap}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666666; font-size: 14px;">NIP</td>
                  <td style="padding: 8px 0; color: #1e3a5f; font-size: 14px;">: ${params.nip}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666666; font-size: 14px;">Pangkat/Golongan</td>
                  <td style="padding: 8px 0; color: #1e3a5f; font-size: 14px;">: ${params.pangkatGolongan}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666666; font-size: 14px;">Tujuan Permohonan</td>
                  <td style="padding: 8px 0; color: #1e3a5f; font-size: 14px;">: ${getTujuanLabel(params.tujuanPermohonan)}</td>
                </tr>
                ${optionalField('Jabatan', params.jabatan)}
                ${optionalField('Unit Kerja Asal', params.unitKerjaAsal)}
                ${optionalField('Instansi Tujuan', params.instansiTujuan)}
                ${optionalField('Alasan Permohonan', params.alasanPermohonan)}
                <tr>
                  <td style="padding: 8px 0; color: #666666; font-size: 14px;">Email</td>
                  <td style="padding: 8px 0; color: #1e3a5f; font-size: 14px;">: ${params.email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666666; font-size: 14px;">Nomor HP</td>
                  <td style="padding: 8px 0; color: #1e3a5f; font-size: 14px;">: ${params.nomorHp}</td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 1px solid #e6ebf1; margin: 0;">
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #1e3a5f;">
                Mohon Untuk Segera Ditindaklanjuti, Terima Kasih.
              </p>
              <p style="margin: 0; font-size: 12px; color: #8898aa;">
                e-Nihil - Inspektorat Daerah Kabupaten Bintan
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

// Email template untuk pemohon (konfirmasi pengajuan)
const generateApplicantEmailHTML = (params: SendNewApplicationEmailParams & { tanggalPengajuan: string }) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: 'Times New Roman', Times, serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header with Checkmark -->
          <tr>
            <td style="padding: 30px 40px; text-align: center;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="width: 70px; height: 70px; background-color: #22c55e; border-radius: 50%;">
                          <span style="color: white; font-size: 36px; line-height: 70px;">✓</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 15px;">
                    <h1 style="margin: 0; font-size: 18px; font-weight: bold; color: #22c55e; text-transform: uppercase; letter-spacing: 1px;">
                      PERMOHONAN SKBT BERHASIL DIAJUKAN
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 1px solid #e6ebf1; margin: 0;">
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px 40px;">
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #333; line-height: 1.6;">
                Yth. <strong>${params.namaLengkap}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #333; line-height: 1.6;">
                Permohonan Surat Keterangan Bebas Temuan (SKBT) Anda telah berhasil diajukan dan sedang dalam proses verifikasi.
              </p>
              
              <!-- Tracking Number Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f9ff; border-radius: 8px; margin: 20px 0;">
                <tr>
                  <td style="padding: 20px; text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">Nomor Tracking Anda:</p>
                    <p style="margin: 0; font-size: 24px; font-weight: bold; color: #1e3a5f; font-family: monospace; letter-spacing: 2px;">
                      ${params.trackingNumber}
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0; font-size: 14px; color: #333; line-height: 1.6;">
                Simpan nomor tracking ini untuk memantau status permohonan Anda.
              </p>
              
              <!-- Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-radius: 8px; margin: 20px 0;">
                <tr>
                  <td style="padding: 15px;">
                    <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
                      <strong>Informasi:</strong><br>
                      • Tanggal Pengajuan: ${params.tanggalPengajuan}<br>
                      • Status: Menunggu Verifikasi Admin<br>
                      • Anda akan menerima notifikasi email setiap ada perubahan status
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 1px solid #e6ebf1; margin: 0;">
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #1e3a5f;">
                Terima kasih telah menggunakan layanan e-Nihil.
              </p>
              <p style="margin: 0; font-size: 12px; color: #8898aa;">
                e-Nihil - Inspektorat Daerah Kabupaten Bintan
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

export async function sendNewApplicationEmail(params: SendNewApplicationEmailParams) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@inspektorat.bintankab.go.id'
  const tanggalPengajuan = format(new Date(params.createdAt), 'dd MMMM yyyy, HH:mm', { locale: id })

  try {
    // Send email to admin
    const adminInfo = await transporter.sendMail({
      from: `"e-Nihil Inspektorat" <${process.env.GMAIL_USER}>`,
      to: adminEmail,
      subject: `[e-Nihil] Permohonan SKBT Baru - ${params.trackingNumber}`,
      html: generateEmailHTML({ ...params, tanggalPengajuan }),
    })
    console.log('Admin email sent:', adminInfo.messageId)

    // Send confirmation email to applicant
    const applicantInfo = await transporter.sendMail({
      from: `"e-Nihil Inspektorat" <${process.env.GMAIL_USER}>`,
      to: params.email,
      subject: `[e-Nihil] Permohonan SKBT Anda Berhasil Diajukan - ${params.trackingNumber}`,
      html: generateApplicantEmailHTML({ ...params, tanggalPengajuan }),
    })
    console.log('Applicant email sent:', applicantInfo.messageId)

    return { success: true, data: { adminId: adminInfo.messageId, applicantId: applicantInfo.messageId } }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error }
  }
}


// Interface untuk pengiriman berkas online
interface SendDigitalReceiptParams {
  trackingNumber: string
  nomorSurat: string
  namaLengkap: string
  nip: string
  tujuanPermohonan: string
  email: string
  tanggalTTD: string
  downloadUrl?: string
}

// Email template untuk tanda terima digital (berkas selesai)
const generateDigitalReceiptHTML = (params: SendDigitalReceiptParams) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: 'Times New Roman', Times, serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header with Checkmark -->
          <tr>
            <td style="padding: 30px 40px; text-align: center;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="width: 70px; height: 70px; background-color: #22c55e; border-radius: 50%;">
                          <span style="color: white; font-size: 36px; line-height: 70px;">✓</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 15px;">
                    <h1 style="margin: 0; font-size: 18px; font-weight: bold; color: #22c55e; text-transform: uppercase; letter-spacing: 1px;">
                      SURAT KETERANGAN BEBAS TEMUAN ANDA TELAH SELESAI
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 1px solid #e6ebf1; margin: 0;">
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px 40px;">
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #333; line-height: 1.6;">
                Yth. <strong>${params.namaLengkap}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #333; line-height: 1.6;">
                Dengan hormat, kami informasikan bahwa Surat Keterangan Bebas Temuan (SKBT) Anda telah selesai diproses dan telah ditandatangani oleh Inspektur.
              </p>
              
              <!-- Receipt Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0fdf4; border: 2px solid #22c55e; border-radius: 8px; margin: 20px 0;">
                <tr>
                  <td style="padding: 25px; text-align: center;">
                    <p style="margin: 0 0 5px 0; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px;">TANDA TERIMA DIGITAL</p>
                    <hr style="border: none; border-top: 1px dashed #22c55e; margin: 15px 0;">
                    
                    <table width="100%" cellpadding="0" cellspacing="0" style="text-align: left;">
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 13px; width: 140px;">No. Registrasi</td>
                        <td style="padding: 8px 0; color: #1e3a5f; font-size: 13px; font-weight: bold;">: ${params.trackingNumber}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 13px;">No. Surat</td>
                        <td style="padding: 8px 0; color: #1e3a5f; font-size: 13px; font-weight: bold;">: ${params.nomorSurat}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 13px;">Nama Pemohon</td>
                        <td style="padding: 8px 0; color: #1e3a5f; font-size: 13px;">: ${params.namaLengkap}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 13px;">NIP</td>
                        <td style="padding: 8px 0; color: #1e3a5f; font-size: 13px;">: ${params.nip}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 13px;">Jenis Berkas</td>
                        <td style="padding: 8px 0; color: #1e3a5f; font-size: 13px;">: Surat Keterangan Bebas Temuan (SKBT)</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 13px;">Tujuan</td>
                        <td style="padding: 8px 0; color: #1e3a5f; font-size: 13px;">: ${getTujuanLabel(params.tujuanPermohonan)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 13px;">Tanggal Selesai</td>
                        <td style="padding: 8px 0; color: #1e3a5f; font-size: 13px;">: ${params.tanggalTTD}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 13px;">Instansi</td>
                        <td style="padding: 8px 0; color: #1e3a5f; font-size: 13px;">: Inspektorat Daerah Kabupaten Bintan</td>
                      </tr>
                    </table>
                    
                    <hr style="border: none; border-top: 1px dashed #22c55e; margin: 15px 0;">
                    <p style="margin: 0; font-size: 11px; color: #666;">
                      Tanda terima ini sah sebagai bukti penyelesaian permohonan SKBT
                    </p>
                  </td>
                </tr>
              </table>
              
              ${params.downloadUrl ? `
              <!-- Download Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                <tr>
                  <td align="center">
                    <a href="${params.downloadUrl}" style="display: inline-block; padding: 14px 30px; background-color: #1e3a5f; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: bold;">
                      📥 Download Berkas SKBT
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <!-- Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-radius: 8px; margin: 20px 0;">
                <tr>
                  <td style="padding: 15px;">
                    <p style="margin: 0; font-size: 13px; color: #1e40af; line-height: 1.5;">
                      <strong>Informasi Pengambilan:</strong><br>
                      Anda dapat mengambil berkas fisik di:<br>
                      <strong>Inspektorat Daerah Kabupaten Bintan</strong><br>
                      Jl. Bintan Buyu, Bandar Seri Bentan<br>
                      Kabupaten Bintan, Kepulauan Riau<br>
                      Jam Kerja: Senin - Jumat, 08.00 - 16.00 WIB<br><br>
                      Harap membawa identitas diri (KTP/Kartu Pegawai) saat pengambilan.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 1px solid #e6ebf1; margin: 0;">
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #1e3a5f;">
                Terima kasih telah menggunakan layanan e-Nihil.
              </p>
              <p style="margin: 0; font-size: 12px; color: #8898aa;">
                e-Nihil - Inspektorat Daerah Kabupaten Bintan
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

export async function sendDigitalReceiptEmail(params: SendDigitalReceiptParams) {
  try {
    const info = await transporter.sendMail({
      from: `"e-Nihil Inspektorat" <${process.env.GMAIL_USER}>`,
      to: params.email,
      subject: `[e-Nihil] SKBT Anda Telah Selesai - ${params.nomorSurat}`,
      html: generateDigitalReceiptHTML(params),
    })
    console.log('Digital receipt email sent:', info.messageId)
    return { success: true, data: { messageId: info.messageId } }
  } catch (error) {
    console.error('Error sending digital receipt email:', error)
    return { success: false, error }
  }
}

// Interface untuk notifikasi penolakan dokumen
interface SendDocumentRejectionEmailParams {
  trackingNumber: string
  namaLengkap: string
  email: string
  documentName: string
  rejectionReason: string
  trackingUrl: string
}

// Email template untuk penolakan dokumen
const generateDocumentRejectionHTML = (params: SendDocumentRejectionEmailParams) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: 'Times New Roman', Times, serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header with Warning Icon -->
          <tr>
            <td style="padding: 30px 40px; text-align: center;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="width: 70px; height: 70px; background-color: #f59e0b; border-radius: 50%;">
                          <span style="color: white; font-size: 36px; line-height: 70px;">⚠</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 15px;">
                    <h1 style="margin: 0; font-size: 18px; font-weight: bold; color: #d97706; text-transform: uppercase; letter-spacing: 1px;">
                      DOKUMEN PERLU DIPERBAIKI
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 1px solid #e6ebf1; margin: 0;">
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px 40px;">
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #333; line-height: 1.6;">
                Yth. <strong>${params.namaLengkap}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #333; line-height: 1.6;">
                Kami informasikan bahwa terdapat dokumen pada permohonan SKBT Anda yang perlu diperbaiki.
              </p>
              
              <!-- Rejection Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; margin: 20px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 13px; width: 140px;">No. Registrasi</td>
                        <td style="padding: 8px 0; color: #1e3a5f; font-size: 13px; font-weight: bold;">: ${params.trackingNumber}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 13px; vertical-align: top;">Dokumen Ditolak</td>
                        <td style="padding: 8px 0; color: #dc2626; font-size: 13px; font-weight: bold;">: ${params.documentName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 13px; vertical-align: top;">Alasan Penolakan</td>
                        <td style="padding: 8px 0; color: #1e3a5f; font-size: 13px;">: ${params.rejectionReason}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0; font-size: 14px; color: #333; line-height: 1.6;">
                Silakan upload ulang dokumen yang diperbaiki melalui halaman tracking permohonan Anda.
              </p>
              
              <!-- Upload Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                <tr>
                  <td align="center">
                    <a href="${params.trackingUrl}" style="display: inline-block; padding: 14px 30px; background-color: #1e3a5f; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: bold;">
                      📤 Upload Ulang Dokumen
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border-radius: 8px; margin: 20px 0;">
                <tr>
                  <td style="padding: 15px;">
                    <p style="margin: 0; font-size: 13px; color: #1e40af; line-height: 1.5;">
                      <strong>Informasi:</strong><br>
                      • Pastikan dokumen yang diupload sesuai dengan persyaratan<br>
                      • Format file yang diterima: PDF, JPG, PNG<br>
                      • Ukuran maksimal file: 10MB<br>
                      • Setelah upload ulang, permohonan akan diverifikasi kembali
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 1px solid #e6ebf1; margin: 0;">
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #1e3a5f;">
                Jika ada pertanyaan, silakan hubungi kami.
              </p>
              <p style="margin: 0; font-size: 12px; color: #8898aa;">
                e-Nihil - Inspektorat Daerah Kabupaten Bintan<br>
                Jl. Bintan Buyu, Bandar Seri Bentan, Kabupaten Bintan, Kepulauan Riau
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

export async function sendDocumentRejectionEmail(params: SendDocumentRejectionEmailParams) {
  try {
    const info = await transporter.sendMail({
      from: `"e-Nihil Inspektorat" <${process.env.GMAIL_USER}>`,
      to: params.email,
      subject: `[e-Nihil] Dokumen Perlu Diperbaiki - ${params.trackingNumber}`,
      html: generateDocumentRejectionHTML(params),
    })
    console.log('Document rejection email sent:', info.messageId)
    return { success: true, data: { messageId: info.messageId } }
  } catch (error) {
    console.error('Error sending document rejection email:', error)
    return { success: false, error }
  }
}
