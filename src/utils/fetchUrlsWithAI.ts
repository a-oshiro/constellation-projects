import { CTA_OPTIONS } from '../components/settings/DestinationURLs';
import type { DestinationUrl, DestinationUrlType } from '../components/settings/DestinationURLs';

const OPENAI_MODEL = 'gpt-4o';

// 2026 BMW lineup — shared between the "Fetch URLs with AI" dialog and the
// auto-suggest flow triggered after the first manually-added Inventory URL.
export const BMW_2026_MODELS = [
  'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'XM',
  '2 Series', '3 Series', '4 Series', '5 Series', '7 Series', '8 Series', 'M2', 'M3', 'M4',
  'M5', 'iX', 'Z4', 'i4', 'i5', 'i7'
];

export interface FetchUrlsParams {
  website: string;
  types: DestinationUrlType[];
  models: string[];
  allModelsSelected: boolean;
}

// Which CTAs typically make sense for each URL category — passed to the model as guidance,
// not a hard filter, since the prompt still asks it to use judgement per row.
const CTA_GUIDANCE: Record<DestinationUrlType, string[]> = {
  Contact: ['Contact Dealer', 'Sign-up for News'],
  Inventory: ['See Inventory', 'See New Vehicles', 'New Inventory'],
  Specials: ['Claim Special', 'Get Offer'],
  'Trade-In': ['Value Trade', 'Trade-in your vehicle', 'Trade-In'],
};

const SYSTEM_PROMPT = `You generate destination-URL data for an automotive dealer website integration tool.
You have live web browsing access — use it to actually visit and inspect the target website; never guess, fabricate, or "clean up" a URL.
Copy each URL's path exactly as it appears when you open the page — no invented segments, no shortening, no renaming. Always output the full absolute URL including the "https://" scheme and domain.
Before including any URL, confirm it loads and that its own page content clearly matches the category it's filed under (see rules per category below) — if not, keep looking, or omit the row.
If the site cannot be reached at all, respond with only the header row.
Always respond with ONLY raw CSV text — no markdown code fences, no commentary before or after.
The first line must be exactly this header: Label,URL,Type,Vehicle,Associated CTAs
Wrap every field in double quotes and escape internal quotes by doubling them (""").
When a field holds multiple values (multiple CTAs), join them with "; " inside the single quoted field.
Do not include a trailing blank line.`;

// Per-category rules the model checks a candidate URL against before accepting it. Written as a
// compact "valid vs. reject" pair rather than prose so every category gets equal rigor — the old
// prompt only spelled this out for Inventory, which is why Specials/Trade-In/Contact came back wrong.
const CATEGORY_RULES: Record<DestinationUrlType, { valid: string; reject: string; navHint: string }> = {
  Inventory: {
    valid: 'the model LINE page — lists that model\'s trims/features and current in-stock units as a whole, at whatever path the site actually resolves it to after opening the link (commonly under a section like ".../new-vehicles/x1/" or ".../inventory/x1/", but use the real resolved path even if it\'s shorter or different from that pattern)',
    reject: 'a single specific vehicle\'s detail page (17-character VIN, a numeric stock number, or a long hyphenated string describing one exact vehicle) — or a pre-redirect vanity/shortcut URL when the page actually resolves somewhere else',
    navHint: 'the site\'s new-vehicles/inventory navigation menu, which almost always lists each model as its own link',
  },
  Specials: {
    valid: 'a page whose main content is current special offers, deals, or lease/finance promotions',
    reject: 'the general new-vehicles/inventory landing page, or any page that only mentions specials in passing',
    navHint: 'a nav link labeled "Specials," "Offers," "Deals," or similar',
  },
  'Trade-In': {
    valid: 'a page dedicated to appraising or valuing a trade-in vehicle',
    reject: 'the homepage or a generic contact page',
    navHint: 'a nav link labeled "Trade-In," "Value Your Trade," "Sell/Trade Your Car," or similar',
  },
  Contact: {
    valid: 'a page dedicated to contacting the dealership (staff directory, contact form, or "Contact Us" page)',
    reject: 'the homepage, unless the site genuinely has no dedicated contact page',
    navHint: 'a nav link labeled "Contact," "Contact Us," or similar',
  },
};

function buildUserPrompt({ website, types, models, allModelsSelected }: FetchUrlsParams): string {
  const lines: string[] = [];

  lines.push(`Website to inspect: ${website}`);
  lines.push('');
  lines.push(
    'Actually browse this live site for each category below — never guess or construct URLs from ' +
    'patterns. Only produce rows for these categories: ' + types.join(', ') + '.',
  );
  lines.push('');

  for (const type of types) {
    const rule = CATEGORY_RULES[type];
    lines.push(`### ${type}`);
    lines.push(`Valid page: ${rule.valid}.`);
    lines.push(`Reject: ${rule.reject}.`);
    lines.push(`Look for: ${rule.navHint}.`);

    if (type === 'Inventory') {
      lines.push(
        'Open the site\'s inventory/new-vehicles navigation ONCE and read off the sub-link for every ' +
        'requested model directly from that menu — do not run a fresh web search per model name, since ' +
        'that route commonly lands on one in-stock unit\'s detail page (or a third-party listing) ' +
        'instead of the dealer\'s own model-line page, and it also burns far more searches than reading ' +
        'the nav once.',
      );
      lines.push(
        'Then actually open each of those nav links (don\'t just report the href text). Some sites ' +
        'route a nav link through a shorter vanity path that redirects to a different, longer canonical ' +
        'URL once opened — always output the URL of the page you actually land on after opening the ' +
        'link, never the pre-redirect link text, and never a URL read off a search-engine results ' +
        'snippet (those are often truncated or canonicalized and don\'t match the real page URL).',
      );
      lines.push(
        (allModelsSelected
          ? `Find one row for every one of these ${models.length} models — do not add or omit any: `
          : `Find one row for each of these ${models.length} selected models — do not add or omit any: `)
        + models.join(', ') + '.',
      );
      lines.push(
        'Label each row "New Vehicle Inventory - <Model>", set Type to "Inventory", set Vehicle to ' +
        '"2026 BMW <Model>". If a model\'s page truly can\'t be found, omit that row rather than guessing.',
      );
    }
    lines.push('');
  }

  lines.push(`For every row, choose Associated CTAs only from this fixed list, picking every one that reasonably fits: ${CTA_OPTIONS.join(', ')}.`);
  for (const type of Object.keys(CTA_GUIDANCE) as DestinationUrlType[]) {
    lines.push(`- ${type} -> ${CTA_GUIDANCE[type].join(', ')}`);
  }
  lines.push('Leave the Vehicle column blank ("") for any non-Inventory row.');
  lines.push('Respond with ONLY the raw CSV text (the header row plus data rows) and nothing else.');

  return lines.join('\n');
}

function stripCodeFences(text: string): string {
  return text.trim().replace(/^```[a-z]*\n?/i, '').replace(/```$/, '').trim();
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') { current += '"'; i++; }
        else { inQuotes = false; }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

function parseCsv(text: string): string[][] {
  return text
    .trim()
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '')
    .map(parseCsvLine);
}

const VALID_TYPES: DestinationUrlType[] = ['Contact', 'Inventory', 'Specials', 'Trade-In'];

function normalizeType(raw: string | undefined): DestinationUrlType {
  const trimmed = (raw ?? '').trim();
  return VALID_TYPES.find((t) => t.toLowerCase() === trimmed.toLowerCase()) ?? 'Contact';
}

// Safety net for when the model returns a path instead of a fully-qualified URL (e.g.
// "/new-vehicles/x1/" instead of "https://www.example.com/new-vehicles/x1/") — resolving
// against the site's own origin is deterministic and doesn't depend on prompt compliance.
function resolveUrl(url: string, website: string): string {
  try {
    return new URL(url, website).toString();
  } catch {
    return url;
  }
}

function rowsToDestinationUrls(rows: string[][], website: string): DestinationUrl[] {
  const [, ...dataRows] = rows;
  return dataRows
    .filter((row) => row.length >= 5 && row[0]?.trim())
    .map((row) => {
      const [label, url, type, vehicle, ctasRaw] = row;
      return {
        id: `url-${Math.random().toString(36).slice(2)}`,
        label: label.trim(),
        url: resolveUrl(url.trim(), website),
        type: normalizeType(type),
        ymmt: vehicle?.trim() ? vehicle.trim() : undefined,
        ctas: ctasRaw ? ctasRaw.split(';').map((s) => s.trim()).filter(Boolean) : [],
      };
    });
}

export interface CsvUploadResult {
  valid: DestinationUrl[];
  invalidRows: number[];
}

// Parses a user-authored CSV (same Label,URL,Type,Vehicle,Associated CTAs shape produced by the
// AI-fetch flow) for the Upload CSV feature. Unlike rowsToDestinationUrls (lenient, for trusted AI
// output), this enforces that Label, URL, and Type are present and Type is one of the four valid
// values, reporting the 1-indexed file row (header = row 1) of anything that fails those checks.
export function parseDestinationUrlsCsv(text: string): CsvUploadResult {
  const [, ...dataRows] = parseCsv(text);
  const valid: DestinationUrl[] = [];
  const invalidRows: number[] = [];

  dataRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const [label, url, type, vehicle, ctasRaw] = row;
    const matchedType = VALID_TYPES.find((t) => t.toLowerCase() === (type ?? '').trim().toLowerCase());

    if (!label?.trim() || !url?.trim() || !matchedType) {
      invalidRows.push(rowNumber);
      return;
    }

    valid.push({
      id: `url-${Math.random().toString(36).slice(2)}`,
      label: label.trim(),
      url: url.trim(),
      type: matchedType,
      ymmt: vehicle?.trim() ? vehicle.trim() : undefined,
      ctas: ctasRaw ? ctasRaw.split(';').map((s) => s.trim()).filter(Boolean) : [],
    });
  });

  return { valid, invalidRows };
}

// Generates the downloadable CSV template, matching the column headers used by both the AI-fetch
// flow and the manual Upload CSV flow, so users can fill it out on their own device and re-upload it.
export function downloadCsvTemplate(filename = 'Destination URLs Template.csv') {
  const blob = new Blob(['Label,URL,Type,Vehicle,Associated CTAs'], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function normalizeUrlString(url: string): string {
  return url.trim().toLowerCase().replace(/\/+$/, '');
}

function normalizeYmmtString(ymmt: string | undefined): string {
  return (ymmt ?? '').trim().toLowerCase();
}

// Filters AI-fetched (or any incoming) URLs against what's already on the table, so the
// caller never re-adds: (1) another Inventory URL for a model that already has one, or
// (2) a URL that's an exact duplicate of one already present, regardless of type.
export function dedupeAgainstExisting(newUrls: DestinationUrl[], existingUrls: DestinationUrl[]): DestinationUrl[] {
  const existingModels = new Set(
    existingUrls
      .filter((u) => u.type === 'Inventory' && u.ymmt)
      .map((u) => normalizeYmmtString(u.ymmt)),
  );
  const existingUrlStrings = new Set(existingUrls.map((u) => normalizeUrlString(u.url)));

  return newUrls.filter((u) => {
    if (u.type === 'Inventory' && u.ymmt && existingModels.has(normalizeYmmtString(u.ymmt))) return false;
    if (existingUrlStrings.has(normalizeUrlString(u.url))) return false;
    return true;
  });
}

// Extracts the assistant's plain-text output from a Responses API payload — its shape differs
// from Chat Completions (an `output` array of items rather than a single `choices[0].message`).
function extractResponseText(data: unknown): string | undefined {
  const payload = data as { output_text?: string; output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }> };
  if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text;
  }
  const textParts: string[] = [];
  for (const item of payload.output ?? []) {
    if (item.type !== 'message') continue;
    for (const part of item.content ?? []) {
      if (part.type === 'output_text' && typeof part.text === 'string') textParts.push(part.text);
    }
  }
  return textParts.length ? textParts.join('\n') : undefined;
}

export async function fetchUrlsFromWebsite(params: FetchUrlsParams): Promise<DestinationUrl[]> {
  // Routed through our own /api/fetch-urls serverless function rather than calling OpenAI
  // directly — that keeps the API key server-side instead of baked into the client bundle.
  const response = await fetch('/api/fetch-urls', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.0,
      tools: [{ type: 'web_search' }],
      input: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(params) },
      ],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${errBody.slice(0, 300)}`);
  }

  const data = await response.json();
  const content = extractResponseText(data);
  if (!content) {
    throw new Error('OpenAI response did not include any content.');
  }

  const rows = parseCsv(stripCodeFences(content));
  if (rows.length < 2) {
    throw new Error('No verified URLs were found on this website for the selected categories.');
  }

  return rowsToDestinationUrls(rows, params.website);
}
