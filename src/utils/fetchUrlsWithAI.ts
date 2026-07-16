import { CTA_OPTIONS } from '../components/settings/DestinationURLs';
import type { DestinationUrl, DestinationUrlType } from '../components/settings/DestinationURLs';

const OPENAI_MODEL = 'gpt-4o-mini';

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
Always respond with ONLY raw CSV text — no markdown code fences, no commentary before or after.
The first line must be exactly this header: Label,URL,Type,Vehicle,Associated CTAs
Wrap every field in double quotes and escape internal quotes by doubling them (""").
When a field holds multiple values (multiple CTAs), join them with "; " inside the single quoted field.
Do not include a trailing blank line.`;

function buildUserPrompt({ website, types, models, allModelsSelected }: FetchUrlsParams): string {
  const lines: string[] = [];

  lines.push(`Website to inspect: ${website}`);
  lines.push('');
  lines.push(
    'You do not have live browsing access to this site. Fabricate realistic, plausible page URLs ' +
    'under this exact domain, following common automotive dealership website conventions ' +
    '(e.g. /new-inventory/<model>, /specials, /contact-us, /trade-in-your-vehicle).',
  );
  lines.push('');
  lines.push(`Only produce rows for these URL categories: ${types.join(', ')}.`);
  lines.push('');

  for (const type of types) {
    if (type === 'Inventory') {
      lines.push(
        'Category "Inventory": create exactly one CSV row per vehicle model listed below — ' +
        'never combine multiple models into a single row, and never skip a listed model.',
      );
      lines.push(
        allModelsSelected
          ? `Every one of the following models is selected — produce a row for each (${models.length} rows total):`
          : `The following models are selected — produce a row for each (${models.length} rows total):`,
      );
      lines.push(models.join(', '));
      lines.push(
        'For each model\'s row: invent a distinct label such as "New Vehicle Inventory - <Model>", ' +
        'invent a URL under the domain specific to that model, set Type to "Inventory", ' +
        'and set Vehicle to "2026 BMW <Model>".',
      );
    } else {
      lines.push(`Category "${type}": invent 1-2 plausible page(s) for this category on the site.`);
    }
    lines.push('');
  }

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

function rowsToDestinationUrls(rows: string[][]): DestinationUrl[] {
  const [, ...dataRows] = rows;
  return dataRows
    .filter((row) => row.length >= 5 && row[0]?.trim())
    .map((row) => {
      const [label, url, type, vehicle, ctasRaw] = row;
      return {
        id: `url-${Math.random().toString(36).slice(2)}`,
        label: label.trim(),
        url: url.trim(),
        type: normalizeType(type),
        ymmt: vehicle?.trim() ? vehicle.trim() : undefined,
        ctas: ctasRaw ? ctasRaw.split(';').map((s) => s.trim()).filter(Boolean) : [],
      };
    });
}

export async function fetchUrlsFromWebsite(params: FetchUrlsParams): Promise<DestinationUrl[]> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;
  if (!apiKey) {
    throw new Error('Missing OpenAI API key. Set VITE_OPENAI_API_KEY in your .env.local file.');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.7,
      messages: [
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
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI response did not include any content.');
  }

  const rows = parseCsv(stripCodeFences(content));
  if (rows.length < 2) {
    throw new Error('OpenAI did not return any URL rows.');
  }

  return rowsToDestinationUrls(rows);
}
