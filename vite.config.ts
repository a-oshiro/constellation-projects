/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

type WebHandler = (request: Request) => Response | Promise<Response>

/** The function's web handler, in any of the shapes Vercel accepts: a default function, `export default { fetch }`, or a named method export (`export function POST`). */
function resolveHandler(mod: Record<string, unknown>, method: string): WebHandler | undefined {
  const def = mod.default as WebHandler | { fetch?: WebHandler } | undefined
  if (typeof def === 'function') return def
  if (def && typeof def.fetch === 'function') return def.fetch
  const named = mod[method]
  return typeof named === 'function' ? (named as WebHandler) : undefined
}

// Runs the Vercel functions in api/ straight from the dev server — /api/<name> calls the web handler
// of api/<name>.ts with a standard Request — so plain `npm run dev` covers the Portal's live data and
// the OpenAI calls (disclosure templates, image generation) with no `vercel dev` needed. Like Vercel
// with `supportsCancellation`, the Request's signal aborts if the browser disconnects first.
// Env (OPENAI_API_KEY etc.) comes from .env.local, loaded server-side only.
function vercelFunctionsDevApi(): Plugin {
  return {
    name: 'vercel-functions-dev-api',
    apply: 'serve',
    configureServer(server) {
      Object.assign(process.env, loadEnv('development', process.cwd(), ''))
      server.middlewares.use('/api', async (req, res, next) => {
        const name = (req.url ?? '').split('?')[0].replace(/^\/+|\/+$/g, '')
        const file = `/api/${name}.ts`
        if (!/^[\w-]+$/.test(name) || !existsSync(fileURLToPath(new URL(`.${file}`, import.meta.url)))) return next()
        // Aborted when the browser drops the request before the response is sent (e.g. "Stop generating").
        const controller = new AbortController()
        res.on('close', () => { if (!res.writableFinished) controller.abort() })
        try {
          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(chunk as Buffer)
          const method = req.method ?? 'GET'
          const headers = new Headers()
          for (const [k, v] of Object.entries(req.headers)) {
            if (typeof v === 'string') headers.set(k, v)
            else if (Array.isArray(v)) headers.set(k, v.join(', '))
          }
          const request = new Request(`http://${req.headers.host ?? 'localhost'}${req.originalUrl ?? req.url}`, {
            method, headers, body: method === 'GET' || method === 'HEAD' ? undefined : Buffer.concat(chunks),
            signal: controller.signal,
          })
          const handler = resolveHandler(await server.ssrLoadModule(file), method)
          if (!handler) throw new Error(`${file} has no web handler for ${method}`)
          const response = await handler(request)
          res.statusCode = response.status
          response.headers.forEach((v, k) => res.setHeader(k, v))
          // Passed on chunk by chunk, not collected, so streamed answers (the Portal library's NDJSON,
          // AI Enhance) reach the browser as they arrive; hanging up aborts the signal above.
          if (!response.body) return res.end()
          const reader = response.body.getReader()
          for (;;) {
            const { done, value } = await reader.read()
            if (done) break
            res.write(value)
          }
          res.end()
        } catch (e) {
          if (controller.signal.aborted) {
            // The handler stopped because the browser cancelled — nobody is left to send an error to.
            server.config.logger.info(`[api] ${req.method} /api/${name} cancelled by the client`, { timestamp: true })
            return
          }
          if (res.headersSent) return res.end()
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ source: 'error', error: String(e).slice(0, 200) }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), vercelFunctionsDevApi()],
  resolve: {
    alias: { '@portal': fileURLToPath(new URL('./src/portal', import.meta.url)) },
  },
  test: { environment: 'node', include: ['src/portal/**/*.test.ts', 'src/components/ui/ProjectsFilterBar.test.ts'] },
})
