import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { hashPassword } from '@/lib/security'
import type { User } from '@/types/database'

/**
 * One-time migration endpoint to hash existing plain text passwords
 * Should be called once and then disabled/removed
 * 
 * POST /api/admin/migrate-passwords
 * Header: X-Migration-Key: <MIGRATION_SECRET from env>
 */
export async function POST(request: NextRequest) {
  // Verify migration key
  const migrationKey = request.headers.get('X-Migration-Key')
  const expectedKey = process.env.MIGRATION_SECRET

  if (!expectedKey || migrationKey !== expectedKey) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // Get all users
    const { data: users, error } = await supabase
      .from('users')
      .select('id, nip, password_hash')

    if (error) throw error

    let migratedCount = 0
    let skippedCount = 0

    for (const user of (users as unknown as User[])) {
      // Check if password is already hashed (bcrypt hashes start with $2)
      if (user.password_hash.startsWith('$2')) {
        skippedCount++
        continue
      }

      // Hash the plain text password
      const hashedPassword = await hashPassword(user.password_hash)

      // Update the user
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: hashedPassword } as never)
        .eq('id', user.id)

      if (updateError) {
        console.error(`Failed to migrate user ${user.nip}:`, updateError)
        continue
      }

      migratedCount++
    }

    return NextResponse.json({
      success: true,
      message: `Migration complete. Migrated: ${migratedCount}, Skipped (already hashed): ${skippedCount}`,
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { success: false, error: 'Migration failed' },
      { status: 500 }
    )
  }
}
