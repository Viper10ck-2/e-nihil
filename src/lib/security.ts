/**
 * Security Utilities for e-Nihil Application
 * Provides password hashing, token generation, session management, and security helpers
 */

import bcrypt from 'bcryptjs'
import { createHash, randomBytes } from 'crypto'
import { createServerClient } from '@/lib/supabase'

// Salt rounds for bcrypt (higher = more secure but slower)
const SALT_ROUNDS = 12

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Handle legacy plain text passwords (for migration)
  if (!hash.startsWith('$2')) {
    return password === hash
  }
  return bcrypt.compare(password, hash)
}

/**
 * Generate a cryptographically secure random token (Node.js compatible)
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex')
}

/**
 * Hash a token for secure storage (SHA-256)
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): string {
  return generateSecureToken(32)
}

/**
 * Generate a CSRF token + hashed version pair
 */
export function generateCSRFTokenPair(): { token: string; hash: string } {
  const token = generateCSRFToken()
  return { token, hash: hashToken(token) }
}

// ---- Session Management ----

/**
 * Create a new session in the database
 */
export async function createSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ sessionToken: string; expiresAt: number }> {
  const sessionToken = generateSecureToken(32)
  const tokenHash = hashToken(sessionToken)
  const now = Date.now()
  const expiresAt = now + 8 * 60 * 60 * 1000 // 8 hours

  const supabase = createServerClient()
  await supabase.from('sessions').insert({
    user_id: userId,
    token_hash: tokenHash,
    ip_address: ipAddress || null,
    user_agent: userAgent || null,
    expires_at: new Date(expiresAt).toISOString(),
  } as never)

  return { sessionToken, expiresAt }
}

/**
 * Validate a session token against the database
 * Returns the user_id if valid, null otherwise
 */
export async function validateSession(sessionToken: string): Promise<string | null> {
  if (!sessionToken) return null

  const tokenHash = hashToken(sessionToken)
  const supabase = createServerClient()

  const { data } = await supabase
    .from('sessions')
    .select('user_id, expires_at, revoked_at')
    .eq('token_hash', tokenHash)
    .single()

  if (!data) return null

  const session = data as unknown as { user_id: string; expires_at: string; revoked_at: string | null }

  // Check if revoked
  if (session.revoked_at) return null

  // Check if expired
  if (new Date(session.expires_at) < new Date()) return null

  return session.user_id
}

/**
 * Revoke a session (logout)
 */
export async function revokeSession(sessionToken: string): Promise<void> {
  if (!sessionToken) return

  const tokenHash = hashToken(sessionToken)
  const supabase = createServerClient()

  await supabase
    .from('sessions')
    .update({ revoked_at: new Date().toISOString() } as never)
    .eq('token_hash', tokenHash)
}

/**
 * Revoke all sessions for a user
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  const supabase = createServerClient()
  await supabase
    .from('sessions')
    .update({ revoked_at: new Date().toISOString() } as never)
    .eq('user_id', userId)
    .is('revoked_at', null)
}

/**
 * Sanitize user input to prevent XSS
 * @param input - User input string
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Validate email format
 * @param email - Email to validate
 * @returns True if valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate NIP format (18 digits)
 * @param nip - NIP to validate
 * @returns True if valid NIP format
 */
export function isValidNIP(nip: string): boolean {
  const nipRegex = /^\d{18}$/
  return nipRegex.test(nip)
}

/**
 * Rate limiter store (in-memory, for production use Redis)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Check rate limit for an identifier
 * @param identifier - Unique identifier (IP, user ID, etc.)
 * @param maxRequests - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const record = rateLimitStore.get(identifier)

  if (!record || now > record.resetTime) {
    // New window
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs }
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now }
  }

  record.count++
  return { allowed: true, remaining: maxRequests - record.count, resetIn: record.resetTime - now }
}

/**
 * Clean up expired rate limit entries (call periodically)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// Clean up every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000)
}

/**
 * Mask sensitive data for logging
 * @param data - Data to mask
 * @param visibleChars - Number of visible characters at start/end
 * @returns Masked string
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars * 2) {
    return '*'.repeat(data.length)
  }
  const start = data.slice(0, visibleChars)
  const end = data.slice(-visibleChars)
  const masked = '*'.repeat(Math.max(data.length - visibleChars * 2, 4))
  return `${start}${masked}${end}`
}

/**
 * Secure cookie options for authentication
 */
export const SECURE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production' && process.env.VERCEL === '1',
  sameSite: 'lax' as const, // Use 'lax' to allow cookies on same-site navigation
  path: '/',
}

/**
 * Get client IP from request headers
 * @param headers - Request headers
 * @returns Client IP address
 */
export function getClientIP(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  )
}
