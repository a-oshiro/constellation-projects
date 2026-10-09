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
// Unconfigured (no OFFERS_* env), it answers `source: "unconfigured"` and the
// Portal falls back to the generated local library.
export const config = { runtime: 'edge' };

// Edge Runtime exposes env vars via process.env but isn't Node.js — declare just the
// shape this file uses (same approach as api/fetch-urls.ts).
declare const process: { env: Record<string, string | undefined> };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

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

export default async function handler(): Promise<Response> {
  if (!API_URL || !API_KEY || !CLIENT_ID) {
    return json({ assets: [], folders: [], source: "unconfigured" });
  }

  const headers = { "X-API-Key": API_KEY, "X-Client-Id": CLIENT_ID };

  try {
    const projectsRes = await fetch(`${API_URL}/projects?limit=${PROJECT_LIMIT}`, {
      headers, cache: "no-store",
    });
    if (!projectsRes.ok) {
      return json(
        { assets: [], folders: [], source: "error", error: `Upstream ${projectsRes.status}` },
        { status: 200 },
      );
    }
    const projects = ((await projectsRes.json()) as { data?: { id: string }[] }).data ?? [];

    // Read the projects' assets together rather than one after another — 25
    // sequential round trips is the difference between 2 seconds and 20.
    const pages = await Promise.all(
      projects.map(async (p) => {
        try {
          const res = await fetch(`${API_URL}/projects/${p.id}/assets?limit=${ASSET_PAGE}`, {
            headers, cache: "no-store",
          });
          if (!res.ok) return [];
          return ((await res.json()) as { data?: ApiAsset[] }).data ?? [];
        } catch {
          return [];
        }
      }),
    );

    const assets = pages.flat().map(toPortalAsset);

    // The tree, from the leaves — one entry per folder with its count.
    const counts = new Map<string, number>();
    for (const a of assets) counts.set(a.folder, (counts.get(a.folder) ?? 0) + 1);
    const folders = [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return json({
      assets,
      folders,
      source: "live",
      projectsRead: projects.length,
    });
  } catch (e) {
    return json({
      assets: [], folders: [], source: "error", error: String(e).slice(0, 200),
    });
  }
}
