// Mock postgres for testing
const mockQuery = async () => [{ count: '0' }] as unknown as Record<string, unknown>[]

const mockFn = Object.assign(
  async () => [{ count: '0' }],
  {
    unsafe: async () => (await mockQuery()) as unknown as Record<string, unknown>[],
    end: async () => {},
    query: async () => ({ rows: [], rowCount: 0 }),
  }
)

export default function postgres() {
  return mockFn
}
