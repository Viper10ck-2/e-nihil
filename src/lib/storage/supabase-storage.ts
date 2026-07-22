/**
 * Supabase Storage Service (SERVER-ONLY)
 * Menggunakan Supabase Storage bucket untuk menyimpan file.
 * Jangan import dari 'use client' component.
 */
import { createClient } from '@supabase/supabase-js'
import 'server-only'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || 'documents'

let _supabase: ReturnType<typeof createClient> | null = null

function getClient() {
  if (!_supabase) {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error('Supabase URL dan Service Role Key wajib dikonfigurasi di environment variables')
    }
    _supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    })
  }
  return _supabase
}

/** Pastikan bucket sudah ada, buat jika belum */
async function ensureBucket(): Promise<void> {
  const client = getClient()
  const { data: buckets } = await client.storage.listBuckets()
  const exists = buckets?.some(b => b.name === BUCKET_NAME)
  if (!exists) {
    const { error } = await client.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['application/pdf'],
    })
    if (error) {
      console.warn('Gagal membuat bucket Supabase:', error.message)
    }
  }
}

export async function saveFile(
  filePath: string,
  buffer: Buffer,
  contentType?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureBucket()
    const client = getClient()

    const { error } = await client.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: contentType || 'application/pdf',
        upsert: true,
      })

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function readFile(
  filePath: string
): Promise<{ data: Buffer | null; mimeType: string; error?: string }> {
  try {
    await ensureBucket()
    const client = getClient()

    const { data, error } = await client.storage
      .from(BUCKET_NAME)
      .download(filePath)

    if (error) return { data: null, mimeType: '', error: error.message }
    if (!data) return { data: null, mimeType: '', error: 'File tidak ditemukan' }

    const buffer = Buffer.from(await data.arrayBuffer())
    return { data: buffer, mimeType: data.type || 'application/pdf' }
  } catch (err) {
    return { data: null, mimeType: '', error: (err as Error).message }
  }
}

export async function deleteFile(
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getClient()
    const { error } = await client.storage
      .from(BUCKET_NAME)
      .remove([filePath])

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function listFiles(
  prefix: string,
  search?: string
): Promise<{ files: { name: string; created_at: string }[]; error?: string }> {
  try {
    const client = getClient()
    const { data, error } = await client.storage
      .from(BUCKET_NAME)
      .list(prefix, {
        sortBy: { column: 'created_at', order: 'desc' },
      })

    if (error) return { files: [], error: error.message }

    const files = (data || [])
      .filter(f => f.name !== '.emptyFolderPlaceholder')
      .filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()))
      .map(f => ({
        name: f.name,
        created_at: f.created_at || new Date().toISOString(),
      }))

    return { files }
  } catch (err) {
    return { files: [], error: (err as Error).message }
  }
}

/** Dapatkan public URL untuk file di Supabase Storage */
export function getPublicUrl(filePath: string): string {
  if (!SUPABASE_URL) return ''
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${encodeURIComponent(filePath)}`
}
