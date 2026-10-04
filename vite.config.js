import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Recharts makes up most of the bundle; a single chunk is fine for this app.
  build: { chunkSizeWarningLimit: 1000 },
})
