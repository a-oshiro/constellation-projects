import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Forwards /api/* to `vercel dev` running separately (see README/local-dev notes) —
      // vercel dev's own frontend proxy doesn't reliably wrap Vite 8's dev server, so we
      // never let it serve the page directly; it's used only to run the serverless function.
      '/api': 'http://localhost:3001',
    },
  },
})
