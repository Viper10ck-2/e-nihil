import { describe, it, expect } from 'vitest'
import {
  canTransition,
  canRoleUpdateStatus,
  getNextStatus,
} from './statusService'
import type { ApplicationStatus, UserRole } from '@/types/database'

describe('statusService', () => {
  describe('canTransition', () => {
    it('should allow valid transitions', () => {
      expect(canTransition('Menunggu Verifikasi Admin', 'Diverifikasi Admin')).toBe(true)
      expect(canTransition('Diverifikasi Admin', 'Diparaf Kasubbag Anev')).toBe(true)
      expect(canTransition('Diparaf Kasubbag Anev', 'Diproses Sekretaris')).toBe(true)
      expect(canTransition('Diproses Sekretaris', 'Ditandatangani Inspektur')).toBe(true)
      expect(canTransition('Ditandatangani Inspektur', 'Selesai')).toBe(true)
    })

    it('should reject invalid transitions', () => {
      expect(canTransition('Menunggu Verifikasi Admin', 'Ditandatangani Inspektur')).toBe(false)
      expect(canTransition('Diparaf Kasubbag Anev', 'Diverifikasi Admin')).toBe(false)
      expect(canTransition('Selesai', 'Diverifikasi Admin')).toBe(false)
      expect(canTransition('Selesai', 'Menunggu Verifikasi Admin')).toBe(false)
    })

    it('should allow Dokumen Ditolak to return to Menunggu Verifikasi Admin', () => {
      expect(canTransition('Dokumen Ditolak', 'Menunggu Verifikasi Admin')).toBe(true)
    })
  })

  describe('canRoleUpdateStatus', () => {
    const testCases: [UserRole, ApplicationStatus, boolean][] = [
      ['admin', 'Menunggu Verifikasi Admin', true],
      ['admin', 'Diverifikasi Admin', false],
      ['kasubbag_anev', 'Diverifikasi Admin', true],
      ['kasubbag_anev', 'Menunggu Verifikasi Admin', false],
      ['sekretaris', 'Diparaf Kasubbag Anev', true],
      ['sekretaris', 'Diverifikasi Admin', false],
      ['inspektur', 'Diproses Sekretaris', true],
      ['inspektur', 'Diparaf Kasubbag Anev', false],
    ]

    testCases.forEach(([role, status, expected]) => {
      it(`${role} ${expected ? 'can' : 'cannot'} update status ${status}`, () => {
        expect(canRoleUpdateStatus(role, status)).toBe(expected)
      })
    })
  })

  describe('getNextStatus', () => {
    it('should return next status for each role', () => {
      expect(getNextStatus('admin', 'Menunggu Verifikasi Admin')).toBe('Diverifikasi Admin')
      expect(getNextStatus('kasubbag_anev', 'Diverifikasi Admin')).toBe('Diparaf Kasubbag Anev')
      expect(getNextStatus('sekretaris', 'Diparaf Kasubbag Anev')).toBe('Diproses Sekretaris')
      expect(getNextStatus('inspektur', 'Diproses Sekretaris')).toBe('Ditandatangani Inspektur')
    })

    it('should return null for unauthorized role', () => {
      expect(getNextStatus('admin', 'Diverifikasi Admin')).toBeNull()
      expect(getNextStatus('inspektur', 'Menunggu Verifikasi Admin')).toBeNull()
    })
  })
})
