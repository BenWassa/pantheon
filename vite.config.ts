import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { studioServer } from './scripts/lib/studioServer.ts';

const base = process.env.GITHUB_PAGES === 'true' ? '/pantheon/' : '/';

// vite-plugin-pwa injects the reader's webmanifest into every HTML entry. The
// studio is a separate, installable app: after the build, point its page at its
// own manifest so "add to home screen" launches the studio, not the reader.
function studioPwaIdentity(): Plugin {
  return {
    name: 'pantheon-studio-pwa-identity',
    apply: 'build',
    closeBundle() {
      const file = fileURLToPath(new URL('./dist/mobile-studio.html', import.meta.url));
      if (!existsSync(file)) return;
      const html = readFileSync(file, 'utf8').replace(
        /(<link rel="manifest" href=")[^"]*(")/,
        `$1${base}studio.webmanifest$2`,
      );
      writeFileSync(file, html);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  base,
  // studioServer adds the Studio's dev-only review API (see scripts/lib/studioServer.ts).
  // It applies to `serve` only, so production builds stay backend-free.
  plugins: [
    react(),
    studioServer(),
    VitePWA({
      // We register the service worker ourselves via the React hook (see PWAPrompt),
      // so the reader is asked before a new edition is applied rather than mid-read.
      injectRegister: false,
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Pantheon',
        short_name: 'Pantheon',
        description: 'One theme a day, six resonant facets, explored at your pace.',
        // The GitHub Pages subpath (/pantheon/) must be the scope and entry point.
        scope: base,
        start_url: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0a0a0c',
        theme_color: '#0a0a0c',
        categories: ['education', 'books'],
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache the app shell. Content and fonts are cached at runtime below.
        globPatterns: ['**/*.{js,css,html,svg,woff2,webmanifest}'],
        navigateFallback: `${base}index.html`,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Day JSON (manifest + day files): fresh when online, available offline.
            urlPattern: ({ url }) =>
              url.pathname.includes('/content/') && url.pathname.endsWith('.json'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'pantheon-content',
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            // Facet images: keep the first copy, they do not change in place.
            urlPattern: ({ url }) => url.pathname.includes('/content/images/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'pantheon-images',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
    studioPwaIdentity(),
  ],
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        'mobile-studio': fileURLToPath(new URL('./mobile-studio.html', import.meta.url)),
      },
    },
  },
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
