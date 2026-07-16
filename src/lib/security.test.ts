import { describe, it, expect } from 'vitest'
import {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  hashToken,
  generateCSRFTokenPair,
  sanitizeInput,
  isValidEmail,
  isValidNIP,
  checkRateLimit,
  maskSensitiveData,
  getClientIP,
} from './security'

describe('security.ts', () => {
  describe('hashPassword & verifyPassword', () => {
    it('should hash and verify a password correctly', async () => {
      const password = 'testPassword123'
      const hash = await hashPassword(password)
      expect(hash).toMatch(/^\$2[aby]\$/)
      
      const isValid = await verifyPassword(password, hash)
      expect(isValid).toBe(true)
    })

    it('should reject wrong password', async () => {
      const hash = await hashPassword('correct')
      const isValid = await verifyPassword('wrong', hash)
      expect(isValid).toBe(false)
    })

    it('should support legacy plain-text passwords', async () => {
      const isValid = await verifyPassword('plaintext', 'plaintext')
      expect(isValid).toBe(true)
    })
  })

  describe('generateSecureToken', () => {
    it('should generate token of correct byte length (hex = 2x bytes)', () => {
      const token = generateSecureToken(32)
      expect(token).toHaveLength(64)
    })

    it('should generate unique tokens', () => {
      const token1 = generateSecureToken()
      const token2 = generateSecureToken()
      expect(token1).not.toBe(token2)
    })
  })

  describe('hashToken', () => {
    it('should produce consistent hash for same input', () => {
      const token = 'test-token'
      expect(hashToken(token)).toBe(hashToken(token))
    })

    it('should produce different hashes for different inputs', () => {
      expect(hashToken('a')).not.toBe(hashToken('b'))
    })

    it('should produce 64-char hex string (SHA-256)', () => {
      expect(hashToken('test')).toHaveLength(64)
    })
  })

  describe('generateCSRFTokenPair', () => {
    it('should generate token and matching hash', () => {
      const { token, hash } = generateCSRFTokenPair()
      expect(token).toHaveLength(64)
      expect(hash).toHaveLength(64)
      expect(hashToken(token)).toBe(hash)
    })
  })

  describe('sanitizeInput', () => {
    it('should escape HTML special chars', () => {
      expect(sanitizeInput('<script>alert("xss")</script>'))
        .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;')
    })
  })

  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('user@example.com')).toBe(true)
      expect(isValidEmail('user.name+tag@domain.co.id')).toBe(true)
    })

    it('should reject invalid emails', () => {
      expect(isValidEmail('not-an-email')).toBe(false)
      expect(isValidEmail('@domain.com')).toBe(false)
      expect(isValidEmail('')).toBe(false)
    })
  })

  describe('isValidNIP', () => {
    it('should validate 18-digit NIP', () => {
      expect(isValidNIP('200212312024091001')).toBe(true)
    })

    it('should reject invalid NIP', () => {
      expect(isValidNIP('12345')).toBe(false)
      expect(isValidNIP('abcdefghijklmnopqr')).toBe(false)
    })
  })

  describe('checkRateLimit', () => {
    it('should allow requests within limit', () => {
      const result = checkRateLimit('test-1', 5, 60000)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4)
    })

    it('should block requests exceeding limit', () => {
      const key = 'test-2'
      for (let i = 0; i < 5; i++) {
        checkRateLimit(key, 5, 60000)
      }
      const result = checkRateLimit(key, 5, 60000)
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })
  })

  describe('maskSensitiveData', () => {
    it('should mask middle of string', () => {
      const masked = maskSensitiveData('1234567890', 3)
      expect(masked).toMatch(/^123\*+890$/)
    })

    it('should fully mask short strings', () => {
      const masked = maskSensitiveData('abc', 2)
      expect(masked).toBe('***')
    })
  })

  describe('getClientIP', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const headers = new Headers({ 'x-forwarded-for': '192.168.1.1, 10.0.0.1' })
      expect(getClientIP(headers)).toBe('192.168.1.1')
    })

    it('should return unknown if no IP headers', () => {
      const headers = new Headers()
      expect(getClientIP(headers)).toBe('unknown')
    })
  })
})
