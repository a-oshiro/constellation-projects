// ── Mock data model for the Project Content View dialog's "Enrollment Settings" tab ──
// Purely local/demo state — there is no backend for these yet, so each project's edits
// live in an in-memory store (see enrollmentSettingsStore.ts) that persists only for the
// current browser session.

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

export interface DisclosureBlock {
  id: 'lease' | 'cash' | 'finance';
  label: string;
  optional: boolean;
  enabled: boolean;
  text: string;
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
  docFee: number | null;
  additionalFees: AdditionalFee[];
}

const LEASE_DISCLOSURE_DEFAULT =
  '${totalDueAtSigning} due at signing which includes an ${docFee} document fee and any dealer ad-on\'s, {milesPerYear} annual miles, ${centsPerMile} per mile thereafter, no security deposit required. Subject to credit approval by BMW Financial. Lease terms based on {vin} with MSRP of ${msrp} less ${dealerDiscount} dealer participation for total MSRP of ${vehicleSalesPrice}. Excludes taxes, license, registration, and government fees. Prices may vary depending on vehicle. *Loyalty Credit Offers available to qualified customers who have leased or financed a BMW vehicle through BMW Financial Services NA, LLC in the last 12 months. To qualify for a BMW Loyalty Offer, loyal current or former BMW owners or lessees must show proof of ownership or BMW Financial Services account number and qualify for credit approval. Visit your authorized BMW Center for important details. Offer expires {leaseExpirationDate}. Subject to prior sale.';

function vehicle(id: string, model: string, year: number, selected: boolean): VehicleModelYear {
  return { id, model, year, selected, trimsMode: 'core', offerMode: 'oem' };
}

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
      { id: 'lease', label: 'Lease Disclosure', optional: false, enabled: true, text: LEASE_DISCLOSURE_DEFAULT },
      { id: 'cash', label: 'Cash Disclosure', optional: true, enabled: false, text: '' },
      { id: 'finance', label: 'Finance Disclosure', optional: true, enabled: false, text: '' },
    ],
    docFee: 85,
    additionalFees: [],
  };
}

export const MODEL_YEAR_OPTIONS = ['all', '2027', '2026', '2025'] as const;
