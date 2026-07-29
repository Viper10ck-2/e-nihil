# Requirements Document: cPanel Email Migration

## Introduction

Sistem e-Nihil (SKBT Inspektorat Kabupaten Bintan) saat ini menggunakan Resend API sebagai layanan pengiriman email. Requirement ini mendeskripsikan migrasi dari Resend API ke cPanel webmail menggunakan protokol SMTP untuk mengurangi ketergantungan pada layanan eksternal dan meningkatkan kontrol atas infrastruktur email pemerintah.

Migrasi ini harus mempertahankan semua fungsi email yang ada (6 jenis email yang berbeda) dan mendukung pengiriman attachment PDF untuk dokumen SKBT, dengan minimal breaking changes pada API endpoints dan aplikasi logic yang sudah ada.

## Glossary

- **Email_Service**: Modul layanan di `src/lib/services/emailService.ts` yang bertanggung jawab untuk pengiriman email
- **Resend_API**: Layanan email eksternal yang saat ini digunakan untuk mengirim email
- **cPanel_Webmail**: Server email pemerintah dengan SMTP yang akan menggantikan Resend API
- **SMTP_Client**: Library Nodemailer yang digunakan untuk mengirim email melalui protokol SMTP
- **Email_Template**: Template HTML untuk setiap jenis email yang dikirim
- **Attachment**: File PDF yang dilampirkan pada email (khusus untuk SKBT online)
- **Application**: Next.js application dengan stack Next.js 16, React 19, TypeScript, dan CockroachDB
- **API_Endpoint**: Route handler di `/src/app/api/*` yang memanggil Email_Service
- **Environment_Variable**: Konfigurasi yang disimpan di file `.env.local`

## Requirements

### Requirement 1: Migrasi dari Resend ke Nodemailer dengan cPanel SMTP

**User Story:** Sebagai developer sistem, saya ingin mengganti Resend API dengan Nodemailer yang menggunakan cPanel SMTP, agar sistem tidak bergantung pada layanan eksternal dan menggunakan infrastruktur email pemerintah sendiri.

#### Acceptance Criteria

1. THE Email_Service SHALL menggunakan Nodemailer sebagai SMTP_Client untuk menggantikan Resend_API
2. WHEN Email_Service diinisialisasi, THE SMTP_Client SHALL dikonfigurasi dengan koneksi ke cPanel_Webmail menggunakan Environment_Variable
3. THE SMTP_Client SHALL menggunakan host "mail.bintankab.go.id" dengan port 465 dan SSL encryption
4. WHEN koneksi SMTP gagal diinisialisasi, THE Email_Service SHALL mencatat error dan mengembalikan error response yang deskriptif
5. THE Email_Service SHALL mempertahankan semua interface function yang ada (6 fungsi pengiriman email) tanpa mengubah signature function

### Requirement 2: Konfigurasi Environment Variables untuk cPanel Webmail

**User Story:** Sebagai operator sistem, saya ingin konfigurasi cPanel webmail disimpan di environment variables, agar kredensial email tidak hardcoded dalam kode dan dapat diubah tanpa deployment ulang.

#### Acceptance Criteria

1. THE Application SHALL membaca konfigurasi SMTP dari Environment_Variable berikut: MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD, MAIL_ENCRYPTION
2. WHEN Environment_Variable MAIL_HOST tidak tersedia, THE SMTP_Client SHALL menggunakan default value "mail.bintankab.go.id"
3. WHEN Environment_Variable MAIL_PORT tidak tersedia, THE SMTP_Client SHALL menggunakan default value 465
4. WHEN Environment_Variable MAIL_ENCRYPTION tidak tersedia, THE SMTP_Client SHALL menggunakan default value "ssl"
5. THE Application SHALL mencatat warning di console WHEN Environment_Variable MAIL_USERNAME atau MAIL_PASSWORD tidak tersedia
6. THE `.env.local.example` SHALL diperbarui dengan template konfigurasi cPanel webmail untuk dokumentasi

### Requirement 3: Pertahankan Fungsi Email Notifikasi Aplikasi Baru

**User Story:** Sebagai admin inspektorat, saya ingin tetap menerima email notifikasi ketika ada permohonan SKBT baru, agar saya dapat segera memproses permohonan tersebut.

#### Acceptance Criteria

1. WHEN fungsi `sendNewApplicationEmail` dipanggil, THE Email_Service SHALL mengirim email ke admin dengan detail permohonan SKBT
2. WHEN fungsi `sendNewApplicationEmail` dipanggil, THE Email_Service SHALL mengirim email konfirmasi ke pemohon dengan nomor tracking
3. THE Email_Service SHALL mempertahankan Email_Template HTML yang sama untuk kedua email (admin dan pemohon)
4. WHEN email berhasil dikirim, THE Email_Service SHALL mengembalikan object dengan `success: true` dan `data` berisi message ID dari SMTP_Client
5. WHEN email gagal dikirim, THE Email_Service SHALL mengembalikan object dengan `success: false` dan `error` berisi error detail

### Requirement 4: Pertahankan Fungsi Email Digital Receipt

**User Story:** Sebagai pemohon SKBT, saya ingin menerima tanda terima digital ketika SKBT saya selesai diproses, agar saya memiliki bukti penyelesaian permohonan.

#### Acceptance Criteria

1. WHEN fungsi `sendDigitalReceiptEmail` dipanggil, THE Email_Service SHALL mengirim email tanda terima digital ke pemohon
2. THE Email_Service SHALL mempertahankan Email_Template HTML yang sama dengan format tanda terima yang ada
3. WHERE parameter `downloadUrl` disediakan, THE Email_Service SHALL menyertakan tombol download dalam email
4. WHEN email berhasil dikirim, THE Email_Service SHALL mengembalikan object dengan `success: true` dan `data` berisi message ID
5. WHEN email gagal dikirim, THE Email_Service SHALL mencatat error di console dan mengembalikan object dengan `success: false`

### Requirement 5: Pertahankan Fungsi Email Penolakan Dokumen

**User Story:** Sebagai pemohon SKBT, saya ingin menerima notifikasi email ketika dokumen saya ditolak, agar saya dapat memperbaiki dan mengupload ulang dokumen yang benar.

#### Acceptance Criteria

1. WHEN fungsi `sendDocumentRejectionEmail` dipanggil, THE Email_Service SHALL mengirim email notifikasi penolakan single dokumen ke pemohon
2. WHEN fungsi `sendMultipleDocumentRejectionEmail` dipanggil, THE Email_Service SHALL mengirim email notifikasi penolakan multiple dokumen dengan daftar dokumen yang ditolak
3. THE Email_Service SHALL mempertahankan Email_Template HTML yang sama untuk kedua jenis email penolakan
4. THE Email_Service SHALL menyertakan alasan penolakan untuk setiap dokumen dalam email
5. WHEN email berhasil dikirim, THE Email_Service SHALL mengembalikan object dengan `success: true` dan message ID

### Requirement 6: Pertahankan Fungsi Email SKBT Siap Diambil

**User Story:** Sebagai pemohon SKBT, saya ingin menerima notifikasi email ketika SKBT saya sudah ditandatangani dan siap diambil, agar saya dapat memilih metode pengambilan (online atau offline).

#### Acceptance Criteria

1. WHEN fungsi `sendSkbtReadyEmail` dipanggil, THE Email_Service SHALL mengirim email notifikasi SKBT siap diambil ke pemohon
2. THE Email_Service SHALL mempertahankan Email_Template HTML yang sama dengan opsi pengambilan online dan offline
3. THE Email_Service SHALL menyertakan link WhatsApp admin dalam email untuk komunikasi lebih lanjut
4. WHEN email berhasil dikirim, THE Email_Service SHALL mengembalikan object dengan `success: true` dan message ID
5. WHEN email gagal dikirim, THE Email_Service SHALL mencatat error dan mengembalikan error response

### Requirement 7: Pertahankan Fungsi Email Pilihan Metode Pickup

**User Story:** Sebagai admin inspektorat, saya ingin menerima notifikasi ketika pemohon memilih metode pengambilan SKBT, agar saya dapat mempersiapkan berkas sesuai pilihan (online atau offline).

#### Acceptance Criteria

1. WHEN fungsi `sendPickupChoiceEmail` dipanggil, THE Email_Service SHALL mengirim email notifikasi pilihan metode pickup ke admin
2. THE Email_Service SHALL mempertahankan Email_Template HTML yang sama dengan visual berbeda untuk pilihan online dan offline
3. WHERE pilihan adalah "online", THE Email_Service SHALL menyertakan call-to-action untuk mengirim berkas via email
4. WHERE pilihan adalah "offline", THE Email_Service SHALL menyertakan informasi persiapan berkas fisik
5. WHEN email berhasil dikirim, THE Email_Service SHALL mengembalikan object dengan `success: true` dan message ID

### Requirement 8: Support Pengiriman Attachment PDF untuk SKBT Online

**User Story:** Sebagai pemohon SKBT yang memilih pengambilan online, saya ingin menerima file PDF SKBT sebagai attachment email, agar saya dapat mengunduh dan menggunakan dokumen tersebut.

#### Acceptance Criteria

1. WHEN fungsi `sendSkbtOnlineEmail` dipanggil dengan parameter PDF buffer atau path, THE Email_Service SHALL melampirkan file PDF pada email
2. THE SMTP_Client SHALL mendukung pengiriman attachment dengan format PDF
3. WHEN attachment berhasil dilampirkan, THE Email_Service SHALL mengirim email dengan attachment ke pemohon
4. THE Email_Service SHALL mempertahankan Email_Template HTML yang sama untuk email SKBT online
5. WHEN pengiriman attachment gagal, THE Email_Service SHALL mencatat error dengan detail tentang ukuran file dan error message dari SMTP_Client

### Requirement 9: Error Handling yang Robust

**User Story:** Sebagai developer sistem, saya ingin error handling yang robust untuk semua pengiriman email, agar saya dapat mendiagnosis masalah dengan cepat ketika terjadi kegagalan pengiriman.

#### Acceptance Criteria

1. WHEN pengiriman email gagal karena SMTP connection error, THE Email_Service SHALL mencatat error dengan detail koneksi SMTP (host, port, encryption)
2. WHEN pengiriman email gagal karena authentication error, THE Email_Service SHALL mencatat error dengan indikasi bahwa username atau password salah
3. WHEN pengiriman email gagal karena invalid recipient, THE Email_Service SHALL mencatat error dengan email address yang invalid
4. WHEN pengiriman email gagal karena timeout, THE Email_Service SHALL mencatat error dengan durasi timeout
5. IF pengiriman email gagal, THEN THE Email_Service SHALL mengembalikan object dengan `success: false` dan `error` yang berisi error message yang deskriptif
6. THE Email_Service SHALL menangkap semua exception dari SMTP_Client dan tidak membiarkan exception tersebut crash Application

### Requirement 10: Logging untuk Tracking Pengiriman Email

**User Story:** Sebagai operator sistem, saya ingin logging yang jelas untuk setiap pengiriman email, agar saya dapat melacak status pengiriman dan troubleshooting ketika ada masalah.

#### Acceptance Criteria

1. WHEN email berhasil dikirim, THE Email_Service SHALL mencatat log dengan message ID, recipient email, dan email subject
2. WHEN email gagal dikirim, THE Email_Service SHALL mencatat error log dengan recipient email, email subject, dan error detail
3. THE Email_Service SHALL menggunakan console.log untuk success log dan console.error untuk error log
4. THE Email_Service SHALL mencatat timestamp dalam setiap log entry menggunakan ISO 8601 format
5. THE log message SHALL tidak mengandung password atau credential sensitif lainnya

### Requirement 11: Backward Compatibility dengan API Endpoints yang Sudah Ada

**User Story:** Sebagai developer sistem, saya ingin API endpoints yang menggunakan Email_Service tetap berfungsi tanpa perubahan, agar tidak ada breaking changes pada aplikasi frontend atau client yang sudah ada.

#### Acceptance Criteria

1. THE Email_Service SHALL mempertahankan semua function signature yang sama (parameter dan return type)
2. THE Email_Service SHALL mempertahankan return value format yang sama untuk success dan error response
3. WHEN API_Endpoint memanggil Email_Service, THE API_Endpoint SHALL tidak perlu diubah kecuali Environment_Variable
4. THE Email_Service SHALL mempertahankan behavior yang sama untuk semua edge case (missing parameter, invalid email, dll)
5. FOR ALL API_Endpoint yang menggunakan Email_Service, calling code SHALL tetap kompatibel tanpa modifikasi

### Requirement 12: Migration Script dan Testing

**User Story:** Sebagai developer sistem, saya ingin script testing untuk memverifikasi bahwa migrasi email berfungsi dengan benar, agar saya dapat yakin bahwa semua fungsi email bekerja sebelum deployment ke production.

#### Acceptance Criteria

1. THE migration repository SHALL menyediakan script testing untuk memverifikasi koneksi SMTP ke cPanel_Webmail
2. THE testing script SHALL mengirim test email ke email address yang dikonfigurasi untuk memverifikasi pengiriman berhasil
3. WHEN testing script dijalankan, THE script SHALL memvalidasi bahwa semua Environment_Variable yang diperlukan tersedia
4. THE testing script SHALL memverifikasi bahwa attachment PDF dapat dikirim dengan benar
5. THE testing script SHALL memberikan output yang jelas tentang hasil testing (success atau error dengan detail)

