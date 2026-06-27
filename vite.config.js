// File: vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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