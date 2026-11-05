// Local stand-in for the OpenAI disclosure templatizer (see disclosureSnippetAI.ts), so the snippet
// builder flows can be exercised without spending credits. Rule-based, not smart: it swaps the obvious
// per-offer values (dates, rates, mileage, dollar amounts, model year) for {variable} placeholders and
// reports each swap in `replacements`, so the comparison view still color-matches source and outcome.

import type { DisclosureIssue } from '../data/enrollmentSettings';
import type { DisclosureReplacement } from './disclosureSnippetColors';
import type { DisclosureSnippetGeneration } from './disclosureSnippetAI';

/** Rebate + dealer-fee legal text appended to every generated snippet — shared with the real prompt. */
export const DISCLOSURE_BOILERPLATE = [
  'Price includes the following rebates: $ {leaseRebate1Amount} {leaseRebate1Name}. {leaseRebate1Disclosure} $ {leaseRebate2Amount} {leaseRebate2Name}. {leaseRebate2Disclosure} $ {leaseRebate3Amount} {leaseRebate3Name}. {leaseRebate3Disclosure} $ {leaseRebate4Amount} {leaseRebate4Name}. {leaseRebate4Disclosure} $ {leaseRebate5Amount} {leaseRebate5Name}. {leaseRebate5Disclosure} $ {leaseRebate6Amount} {leaseRebate6Name}. {leaseRebate6Disclosure}',
  '{leaseDealerFee1Name}: ${leaseDealerFee1Value}, {leaseDealerFee2Name}: ${leaseDealerFee2Value}, {leaseDealerFee3Name}: ${leaseDealerFee3Value}, {leaseDealerFee4Name}: ${leaseDealerFee4Value}, {leaseDealerFee5Name}: ${leaseDealerFee5Value}, {leaseDealerFee6Name}: ${leaseDealerFee6Value}. {dynamicVinList} VIN: {VIN}',
].join('\n');

/** Roughly how long a real generation takes, so loading states are still visible in mock mode. */
const MOCK_LATENCY_MS = 1200;

/** Keyword hints (checked against the text around a dollar amount) for picking a variable key. */
const DOLLAR_KEY_HINTS: Array<{ key: string; after?: RegExp; before?: RegExp }> = [
  { key: 'totalDueAtSigning', after: /^\s*(total\s+)?due at signing/i },
  { key: 'docFee', after: /^\s*(document|doc|documentation) fee/i },
  { key: 'securityDeposit', after: /^\s*security deposit/i },
  { key: 'downPayment', after: /^\s*down/i },
  { key: 'monthlyPayment', after: /^\s*(\/\s*mo|per month|a month|monthly)/i },
  { key: 'dealerDiscount', after: /^\s*(dealer participation|dealer discount|discount)/i },
  { key: 'vehicleSalesPrice', before: /total msrp of\s*$/i },
  { key: 'msrp', before: /msrp of\s*$/i },
];

// Stand-ins for the warnings the live prompt is asked to report — one per severity, matching the
// examples in the Figma "Disclosure Warnings" dialog.
const ELIGIBILITY_RE = /\b(?:who|that) (?:have|has|currently) (?:leased|financed|purchased|owned)(?: or (?:leased|financed|purchased|owned))?\b/i;
const NAMED_PROGRAM_RE = /\b(loyalty|conquest|military|college grad(?:uate)?)\b/i;
const STATED_DOC_FEE_RE = /\$\s?\d[\d,]*(?:\.\d{2})? (?:document|doc|documentation) fee/i;

function findMockDisclosureIssues(rawDisclosureText: string): DisclosureIssue[] {
  const issues: DisclosureIssue[] = [];
  const eligibility = ELIGIBILITY_RE.exec(rawDisclosureText);
  if (eligibility) {
    issues.push({
      severity: 'failure',
      title: 'Conditional eligibility',
      message: `"${eligibility[0]}" limits the offer to existing owners or lessees. The platform cannot tell who is viewing, so it cannot say whether this payment applies to them. Send back.`,
    });
  }
  const program = NAMED_PROGRAM_RE.exec(rawDisclosureText);
  if (program) {
    const name = program[1].charAt(0).toUpperCase() + program[1].slice(1).toLowerCase();
    issues.push({
      severity: 'warning',
      title: `Mentions "${name}"`,
      message: 'Check the offer does not depend on a rebate or loyalty program. Generic language is usually fine; a named program with an amount is not.',
    });
  }
  const docFee = STATED_DOC_FEE_RE.exec(rawDisclosureText);
  if (docFee) {
    issues.push({
      severity: 'change',
      title: 'Document fee already stated',
      message: `"${docFee[0]}" states a fee inside a sentence, so it was left in place — the appended dealer-fee sentence may repeat it.`,
    });
  }
  return issues;
}

export async function generateMockDisclosureSnippet(rawDisclosureText: string): Promise<DisclosureSnippetGeneration> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

  const issues = findMockDisclosureIssues(rawDisclosureText);
  const replacements: DisclosureReplacement[] = [];
  const usedKeys = new Map<string, string>();

  // Reuses a key for a repeated identical value; otherwise suffixes it (`amount2`) so two different
  // values never collapse into one placeholder.
  const placeholder = (baseKey: string, original: string): string => {
    let key = baseKey;
    for (let n = 2; usedKeys.has(key) && usedKeys.get(key) !== original; n++) key = `${baseKey}${n}`;
    if (!usedKeys.has(key)) {
      usedKeys.set(key, original);
      replacements.push({ key, original });
    }
    return `{${key}}`;
  };

  let text = rawDisclosureText;

  text = text.replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, (m) => placeholder('offerExpirationDate', m));
  text = text.replace(/\b\d+(?:\.\d+)?%/g, (m) => placeholder('apr', m));
  text = text.replace(/\b(\d{1,3}(?:,\d{3})+|\d+)(?=\s+(?:annual\s+)?miles\b)/gi, (m) => placeholder('milesPerYear', m));
  text = text.replace(/\$\s?(\d*\.\d{2})(?=\s+per mile)/gi, (_, amount: string) => `$ ${placeholder('centsPerMile', amount)}`);
  text = text.replace(/\b(\d{1,3})(?=\s+months?\b)/gi, (m) => placeholder('termMonths', m));
  text = text.replace(/\$\s?(\d[\d,]*(?:\.\d{2})?)/g, (match: string, amount: string, offset: number, whole: string) => {
    const before = whole.slice(Math.max(0, offset - 40), offset);
    const after = whole.slice(offset + match.length, offset + match.length + 40);
    const hint = DOLLAR_KEY_HINTS.find((h) => (h.after?.test(after) ?? false) || (h.before?.test(before) ?? false));
    return `$ ${placeholder(hint?.key ?? 'amount', amount)}`;
  });
  text = text.replace(/\b(?:19|20)\d{2}\b(?=\s+[A-Z])/g, (m) => placeholder('modelYear', m));

  return { snippet: `${text.trim()}\n\n${DISCLOSURE_BOILERPLATE}`, replacements, issues };
}
