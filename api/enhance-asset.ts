// Server-side proxy for the Portal's AI Enhance dialog. One call per asset:
// the asset's image plus any reference images go to OpenAI's image edit API
// with the user's prompt, and `n` edited variants come back.
//
// Cost-aware, with fidelity where it matters most:
//  · gpt-image-2, which reads every input image at high fidelity, rendered at
//    low quality (high quality costs several times more per variant).
//  · Fixed instructions protect the text, logos and car (BASE_INSTRUCTIONS).
//  · Lightly compressed JPEG (95): near-lossless, a fraction of PNG's size.
//  · ONE request still returns all the variants (`n`).
//  · The client shrinks reference images before sending them (AiEnhanceDialog).
//
// Keeps OPENAI_API_KEY out of the client bundle.
export const config = { runtime: 'edge' };

declare const process: { env: Record<string, string | undefined> };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** The edit endpoint accepts up to 16 images; the dialog allows 7 references + the source. */
const MAX_REFERENCES = 7;
const MAX_VARIANTS = 4;
/** OPENAI_IMAGE_MODEL overrides it (it is shared with api/generate-image.ts). */
const DEFAULT_MODEL = 'gpt-image-2';
/** Render tier: low | medium | high. OPENAI_ENHANCE_QUALITY overrides it. */
const DEFAULT_QUALITY = 'medium';

/** Sent with every prompt so an edit never distorts the car, its text or logos. */
const BASE_INSTRUCTIONS = [
  'Do not change any of the text or logos present in the image.',
  'Verify that the text is legible and has good contrast; if not, adjust the background only until a sufficient level of contrast is obtained.',
  'Do not modify the car details in the image. Avoid changing the shape and color of the car.',
].join(' ');

/** Platform asset URLs are signed CloudFront links on these hosts. Anything
 *  else must arrive as a data URL, so this function never fetches an
 *  arbitrary address on a caller's behalf. */
const ALLOWED_SOURCE_HOST = /(^|\.)constech\.io$/;

/** The closest size the image model can produce for the asset's proportions. */
const sizeFor = (width: number, height: number) => {
  if (!width || !height) return '1024x1024';
  const ratio = width / height;
  if (ratio > 1.2) return '1536x1024';
  if (ratio < 0.83) return '1024x1536';
  return '1024x1024';
};

function dataUrlToBlob(dataUrl: string): Blob | null {
  const m = /^data:([^;,]+);base64,(.+)$/.exec(dataUrl);
  if (!m) return null;
  const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: m[1] });
}

const extFor = (type: string) => (type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg');

interface Body {
  prompt?: string;
  /** A platform asset URL (constech.io)… */
  sourceUrl?: string;
  /** …or the image itself, for assets the server cannot fetch. */
  sourceImage?: string;
  width?: number;
  height?: number;
  /** Data URLs, already downscaled by the client. */
  references?: string[];
  /** How many variants to make — fewer than 4 when the user kept some. */
  count?: number;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return json({ error: 'Missing OpenAI API key. Set OPENAI_API_KEY in the environment variables.' }, 500);

  const body = (await req.json()) as Body;
  const prompt = body.prompt?.trim();
  if (!prompt) return json({ error: 'A prompt is required' }, 400);
  const count = Math.min(MAX_VARIANTS, Math.max(1, Math.floor(body.count ?? MAX_VARIANTS)));
  const references = (body.references ?? []).slice(0, MAX_REFERENCES);

  // ── The source image ──
  let source: Blob | null = null;
  if (body.sourceImage) {
    source = dataUrlToBlob(body.sourceImage);
  } else if (body.sourceUrl) {
    let url: URL;
    try { url = new URL(body.sourceUrl); } catch { return json({ error: 'Invalid source URL' }, 400); }
    if (url.protocol !== 'https:' || !ALLOWED_SOURCE_HOST.test(url.hostname)) {
      return json({ error: 'Source URL is not a platform asset' }, 400);
    }
    const res = await fetch(url, { signal: req.signal });
    if (!res.ok) return json({ error: `Could not read the asset (${res.status})` }, 502);
    source = await res.blob();
  }
  if (!source) return json({ error: 'sourceUrl or sourceImage is required' }, 400);

  const form = new FormData();
  const model = process.env.OPENAI_IMAGE_MODEL || DEFAULT_MODEL;
  form.append('model', model);
  form.append('image[]', source, `source.${extFor(source.type)}`);
  references.forEach((ref, i) => {
    const blob = dataUrlToBlob(ref);
    if (blob) form.append('image[]', blob, `reference-${i + 1}.${extFor(blob.type)}`);
  });
  form.append('n', String(count));
  form.append('size', sizeFor(body.width ?? 0, body.height ?? 0));
  form.append('quality', process.env.OPENAI_ENHANCE_QUALITY || DEFAULT_QUALITY);
  form.append('output_format', 'jpeg');
  form.append('output_compression', '95');
  // gpt-image-2 always reads inputs at high fidelity and rejects this field;
  // gpt-image-1.5 needs it to keep faces, logos and text close to the source.
  if (model.startsWith('gpt-image-1.5')) form.append('input_fidelity', 'high');
  // The user's words, then the fewest instructions that still frame the job.
  form.append('prompt', [
    `Edit image 1: ${prompt}.`,
    references.length ? `Use image${references.length > 1 ? 's' : ''} 2${references.length > 1 ? `-${references.length + 1}` : ''} as reference (e.g. logo, background) as asked.` : '',
    'Keep the layout.',
    BASE_INSTRUCTIONS,
  ].filter(Boolean).join(' '));

  // Edge functions must start responding within ~25s and an edit of several
  // variants takes longer: respond at once with a stream, send whitespace as a
  // keep-alive, and finish with the JSON (leading whitespace is valid JSON).
  // The status is fixed up front, so failures are reported as { error }.
  //
  // `req.signal` aborts when the client hangs up (Stop Request), which cancels
  // the OpenAI call too.
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const keepAlive = setInterval(() => controller.enqueue(encoder.encode(' ')), 5000);
      const finish = (out: unknown) => {
        clearInterval(keepAlive);
        try {
          controller.enqueue(encoder.encode(JSON.stringify(out)));
          controller.close();
        } catch { /* the client already left */ }
      };
      try {
        const upstream = await fetch('https://api.openai.com/v1/images/edits', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}` },
          body: form,
          signal: AbortSignal.any([req.signal, AbortSignal.timeout(170_000)]),
        });
        const data = await upstream.json() as { data?: { b64_json?: string }[]; error?: { message?: string } };
        const images = (data.data ?? []).map((d) => d.b64_json).filter(Boolean)
          .map((b64) => `data:image/jpeg;base64,${b64}`);
        finish(upstream.ok && images.length ? { images } : { error: data.error?.message ?? 'Image generation failed' });
      } catch (e) {
        const name = e instanceof Error ? e.name : '';
        finish({
          error: name === 'TimeoutError' ? 'OpenAI took too long to respond.'
            : name === 'AbortError' ? 'Request stopped.'
            : 'Image generation failed.',
        });
      }
    },
  });
  return new Response(stream, { headers: { 'Content-Type': 'application/json' } });
}
