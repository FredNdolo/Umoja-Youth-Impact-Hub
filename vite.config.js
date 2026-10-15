// File: vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    // Installable, offline-capable Tree Monitor. The service worker is only
    // registered when someone opens the tree app (see src/trees/pwa.js).
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      manifest: {
        name: 'UYIH Tree Monitor',
        short_name: 'Tree Monitor',
        description: 'Register and monitor Green Futures trees in the field, even offline.',
        start_url: '/me/trees',
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#1A3C2A',
        icons: [
          { src: '/tree-app-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/tree-app-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/tree-app-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/docs\//],
        globPatterns: ['**/*.{js,css,html,svg,woff2}', 'tree-app-*.png', 'favicon.png'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [
          {
            // Map tiles, so maps keep working with a weak signal
            urlPattern: /^https:\/\/(server\.arcgisonline\.com|[abc]\.tile\.openstreetmap\.org|tile\.openstreetmap\.org)\//,
            handler: 'CacheFirst',
            options: { cacheName: 'map-tiles', expiration: { maxEntries: 800, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
        ],
      },
    }),
  ],
  assetsInclude: ['**/*.JPG', '**/*.JPEG', '**/*.PNG', '**/*.WEBP'],
  server: {
    open: true,
    watch: {
      usePolling: true,
    },
  },
  build: {
    outDir: 'dist',
  },
})
