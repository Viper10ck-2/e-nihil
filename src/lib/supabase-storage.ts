/**
 * Storage Client - CLIENT-SAFE
 * Menggunakan Supabase Storage public URL untuk akses file.
 * Untuk upload, gunakan API route /api/storage/upload.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const BUCKET_NAME = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'documents'
const STORAGE_BASE = '/api/storage'

/** Dapatkan public URL langsung dari Supabase Storage */
export function getPublicUrl(filePath: string): { publicUrl: string } | null {
  if (!SUPABASE_URL) return null
  return {
    publicUrl: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${encodeURIComponent(filePath)}`,
  }
}

/** Download file dari Supabase Storage public URL */
export async function downloadFile(filePath: string): Promise<{ data: Blob | null; error: string | null }> {
  try {
    const publicUrl = getPublicUrl(filePath)
    if (!publicUrl) return { data: null, error: 'Supabase URL tidak dikonfigurasi' }

    const response = await fetch(publicUrl.publicUrl)
    if (!response.ok) return { data: null, error: 'File tidak ditemukan' }
    const blob = await response.blob()
    return { data: blob, error: null }
  } catch (err) {
    return { data: null, error: (err as Error).message }
  }
}

/** Upload file melalui API route (server-side yang menggunakan Supabase service role) */
export async function uploadFile(filePath: string, file: File): Promise<{ error: string | null }> {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('path', filePath)

    const response = await fetch(`${STORAGE_BASE}/upload`, {
      method: 'POST',
      body: formData,
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Upload failed' }))
      return { error: err.error || 'Upload failed' }
    }
    return { error: null }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

/** List file di folder tertentu melalui API route */
export async function listFiles(prefix: string, search?: string): Promise<{ files: { name: string; created_at: string }[] | null; error: string | null }> {
  try {
    const params = new URLSearchParams({ prefix })
    if (search) params.set('search', search)
    const response = await fetch(`${STORAGE_BASE}/list?${params}`)
    if (!response.ok) return { files: null, error: 'List failed' }
    const data = await response.json()
    return { files: data.files || [], error: null }
  } catch (err) {
    return { files: null, error: (err as Error).message }
  }
}
