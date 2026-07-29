# Implementation Plan: cPanel Email Migration

## Overview

Migrate the e-Nihil email service from Resend API to cPanel webmail SMTP using Nodemailer. This involves:
- Installing Nodemailer and configuring SMTP connection
- Refactoring 7 email functions to use Nodemailer instead of Resend
- Maintaining 100% backward compatibility with existing API endpoints
- Adding PDF attachment support for SKBT online delivery
- Implementing robust error handling and logging
- Testing all email types to ensure successful delivery

## Tasks

- [ ] 1. Install dependencies and configure environment
  - Install `nodemailer` package via npm
  - Update `.env.local` with cPanel SMTP credentials (MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD, MAIL_ENCRYPTION)
  - Update `.env.local.example` with new cPanel configuration template and deprecation notices for Resend variables
  - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.6_

- [ ]* 1.1 Create SMTP connection test script
  - Write a standalone test script to verify SMTP connection to cPanel webmail
  - Test authentication with provided credentials
  - Verify connection is established successfully
  - _Requirements: 12.1, 12.3_

- [ ] 2. Refactor email service initialization and configuration
  - [ ] 2.1 Replace Resend import with Nodemailer
    - Remove `import { Resend } from 'resend'` from `src/lib/services/emailService.ts`
    - Add `import nodemailer from 'nodemailer'` and `import type { Transporter } from 'nodemailer'`
    - Remove Resend client instantiation
    - _Requirements: 1.1, 1.5_
  
  - [ ] 2.2 Create SMTP configuration and transporter
    - Define SMTP_CONFIG object with environment variables (host, port, secure, auth)
    - Add validation warnings for missing MAIL_USERNAME or MAIL_PASSWORD
    - Create Nodemailer transporter with SMTP_CONFIG
    - Update FROM_EMAIL configuration to use MAIL_USERNAME
    - _Requirements: 1.2, 1.3, 2.1, 2.4, 2.5_
  
  - [ ] 2.3 Add error logging helper function
    - Create `logEmailError()` function with standardized error logging format
    - Include error message, error code, timestamp, and SMTP config (without password)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.6, 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 3. Migrate new application email function
  - [ ] 3.1 Refactor sendNewApplicationEmail to use Nodemailer
    - Replace `resend.emails.send()` with `transporter.sendMail()` for admin email
    - Replace `resend.emails.send()` with `transporter.sendMail()` for applicant email
    - Update response to use `info.messageId` instead of `data.id`
    - Maintain exact same function signature and return type
    - Add comprehensive error handling with try-catch
    - Add success and error logging with timestamps
    - _Requirements: 1.4, 1.5, 3.1, 3.2, 3.3, 3.4, 3.5, 9.5, 10.1, 10.2, 11.1, 11.2_
  
  - [ ]* 3.2 Write unit tests for sendNewApplicationEmail
    - Test successful email delivery to both admin and applicant
    - Test error handling for invalid email addresses
    - Test error handling for SMTP connection failures
    - Verify logging output for success and error cases
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 12.2_

- [ ] 4. Migrate digital receipt email function
  - [ ] 4.1 Refactor sendDigitalReceiptEmail to use Nodemailer
    - Replace `resend.emails.send()` with `transporter.sendMail()`
    - Update response to use `info.messageId`
    - Maintain exact same function signature and return type
    - Add comprehensive error handling and logging
    - _Requirements: 1.4, 1.5, 4.1, 4.2, 4.3, 4.4, 4.5, 11.1, 11.2_
  
  - [ ]* 4.2 Write unit tests for sendDigitalReceiptEmail
    - Test successful email delivery with download URL
    - Test successful email delivery without download URL
    - Test error handling scenarios
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 12.2_

- [ ] 5. Migrate document rejection email functions
  - [ ] 5.1 Refactor sendDocumentRejectionEmail to use Nodemailer
    - Replace `resend.emails.send()` with `transporter.sendMail()`
    - Update response to use `info.messageId`
    - Maintain exact same function signature and return type
    - Add comprehensive error handling and logging
    - _Requirements: 1.4, 1.5, 5.1, 5.2, 5.3, 5.4, 5.5, 11.1, 11.2_
  
  - [ ] 5.2 Refactor sendMultipleDocumentRejectionEmail to use Nodemailer
    - Replace `resend.emails.send()` with `transporter.sendMail()`
    - Update response to use `info.messageId`
    - Maintain exact same function signature and return type
    - Add comprehensive error handling and logging
    - _Requirements: 1.4, 1.5, 5.1, 5.2, 5.3, 5.4, 5.5, 11.1, 11.2_
  
  - [ ]* 5.3 Write unit tests for document rejection emails
    - Test single document rejection email
    - Test multiple document rejection email with list of rejected documents
    - Test error handling for both functions
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 12.2_

- [ ] 6. Checkpoint - Verify base migration is working
  - Ensure all tests pass for migrated functions (1-5)
  - Verify SMTP connection is stable
  - Ask the user if questions arise

- [ ] 7. Migrate SKBT ready email function
  - [ ] 7.1 Refactor sendSkbtReadyEmail to use Nodemailer
    - Replace `resend.emails.send()` with `transporter.sendMail()`
    - Update response to use `info.messageId`
    - Maintain exact same function signature and return type
    - Add comprehensive error handling and logging
    - _Requirements: 1.4, 1.5, 6.1, 6.2, 6.3, 6.4, 6.5, 11.1, 11.2_
  
  - [ ]* 7.2 Write unit tests for sendSkbtReadyEmail
    - Test successful email delivery with pickup options
    - Test email includes WhatsApp link
    - Test error handling
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 12.2_

- [ ] 8. Migrate pickup choice email function
  - [ ] 8.1 Refactor sendPickupChoiceEmail to use Nodemailer
    - Replace `resend.emails.send()` with `transporter.sendMail()`
    - Update response to use `info.messageId`
    - Maintain exact same function signature and return type
    - Add comprehensive error handling and logging
    - Ensure correct visual representation for online/offline choices
    - _Requirements: 1.4, 1.5, 7.1, 7.2, 7.3, 7.4, 7.5, 11.1, 11.2_
  
  - [ ]* 8.2 Write unit tests for sendPickupChoiceEmail
    - Test email for "online" pickup choice
    - Test email for "offline" pickup choice
    - Test call-to-action is included for online choice
    - Test error handling
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 12.2_

- [ ] 9. Enhance SKBT online email with PDF attachment support
  - [ ] 9.1 Add attachment parameters to SendSkbtOnlineEmailParams interface
    - Add optional `pdfBuffer?: Buffer` parameter
    - Add optional `pdfFilename?: string` parameter
    - Ensure backward compatibility (existing callers don't need to provide these)
    - _Requirements: 8.1, 8.2, 11.1, 11.2, 11.4_
  
  - [ ] 9.2 Refactor sendSkbtOnlineEmail to use Nodemailer with attachment support
    - Replace `resend.emails.send()` with `transporter.sendMail()`
    - Add attachments array to mailOptions when pdfBuffer is provided
    - Configure attachment with filename, content, and contentType (application/pdf)
    - Update response to use `info.messageId`
    - Add logging for attachment size and presence
    - Add specific error handling for attachment failures (log size and error details)
    - Maintain exact same function signature (backward compatible)
    - _Requirements: 1.4, 1.5, 8.1, 8.2, 8.3, 8.4, 8.5, 11.1, 11.2, 11.4_
  
  - [ ]* 9.3 Write unit tests for sendSkbtOnlineEmail
    - Test email delivery without attachment (backward compatibility)
    - Test email delivery with PDF attachment
    - Test attachment metadata (filename, contentType)
    - Test error handling for large attachments (> 10MB)
    - Test error handling for corrupt PDF buffers
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 12.2, 12.4_

- [ ] 10. Checkpoint - Verify all email functions migrated
  - Ensure all 7 email functions have been migrated to Nodemailer
  - Verify all unit tests pass
  - Verify no breaking changes to function signatures
  - Ask the user if questions arise

- [ ] 11. Clean up Resend dependencies
  - [ ] 11.1 Remove Resend package from package.json
    - Run `npm uninstall resend` to remove the package
    - Verify package.json no longer includes resend dependency
    - _Requirements: 1.5, 11.3_
  
  - [ ] 11.2 Remove deprecated environment variable references
    - Remove any remaining code references to RESEND_API_KEY or RESEND_FROM_EMAIL
    - Update code comments to reference new cPanel configuration
    - _Requirements: 2.6, 11.3_

- [ ] 12. Integration testing with API endpoints
  - [ ]* 12.1 Test /api/send-notification endpoint
    - Send POST request to trigger sendNewApplicationEmail
    - Verify 200 response and email sent successfully
    - Check actual email delivery in inbox
    - _Requirements: 3.1, 11.3, 11.5, 12.2_
  
  - [ ]* 12.2 Test /api/send-digital-receipt endpoint
    - Send POST request to trigger sendDigitalReceiptEmail
    - Verify email delivery and HTML rendering
    - _Requirements: 4.1, 11.3, 11.5, 12.2_
  
  - [ ]* 12.3 Test document rejection API endpoints
    - Test /api/documents/reject endpoint (single document)
    - Test /api/documents/reject-multiple endpoint (multiple documents)
    - Verify email delivery for both scenarios
    - _Requirements: 5.1, 11.3, 11.5, 12.2_
  
  - [ ]* 12.4 Test /api/send-skbt-ready endpoint
    - Send POST request to trigger sendSkbtReadyEmail
    - Verify email delivery with pickup options
    - _Requirements: 6.1, 11.3, 11.5, 12.2_
  
  - [ ]* 12.5 Test /api/send-pickup-choice endpoint
    - Send POST request for "online" choice
    - Send POST request for "offline" choice
    - Verify admin receives correct email for each choice
    - _Requirements: 7.1, 11.3, 11.5, 12.2_
  
  - [ ]* 12.6 Test /api/send-skbt-online endpoint with attachment
    - Send POST request with PDF buffer to trigger sendSkbtOnlineEmail
    - Verify email delivery with PDF attachment
    - Verify attachment can be downloaded and opened
    - Test with various PDF sizes (< 1MB, 1-5MB, 5-10MB)
    - _Requirements: 8.1, 8.2, 8.3, 11.3, 11.5, 12.2, 12.4_

- [ ] 13. Manual testing and email client verification
  - [ ]* 13.1 Test HTML rendering across email clients
    - Verify all 7 email types render correctly in Gmail
    - Verify all 7 email types render correctly in Outlook
    - Verify all 7 email types render correctly in Apple Mail
    - Check for layout issues, broken images, or formatting problems
    - _Requirements: 12.2, 12.5_
  
  - [ ]* 13.2 Test error scenarios and logging
    - Test with invalid SMTP password (verify authentication error logged)
    - Test with invalid recipient email (verify recipient error logged)
    - Test with network timeout (verify timeout error logged)
    - Verify no sensitive data (passwords) in logs
    - Verify timestamps are in ISO 8601 format
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 10.1, 10.2, 10.3, 10.4, 10.5, 12.5_
  
  - [ ]* 13.3 End-to-end testing of complete application workflows
    - Submit new SKBT application → verify admin and applicant emails received
    - Reject document → verify rejection email received → upload new document
    - Complete SKBT processing → verify SKBT ready email → choose pickup method → verify pickup choice email → send SKBT online with attachment
    - _Requirements: 11.3, 11.5, 12.2, 12.5_

- [ ] 14. Final checkpoint and documentation
  - Ensure all tests pass (unit and integration)
  - Verify all 7 email types send successfully via cPanel SMTP
  - Verify email delivery rate is acceptable (manual testing results)
  - Verify logs provide useful debugging information
  - Verify no sensitive data exposed in logs
  - Ask the user if questions arise or if ready for production deployment

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP, though they are highly recommended for production readiness
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and provide opportunities to address issues early
- The migration maintains 100% backward compatibility - no changes required to existing API endpoint callers
- SMTP connection uses singleton pattern with connection pooling for optimal performance
- All function signatures and return types remain unchanged to prevent breaking changes
- PDF attachment support is backward compatible - existing code works without providing attachment
