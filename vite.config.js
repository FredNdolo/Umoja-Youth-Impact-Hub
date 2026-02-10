// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    open: true, // opens the browser automatically
    watch: {
      usePolling: true,
    },
  },
  build: {
    outDir: 'dist',
  }
})
