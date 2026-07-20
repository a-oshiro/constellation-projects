// Server-side proxy for the OpenAI Responses API. Keeps OPENAI_API_KEY out of the
// client bundle — never rename this to VITE_OPENAI_API_KEY, which Vite would inline
// into shipped JS and expose to anyone inspecting the browser.
export const config = { runtime: 'edge' };

// Edge Runtime exposes env vars via process.env but isn't Node.js — @types/node isn't
// applicable here, so declare just the shape this file actually uses.
declare const process: { env: Record<string, string | undefined> };

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'Missing OpenAI API key. Set OPENAI_API_KEY in the Vercel project environment variables.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const body = await req.text();

  const upstream = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body,
  });

  const data = await upstream.text();
  return new Response(data, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
