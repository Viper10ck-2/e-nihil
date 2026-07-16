import 'server-only'
import postgres from 'postgres'

let _sql: ReturnType<typeof postgres> | null = null

function getSql() {
  if (!_sql) {
    const url = process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING || ''
    _sql = postgres(url, { ssl: url.includes('localhost') ? false : 'require', max: 10 })
  }
  return _sql
}

async function query(text: string, params?: unknown[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return getSql().unsafe(text, (params || []) as any[])
}

type QueryResult<T> = { data: T | null; error: Error | null; count?: number }

/**
 * Drop-in replacement untuk Supabase client query builder.
 * Menggunakan PostgreSQL native (CockroachDB-compatible).
 */
class QueryBuilder<T = Record<string, unknown>> {
  private tableName: string
  private selectCols = '*'
  private conditions: string[] = []
  private params: unknown[] = []
  private orderBy = ''
  private limitCount = 0
  private isSingle = false
  private isCount = false

  constructor(table: string) {
    this.tableName = table
  }

  select(cols: string, opts?: { count?: string; head?: boolean }): this {
    this.selectCols = cols
    if (opts?.count === 'exact') this.isCount = true
    if (opts?.head) this.selectCols = '1'  // head = just need count
    return this
  }

  eq(col: string, val: unknown): this {
    if (val === null) { this.conditions.push(`${col} IS NULL`); return this }
    this.params.push(val)
    this.conditions.push(`${col} = $${this.params.length}`)
    return this
  }

  neq(col: string, val: unknown): this {
    if (val === '') { this.conditions.push(`${col} != ''`); return this }
    this.params.push(val)
    this.conditions.push(`${col} != $${this.params.length}`)
    return this
  }

  in(col: string, vals: unknown[]): this {
    const ph = vals.map(v => { this.params.push(v); return `$${this.params.length}` }).join(', ')
    this.conditions.push(`${col} IN (${ph})`)
    return this
  }

  like(col: string, val: string): this {
    this.params.push(val)
    this.conditions.push(`${col} LIKE $${this.params.length}`)
    return this
  }

  ilike(col: string, val: string): this {
    this.params.push(val)
    this.conditions.push(`${col} ILIKE $${this.params.length}`)
    return this
  }

  gte(col: string, val: unknown): this {
    this.params.push(val)
    this.conditions.push(`${col} >= $${this.params.length}`)
    return this
  }

  lte(col: string, val: unknown): this {
    this.params.push(val)
    this.conditions.push(`${col} <= $${this.params.length}`)
    return this
  }

  not(col: string, op: string, val: unknown): this {
    if (val === null) { this.conditions.push(`${col} IS NOT NULL`); return this }
    this.params.push(val)
    this.conditions.push(`NOT (${col} ${op} $${this.params.length})`)
    return this
  }

  is(col: string, val: unknown): this {
    if (val === null) { this.conditions.push(`${col} IS NULL`) }
    else { this.eq(col, val) }
    return this
  }

  order(col: string, opts?: { ascending?: boolean }): this {
    const dir = opts?.ascending === false ? 'DESC' : 'ASC'
    this.orderBy = `ORDER BY ${col} ${dir}`
    return this
  }

  limit(n: number): this {
    this.limitCount = n
    return this
  }

  single(): this {
    this.isSingle = true
    this.limitCount = 1
    return this
  }

  private whereClause(): string {
    return this.conditions.length > 0 ? `WHERE ${this.conditions.join(' AND ')}` : ''
  }

  private insertData: Record<string, unknown> | null = null
  private updateData: Record<string, unknown> | null = null
  private mode: 'select' | 'insert' | 'update' = 'select'

  // INSERT - sets data, returns this for chaining
  insert(values: Record<string, unknown>): this {
    this.mode = 'insert'
    this.insertData = values
    return this
  }

  // UPDATE - sets data, returns this for chaining
  update(values: Record<string, unknown>): this {
    this.mode = 'update'
    this.updateData = values
    return this
  }

  // Execute query when awaited
  async then<TResult = T>(
    resolve?: (value: QueryResult<TResult>) => void,
    reject?: (reason: Error) => void
  ): Promise<QueryResult<TResult>> {
    try {
      let result: QueryResult<TResult>

      if (this.mode === 'insert' && this.insertData) {
        result = await this.executeInsert<TResult>()
      } else if (this.mode === 'update' && this.updateData) {
        result = await this.executeUpdate()
      } else {
        result = await this.executeSelect<TResult>()
      }

      resolve?.(result)
      return result
    } catch (err) {
      const error = err as Error
      reject?.(error)
      return { data: null, error }
    }
  }

  private async executeInsert<TResult>(): Promise<QueryResult<TResult>> {
    const keys = Object.keys(this.insertData!)
    const vals = Object.values(this.insertData!)
    const placeholders = keys.map((_, i) => `$${i + 1}`)
    const q = `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`
    const r = await query(q, vals)
    return { data: (this.isSingle ? r[0] : r) as TResult, error: null }
  }

  private async executeUpdate(): Promise<QueryResult<null>> {
    const keys = Object.keys(this.updateData!)
    const vals = Object.values(this.updateData!)
    const setParts = keys.map((k, i) => `${k} = $${i + 1}`)
    
    const offset = vals.length
    let whereClause = this.whereClause()
    if (this.params.length > 0) {
      const sorted = [...this.params.keys()].sort((a, b) => b - a)
      for (const i of sorted) {
        whereClause = whereClause.replace(`$${i + 1}`, `$${i + 1 + offset}`)
      }
    }

    const q = `UPDATE ${this.tableName} SET ${setParts.join(', ')} ${whereClause}`
    await query(q, [...vals, ...this.params])
    return { data: null, error: null }
  }

  private async executeSelect<TResult>(): Promise<QueryResult<TResult>> {
    if (this.isCount) {
      const q = `SELECT COUNT(*) as count FROM ${this.tableName} ${this.whereClause()}`
      const r = await query(q, this.params)
      return { data: { count: parseInt(String(r[0]?.count || 0)) } as TResult, error: null, count: parseInt(String(r[0]?.count || 0)) }
    }

    const lim = this.limitCount > 0 ? `LIMIT ${this.limitCount}` : ''
    const q = `SELECT ${this.selectCols} FROM ${this.tableName} ${this.whereClause()} ${this.orderBy} ${lim}`
    const r = await query(q, this.params)

    let data: TResult
    if (this.isSingle) {
      data = (r[0] || null) as TResult
    } else {
      data = r as TResult
    }

    return { data, error: null }
  }
}

// Supabase-compatible client
export const db = {
  from<T = Record<string, unknown>>(table: string): QueryBuilder<T> {
    return new QueryBuilder<T>(table)
  },

  // Storage (gunakan Vercel Blob untuk production)
  storage: {
    from(_bucket: string) {
      return {
        upload: async (_path: string, _file: File | Blob | Buffer | string, _opts?: Record<string, unknown>) => {
          console.warn('Storage: Use Vercel Blob for file uploads')
          return { error: new Error('Storage not configured. Use Vercel Blob.') }
        },
        remove: async (_paths: string[]) => ({ error: null }),
        download: async (_path: string) => ({ data: null as Blob | null, error: new Error('Not available') }),
        getPublicUrl: (_path: string) => ({ data: { publicUrl: '' } }),
        list: async (_prefix?: string) => ({ data: [] as { name: string }[], error: null }),
      }
    }
  },

  // Raw SQL
  async query(text: string, params?: unknown[]) {
    return query(text, params)
  }
}

