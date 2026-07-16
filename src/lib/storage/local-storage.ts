/**
 * Local Filesystem Storage Service
 * For home server deployment - files stored directly on disk.
 */
import fs from 'fs'
import path from 'path'
import { randomBytes } from 'crypto'

const STORAGE_PATH = process.env.LOCAL_STORAGE_PATH || '/opt/e-nihil/uploads'

// Ensure upload directory exists
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

// Public URL base for accessing files
const PUBLIC_URL_BASE = process.env.NEXT_PUBLIC_STORAGE_URL || '/api/storage'

export function getPublicUrl(filePath: string) {
  return `${PUBLIC_URL_BASE}/file?path=${encodeURIComponent(filePath)}`
}

export function getStoragePath(filePath: string) {
  return path.join(STORAGE_PATH, filePath)
}

export async function saveFile(
  filePath: string,
  buffer: Buffer
): Promise<{ success: boolean; error?: string }> {
  try {
    const fullPath = getStoragePath(filePath)
    ensureDir(path.dirname(fullPath))
    fs.writeFileSync(fullPath, buffer)
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function readFile(
  filePath: string
): Promise<{ data: Buffer | null; mimeType: string; error?: string }> {
  try {
    const fullPath = getStoragePath(filePath)
    if (!fs.existsSync(fullPath)) {
      return { data: null, mimeType: '', error: 'File not found' }
    }
    const data = fs.readFileSync(fullPath)
    const ext = path.extname(filePath).toLowerCase()
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.json': 'application/json',
    }
    return { data, mimeType: mimeTypes[ext] || 'application/octet-stream' }
  } catch (err) {
    return { data: null, mimeType: '', error: (err as Error).message }
  }
}

export async function deleteFile(filePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    const fullPath = getStoragePath(filePath)
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export function generateFileName(prefix: string, originalName: string): string {
  const ext = path.extname(originalName)
  const random = randomBytes(8).toString('hex')
  return `${prefix}_${random}_${Date.now()}${ext}`
}
