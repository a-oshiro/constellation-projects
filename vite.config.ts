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
      // The library arrives as a stream (NDJSON, see the API file), so it is
      // passed on chunk by chunk rather than collected; hanging up stops the
      // remaining upstream reads.
      server.middlewares.use('/api/portal-assets', async (_req, res) => {
        const abort = new AbortController()
        res.on('close', () => { if (!res.writableFinished) abort.abort() })
        try {
          const mod = await server.ssrLoadModule('/api/portal-assets.ts')
          const upstream: Response = await mod.default(
            new Request('http://localhost/api/portal-assets', { signal: abort.signal }),
          )
          res.statusCode = upstream.status
          upstream.headers.forEach((v, k) => res.setHeader(k, v))
          if (!upstream.body) return res.end()
          const reader = upstream.body.getReader()
          for (;;) {
            const { done, value } = await reader.read()
            if (done) break
            res.write(value)
          }
          res.end()
        } catch (e) {
          if (res.headersSent) return res.end()
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/x-ndjson')
          res.end(JSON.stringify({ type: 'error', reason: String(e).slice(0, 200) }) + '\n')
        }
      })

      // The AI Enhance dialog's endpoint takes a POST body and streams its answer,
      // so it is adapted to a web Request/Response. Hanging up (Stop Request)
      // aborts the request's signal, which cancels the OpenAI call.
      server.middlewares.use('/api/enhance-asset', async (req, res) => {
        const abort = new AbortController()
        res.on('close', () => { if (!res.writableFinished) abort.abort() })
        try {
          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(chunk as Buffer)
          const request = new Request('http://localhost/api/enhance-asset', {
            method: req.method,
            headers: { 'Content-Type': 'application/json' },
            body: req.method === 'POST' ? Buffer.concat(chunks) : undefined,
            signal: abort.signal,
          })
          const mod = await server.ssrLoadModule('/api/enhance-asset.ts')
          const upstream: Response = await mod.default(request)
          res.statusCode = upstream.status
          upstream.headers.forEach((v, k) => res.setHeader(k, v))
          if (!upstream.body) return res.end()
          const reader = upstream.body.getReader()
          for (;;) {
            const { done, value } = await reader.read()
            if (done) break
            res.write(value)
          }
          res.end()
        } catch (e) {
          if (res.headersSent) return res.end()
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: String(e).slice(0, 200) }))
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
  test: { environment: 'node', include: ['src/portal/**/*.test.ts', 'src/components/ui/ProjectsFilterBar.test.ts'] },
  server: {
    proxy: {
      // Forwards /api/* to `vercel dev` running separately (see README/local-dev notes) —
      // vercel dev's own frontend proxy doesn't reliably wrap Vite 8's dev server, so we
      // never let it serve the page directly; it's used only to run the serverless function.
      '/api': 'http://localhost:3001',
    },
  },
})
