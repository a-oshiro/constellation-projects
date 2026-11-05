import { DISCLOSURE_VARIABLES } from '../data/disclosureVariables';
import type { DisclosureIssue } from '../data/enrollmentSettings';
import type { DisclosureReplacement } from './disclosureSnippetColors';
import { DISCLOSURE_BOILERPLATE, generateMockDisclosureSnippet } from './disclosureSnippetMock';

// 'live' sends disclosures to OpenAI through /api/fetch-urls; 'mock' templatizes them locally so local
// development doesn't spend credits (or fail when the serverless API isn't running). Defaults to mock
// under `vite dev` and live in production builds — set VITE_DISCLOSURE_AI_MODE to override either way.
const AI_MODE: 'live' | 'mock' = import.meta.env.VITE_DISCLOSURE_AI_MODE === 'live' || import.meta.env.VITE_DISCLOSURE_AI_MODE === 'mock'
  ? import.meta.env.VITE_DISCLOSURE_AI_MODE
  : import.meta.env.DEV ? 'mock' : 'live';

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
- Append, exactly once, at the end of the disclosure (after the source text, on a new line) these two paragraphs of legal text regarding Rebate and Dealer Fee offers, using their placeholders verbatim exactly as given below — do not omit them even if the source disclosure has no rebate or dealer fee language of its own. These placeholders have no original substring in the source, so never list them in "replacements":
${DISCLOSURE_BOILERPLATE}
- Report anything in the source disclosure that stops it from working as a reusable automated-offer template, as "issues". Use severity "failure" for language the client must change (e.g. eligibility conditions such as "who have leased or financed" that limit the offer to a group the platform cannot identify the viewer as part of), "warning" for things a human should double-check (e.g. mentions of a loyalty, conquest, military or other named program), and "change" for something you deliberately left as-is that may read oddly in the result (e.g. a fee already stated inside a sentence, which the appended dealer-fee sentence may repeat). Quote the exact source wording in each message. Return an empty list when there is nothing to report.
- Return ONLY a single JSON object, no markdown code fences, no commentary, of this exact shape:
{"snippet": "<the resulting disclosure snippet text, exactly as described above>", "replacements": [{"key": "<variableKey, no braces>", "original": "<the exact original substring from the source disclosure that this variable replaced, verbatim, no leading $ if the $ stayed in the snippet as literal text>"}], "issues": [{"severity": "failure" | "warning" | "change", "title": "<short title>", "message": "<one or two sentences explaining the problem and what to do>"}]}
- Include exactly one "replacements" entry per distinct placeholder you introduced FROM THE SOURCE TEXT (skip the fixed rebate/dealer-fee/VIN boilerplate placeholders above, since they were not present in the source).`;

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

// Lenient JSON parse: the prompt asks for a single {"snippet","replacements"} object, but if the model
// ever wraps that in stray prose the snippet is still usable — it just loses its comparison-view
// highlighting and warnings (replacements: [], issues: []) rather than failing the whole generation.
function parseGenerationResponse(content: string): DisclosureSnippetGeneration {
  const cleaned = stripCodeFences(content);
  try {
    const parsed = JSON.parse(cleaned) as { snippet?: unknown; replacements?: unknown; issues?: unknown };
    if (typeof parsed.snippet === 'string') {
      const replacements = Array.isArray(parsed.replacements)
        ? parsed.replacements.filter(
            (r): r is DisclosureReplacement => !!r && typeof r === 'object' && typeof (r as DisclosureReplacement).key === 'string' && typeof (r as DisclosureReplacement).original === 'string',
          )
        : [];
      const issues = Array.isArray(parsed.issues) ? parsed.issues.filter(isDisclosureIssue) : [];
      return { snippet: parsed.snippet, replacements, issues };
    }
  } catch {
    // fall through to the raw-text fallback below
  }
  return { snippet: cleaned, replacements: [], issues: [] };
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
 * in more than one template (the rebate/dealer-fee boilerplate every template ends with, or shared legal
 * lines like "Subject to prior sale.") is written once, after the type-specific text, keeping the
 * paragraph it first appeared in; sentences unique to one template stay in place, in template order.
 */
export function consolidateDisclosureTemplates(templates: string[]): string {
  const parsed = templates.map((t) => t.split(/\n+/).map(splitSentences).filter((p) => p.length > 0));

  const templateCount = new Map<string, number>();
  for (const paragraphs of parsed) {
    for (const key of new Set(paragraphs.flat().map(normalizeSentence))) {
      templateCount.set(key, (templateCount.get(key) ?? 0) + 1);
    }
  }

  const own: string[] = [];
  const shared = new Map<string, string[]>();
  const seen = new Set<string>();
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

  return [...own, ...Array.from(shared.values(), (s) => s.join(' '))].join('\n\n');
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

/** Sends a raw client-provided disclosure through the OpenAI-backed templatizer and returns the resulting snippet text plus its source-value mapping. */
export async function generateDisclosureSnippet(rawDisclosureText: string): Promise<DisclosureSnippetGeneration> {
  if (AI_MODE === 'mock') return generateMockDisclosureSnippet(rawDisclosureText);

  // Routed through the existing /api/fetch-urls serverless function — it's a generic Responses API
  // proxy with nothing URL-specific in its own logic, so it's reused here rather than duplicating it.
  const response = await fetch('/api/fetch-urls', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.0,
      input: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(rawDisclosureText) },
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

  return parseGenerationResponse(content);
}
