/**
 * Supabase Storage Client - CLIENT-SAFE
 * Uses @supabase/supabase-js (browser-compatible, no Node.js deps).
 * Only for storage operations. DB queries use server actions.
 */
import { createClient } from '@supabase/supabase-js'

function getStorageClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

function requireClient() {
  const client = getStorageClient()
  if (!client) throw new Error('Storage tidak dikonfigurasi (NEXT_PUBLIC_SUPABASE_URL/ANON_KEY tidak disetel)')
  return client
}

export function getPublicUrl(filePath: string): { publicUrl: string } | null {
  const client = getStorageClient()
  if (!client) return null
  const { data } = client.storage.from('documents').getPublicUrl(filePath)
  return data
}

export async function downloadFile(filePath: string): Promise<{ data: Blob | null; error: string | null }> {
  try {
    const client = requireClient()
    const { data, error } = await client.storage.from('documents').download(filePath)
    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err) {
    return { data: null, error: (err as Error).message }
  }
}

export async function uploadFile(filePath: string, file: File): Promise<{ error: string | null }> {
  try {
    const client = requireClient()
    const { error } = await client.storage.from('documents').upload(filePath, file)
    if (error) return { error: error.message }
    return { error: null }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

export async function listFiles(prefix: string, search?: string): Promise<{ files: { name: string; created_at: string }[] | null; error: string | null }> {
  try {
    const client = requireClient()
    const opts: { search?: string } = {}
    if (search) opts.search = search
    const { data, error } = await client.storage.from('documents').list(prefix, opts)
    if (error) return { files: null, error: error.message }
    return { files: data?.map(f => ({ name: f.name, created_at: f.created_at })) || [], error: null }
  } catch (err) {
    return { files: null, error: (err as Error).message }
  }
}
