import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'postgres': path.resolve(__dirname, './src/test/mocks/vercel-postgres.ts'),
      'server-only': path.resolve(__dirname, './src/test/mocks/server-only.ts'),
    },
  },
})
