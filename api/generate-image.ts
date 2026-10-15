// Server-side proxy for the OpenAI image edit API. Takes one existing background and returns it
// re-composed at another aspect ratio. Keeps OPENAI_API_KEY out of the client bundle.
export const config = { runtime: 'edge' };

declare const process: { env: Record<string, string | undefined> };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** The closest size gpt-image-1 can produce; the client crops the result to the exact dimensions. */
const sizeFor = (width: number, height: number) => {
  const ratio = width / height;
  if (ratio > 1.2) return '1536x1024';
  if (ratio < 0.83) return '1024x1536';
  return '1024x1024';
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return json({ error: 'Missing OpenAI API key. Set OPENAI_API_KEY in the environment variables.' }, 500);

  const { image, width, height, name } = (await req.json()) as { image?: string; width?: number; height?: number; name?: string };
  if (!image || !width || !height) return json({ error: 'image, width and height are required' }, 400);

  const [header, b64] = image.split(',');
  const mime = header.match(/data:(.*?);base64/)?.[1] ?? 'image/png';
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

  const form = new FormData();
  form.append('model', 'gpt-image-1');
  form.append('image', new Blob([bytes], { type: mime }), 'source.png');
  form.append('size', sizeFor(width, height));
  // Low quality is much faster than the default, and plenty for a background.
  form.append('quality', 'low');
  form.append('prompt',
    `Recompose this background image${name ? ` ("${name}")` : ''} for a ${width} x ${height} ad layout. `
    + 'Keep exactly the same scene, style, colors, lighting and mood; extend or reframe the composition to fit the new proportions. '
    + 'Do not add text, logos, people or vehicles.');

  // Edge functions must start responding within ~25s, and image edits can take longer. Respond at once
  // with a stream, send whitespace as a keep-alive, and finish with the JSON (leading whitespace is
  // valid JSON). The status is fixed up front, so failures are reported as { error } in the body.
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const keepAlive = setInterval(() => controller.enqueue(encoder.encode(' ')), 5000);
      const finish = (body: unknown) => {
        clearInterval(keepAlive);
        controller.enqueue(encoder.encode(JSON.stringify(body)));
        controller.close();
      };
      try {
        const upstream = await fetch('https://api.openai.com/v1/images/edits', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}` },
          body: form,
          signal: AbortSignal.timeout(110_000),
        });
        const data = await upstream.json() as { data?: { b64_json?: string }[]; error?: { message?: string } };
        const b64Out = data.data?.[0]?.b64_json;
        finish(upstream.ok && b64Out ? { image: `data:image/png;base64,${b64Out}` } : { error: data.error?.message ?? 'Image generation failed' });
      } catch (e) {
        finish({ error: e instanceof Error && e.name === 'TimeoutError' ? 'OpenAI took too long to respond.' : 'Image generation failed.' });
      }
    },
  });
  return new Response(stream, { headers: { 'Content-Type': 'application/json' } });
}
