/// <reference types="vitest/config" />
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Runs the Vercel functions in api/ straight from the dev server — /api/<name> calls the default
// export of api/<name>.ts with a standard Request — so plain `npm run dev` covers the Portal's live
// data and the OpenAI calls (disclosure templates, image generation) with no `vercel dev` needed.
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
          })
          const mod = await server.ssrLoadModule(file)
          const response: Response = await mod.default(request)
          res.statusCode = response.status
          response.headers.forEach((v, k) => res.setHeader(k, v))
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (e) {
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
