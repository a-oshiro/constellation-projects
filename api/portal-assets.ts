// Server-side proxy for the Portal's asset library, on the same platform API
// the Studio already talks to (rest.*-app.constech.io/v1, X-API-Key +
// X-Client-Id). Reads GET /v1/projects/{id}/assets for the most recent
// projects and flattens them into one library.
//
// Two things this is NOT, deliberately:
//
//  · Not a generated file. `public_url` is a signed CloudFront link with an
//    expiry, so a snapshot committed to the repo would rot into broken images.
//    Proxying keeps every URL as fresh as the platform makes it.
//  · Not the whole platform. /projects caps a page at 200 and exposes no
//    cursor to this key, so PROJECT_LIMIT is that cap and the library is the
//    most recent 200 projects — see the measurements there.
//
// Folders are derived rather than fetched: /projects/{id}/folders answers 403
// for this key, but every asset carries `folder_name`, which is the same tree
// seen from the leaves.
//
// The answer is a stream, one JSON object per line (NDJSON), so the Portal can
// show assets while the rest are still being read — 200 project reads take
// 3–6s upstream, and most of that is the platform, not us:
//
//   {"type":"start","projects":200}
//   {"type":"assets","index":7,"assets":[…]}
//   …                                  one line per project, in the order the
//                                      reads finish (empty if it had none or
//                                      could not be read). `index` is the
//                                      project's place in the list, so the
//                                      Portal can put the library back in one
//                                      fixed order whatever order it arrived in
//   {"type":"done","projectsRead":200}
//
// Anything that stops it before any assets is a single
// {"type":"error","reason":"…"} line. Unconfigured (no OFFERS_* env) the
// reason is "unconfigured", and the Portal offers the generated local library.
// Folders are no longer sent: the Portal counts them from the assets as they
// arrive, the same derivation this file used to do at the end.
//
// Cached twice, because every read costs the platform 201 requests and 5–7s:
//  · At the CDN (CACHE_CONTROL): Vercel answers from its cache for
//    FRESH_SECONDS, and for STALE_SECONDS after that it still answers at once
//    while it refreshes in the background. The library is the same for every
//    user (one API key), and the signed image URLs last a year, so sharing it
//    is safe. Errors are never cached.
//  · In this module's memory (memo): the dev server has no CDN in front of it,
//    and a warm edge instance can skip the platform too. A complete answer
//    younger than FRESH_SECONDS is replayed in one go.
// So a change on the platform can take up to FRESH_SECONDS to show up.
export const config = { runtime: 'edge' };

// Edge Runtime exposes env vars via process.env but isn't Node.js — declare just the
// shape this file uses (same approach as api/fetch-urls.ts).
declare const process: { env: Record<string, string | undefined> };

const FRESH_SECONDS = 300;
const STALE_SECONDS = 3600;
/** `max-age=0`: browsers do not keep it (the Portal keeps its own copy, in
 *  IndexedDB); `s-maxage` and `stale-while-revalidate` are for the CDN. */
const CACHE_CONTROL = `public, max-age=0, s-maxage=${FRESH_SECONDS}, stale-while-revalidate=${STALE_SECONDS}`;
const NDJSON_HEADERS = { 'Content-Type': 'application/x-ndjson', 'Cache-Control': CACHE_CONTROL };

/** The whole answer when there is nothing to stream. Never cached, so a
 *  platform outage is not served back for minutes after it ends. */
const errorLine = (reason: string) =>
  new Response(JSON.stringify({ type: 'error', reason }) + '\n', {
    headers: { 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-store' },
  });

/** The last complete answer, line for line, and when it finished. */
let memo: { body: string; at: number } | null = null;

const API_URL = process.env.OFFERS_API_URL;
const API_KEY = process.env.OFFERS_API_KEY;
const CLIENT_ID = process.env.OFFERS_CLIENT_ID;

/** How many of the most recent projects to read assets from.
 *
 *  200 is the platform's page cap for /projects, and measured against prod it
 *  costs nothing to take all of it: the per-project asset reads go out in
 *  parallel, so the wall clock is flat across the range.
 *
 *    projects   time    assets   folders
 *        25     1.4s       100         7
 *        50     1.2s       178        21
 *       120     2.8s       856        67
 *       200     2.4s     2,402       126
 *
 *  At 25 the rail showed seven folders, which is a sample rather than a
 *  library — the tree it drew looked nothing like the one the platform shows.
 *  The cost of the larger set is not here but on the screen: the Portal
 *  recomputes 23 facet passes over the library on every keystroke and nothing
 *  debounces it (HANDOFF-search §5.2). */
const PROJECT_LIMIT = 200;
/** Per-project page size — the platform caps a page at 100. */
const ASSET_PAGE = 100;

interface ApiField { name: string; value: string }

interface ApiAsset {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  dimensions: string | null;
  width: number | null;
  height: number | null;
  file_type: string | null;
  aspect_ratio: string | null;
  public_url: string | null;
  tags: string[] | null;
  fields: ApiField[] | null;
  account_names: string[] | null;
  brand_names: string[] | null;
  entity_status: string | null;
  folder_name: string | null;
}

/** The shape the Portal's filters read. Mirrors lib/portal-assets.ts so the
 *  live library and the generated one are interchangeable. */
export interface LivePortalAsset {
  id: string;
  name: string;
  url: string;
  folder: string;
  fileType: string;
  entityType: string;
  width: number;
  height: number;
  dimensions: string;
  shape: string;
  platform: string;
  updatedDaysAgo: number;
  tags: string[];
  entityStatus: string;
  brands: string[];
  accounts: string[];
  assetTypes: string[];
  collection: string;
  make: string;
  model: string;
  trim: string;
  season: string;
  theme: string;
  vehicleCondition: string;
  year: string;
}

function shapeOf(w: number, h: number): string {
  if (!w || !h) return "Unknown";
  const ratio = w / h;
  if (ratio > 3) return "Banner";
  if (ratio > 1.15) return "Landscape";
  if (ratio < 0.85) return "Portrait";
  return "Square";
}

function daysAgo(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

/** `fields` is a name/value list, and the names are lower-case and spaced
 *  ("vehicle condition"), so look them up rather than destructuring. */
function field(fields: ApiField[] | null, name: string): string {
  return fields?.find((f) => f.name.toLowerCase() === name)?.value ?? "";
}

function toPortalAsset(a: ApiAsset): LivePortalAsset {
  const width = a.width ?? 0;
  const height = a.height ?? 0;
  const assetType = field(a.fields, "asset type");
  return {
    id: a.id,
    name: a.name,
    url: a.public_url ?? "",
    folder: a.folder_name ?? "Uncategorised",
    fileType: a.file_type ?? "Unknown",
    // The platform calls a rendered asset a composite; the Portal's Entity
    // Type vocabulary is the one the filter offers.
    entityType: "Design Composites",
    width,
    height,
    dimensions: a.dimensions ?? (width && height ? `${width} × ${height}` : "Unknown"),
    shape: shapeOf(width, height),
    platform: assetType || "Unknown",
    updatedDaysAgo: daysAgo(a.updated_at || a.created_at),
    tags: a.tags ?? [],
    entityStatus: a.entity_status ?? "Unknown",
    brands: a.brand_names?.length ? a.brand_names : [field(a.fields, "brand")].filter(Boolean),
    accounts: a.account_names ?? [],
    assetTypes: [assetType].filter(Boolean),
    collection: a.folder_name ?? "Uncategorised",
    make: field(a.fields, "make"),
    model: field(a.fields, "model"),
    trim: field(a.fields, "trim"),
    season: field(a.fields, "season"),
    theme: field(a.fields, "theme"),
    vehicleCondition: field(a.fields, "vehicle condition"),
    year: field(a.fields, "year"),
  };
}

/** `req` is optional so a caller with no request (a script) can still read
 *  it; when present, its signal stops the remaining project reads if the
 *  Portal hangs up — leaving the page mid-load, say. */
export default async function handler(req?: Request): Promise<Response> {
  if (!API_URL || !API_KEY || !CLIENT_ID) return errorLine('unconfigured');

  if (memo && Date.now() - memo.at < FRESH_SECONDS * 1000) {
    return new Response(memo.body, { headers: { ...NDJSON_HEADERS, 'X-Library-Cache': 'memory' } });
  }

  const headers = { "X-API-Key": API_KEY, "X-Client-Id": CLIENT_ID };
  const abort = new AbortController();
  req?.signal.addEventListener('abort', () => abort.abort());

  // The project list is read before the stream starts, so a platform that is
  // down is reported plainly rather than as a stream that ends early.
  let projects: { id: string }[];
  try {
    const projectsRes = await fetch(`${API_URL}/projects?limit=${PROJECT_LIMIT}`, {
      headers, cache: "no-store", signal: abort.signal,
    });
    if (!projectsRes.ok) return errorLine(`Upstream ${projectsRes.status}`);
    projects = ((await projectsRes.json()) as { data?: { id: string }[] }).data ?? [];
  } catch (e) {
    return errorLine(String(e).slice(0, 200));
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      /** Everything sent, kept to replay from memory next time. */
      const sent: string[] = [];
      let failed = 0;
      const send = (line: unknown) => {
        if (abort.signal.aborted) return;
        const text = JSON.stringify(line) + '\n';
        sent.push(text);
        try { controller.enqueue(encoder.encode(text)); } catch { /* closed */ }
      };
      send({ type: 'start', projects: projects.length });

      // Read the projects' assets together rather than one after another — 25
      // sequential round trips is the difference between 2 seconds and 20 —
      // and pass each one on the moment it lands.
      await Promise.all(
        projects.map(async (p, index) => {
          let assets: LivePortalAsset[] = [];
          try {
            const res = await fetch(`${API_URL}/projects/${p.id}/assets?limit=${ASSET_PAGE}`, {
              headers, cache: "no-store", signal: abort.signal,
            });
            if (res.ok) {
              assets = (((await res.json()) as { data?: ApiAsset[] }).data ?? []).map(toPortalAsset);
            } else {
              failed += 1;
            }
          } catch {
            /* One unreadable project is skipped, as before. */
            failed += 1;
          }
          send({ type: 'assets', index, assets });
        }),
      );

      send({ type: 'done', projectsRead: projects.length });
      // Only a whole answer is remembered: one with holes in it would be
      // replayed as if it were the library.
      if (!abort.signal.aborted && failed === 0) memo = { body: sent.join(''), at: Date.now() };
      try { controller.close(); } catch { /* the client already left */ }
    },
    cancel() {
      abort.abort();
    },
  });
  return new Response(stream, { headers: NDJSON_HEADERS });
}
