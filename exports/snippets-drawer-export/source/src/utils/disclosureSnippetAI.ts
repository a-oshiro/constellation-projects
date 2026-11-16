import { DISCLOSURE_VARIABLES } from '../data/disclosureVariables';
import type { DisclosureIssue } from '../data/enrollmentSettings';
import type { DisclosureReplacement } from './disclosureSnippetColors';
import { DISCLOSURE_BOILERPLATE, generateMockDisclosureSnippet } from './disclosureSnippetMock';

// 'live' (the default, dev included) sends disclosures to OpenAI through /api/fetch-urls — `npm run dev`
// serves that function itself (see vite.config.ts). Set VITE_DISCLOSURE_AI_MODE=mock to templatize
// locally instead, without spending OpenAI credits.
const AI_MODE: 'live' | 'mock' = import.meta.env.VITE_DISCLOSURE_AI_MODE === 'mock' ? 'mock' : 'live';

// Cheapest model in the same family as the already-proven `gpt-4o` Responses API call used by
// fetchUrlsWithAI.ts — keeps this a low-cost call while reusing the exact same integration path.
const OPENAI_MODEL = 'gpt-4o-mini';

// Adapted from the client-provided "generate a disclosure from known offer values" prompt into the
// reverse task: given a disclosure a client already runs elsewhere, identify the values that would
// change per-offer and replace them with {variableName} placeholders, without altering anything else.
// Also asks for a `replacements` map (variable key -> the exact original substring it replaced) so the
// snippet builder's comparison view can highlight the matching source text for each outcome variable.
const SYSTEM_PROMPT = `You are a compliance-focused assistant that converts real-world automotive marketing disclosures into reusable disclosure snippet templates.
You will be given a disclosure that a dealer or client already publishes in live campaigns, plus a list of known template variables. Your job is only to templatize it: identify every value in the disclosure that would change from one offer or vehicle to the next, and replace it with a placeholder variable in {camelCaseName} format (e.g. {modelYear}, {vehicleModel}, {vinNumber}, {msrp}, {monthlyPayment}, {downPayment}, {totalDueAtSigning}).
Always:
- Preserve every other word, all punctuation, and the overall structure of the source disclosure exactly as written. Do not rewrite, rephrase, shorten, or "clean up" any sentence — only swap out values for placeholders.
- Treat as replaceable: dollar amounts, percentages/APRs, dates, mileage figures, lease/finance terms, vehicle model/trim/year, VINs, MSRP and discount figures, and any dealer or lender name that is specific to this one offer.
- Reuse an exact key from the provided variable list whenever a value in the disclosure matches that variable's description. Only invent a new {camelCaseName} key when nothing in the list fits.
- Preserve the "$" sign and any punctuation that sits immediately next to a value in the source text (e.g. write $ {msrp} when the source disclosure has a dollar sign directly before that value).
- Keep the language formal and compliant with CARS Act requirements.
- The result must be a 1:1 adaptation of the source disclosure: do not add any sentence, paragraph, or legal text that is not in the source (rebate, dealer-fee and VIN language is added separately, later).
- Report anything in the source disclosure that stops it from working as a reusable automated-offer template, as "issues". Use severity "failure" for language the client must change (e.g. eligibility conditions such as "who have leased or financed" that limit the offer to a group the platform cannot identify the viewer as part of), "warning" for things a human should double-check (e.g. mentions of a loyalty, conquest, military or other named program), and "change" for something you deliberately left as-is that may read oddly in the result (e.g. a fee already stated inside a sentence, which the dealer-fee sentence later added to the final snippet may repeat). Quote the exact source wording in each message. Return an empty list when there is nothing to report.
- Return ONLY a single JSON object, no markdown code fences, no commentary, of this exact shape:
{"snippet": "<the resulting disclosure snippet text, exactly as described above>", "replacements": [{"key": "<variableKey, no braces>", "original": "<the exact original substring from the source disclosure that this variable replaced, verbatim, no leading $ if the $ stayed in the snippet as literal text>"}], "issues": [{"severity": "failure" | "warning" | "change", "title": "<short title>", "message": "<one or two sentences explaining the problem and what to do>"}]}
- Include exactly one "replacements" entry per distinct placeholder you introduced.`;

function buildUserPrompt(rawDisclosureText: string): string {
  const variableList = DISCLOSURE_VARIABLES
    .map((v) => `- {${v.key}}: ${v.label}`)
    .join('\n');

  return [
    'Known template variables (prefer reusing one of these keys over inventing a new one):',
    variableList,
    '',
    'Raw disclosure to templatize:',
    rawDisclosureText,
  ].join('\n');
}

// Same extraction logic as fetchUrlsWithAI.ts's extractResponseText — duplicated locally rather
// than shared, since these two AI features have otherwise-unrelated request/response shapes.
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

function stripCodeFences(text: string): string {
  return text.trim().replace(/^```[a-z]*\n?/i, '').replace(/```$/, '').trim();
}

export interface DisclosureSnippetGeneration {
  snippet: string;
  replacements: DisclosureReplacement[];
  issues: DisclosureIssue[];
}

const ISSUE_SEVERITIES: ReadonlySet<string> = new Set(['failure', 'warning', 'change']);

const isDisclosureIssue = (i: unknown): i is DisclosureIssue => {
  const issue = i as DisclosureIssue;
  return !!issue && typeof issue === 'object' && ISSUE_SEVERITIES.has(issue.severity)
    && typeof issue.title === 'string' && typeof issue.message === 'string';
};

// Pulls the JSON object out of a response that may carry stray prose or code fences around it.
function extractJsonObject(content: string): unknown {
  const cleaned = stripCodeFences(content);
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

/**
 * Cleans the model's replacements so the comparison-view colors can match them: keys lose any braces,
 * and an `original` that isn't found verbatim in the source (stray "$", different spacing) is retried
 * without the "$" / with flexible whitespace and replaced by the actual source substring.
 */
function normalizeReplacements(raw: unknown[], sourceText: string): DisclosureReplacement[] {
  const result: DisclosureReplacement[] = [];
  for (const r of raw) {
    if (!r || typeof r !== 'object') continue;
    const { key: rawKey, original: rawOriginal } = r as Partial<DisclosureReplacement>;
    if (typeof rawKey !== 'string' || typeof rawOriginal !== 'string') continue;
    const key = rawKey.trim().replace(/^\{+|\}+$/g, '');
    let original = rawOriginal;
    if (!key || !original) continue;
    if (!sourceText.includes(original)) {
      const trimmed = original.trim().replace(/^\$\s*/, '');
      const pattern = trimmed.split(/\s+/).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+');
      const found = pattern ? sourceText.match(new RegExp(pattern))?.[0] : undefined;
      if (!found) continue;
      original = found;
    }
    result.push({ key, original });
  }
  return result;
}

/** JSON schema the model's reply must match (Responses API structured output, strict mode). */
const GENERATION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['snippet', 'replacements', 'issues'],
  properties: {
    snippet: { type: 'string' },
    replacements: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['key', 'original'],
        properties: { key: { type: 'string' }, original: { type: 'string' } },
      },
    },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['severity', 'title', 'message'],
        properties: {
          severity: { type: 'string', enum: ['failure', 'warning', 'change'] },
          title: { type: 'string' },
          message: { type: 'string' },
        },
      },
    },
  },
} as const;

// Lenient parse: if the model wraps the JSON in stray prose the object is still extracted. Returns null
// when no {snippet} object can be read — raw model output is never shown as a template.
function parseGenerationResponse(content: string, sourceText: string): DisclosureSnippetGeneration | null {
  const parsed = extractJsonObject(content) as { snippet?: unknown; replacements?: unknown; issues?: unknown } | null;
  if (!parsed || typeof parsed.snippet !== 'string') return null;
  const replacements = Array.isArray(parsed.replacements) ? normalizeReplacements(parsed.replacements, sourceText) : [];
  const issues = Array.isArray(parsed.issues) ? parsed.issues.filter(isDisclosureIssue) : [];
  return { snippet: parsed.snippet, replacements, issues };
}

/** Joins every disclosure type's raw text into one labeled source, so a single account snippet covers all of them. */
export function buildCombinedDisclosureSource(disclosures: Array<{ label: string; text: string }>): string {
  if (disclosures.length === 1) return disclosures[0].text;
  return disclosures.map((d) => `${d.label}:\n${d.text.trim()}`).join('\n\n');
}

const normalizeSentence = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();

function splitSentences(paragraph: string): string[] {
  return paragraph.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
}

/**
 * Combines each disclosure type's resulting template into one account snippet. A sentence that appears
 * in more than one template (shared legal lines like "Subject to prior sale.") is written once, after the
 * type-specific text, keeping the paragraph it first appeared in; sentences unique to one template stay
 * in place, in template order. The rebate/dealer-fee/VIN boilerplate exists only here, appended once at
 * the end — templates are 1:1 adaptations of the client's disclosures and never carry it.
 */
export function consolidateDisclosureTemplates(templates: string[]): string {
  if (templates.length === 0) return '';
  const parsed = templates.map((t) => t.split(/\n+/).map(splitSentences).filter((p) => p.length > 0));

  const templateCount = new Map<string, number>();
  for (const paragraphs of parsed) {
    for (const key of new Set(paragraphs.flat().map(normalizeSentence))) {
      templateCount.set(key, (templateCount.get(key) ?? 0) + 1);
    }
  }

  const own: string[] = [];
  const shared = new Map<string, string[]>();
  // Pre-seeded with the boilerplate, so a template that still carries it (one generated before this
  // rule) doesn't write it twice.
  const seen = new Set(DISCLOSURE_BOILERPLATE.split('\n').flatMap(splitSentences).map(normalizeSentence));
  parsed.forEach((paragraphs, ti) => {
    paragraphs.forEach((sentences, pi) => {
      const ownSentences: string[] = [];
      for (const sentence of sentences) {
        const key = normalizeSentence(sentence);
        if (seen.has(key)) continue;
        seen.add(key);
        if ((templateCount.get(key) ?? 0) > 1) {
          const group = shared.get(`${ti}:${pi}`) ?? [];
          group.push(sentence);
          shared.set(`${ti}:${pi}`, group);
        } else {
          ownSentences.push(sentence);
        }
      }
      if (ownSentences.length) own.push(ownSentences.join(' '));
    });
  });

  return [...own, ...Array.from(shared.values(), (s) => s.join(' ')), DISCLOSURE_BOILERPLATE].join('\n\n');
}

/** Every distinct {key, original} pair across the templates' replacements, in order — powers the snippet's comparison-view colors. */
export function mergeDisclosureReplacements(lists: DisclosureReplacement[][]): DisclosureReplacement[] {
  const seen = new Set<string>();
  return lists.flat().filter((r) => {
    const id = `${r.key}\u0000${r.original}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

/**
 * Sends a raw client-provided disclosure through the OpenAI-backed templatizer and returns the resulting
 * snippet text plus its source-value mapping. Aborting `signal` cancels the in-flight request; the
 * promise then rejects with an AbortError (check `signal.aborted`).
 */
export async function generateDisclosureSnippet(rawDisclosureText: string, signal?: AbortSignal): Promise<DisclosureSnippetGeneration> {
  if (AI_MODE === 'mock') return generateMockDisclosureSnippet(rawDisclosureText, signal);

  // Routed through the existing /api/fetch-urls serverless function — it's a generic Responses API
  // proxy with nothing URL-specific in its own logic, so it's reused here rather than duplicating it.
  const response = await fetch('/api/fetch-urls', {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.0,
      input: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(rawDisclosureText) },
      ],
      // Structured output: OpenAI guarantees the reply is valid JSON of exactly this shape, so it always parses.
      text: { format: { type: 'json_schema', name: 'disclosure_template', strict: true, schema: GENERATION_SCHEMA } },
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

  const generation = parseGenerationResponse(content, rawDisclosureText);
  if (!generation) {
    console.warn('[Disclosure template] Unreadable OpenAI response:', data);
    throw new Error('OpenAI returned a response the template builder couldn\'t read. Edit the disclosure to try again.');
  }
  // Logged only once the template parsed successfully — the full Responses API payload, for debugging.
  console.log('[Disclosure template] OpenAI response:', data);
  return generation;
}
