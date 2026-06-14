import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { studioServer } from './scripts/lib/studioServer.ts';

// https://vitejs.dev/config/
export default defineConfig({
  // studioServer adds the Studio's dev-only review API (see scripts/lib/studioServer.ts).
  // It applies to `serve` only, so production builds stay backend-free.
  plugins: [react(), studioServer()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
