# Design Document: cPanel Email Migration

## 1. Overview

This document outlines the technical design for migrating the e-Nihil email service from Resend API to cPanel webmail using SMTP protocol via Nodemailer. The migration will maintain all existing email functionality while eliminating dependency on external third-party services.

### 1.1 Design Goals

- Replace Resend API client with Nodemailer SMTP client
- Maintain 100% backward compatibility with existing API endpoints
- Support all 6 existing email types without template changes
- Enable PDF attachment support for SKBT online delivery
- Provide robust error handling and logging
- Zero breaking changes to calling code

### 1.2 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Application                      │
├─────────────────────────────────────────────────────────────┤
│  API Endpoints (src/app/api/*)                              │
│  ├─ send-notification/route.ts                              │
│  ├─ send-digital-receipt/route.ts                           │
│  ├─ send-skbt-ready/route.ts                                │
│  ├─ send-pickup-choice/route.ts                             │
│  ├─ send-skbt-online/route.ts                               │
│  └─ documents/reject*/route.ts                              │
│                           │                                   │
│                           ▼                                   │
│  ┌───────────────────────────────────────────────────┐      │
│  │ Email Service (src/lib/services/emailService.ts)  │      │
│  │                                                     │      │
│  │  ┌──────────────────────────────────────────┐     │      │
│  │  │  BEFORE (Current)                        │     │      │
│  │  │  - Resend API Client                     │     │      │
│  │  │  - resend.emails.send()                  │     │      │
│  │  └──────────────────────────────────────────┘     │      │
│  │                                                     │      │
│  │  ┌──────────────────────────────────────────┐     │      │
│  │  │  AFTER (New Design)                      │     │      │
│  │  │  - Nodemailer SMTP Client                │     │      │
│  │  │  - transporter.sendMail()                │     │      │
│  │  │  - Attachment Support                    │     │      │
│  │  └──────────────────────────────────────────┘     │      │
│  │                                                     │      │
│  │  6 Email Functions:                                │      │
│  │  ├─ sendNewApplicationEmail()                     │      │
│  │  ├─ sendDigitalReceiptEmail()                     │      │
│  │  ├─ sendDocumentRejectionEmail()                  │      │
│  │  ├─ sendMultipleDocumentRejectionEmail()          │      │
│  │  ├─ sendSkbtReadyEmail()                          │      │
│  │  ├─ sendPickupChoiceEmail()                       │      │
│  │  └─ sendSkbtOnlineEmail()                         │      │
│  └───────────────────┬───────────────────────────────┘      │
│                      │                                        │
└──────────────────────┼────────────────────────────────────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │   cPanel Webmail     │
            │  SMTP Server         │
            │                      │
            │  mail.bintankab.go.id│
            │  Port: 465 (SSL)     │
            └──────────────────────┘
```

## 2. Component Design

### 2.1 Email Service Module

**File:** `src/lib/services/emailService.ts`

#### 2.1.1 SMTP Client Initialization

```typescript
import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

// SMTP Configuration from environment variables
const SMTP_CONFIG = {
  host: process.env.MAIL_HOST || 'mail.bintankab.go.id',
  port: parseInt(process.env.MAIL_PORT || '465'),
  secure: (process.env.MAIL_ENCRYPTION || 'ssl') === 'ssl', // true for SSL
  auth: {
    user: process.env.MAIL_USERNAME || '',
    pass: process.env.MAIL_PASSWORD || ''
  }
}

// Validation warnings
if (!process.env.MAIL_USERNAME || !process.env.MAIL_PASSWORD) {
  console.warn('[Email Service] Warning: MAIL_USERNAME or MAIL_PASSWORD not configured')
}

// Create Nodemailer transporter
const transporter: Transporter = nodemailer.createTransport(SMTP_CONFIG)

// From address configuration
const FROM_EMAIL = process.env.MAIL_USERNAME || 'inspektorat@bintankab.go.id'
const FROM_NAME = 'e-Nihil Inspektorat'
```

**Design Decisions:**
- Use singleton pattern for transporter to reuse connection pool
- Provide sensible defaults for cPanel configuration
- Validate environment variables on module load
- Log warnings but don't crash if credentials missing (allows development without full config)

#### 2.1.2 Email Sending Function Structure

All 6 email functions will follow this unified pattern:

```typescript
export async function send*Email(params: *EmailParams) {
  try {
    // Prepare email options
    const mailOptions = {
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: params.email,
      subject: `[e-Nihil] ...`,
      html: generate*HTML(params),
      // Optional: attachments for SKBT online
      attachments: params.attachment ? [{
        filename: params.filename,
        content: params.attachment
      }] : undefined
    }

    // Send email using Nodemailer
    const info = await transporter.sendMail(mailOptions)
    
    // Success logging
    console.log(`[Email Service] Email sent successfully:`, {
      type: '...',
      to: params.email,
      messageId: info.messageId,
      response: info.response,
      timestamp: new Date().toISOString()
    })
    
    return { 
      success: true, 
      data: { messageId: info.messageId } 
    }
    
  } catch (error) {
    // Error handling and logging
    console.error(`[Email Service] Failed to send email:`, {
      type: '...',
      to: params.email,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
```

**Design Decisions:**
- Maintain exact same function signatures (parameters and return types)
- Use try-catch for comprehensive error handling
- Return same response structure: `{ success: boolean, data?: any, error?: any }`
- Detailed logging with timestamps for debugging
- Never throw exceptions - always return error objects

### 2.2 Email Functions Mapping

#### 2.2.1 New Application Emails

**Function:** `sendNewApplicationEmail(params: SendNewApplicationEmailParams)`

**Current Behavior:** 
- Sends 2 emails: one to admin, one to applicant
- Uses `resend.emails.send()` twice

**New Implementation:**
```typescript
export async function sendNewApplicationEmail(params: SendNewApplicationEmailParams) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@inspektorat.bintankab.go.id'
  const tanggalPengajuan = format(new Date(params.createdAt), 'dd MMMM yyyy, HH:mm', { locale: id })

  try {
    // Send email to admin
    const adminMailOptions = {
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: adminEmail,
      subject: `[e-Nihil] Permohonan SKBT Baru - ${params.trackingNumber}`,
      html: generateEmailHTML({ ...params, tanggalPengajuan }),
    }
    const adminInfo = await transporter.sendMail(adminMailOptions)
    console.log('[Email Service] Admin email sent:', adminInfo.messageId)

    // Send confirmation email to applicant
    const applicantMailOptions = {
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: params.email,
      subject: `[e-Nihil] Permohonan SKBT Anda Berhasil Diajukan - ${params.trackingNumber}`,
      html: generateApplicantEmailHTML({ ...params, tanggalPengajuan }),
    }
    const applicantInfo = await transporter.sendMail(applicantMailOptions)
    console.log('[Email Service] Applicant email sent:', applicantInfo.messageId)

    return { 
      success: true, 
      data: { 
        adminId: adminInfo.messageId, 
        applicantId: applicantInfo.messageId 
      } 
    }
  } catch (error) {
    console.error('[Email Service] Error sending new application email:', error)
    return { success: false, error }
  }
}
```

**Migration Notes:**
- Replace `resend.emails.send()` with `transporter.sendMail()`
- Change `data.id` to `messageId` in response
- HTML templates remain unchanged

#### 2.2.2 Digital Receipt Email

**Function:** `sendDigitalReceiptEmail(params: SendDigitalReceiptParams)`

**Current Behavior:**
- Sends receipt confirmation to applicant
- Includes download URL if provided

**New Implementation:**
```typescript
export async function sendDigitalReceiptEmail(params: SendDigitalReceiptParams) {
  try {
    const mailOptions = {
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: params.email,
      subject: `[e-Nihil] SKBT Anda Telah Selesai - ${params.nomorSurat}`,
      html: generateDigitalReceiptHTML(params),
    }
    
    const info = await transporter.sendMail(mailOptions)
    console.log('[Email Service] Digital receipt email sent:', info.messageId)
    return { success: true, data: { messageId: info.messageId } }
  } catch (error) {
    console.error('[Email Service] Error sending digital receipt email:', error)
    return { success: false, error }
  }
}
```

#### 2.2.3 Document Rejection Emails

**Functions:**
- `sendDocumentRejectionEmail(params: SendDocumentRejectionEmailParams)`
- `sendMultipleDocumentRejectionEmail(params: SendMultipleDocumentRejectionEmailParams)`

**Implementation Pattern:** Same as digital receipt - straightforward migration from Resend to Nodemailer

#### 2.2.4 SKBT Ready Email

**Function:** `sendSkbtReadyEmail(params: SendSkbtReadyEmailParams)`

**Implementation:** Same pattern - notify applicant that SKBT is ready with pickup options

#### 2.2.5 Pickup Choice Email

**Function:** `sendPickupChoiceEmail(params: SendPickupChoiceEmailParams)`

**Implementation:** Sends admin notification of pickup method choice (online/offline)

#### 2.2.6 SKBT Online Delivery Email

**Function:** `sendSkbtOnlineEmail(params: SendSkbtOnlineEmailParams)`

**Current Behavior:**
- Sends SKBT document confirmation
- Currently does NOT include PDF attachment (only email notification)

**Enhanced Implementation:**
```typescript
interface SendSkbtOnlineEmailParams {
  trackingNumber: string
  nomorSurat: string
  namaLengkap: string
  nip: string
  email: string
  tujuanPermohonan: string
  tanggalKirim: string
  // NEW: Optional PDF attachment
  pdfBuffer?: Buffer
  pdfFilename?: string
}

export async function sendSkbtOnlineEmail(params: SendSkbtOnlineEmailParams) {
  try {
    const mailOptions = {
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: params.email,
      subject: `[e-Nihil] SKBT Anda Telah Dikirim - ${params.nomorSurat}`,
      html: generateSkbtOnlineHTML(params),
      // Add PDF attachment if provided
      attachments: params.pdfBuffer ? [{
        filename: params.pdfFilename || `SKBT-${params.nomorSurat}.pdf`,
        content: params.pdfBuffer,
        contentType: 'application/pdf'
      }] : undefined
    }
    
    const info = await transporter.sendMail(mailOptions)
    console.log('[Email Service] SKBT online email sent:', {
      messageId: info.messageId,
      hasAttachment: !!params.pdfBuffer,
      attachmentSize: params.pdfBuffer?.length
    })
    return { success: true, data: { messageId: info.messageId } }
  } catch (error) {
    console.error('[Email Service] Error sending SKBT online email:', {
      error,
      hasAttachment: !!params.pdfBuffer,
      attachmentSize: params.pdfBuffer?.length
    })
    return { success: false, error }
  }
}
```

**Design Decision:**
- Add optional `pdfBuffer` and `pdfFilename` parameters (backward compatible)
- Existing callers work without changes
- New functionality enabled when attachment provided

### 2.3 Error Handling Strategy

#### 2.3.1 Error Categories

1. **Connection Errors** - Cannot connect to SMTP server
2. **Authentication Errors** - Invalid username/password
3. **Recipient Errors** - Invalid email address
4. **Timeout Errors** - SMTP server not responding
5. **Attachment Errors** - PDF file too large or corrupt
6. **General Errors** - Unexpected failures

#### 2.3.2 Error Logging Format

```typescript
function logEmailError(context: string, error: Error, metadata?: Record<string, any>) {
  console.error(`[Email Service Error] ${context}:`, {
    errorMessage: error.message,
    errorName: error.name,
    errorCode: (error as any).code,
    timestamp: new Date().toISOString(),
    smtpConfig: {
      host: SMTP_CONFIG.host,
      port: SMTP_CONFIG.port,
      secure: SMTP_CONFIG.secure,
      // Never log password
    },
    ...metadata
  })
}
```

#### 2.3.3 Error Response Format

Maintain consistency with existing API contracts:

```typescript
type EmailResponse = 
  | { success: true; data: { messageId: string } }
  | { success: false; error: string | Error }
```

### 2.4 Configuration Management

#### 2.4.1 Environment Variables

**New Variables (cPanel):**
```bash
# cPanel Webmail SMTP Configuration
MAIL_HOST=mail.bintankab.go.id
MAIL_PORT=465
MAIL_USERNAME=inspektorat@bintankab.go.id
MAIL_PASSWORD=<password_webmail>
MAIL_ENCRYPTION=ssl
```

**Deprecated Variables (Resend):**
```bash
# DEPRECATED - Will be removed after migration
# RESEND_API_KEY=<key>
# RESEND_FROM_EMAIL=<email>
```

**Retained Variables:**
```bash
# Still used for recipient configuration
ADMIN_EMAIL=admin@inspektorat.bintankab.go.id

# Legacy Gmail config - can be removed (no longer used)
# GMAIL_USER=...
# GMAIL_APP_PASSWORD=...
```

#### 2.4.2 .env.local.example Updates

Update the example file to document new cPanel configuration:

```bash
# ===========================================
# Email Configuration (cPanel Webmail)
# ===========================================
# SMTP settings for sending notification emails via cPanel webmail
# Contact your hosting provider for credentials

MAIL_HOST=mail.bintankab.go.id
MAIL_PORT=465
MAIL_USERNAME=inspektorat@bintankab.go.id
MAIL_PASSWORD=your_cpanel_webmail_password
MAIL_ENCRYPTION=ssl

# Admin email to receive new application notifications
ADMIN_EMAIL=admin@inspektorat.bintankab.go.id

# ===========================================
# Deprecated Email Configuration
# ===========================================
# The following are no longer used after migration to cPanel
# RESEND_API_KEY=<deprecated>
# RESEND_FROM_EMAIL=<deprecated>
# GMAIL_USER=<deprecated>
# GMAIL_APP_PASSWORD=<deprecated>
```

## 3. Data Flow

### 3.1 Email Sending Flow

```
1. API Endpoint receives request
   └─> Validates request data
   
2. Calls Email Service function
   └─> Email Service prepares mail options
       ├─> From: ${FROM_NAME} <${FROM_EMAIL}>
       ├─> To: recipient email
       ├─> Subject: formatted subject
       ├─> HTML: generated template
       └─> Attachments: optional PDF

3. Nodemailer sends via SMTP
   ├─> Connects to mail.bintankab.go.id:465 (SSL)
   ├─> Authenticates with MAIL_USERNAME/MAIL_PASSWORD
   ├─> Transfers email content
   └─> Returns message ID

4. Email Service logs result
   ├─> Success: log message ID and timestamp
   └─> Failure: log error details

5. Email Service returns response
   └─> API Endpoint returns to client
```

### 3.2 Error Flow

```
Error Occurs in SMTP
└─> Nodemailer throws exception
    └─> Email Service catches error
        ├─> Logs detailed error information
        ├─> Determines error category
        └─> Returns { success: false, error }
            └─> API Endpoint returns 500/error response
                └─> Client receives error message
```

## 4. Implementation Plan

### 4.1 Phase 1: Dependencies and Configuration

**Tasks:**
1. Install Nodemailer: `npm install nodemailer`
2. Install types: `npm install --save-dev @types/nodemailer` (already installed)
3. Update `.env.local` with cPanel credentials
4. Update `.env.local.example` with new configuration template
5. Test SMTP connection manually

**Acceptance:**
- Nodemailer installed successfully
- Environment variables configured
- Can connect to mail.bintankab.go.id:465

### 4.2 Phase 2: Email Service Refactoring

**Tasks:**
1. Replace Resend import with Nodemailer
2. Create SMTP transporter with configuration
3. Refactor `sendNewApplicationEmail()` function
4. Refactor `sendDigitalReceiptEmail()` function
5. Refactor `sendDocumentRejectionEmail()` function
6. Refactor `sendMultipleDocumentRejectionEmail()` function
7. Refactor `sendSkbtReadyEmail()` function
8. Refactor `sendPickupChoiceEmail()` function
9. Enhance `sendSkbtOnlineEmail()` with attachment support
10. Update all error handling and logging
11. Remove Resend-specific code

**Acceptance:**
- All 6 email functions migrated to Nodemailer
- Function signatures unchanged (backward compatible)
- Error handling robust for all error types
- Logging comprehensive and sanitized (no passwords)
- SKBT online function supports PDF attachments

### 4.3 Phase 3: Testing

**Tasks:**
1. Create SMTP connection test script
2. Test each email type individually
3. Test with valid and invalid recipients
4. Test with and without attachments
5. Test error scenarios (wrong password, invalid host, etc.)
6. Verify logs are detailed and sanitized
7. Integration testing with existing API endpoints

**Test Script Structure:**
```typescript
// test-email-service.ts
import * as emailService from './src/lib/services/emailService'

async function testEmailService() {
  console.log('Testing Email Service Migration...\n')
  
  // Test 1: New Application Email
  console.log('1. Testing New Application Email...')
  const result1 = await emailService.sendNewApplicationEmail({
    trackingNumber: 'TEST-001',
    namaLengkap: 'Test User',
    nip: '123456789',
    pangkatGolongan: 'Penata / III-c',
    tujuanPermohonan: 'mutasi',
    email: 'test@example.com',
    nomorHp: '081234567890',
    createdAt: new Date().toISOString()
  })
  console.log('Result:', result1)
  
  // Test 2: SKBT Online with Attachment
  console.log('\n2. Testing SKBT Online Email with Attachment...')
  const testPdfBuffer = Buffer.from('PDF content here')
  const result2 = await emailService.sendSkbtOnlineEmail({
    trackingNumber: 'TEST-002',
    nomorSurat: 'SKBT/001/2024',
    namaLengkap: 'Test User',
    nip: '123456789',
    email: 'test@example.com',
    tujuanPermohonan: 'mutasi',
    tanggalKirim: '1 Januari 2024',
    pdfBuffer: testPdfBuffer,
    pdfFilename: 'SKBT-TEST-002.pdf'
  })
  console.log('Result:', result2)
  
  // Add tests for other email functions...
}

testEmailService().catch(console.error)
```

**Acceptance:**
- All email types send successfully
- Attachments work correctly
- Error scenarios handled gracefully
- Logs provide useful debugging information
- No breaking changes to API endpoints

### 4.4 Phase 4: Cleanup and Documentation

**Tasks:**
1. Remove Resend package: `npm uninstall resend`
2. Remove unused environment variables from code
3. Update README with new email configuration
4. Document migration process
5. Create rollback plan (in case of issues)

**Acceptance:**
- Resend package removed
- Documentation updated
- Team aware of new configuration
- Rollback plan documented

## 5. Testing Strategy

### 5.1 Unit Testing

Test each email function in isolation:

```typescript
describe('Email Service - Nodemailer Migration', () => {
  it('should send new application email successfully', async () => {
    const result = await sendNewApplicationEmail({ /* params */ })
    expect(result.success).toBe(true)
    expect(result.data.messageId).toBeDefined()
  })
  
  it('should handle invalid recipient gracefully', async () => {
    const result = await sendNewApplicationEmail({ 
      email: 'invalid-email', 
      /* other params */ 
    })
    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
  
  it('should send SKBT email with PDF attachment', async () => {
    const pdfBuffer = Buffer.from('test PDF content')
    const result = await sendSkbtOnlineEmail({
      /* params */,
      pdfBuffer,
      pdfFilename: 'test.pdf'
    })
    expect(result.success).toBe(true)
  })
})
```

### 5.2 Integration Testing

Test with actual API endpoints:

```typescript
describe('Email API Endpoints', () => {
  it('POST /api/send-notification should trigger email', async () => {
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      body: JSON.stringify({ /* application data */ })
    })
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.emailSent).toBe(true)
  })
})
```

### 5.3 Manual Testing Checklist

- [ ] Test connection to mail.bintankab.go.id:465
- [ ] Send test email to admin address
- [ ] Send test email to personal address
- [ ] Verify HTML rendering in Gmail
- [ ] Verify HTML rendering in Outlook
- [ ] Verify HTML rendering in Apple Mail
- [ ] Test with PDF attachment (< 10MB)
- [ ] Test with PDF attachment (> 10MB) - should handle error
- [ ] Test with wrong SMTP password - should log auth error
- [ ] Test with invalid recipient - should log recipient error
- [ ] Verify no sensitive data in logs
- [ ] Test all 6 email types end-to-end

## 6. Rollback Plan

In case of critical issues with cPanel SMTP:

### 6.1 Quick Rollback Steps

1. Revert `src/lib/services/emailService.ts` to previous version
2. Reinstall Resend: `npm install resend@6.17.2`
3. Restore Resend environment variables:
   ```bash
   RESEND_API_KEY=<previous_key>
   RESEND_FROM_EMAIL=<previous_from_email>
   ```
4. Deploy previous version
5. Verify emails working with Resend

### 6.2 Rollback Decision Criteria

Rollback if:
- Emails fail to send > 50% of the time
- SMTP connection unstable (frequent timeouts)
- Critical bug prevents any email delivery
- cPanel server has extended outage

## 7. Deployment Checklist

### 7.1 Pre-Deployment

- [ ] Code review completed
- [ ] All tests passing
- [ ] `.env.local.example` updated
- [ ] Documentation updated
- [ ] Team trained on new configuration

### 7.2 Deployment

- [ ] Deploy code changes
- [ ] Set environment variables on production server:
  - `MAIL_HOST=mail.bintankab.go.id`
  - `MAIL_PORT=465`
  - `MAIL_USERNAME=inspektorat@bintankab.go.id`
  - `MAIL_PASSWORD=<password>`
  - `MAIL_ENCRYPTION=ssl`
- [ ] Remove old Resend variables
- [ ] Restart application

### 7.3 Post-Deployment Verification

- [ ] Send test email for each type
- [ ] Monitor logs for errors
- [ ] Verify email delivery to test addresses
- [ ] Monitor for 24 hours
- [ ] Collect user feedback

### 7.4 Monitoring

Monitor these metrics for 1 week:
- Email send success rate
- Email send latency
- SMTP connection errors
- Authentication errors
- User-reported email delivery issues

## 8. Risk Analysis

### 8.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| SMTP server downtime | Medium | High | Implement retry logic, maintain Resend as fallback |
| SSL/TLS connection issues | Low | High | Test thoroughly in staging, have cert troubleshooting guide |
| Email marked as spam | Medium | Medium | Configure SPF/DKIM records, test deliverability |
| Attachment size limits | Low | Medium | Validate PDF size before sending, handle errors gracefully |
| Authentication failures | Low | High | Validate credentials in test environment first |

### 8.2 Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Password rotation needed | Medium | Low | Document credential update process |
| cPanel server configuration change | Low | Medium | Maintain contact with hosting provider |
| Email quota exceeded | Low | Medium | Monitor sending volume, implement rate limiting if needed |

## 9. Performance Considerations

### 9.1 SMTP Connection Pooling

Nodemailer automatically handles connection pooling:
- Reuses connections for multiple emails
- Closes idle connections after timeout
- Handles connection errors and reconnection

### 9.2 Expected Performance

- **Email send latency:** 1-3 seconds per email
- **Attachment overhead:** +500ms for 1MB PDF
- **Connection establishment:** ~500ms (cached after first send)

### 9.3 Optimization Recommendations

- Use connection pooling (default in Nodemailer)
- Consider queue system for bulk emails (future enhancement)
- Implement retry logic with exponential backoff (future enhancement)

## 10. Security Considerations

### 10.1 Credential Management

- Store SMTP credentials in environment variables only
- Never commit credentials to version control
- Rotate password periodically
- Use SSL/TLS for all connections

### 10.2 Email Content Security

- Sanitize user input in email templates (already done)
- Validate email addresses before sending
- Don't include sensitive data in logs
- Use secure attachment handling

### 10.3 SPF/DKIM Configuration

Coordinate with hosting provider to ensure:
- SPF record includes cPanel mail server
- DKIM signing enabled for domain
- Proper reverse DNS configured

## 11. Success Criteria

Migration is considered successful when:

1. ✅ All 6 email types send successfully via cPanel SMTP
2. ✅ Email delivery rate > 95%
3. ✅ No breaking changes to API endpoints
4. ✅ All tests passing
5. ✅ Logs provide useful debugging information
6. ✅ Error handling robust for all scenarios
7. ✅ PDF attachments work correctly
8. ✅ No sensitive data in logs
9. ✅ Team trained on new configuration
10. ✅ Documentation complete and accurate

## 12. Appendix

### 12.1 Nodemailer vs Resend API Comparison

| Feature | Resend API | Nodemailer (SMTP) |
|---------|-----------|-------------------|
| Protocol | REST API | SMTP |
| Setup complexity | Low (API key) | Medium (SMTP config) |
| Dependency | External service | Self-hosted/cPanel |
| Cost | Pay per email | Included with hosting |
| Rate limits | API limits | cPanel limits |
| Attachment support | Yes | Yes |
| HTML templates | Yes | Yes |
| Error handling | HTTP errors | SMTP errors |
| Connection pooling | N/A | Yes (automatic) |
| Retry logic | Manual | Manual (can add) |

### 12.2 Useful Nodemailer Resources

- [Nodemailer Documentation](https://nodemailer.com/)
- [SMTP Configuration Guide](https://nodemailer.com/smtp/)
- [Attachment Handling](https://nodemailer.com/message/attachments/)
- [Error Handling](https://nodemailer.com/usage/error-handling/)

### 12.3 Environment Variable Reference

Complete list of email-related environment variables:

```bash
# Required for cPanel SMTP
MAIL_HOST=mail.bintankab.go.id
MAIL_PORT=465
MAIL_USERNAME=inspektorat@bintankab.go.id
MAIL_PASSWORD=<password>
MAIL_ENCRYPTION=ssl

# Required for email recipients
ADMIN_EMAIL=inspektorat@bintankab.go.id

# Deprecated (can be removed)
RESEND_API_KEY=<deprecated>
RESEND_FROM_EMAIL=<deprecated>
GMAIL_USER=<deprecated>
GMAIL_APP_PASSWORD=<deprecated>
```
