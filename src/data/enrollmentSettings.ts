// ── Mock data model for the Project Content View dialog's "Enrollment Settings" tab ──
// Purely local/demo state — there is no backend for these yet, so each project's edits
// live in an in-memory store (see enrollmentSettingsStore.ts) that persists only for the
// current browser session.

import type { DisclosureReplacement } from '../utils/disclosureSnippetColors';

export interface VehicleModelYear {
  id: string;
  model: string;
  year: number;
  selected: boolean;
  trimsMode: 'core' | 'select';
  offerMode: 'oem' | 'custom';
}

export interface VinPriorityCriterion {
  id: string;
  label: string;
  description: string;
  active: boolean;
}

export interface AgedDiscountWindow {
  id: string;
  label: string;
  dayRange: string;
  /** The "Under 60 days" window has no editable percentage — it just references the base discount. */
  editable: boolean;
  discountPct: number | null;
}

export interface DistributionChannel {
  id: string;
  label: string;
  selected: boolean;
}

export interface AdditionalFee {
  id: string;
  label: string;
  amount: number | null;
}

/** Metadata for the account's disclosure snippet once it's been built via the Disclosure Snippet Builder. */
export interface DisclosureSnippetMeta {
  id: string;
  name: string;
  tags: string[];
  folder: string;
  brands: string[];
  expirationDate: string | null;
  websiteDescription: string;
  websiteNotes: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  /** The raw disclosure text as originally pasted in, before AI templatization — powers the comparison view. */
  sourceText: string;
  /** Which {variable} replaced which exact substring of `sourceText`, as reported by the AI generation call — powers the comparison view's color-matching. */
  replacements: DisclosureReplacement[];
}

/** A disclosure type's raw text templatized into {variable} placeholders — generated automatically as the raw text is entered. */
export interface DisclosureTemplate {
  /** The templatized text, with {variable} placeholders (editable). */
  text: string;
  /** Which {variable} replaced which exact substring of `sourceText` — powers the value/variable color-matching. */
  replacements: DisclosureReplacement[];
  /** The raw disclosure text this template was generated from. */
  sourceText: string;
  generatedAt: string;
}

export interface DisclosureBlock {
  id: 'lease' | 'apr' | 'finance' | 'cash';
  label: string;
  /** The raw client-provided disclosure text. */
  text: string;
  template: DisclosureTemplate | null;
  /** "Apply to automated offers" — whether this type's template is combined into the account snippet. */
  includeInSnippet: boolean;
}

/** The single text snippet an account's disclosures are built into — one per account, covering every disclosure type. */
export interface AccountDisclosureSnippet {
  meta: DisclosureSnippetMeta;
  /** The templatized snippet text, with {variable} placeholders. */
  text: string;
  /** The disclosures as they were when the snippet was last generated or updated — what "Discard Changes" restores. */
  disclosures: DisclosureBlock[];
}

export interface EnrollmentSettings {
  modelYearFilter: string;
  vehicleSearch: string;
  vehicles: VehicleModelYear[];
  vinPriorities: VinPriorityCriterion[];
  agedDiscounts: AgedDiscountWindow[];
  agencyName: string;
  channels: DistributionChannel[];
  otherChannels: string[];
  disclosures: DisclosureBlock[];
  disclosureSnippet: AccountDisclosureSnippet | null;
  docFee: number | null;
  additionalFees: AdditionalFee[];
}

function vehicle(id: string, model: string, year: number, selected: boolean): VehicleModelYear {
  return { id, model, year, selected, trimsMode: 'core', offerMode: 'oem' };
}

// TEST DATA — Lease and Cash start pre-filled so combining several disclosure types into one snippet can be
// tried without pasting text each time. Their templates are generated on first view of the Disclosures page.
// Reset both to '' to start the page empty again.
const SAMPLE_LEASE_DISCLOSURE = "$2,999 due at signing, which includes an $895 document fee and any dealer ad-on's, 10,000 annual miles, $0.20 per mile thereafter, no security deposit required. Subject to credit approval by BMW Financial. Lease terms based on 2025 BMW X3 xDrive30i with MSRP of $52,750 less $1,200 dealer participation for total MSRP of $51,550. Excludes taxes, license, registration, and government fees. Prices may vary depending on vehicle. Offer expires 11/30/2026. Subject to prior sale.";
const SAMPLE_CASH_DISCLOSURE = 'Cash price of $48,995 for 2025 BMW X3 xDrive30i with MSRP of $52,750 less $3,755 dealer discount, plus an $895 document fee. Excludes taxes, license, registration, and government fees. Prices may vary depending on vehicle. Offer expires 11/30/2026. Subject to prior sale.';

/** Builds a brand-new default settings object — called once per project the first time its dialog opens. */
export function buildDefaultEnrollmentSettings(): EnrollmentSettings {
  return {
    modelYearFilter: 'all',
    vehicleSearch: '',
    vehicles: [
      vehicle('veh-3series-2026', '3 Series', 2026, true),
      vehicle('veh-5series-2026', '5 Series', 2026, true),
      vehicle('veh-i4-2026', 'i4', 2026, true),
      vehicle('veh-ix-2026', 'iX', 2026, true),
      vehicle('veh-x3-2026', 'X3', 2026, true),
      vehicle('veh-x5-2026', 'X5', 2026, true),
      vehicle('veh-i-2026', 'I', 2026, false),
      vehicle('veh-2series-2027', '2 Series', 2027, false),
      vehicle('veh-2series-2026', '2 Series', 2026, false),
      vehicle('veh-2series-2025', '2 Series', 2025, false),
      vehicle('veh-3series-2025', '3 Series', 2025, false),
      vehicle('veh-4series-2027', '4 Series', 2027, false),
      vehicle('veh-4series-2026', '4 Series', 2026, false),
      vehicle('veh-x1-2026', 'X1', 2026, false),
      vehicle('veh-x7-2026', 'X7', 2026, false),
      vehicle('veh-xm-2026', 'XM', 2026, false),
    ],
    vinPriorities: [
      { id: 'vin-lowest-msrp', label: 'Lowest MSRP', description: 'Advertise the cheapest example', active: true },
      { id: 'vin-aging', label: 'Aging', description: 'How long the vehicle has been listed', active: true },
    ],
    agedDiscounts: [
      { id: 'aged-under-60', label: 'Under 60 days', dayRange: 'Day 1–59', editable: false, discountPct: null },
      { id: 'aged-60', label: '60 days', dayRange: 'Day 60–74', editable: true, discountPct: null },
      { id: 'aged-75', label: '75 days', dayRange: 'Day 75–89', editable: true, discountPct: null },
      { id: 'aged-90', label: '90 days', dayRange: 'Day 90–119', editable: true, discountPct: null },
      { id: 'aged-120', label: '120 days', dayRange: 'Day 120–179', editable: true, discountPct: null },
      { id: 'aged-180', label: '180+ days', dayRange: 'Day 180+', editable: true, discountPct: null },
    ],
    agencyName: '',
    channels: [
      { id: 'channel-website', label: 'Your website', selected: false },
      { id: 'channel-social', label: 'Facebook and Instagram', selected: false },
      { id: 'channel-programmatic', label: 'Programmatic Display', selected: false },
      { id: 'channel-video', label: 'Video (CTV/OTT, YouTube, etc.)', selected: false },
      { id: 'channel-email', label: 'Email Banners', selected: false },
    ],
    otherChannels: [],
    disclosures: [
      { id: 'lease', label: 'Lease', text: SAMPLE_LEASE_DISCLOSURE, template: null, includeInSnippet: true },
      { id: 'apr', label: 'APR', text: '', template: null, includeInSnippet: true },
      { id: 'finance', label: 'Finance', text: '', template: null, includeInSnippet: true },
      { id: 'cash', label: 'Cash', text: SAMPLE_CASH_DISCLOSURE, template: null, includeInSnippet: true },
    ],
    disclosureSnippet: null,
    docFee: 85,
    additionalFees: [],
  };
}

export const MODEL_YEAR_OPTIONS = ['all', '2027', '2026', '2025'] as const;
