// Mock @vercel/postgres for testing
export const sql = {
  query: async () => ({ rows: [], rowCount: 0 }),
}
