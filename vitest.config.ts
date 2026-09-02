import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    // tests/e2e/**/*.spec.ts are Playwright specs (run via `npm run test:e2e`), but
    // Vitest's default include glob also matches `*.spec.ts` — without this exclude,
    // `npm run test` tries to execute them as Vitest tests and fails immediately with
    // "Playwright Test did not expect test() to be called here."
    exclude: [...configDefaults.exclude, 'tests/e2e/**'],
    server: {
      deps: {
        inline: ['next-auth', '@auth/core'],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
