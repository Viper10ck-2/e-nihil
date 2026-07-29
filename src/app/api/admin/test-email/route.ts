import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { withAuth } from '@/lib/api-middleware'

export async function POST(request: NextRequest) {
  return withAuth(request, async () => {
    const results: string[] = []

    // 1. Check env vars
    const host = process.env.MAIL_HOST || 'mail.bintankab.go.id'
    const port = parseInt(process.env.MAIL_PORT || '465')
    const secure = (process.env.MAIL_ENCRYPTION || 'ssl') === 'ssl'
    const user = process.env.MAIL_USERNAME || ''
    const pass = process.env.MAIL_PASSWORD || ''

    results.push(`Config: host=${host}, port=${port}, secure=${secure}, user=${user}, hasPass=${!!pass}`)

    if (!user || !pass) {
      return NextResponse.json({
        success: false,
        error: 'MAIL_USERNAME atau MAIL_PASSWORD belum di-set di environment variables Vercel',
        results
      }, { status: 500 })
    }

    // 2. Test SMTP connection
    try {
      const testTransporter = nodemailer.createTransport({
        host,
        port,
        secure,
        requireTLS: true,
        auth: { user, pass },
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        debug: true,
        logger: true
      })

      results.push('Transporter created, verifying connection...')

      await testTransporter.verify()
      results.push('SMTP connection VERIFIED successfully!')

      // 3. Test sending a test email
      const info = await testTransporter.sendMail({
        from: `e-Nihil Test <${user}>`,
        to: process.env.ADMIN_EMAIL || user,
        subject: '[e-Nihil] SMTP Test Email',
        html: `<p>Ini adalah email test dari e-Nihil.</p><p>SMTP connection ke ${host}:${port} berhasil.</p>`
      })

      results.push(`Test email sent! messageId: ${info.messageId}`)
      results.push(`Response: ${info.response}`)

      return NextResponse.json({
        success: true,
        message: 'SMTP connection & test email berhasil!',
        messageId: info.messageId,
        results
      })

    } catch (error: any) {
      results.push(`ERROR: ${error.message}`)
      results.push(`Code: ${error.code}`)
      results.push(`Command: ${error.command}`)

      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ESOCKET') {
        results.push('⚠️ Kemungkinan Vercel memblokir outbound port SMTP (Hobby plan hanya mengizinkan port 80 & 443)')
        results.push('Solusi: Upgrade ke Vercel Pro, atau gunakan layanan email relay HTTP seperti SendGrid/Brevo')
      }

      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        command: error.command,
        results
      }, { status: 500 })
    }
  })
}
