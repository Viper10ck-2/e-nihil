/**
 * Database Client - CockroachDB
 * SERVER-ONLY. Jangan import dari 'use client' component.
 * Untuk client, gunakan API routes / server actions.
 */
import { db } from '@/lib/query-builder'

export const supabase = db
export const createServerClient = () => db
