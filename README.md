# e-Nihil

Sistem Layanan Surat Keterangan Bebas Temuan (SKBT) secara online dari Inspektorat Daerah Kabupaten Bintan.

## Fitur

- 📝 Pengajuan permohonan SKBT online
- 📊 Tracking status permohonan real-time
- 📧 Notifikasi email otomatis
- 👥 Dashboard admin untuk verifikasi
- 📱 Responsive design (mobile-friendly)

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **Email**: Nodemailer (Gmail SMTP)
- **Testing**: Vitest + fast-check

## Prerequisites

- Node.js 18.x atau lebih baru
- npm atau yarn
- Akun Supabase
- Akun Gmail (untuk notifikasi email)

## Setup Development

### 1. Clone repository

```bash
git clone <repository-url>
cd e-nihil
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

Copy file `.env.local.example` ke `.env.local`:

```bash
cp .env.local.example .env.local
```

Isi nilai-nilai berikut di `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email (Gmail)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your_app_password
ADMIN_EMAIL=admin@inspektorat.bintankab.go.id
```

### 4. Setup Supabase

1. Buat project baru di [Supabase](https://supabase.com)
2. Jalankan SQL schema dari `supabase/schema.sql` di SQL Editor
3. Setup Storage bucket untuk dokumen

### 5. Run development server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## Deploy ke Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/e-nihil)

### Manual Deploy

1. Push code ke GitHub repository
2. Import project di [Vercel Dashboard](https://vercel.com/new)
3. Set environment variables di Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GMAIL_USER`
   - `GMAIL_APP_PASSWORD`
   - `ADMIN_EMAIL`
4. Deploy!

### Environment Variables di Vercel

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/public key Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-side only) |
| `GMAIL_USER` | Email Gmail untuk SMTP |
| `GMAIL_APP_PASSWORD` | App password Gmail (16 karakter) |
| `ADMIN_EMAIL` | Email admin untuk notifikasi |

## Scripts

```bash
# Development
npm run dev

# Build production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint
npm run lint
```

## Project Structure

```
e-nihil/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── api/          # API routes
│   │   ├── dashboard/    # Admin dashboard
│   │   ├── login/        # Login page
│   │   ├── pengajuan/    # Application form
│   │   └── tracking/     # Status tracking
│   ├── components/       # React components
│   │   ├── ui/           # UI primitives
│   │   ├── forms/        # Form components
│   │   └── layout/       # Layout components
│   ├── lib/              # Utilities & services
│   │   └── services/     # Business logic
│   ├── contexts/         # React contexts
│   └── types/            # TypeScript types
├── public/               # Static assets
├── supabase/             # Database schema
└── vercel.json           # Vercel configuration
```

## License

© 2025 Inspektorat Daerah Kabupaten Bintan. All rights reserved.
