import { sql } from '@vercel/postgres'

/**
 * CockroachDB / PostgreSQL client
 * Gantikan Supabase client dengan native PostgreSQL
 */
export { sql }

// Helper: generate UUID (CockroachDB compatible)
export async function generateUUID(): Promise<string> {
  const result = await sql`SELECT gen_random_uuid() as uuid`
  return result.rows[0].uuid as string
}

// Helper: execute raw SQL query
export async function query(text: string, params?: unknown[]) {
  return sql.query(text, params)
}
