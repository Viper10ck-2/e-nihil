/**
 * Database Client - CockroachDB
 * SERVER-ONLY. Jangan import dari 'use client' component.
 * Untuk client, gunakan API routes / server actions.
 */
export { db as supabase, db as createServerClient } from '@/lib/query-builder'
