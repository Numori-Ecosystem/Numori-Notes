import pg from 'pg'

const { Pool } = pg

let pool

/**
 * Get or create the PostgreSQL connection pool.
 * Uses DATABASE_URL from runtime config / environment.
 */
export function useDb() {
  if (!pool) {
    const url = process.env.DATABASE_URL || useRuntimeConfig().databaseUrl
    pool = new Pool({ connectionString: url, max: 20 })
  }
  return pool
}

/**
 * Run a single query with params.
 */
export async function query(text, params) {
  const db = useDb()
  return db.query(text, params)
}
