import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      // Dev mode: forward ke server.js yang jalan di :3000
      '/api': 'http://localhost:3000',
      '/img': 'http://localhost:3000',
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
})
