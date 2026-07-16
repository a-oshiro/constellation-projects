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
When you copy a URL into your output, copy its exact path character-for-character as it appears when you open the page — do not add words (like the brand or make name into a slug), do not shorten or rename segments, and do not apply a naming convention of your own that isn't literally what you observed. Always output the full absolute URL including the "https://" scheme and domain — never a bare path like "/new-vehicles/x1/".
Always respond with ONLY raw CSV text — no markdown code fences, no commentary before or after.
The first line must be exactly this header: Label,URL,Type,Vehicle,Associated CTAs
Wrap every field in double quotes and escape internal quotes by doubling them (""").
When a field holds multiple values (multiple CTAs), join them with "; " inside the single quoted field.
Do not include a trailing blank line.`;

function buildUserPrompt({ website, types, models, allModelsSelected }: FetchUrlsParams): string {
  const lines: string[] = [];

  lines.push(`Website to inspect: ${website}`);
  lines.push('');
  lines.push('Step 1 — Browse and find the real pages. Do this before worrying about output formatting.');
  lines.push(
    'Actually browse this live website with your web browsing tool — do not guess, fabricate, or ' +
    'construct URLs from path conventions. Navigate the site (its navigation menus, footer links, ' +
    'sitemap, and internal pages) to find the real destination pages for each requested category below. ' +
    'Every URL you output must be a page you actually found by browsing the site.',
  );
  lines.push(
    'When you find a page, copy its URL exactly as it appears in the address bar or the link you ' +
    'followed — character for character. Do not "clean up," shorten, or embellish the path, and do not ' +
    'insert the brand or make name into a URL segment unless it is literally part of the real path you ' +
    'observed. For example, if the real inventory page for the X1 is at "/new-vehicles/x1/", output ' +
    'exactly "/new-vehicles/x1/" — do not change it to "/new-vehicles/bmw-x1/" or any other variant ' +
    'that merely looks plausible.',
  );
  lines.push('');
  lines.push(
    'Before including any URL in your output, open it and confirm it loads successfully. If a URL ' +
    'returns a 404, redirects to an error page, or otherwise does not exist, discard it — do not ' +
    'include it in the CSV and do not substitute a guessed URL in its place. Only output URLs you ' +
    'have verified are live.',
  );
  lines.push('');
  lines.push(
    'If the website itself cannot be reached at all (the domain does not resolve, or every page you ' +
    'try 404s), respond with only the header row and no data rows — do not invent a plausible-looking ' +
    'result for a site you could not actually browse.',
  );
  lines.push('');
  lines.push(`Only produce rows for these URL categories: ${types.join(', ')}.`);
  lines.push('');

  for (const type of types) {
    if (type === 'Inventory') {
      lines.push(
        'Category "Inventory": find the real, model-specific inventory page for each vehicle model ' +
        'listed below by browsing the site\'s inventory/new-vehicles section — never combine multiple ' +
        'models into a single row, and never skip a listed model. These are the only models to look ' +
        'for; do not add any other models and do not omit any of them.',
      );
      lines.push(
        'A single web search for a model name is often not enough to reach the exact model subpage — ' +
        'it frequently only surfaces the general "new vehicles" or "inventory" landing page instead. ' +
        'When that happens, treat that landing page as a starting point, not a result: open it, find ' +
        'its navigation menu or on-page list of models (dealer sites almost always list each model as ' +
        'its own distinct link — e.g. X1, X3, M8, i5, ... — right there in that menu), then follow the ' +
        'specific link for the model you are looking for and use THAT page\'s URL, not the landing ' +
        'page\'s URL. The general landing page for the whole inventory section is never an acceptable ' +
        'substitute for a specific model\'s row.',
      );
      lines.push(
        'Look up each model separately and one at a time — do not rely on a single pass to fill in ' +
        'multiple rows at once. Before you finalize a row, re-check that the page\'s own title, ' +
        'heading, or URL explicitly names that exact model — if the page you landed on is for a ' +
        'different model than the one you were looking for, or is a general landing/category page ' +
        'rather than that model\'s own page, that is not a match: keep looking using the navigation ' +
        'menu, or omit the row if you truly cannot find it.',
      );
      lines.push(
        'The page you pick must be the model LINE page (the marketing/browsing page for that model as ' +
        'a whole, listing its trims/features and the current in-stock units) — not a single specific ' +
        'vehicle\'s detail page. A single-vehicle page is tied to one VIN or stock number and will stop ' +
        'working the moment that particular unit is sold, which makes it unsuitable as a standing ' +
        'destination URL. If a URL you are considering shows one specific vehicle\'s VIN, stock number, ' +
        'or exact price/options rather than the model as a whole, go back and use the model line page ' +
        'instead (usually one level up in the site\'s navigation from that vehicle listing).',
      );
      lines.push(
        'A concrete tell for a single-vehicle page: its URL path contains a long VIN-like string (17 ' +
        'characters mixing letters and digits) or a numeric stock number, and/or the path has many ' +
        'hyphen-joined words describing one exact vehicle (color, trim, drivetrain, body style all ' +
        'strung together, e.g. ".../new-2026-bmw-x1-all-wheel-drive-suv-<vin>/"). The model line page\'s ' +
        'URL is almost always much shorter and simpler — typically just the model name or a short slug ' +
        '(e.g. ".../new-vehicles/x1/" or similar). If the URL you found matches the single-vehicle ' +
        'pattern, navigate up or back to find the shorter model line URL and use that instead.',
      );
      lines.push(
        allModelsSelected
          ? `Every one of the following models is selected — find a page for each (${models.length} rows total):`
          : `The following models are selected — find a page for each (${models.length} rows total):`,
      );
      lines.push(models.join(', '));
      lines.push(
        'For each model\'s row: invent a distinct label such as "New Vehicle Inventory - <Model>" ' +
        '(the label may be worded however reads best), use the exact real URL you found for that ' +
        'model\'s inventory page copied verbatim (see the URL-fidelity rule above — do not embellish ' +
        'it or add the make name into the slug), set Type to "Inventory", and set Vehicle to ' +
        '"2026 BMW <Model>". If you cannot find a working page for a given model after checking the ' +
        'site, omit that model\'s row entirely rather than guessing or substituting a different model\'s page.',
      );
    } else {
      lines.push(`Category "${type}": find the real page(s) for this category by browsing the site.`);
    }
    lines.push('');
  }

  lines.push('Step 2 — Format your findings as CSV, without altering any URL from Step 1.');
  lines.push(`For every row, choose Associated CTAs only from this fixed list: ${CTA_OPTIONS.join(', ')}.`);
  lines.push('Pick every CTA from that list that reasonably applies to the row\'s category — a row can have more than one. Typical fit:');
  for (const type of Object.keys(CTA_GUIDANCE) as DestinationUrlType[]) {
    lines.push(`- ${type} -> ${CTA_GUIDANCE[type].join(', ')}`);
  }
  lines.push('');
  lines.push('Leave the Vehicle column blank ("") for any non-Inventory row.');
  lines.push('');
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
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  if (!apiKey) {
    throw new Error('Missing OpenAI API key. Set VITE_OPENAI_API_KEY in your .env.local file.');
  }

  // Responses API (not Chat Completions) — required to grant the model live web browsing via
  // the built-in `web_search` tool, so it can actually inspect the site instead of guessing URLs.
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
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
