# Supabase Migrations

Directory untuk Supabase CLI migrations.

## Cara Setup

```bash
# Install Supabase CLI
npm install supabase --save-dev

# Login ke Supabase
npx supabase login

# Link project
npx supabase link --project-ref <project-ref>

# Push schema ke database
npx supabase db push

# Atau generate migration dari schema yang sudah ada
npx supabase db diff -f initial_schema
```

## Struktur Migrasi

```
supabase/
├── schema.sql          # Schema referensi (source of truth)
├── migrations/         # Folder migrasi (auto-generated oleh Supabase CLI)
│   ├── 00001_initial_schema.sql
│   └── 00002_add_sessions.sql
└── seed.sql           # Data seed untuk development
```
