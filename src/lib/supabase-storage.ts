/**
 * Storage Client - CLIENT-SAFE
 * Uses fetch() to API routes. Files stored on local disk (home server).
 */

const STORAGE_BASE = '/api/storage'

export function getPublicUrl(filePath: string): { publicUrl: string } | null {
  return { publicUrl: `${STORAGE_BASE}/file?path=${encodeURIComponent(filePath)}` }
}

export async function downloadFile(filePath: string): Promise<{ data: Blob | null; error: string | null }> {
  try {
    const url = `${STORAGE_BASE}/file?path=${encodeURIComponent(filePath)}`
    const response = await fetch(url)
    if (!response.ok) return { data: null, error: 'File not found' }
    const blob = await response.blob()
    return { data: blob, error: null }
  } catch (err) {
    return { data: null, error: (err as Error).message }
  }
}

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
