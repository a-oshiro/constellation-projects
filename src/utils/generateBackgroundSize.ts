// Asks the /api/generate-image proxy (OpenAI image edit) to recompose a background at another size,
// then crops the result to the exact dimensions.

const toDataUrl = async (url: string): Promise<string> => {
  const blob = await (await fetch(url)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
};

const cropTo = (src: string, width: number, height: number): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      // Cover-fit, centered.
      const scale = Math.max(width / img.width, height / img.height);
      const w = img.width * scale, h = img.height * scale;
      canvas.getContext('2d')!.drawImage(img, (width - w) / 2, (height - h) / 2, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => reject(new Error('Could not read the generated image'));
    img.src = src;
  });

/** Returns a data URL of `sourceUrl` recomposed at width x height. */
export async function generateBackgroundSize(sourceUrl: string, width: number, height: number, name: string): Promise<string> {
  // Give up after 90s rather than leaving the spinner running forever.
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 90_000);
  const response = await fetch('/api/generate-image', {
    signal: controller.signal,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: await toDataUrl(sourceUrl), width, height, name }),
  }).catch((e) => {
    window.clearTimeout(timer);
    throw e instanceof DOMException && e.name === 'AbortError' ? new Error('Generation timed out. Please try again.') : e;
  });
  const text = await response.text().catch(() => '');
  window.clearTimeout(timer);
  let data: { image?: string; error?: string } = {};
  try { data = JSON.parse(text); } catch { /* not JSON */ }
  if (!response.ok || !data.image) throw new Error(data.error ?? `Image generation failed (${response.status})`);
  return cropTo(data.image, width, height);
}
