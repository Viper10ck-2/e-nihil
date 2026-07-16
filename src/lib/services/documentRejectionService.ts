import { supabase } from '@/lib/supabase'
import type { DocumentRejection, DocumentWithRejection, Document } from '@/types/database'

export interface RejectDocumentParams {
  documentId: string
  applicationId: string
  rejectionReason: string
  rejectedBy?: string
}

export interface ResolveRejectionParams {
  documentId: string
  applicationId: string
}

/**
 * Reject a document with a reason
 */
export async function rejectDocument(params: RejectDocumentParams): Promise<DocumentRejection> {
  const { documentId, applicationId, rejectionReason, rejectedBy } = params

  // First, resolve any existing unresolved rejection for this document
  await supabase
    .from('document_rejections')
    .update({ is_resolved: true, resolved_at: new Date().toISOString() } as never)
    .eq('document_id', documentId)
    .eq('is_resolved', false)

  // Create new rejection record
  const { data, error } = await supabase
    .from('document_rejections')
    .insert({
      document_id: documentId,
      application_id: applicationId,
      rejection_reason: rejectionReason,
      rejected_by: rejectedBy || null,
      is_resolved: false,
    } as never)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to reject document: ${error.message}`)
  }

  return data as DocumentRejection
}

/**
 * Get all document rejections for an application
 */
export async function getDocumentRejections(applicationId: string): Promise<DocumentRejection[]> {
  const { data, error } = await supabase
    .from('document_rejections')
    .select('*')
    .eq('application_id', applicationId)
    .order('rejected_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to get document rejections: ${error.message}`)
  }

  return (data || []) as DocumentRejection[]
}


/**
 * Get unresolved rejections for an application
 */
export async function getUnresolvedRejections(applicationId: string): Promise<DocumentRejection[]> {
  const { data, error } = await supabase
    .from('document_rejections')
    .select('*')
    .eq('application_id', applicationId)
    .eq('is_resolved', false)

  if (error) {
    throw new Error(`Failed to get unresolved rejections: ${error.message}`)
  }

  return (data || []) as DocumentRejection[]
}

/**
 * Resolve a document rejection (mark as fixed)
 */
export async function resolveRejection(params: ResolveRejectionParams): Promise<void> {
  const { documentId } = params

  const { error } = await supabase
    .from('document_rejections')
    .update({
      is_resolved: true,
      resolved_at: new Date().toISOString(),
    } as never)
    .eq('document_id', documentId)
    .eq('is_resolved', false)

  if (error) {
    throw new Error(`Failed to resolve rejection: ${error.message}`)
  }
}

/**
 * Check if all rejections for an application are resolved
 */
export async function checkAllRejectionsResolved(applicationId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('document_rejections')
    .select('id')
    .eq('application_id', applicationId)
    .eq('is_resolved', false)

  if (error) {
    throw new Error(`Failed to check rejections: ${error.message}`)
  }

  return (data || []).length === 0
}

/**
 * Get documents with their rejection status for an application
 */
export async function getDocumentsWithRejections(applicationId: string): Promise<DocumentWithRejection[]> {
  // Get all documents
  const { data: documents, error: docError } = await supabase
    .from('documents')
    .select('*')
    .eq('application_id', applicationId)

  if (docError) {
    throw new Error(`Failed to get documents: ${docError.message}`)
  }

  // Get all unresolved rejections
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rejections, error: rejError } = await (supabase as any)
    .from('document_rejections')
    .select('*')
    .eq('application_id', applicationId)
    .eq('is_resolved', false)

  if (rejError) {
    throw new Error(`Failed to get rejections: ${rejError.message}`)
  }

  // Map rejections to documents
  const rejectionMap = new Map<string, DocumentRejection>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const rejection of (rejections || []) as any[]) {
    rejectionMap.set(rejection.document_id, rejection as DocumentRejection)
  }

  // Combine documents with rejections
  return (documents || []).map((doc: Document) => ({
    ...doc,
    rejection: rejectionMap.get(doc.id),
  })) as DocumentWithRejection[]
}

/**
 * Get rejection history for a document
 */
export async function getDocumentRejectionHistory(documentId: string): Promise<DocumentRejection[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('document_rejections')
    .select('*')
    .eq('document_id', documentId)
    .order('rejected_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to get rejection history: ${error.message}`)
  }

  return (data || []) as DocumentRejection[]
}
