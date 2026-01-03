import { supabase } from '@/lib/supabase'
import type { ApplicationStatus, UserRole } from '@/types/database'

// Valid status transitions
const validTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
  'Menunggu Verifikasi Admin': ['Diverifikasi Admin', 'Ditolak', 'Dokumen Ditolak'],
  'Dokumen Ditolak': ['Menunggu Verifikasi Admin'],
  'Diverifikasi Admin': ['Diparaf Kasubbag Anev', 'Menunggu Verifikasi Admin'], // Can return for revision
  'Diparaf Kasubbag Anev': ['Diproses Sekretaris'],
  'Diproses Sekretaris': ['Ditandatangani Inspektur', 'Diparaf Kasubbag Anev'], // Can return
  'Ditandatangani Inspektur': ['Diambil'],
  'Diambil': [],
  'Ditolak': [],
}

// Role permissions for status changes
const rolePermissions: Record<UserRole, ApplicationStatus[]> = {
  admin: ['Menunggu Verifikasi Admin'],
  kasubbag_anev: ['Diverifikasi Admin'],
  sekretaris: ['Diparaf Kasubbag Anev'],
  inspektur: ['Diproses Sekretaris'],
}

export function canTransition(
  currentStatus: ApplicationStatus,
  newStatus: ApplicationStatus
): boolean {
  const allowedTransitions = validTransitions[currentStatus]
  return allowedTransitions?.includes(newStatus) ?? false
}

export function canRoleUpdateStatus(
  role: UserRole,
  currentStatus: ApplicationStatus
): boolean {
  const allowedStatuses = rolePermissions[role]
  return allowedStatuses?.includes(currentStatus) ?? false
}

export function getNextStatus(
  role: UserRole,
  currentStatus: ApplicationStatus
): ApplicationStatus | null {
  if (!canRoleUpdateStatus(role, currentStatus)) {
    return null
  }

  switch (role) {
    case 'admin':
      return 'Diverifikasi Admin'
    case 'kasubbag_anev':
      return 'Diparaf Kasubbag Anev'
    case 'sekretaris':
      return 'Diproses Sekretaris'
    case 'inspektur':
      return 'Ditandatangani Inspektur'
    default:
      return null
  }
}

export async function updateStatus(
  applicationId: string,
  newStatus: ApplicationStatus,
  userId: string,
  notes?: string
): Promise<void> {
  // Get current application
  const { data: application, error: fetchError } = await supabase
    .from('applications')
    .select('status')
    .eq('id', applicationId)
    .single()

  if (fetchError || !application) {
    throw new Error('Permohonan tidak ditemukan')
  }

  const appData = application as unknown as { status: string }

  // Validate transition
  if (!canTransition(appData.status as ApplicationStatus, newStatus)) {
    throw new Error(`Tidak dapat mengubah status dari "${appData.status}" ke "${newStatus}"`)
  }

  // Update application status
  const { error: updateError } = await supabase
    .from('applications')
    .update({ status: newStatus } as never)
    .eq('id', applicationId)

  if (updateError) {
    throw new Error('Gagal mengupdate status')
  }

  // Add to status history
  await supabase.from('status_history').insert({
    application_id: applicationId,
    status: newStatus,
    notes,
    changed_by: userId,
  } as never)

  // Log audit
  await supabase.from('audit_logs').insert({
    user_id: userId,
    action: 'UPDATE_STATUS',
    entity_type: 'application',
    entity_id: applicationId,
    details: {
      old_status: appData.status,
      new_status: newStatus,
      notes,
    },
  } as never)
}

export async function rejectApplication(
  applicationId: string,
  userId: string,
  reason: string
): Promise<void> {
  if (!reason.trim()) {
    throw new Error('Alasan penolakan wajib diisi')
  }

  // Update application
  const { error: updateError } = await supabase
    .from('applications')
    .update({
      status: 'Ditolak',
      rejection_reason: reason,
    } as never)
    .eq('id', applicationId)

  if (updateError) {
    throw new Error('Gagal menolak permohonan')
  }

  // Add to status history
  await supabase.from('status_history').insert({
    application_id: applicationId,
    status: 'Ditolak',
    notes: reason,
    changed_by: userId,
  } as never)

  // Log audit
  await supabase.from('audit_logs').insert({
    user_id: userId,
    action: 'REJECT_APPLICATION',
    entity_type: 'application',
    entity_id: applicationId,
    details: { reason },
  } as never)
}

export async function finalizeApplication(
  applicationId: string,
  userId: string
): Promise<string> {
  // Generate document number
  const now = new Date()
  const year = now.getFullYear()
  
  // Get count for this year
  const { count } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .not('nomor_surat', 'is', null)
    .gte('created_at', `${year}-01-01`)

  const sequence = String((count || 0) + 1).padStart(3, '0')
  const nomorSurat = `${sequence}/SKBT/INSP/${year}`

  // Update application - status stays at 'Ditandatangani Inspektur', just add nomor_surat
  const { error } = await supabase
    .from('applications')
    .update({
      nomor_surat: nomorSurat,
    } as never)
    .eq('id', applicationId)

  if (error) {
    throw new Error('Gagal menyelesaikan permohonan')
  }

  return nomorSurat
}

export async function confirmPickup(
  applicationId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('applications')
    .update({ status: 'Diambil' } as never)
    .eq('id', applicationId)

  if (error) {
    throw new Error('Gagal mengkonfirmasi pengambilan')
  }

  await supabase.from('status_history').insert({
    application_id: applicationId,
    status: 'Diambil',
    notes: 'Surat telah diambil oleh pemohon',
    changed_by: userId,
  } as never)
}
