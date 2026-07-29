import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-middleware'

export async function POST(request: NextRequest) {
  return withAuth(request, async () => {
    const results: string[] = []
    const brevoKey = process.env.BREVO_API_KEY || ''

    // 1. Check env vars
    if (brevoKey) {
      results.push(`Transport: Brevo HTTP API`)
      results.push(`BREVO_API_KEY: ${brevoKey.substring(0, 6)}...`)
    } else {
      results.push(`Transport: SMTP (no BREVO_API_KEY set)`)
      results.push(`MAIL_HOST: ${process.env.MAIL_HOST || 'mail.bintankab.go.id'}`)
      results.push(`MAIL_USERNAME: ${process.env.MAIL_USERNAME || '(not set)'}`)
    }

    const hasSMTP = process.env.MAIL_USERNAME && process.env.MAIL_PASSWORD
    if (!brevoKey && !hasSMTP) {
      return NextResponse.json({
        success: false,
        error: 'No email transport configured! Set BREVO_API_KEY for Vercel, or SMTP credentials.',
        results
      }, { status: 500 })
    }

    // 2. Test sending
    try {
      if (brevoKey) {
        results.push('Testing Brevo API...')
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': brevoKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sender: { name: 'e-Nihil Test', email: process.env.BREVO_FROM_EMAIL || process.env.MAIL_USERNAME || 'inspektorat@bintankab.go.id' },
            to: [{ email: process.env.ADMIN_EMAIL || 'mohd.rizki08@gmail.com' }],
            subject: '[e-Nihil] SMTP Test via Brevo',
            htmlContent: '<p>Ini adalah email test dari e-Nihil menggunakan Brevo API.</p><p>Koneksi berhasil!</p>',
          }),
        })

        if (!response.ok) {
          const errBody = await response.text()
          results.push(`Brevo API error ${response.status}: ${errBody}`)
          throw new Error(`Brevo API error ${response.status}: ${errBody}`)
        }

        const data = await response.json()
        results.push(`Brevo test email sent! messageId: ${data.messageId}`)

        return NextResponse.json({
          success: true,
          message: 'Brevo API test email berhasil terkirim!',
          messageId: data.messageId,
          results
        })
      }

      // SMTP fallback
      results.push('Testing SMTP...')
      const nodemailer = await import('nodemailer')
      const transporter = nodemailer.default.createTransport({
        host: process.env.MAIL_HOST || 'mail.bintankab.go.id',
        port: parseInt(process.env.MAIL_PORT || '465'),
        secure: true,
        requireTLS: true,
        auth: { user: process.env.MAIL_USERNAME!, pass: process.env.MAIL_PASSWORD! },
        connectionTimeout: 15000,
      })
      await transporter.verify()
      results.push('SMTP verified!')

      const info = await transporter.sendMail({
        from: `e-Nihil Test <${process.env.MAIL_USERNAME}>`,
        to: process.env.ADMIN_EMAIL || 'mohd.rizki08@gmail.com',
        subject: '[e-Nihil] SMTP Test',
        html: '<p>Ini adalah email test dari e-Nihil menggunakan SMTP.</p><p>Koneksi berhasil!</p>',
      })

      return NextResponse.json({
        success: true,
        message: 'SMTP test email berhasil terkirim!',
        messageId: info.messageId,
        results
      })

    } catch (error: any) {
      results.push(`ERROR: ${error.message}`)
      results.push(`Code: ${error.code || 'N/A'}`)

      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        results.push('⚠️ Port SMTP diblokir Vercel Hobby. Gunakan Brevo API (set BREVO_API_KEY).')
      }

      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        results
      }, { status: 500 })
    }
  })
}
