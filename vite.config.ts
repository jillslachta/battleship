import { defineConfig } from 'vitest/config';

// Served from https://<user>.github.io/battleship/ in production.
export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/battleship/' : '/',
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
