/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

// Serves api/portal-assets.ts straight from the dev server, so the Portal's live data
// works with plain `npm run dev` (no `vercel dev` needed). Env comes from .env.local.
function portalAssetsDevApi(): Plugin {
  return {
    name: 'portal-assets-dev-api',
    apply: 'serve',
    configureServer(server) {
      Object.assign(process.env, loadEnv('development', process.cwd(), ''))
      server.middlewares.use('/api/portal-assets', async (_req, res) => {
        try {
          const mod = await server.ssrLoadModule('/api/portal-assets.ts')
          const upstream: Response = await mod.default()
          res.statusCode = upstream.status
          upstream.headers.forEach((v, k) => res.setHeader(k, v))
          res.end(await upstream.text())
        } catch (e) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ assets: [], folders: [], source: 'error', error: String(e).slice(0, 200) }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), portalAssetsDevApi()],
  resolve: {
    alias: { '@portal': fileURLToPath(new URL('./src/portal', import.meta.url)) },
  },
  test: { environment: 'node', include: ['src/portal/**/*.test.ts'] },
  server: {
    proxy: {
      // Forwards /api/* to `vercel dev` running separately (see README/local-dev notes) —
      // vercel dev's own frontend proxy doesn't reliably wrap Vite 8's dev server, so we
      // never let it serve the page directly; it's used only to run the serverless function.
      '/api': 'http://localhost:3001',
    },
  },
})
