export type ReplacementMethod = 'same-ymmt' | 'different-ymmt';

export type WorkflowStatus = 'active' | 'inactive';

export interface DealerAccount {
  id: string;
  name: string;
  brand: 'BMW' | 'Honda' | 'Toyota';
}

// ── Mock accounts — dealerships across the US, mixed brands ────────────────────
export const ACCOUNTS: DealerAccount[] = [
  { id: 'acc-1', name: 'Advantage BMW Midtown', brand: 'BMW' },
  { id: 'acc-2', name: 'BMW of Akron', brand: 'BMW' },
  { id: 'acc-3', name: 'BMW of Annapolis', brand: 'BMW' },
  { id: 'acc-4', name: 'BMW of Bloomington', brand: 'BMW' },
  { id: 'acc-5', name: 'BMW of Columbia', brand: 'BMW' },
  { id: 'acc-6', name: 'BMW of Devon', brand: 'BMW' },
  { id: 'acc-7', name: 'BMW of El Cajon', brand: 'BMW' },
  { id: 'acc-8', name: 'BMW of Fresno', brand: 'BMW' },
  { id: 'acc-9', name: 'BMW of Georgetown', brand: 'BMW' },
  { id: 'acc-10', name: 'BMW of Houston North', brand: 'BMW' },
  { id: 'acc-11', name: 'BMW of Ontario', brand: 'BMW' },
  { id: 'acc-12', name: 'BMW of Palm Springs', brand: 'BMW' },
  { id: 'acc-13', name: 'BMW of Rockville', brand: 'BMW' },
  { id: 'acc-14', name: 'BMW of Sterling', brand: 'BMW' },
  { id: 'acc-15', name: 'BMW of Tucson', brand: 'BMW' },
  { id: 'acc-16', name: 'Honda of Austin', brand: 'Honda' },
  { id: 'acc-17', name: 'Honda of Bellevue', brand: 'Honda' },
  { id: 'acc-18', name: 'Honda of Charlotte', brand: 'Honda' },
  { id: 'acc-19', name: 'Honda of Chicago', brand: 'Honda' },
  { id: 'acc-20', name: 'Honda of Columbus', brand: 'Honda' },
  { id: 'acc-21', name: 'Honda of Denver', brand: 'Honda' },
  { id: 'acc-22', name: 'Honda of Downtown LA', brand: 'Honda' },
  { id: 'acc-23', name: 'Honda of Kirkland', brand: 'Honda' },
  { id: 'acc-24', name: 'Honda of Miami', brand: 'Honda' },
  { id: 'acc-25', name: 'Honda of Nashua', brand: 'Honda' },
  { id: 'acc-26', name: 'Honda of Ocala', brand: 'Honda' },
  { id: 'acc-27', name: 'Honda of Pasadena', brand: 'Honda' },
  { id: 'acc-28', name: 'Honda of Seattle', brand: 'Honda' },
  { id: 'acc-29', name: 'Honda of Slidell', brand: 'Honda' },
  { id: 'acc-30', name: 'Honda of Superstition Springs', brand: 'Honda' },
  { id: 'acc-31', name: 'Toyota of Bellevue', brand: 'Toyota' },
  { id: 'acc-32', name: 'Toyota of Boerne', brand: 'Toyota' },
  { id: 'acc-33', name: 'Toyota of Cedar Park', brand: 'Toyota' },
  { id: 'acc-34', name: 'Toyota of Clermont', brand: 'Toyota' },
  { id: 'acc-35', name: 'Toyota of Dallas', brand: 'Toyota' },
  { id: 'acc-36', name: 'Toyota of Denton', brand: 'Toyota' },
  { id: 'acc-37', name: 'Toyota of Greenville', brand: 'Toyota' },
  { id: 'acc-38', name: 'Toyota of Nashville', brand: 'Toyota' },
  { id: 'acc-39', name: 'Toyota of Orlando', brand: 'Toyota' },
  { id: 'acc-40', name: 'Toyota of Portland', brand: 'Toyota' },
  { id: 'acc-41', name: 'Toyota of Renton', brand: 'Toyota' },
  { id: 'acc-42', name: 'Toyota of Sacramento', brand: 'Toyota' },
  { id: 'acc-43', name: 'Toyota of Santa Fe', brand: 'Toyota' },
  { id: 'acc-44', name: 'Toyota of Tampa Bay', brand: 'Toyota' },
  { id: 'acc-45', name: 'Toyota of Whittier', brand: 'Toyota' },
];

export const BMW_ACCOUNT_IDS = ACCOUNTS.filter((a) => a.brand === 'BMW').map((a) => a.id);
export const ALL_ACCOUNT_IDS = ACCOUNTS.map((a) => a.id);

export const accountById = (id: string) => ACCOUNTS.find((a) => a.id === id);

export interface WorkflowFilterCatalogEntry {
  key: string;
  label: string;
  options: string[];
}

export interface WorkflowFilter {
  id: string;
  filterKey: string;
  label: string;
  value: string;
}

export interface WorkflowStepConfig {
  id: string;
  name: string;
  replacementMethod: ReplacementMethod;
  filters: WorkflowFilter[];
  strategy: string[];
}

export interface OfferReplacementWorkflow {
  id: string;
  name: string;
  steps: WorkflowStepConfig[];
  accountIds: string[];
  status: WorkflowStatus;
}

export const REPLACEMENT_METHODS: { value: ReplacementMethod; label: string; shortLabel: string; helper: string }[] = [
  {
    value: 'same-ymmt',
    label: 'Same YMMT',
    shortLabel: 'Exact Match, different VIN',
    helper: 'Finds offers with same exact YMMT but different VIN',
  },
  {
    value: 'different-ymmt',
    label: 'Different YMMT',
    shortLabel: 'Different YMMT',
    helper: 'Finds offers with a different YMMT that still matches your criteria',
  },
];

export const FILTER_CATALOG: WorkflowFilterCatalogEntry[] = [
  { key: 'offer-type', label: 'Offer Type', options: ['Same Offer Type', 'Different Offer Type'] },
  { key: 'total-price-tolerance', label: 'Total Price Tolerance', options: ['+- $500', '+- $1,000', '+- $2,000'] },
  { key: 'monthly-payment-tolerance', label: 'Monthly Payment Tolerance', options: ['+- $50', '+- $100', '+- $200'] },
  { key: 'year', label: 'Year', options: ['Same Year', '+/- 1 Year', '+/- 2 Years'] },
  { key: 'mileage', label: 'Mileage', options: ['+/- 5,000 mi', '+/- 10,000 mi', '+/- 15,000 mi'] },
  { key: 'trim-level', label: 'Trim Level', options: ['Same Trim', 'Any Trim'] },
  { key: 'exterior-color', label: 'Exterior Color', options: ['Same Color', 'Any Color'] },
];

export const STRATEGY_CATALOG: string[] = [
  'Highest PVI',
  'Largest Inventory',
  'Days in lot',
  'Total Price',
  'Closest Total Price',
  'Closest Monthly Payment',
  'Newest Model Year',
  'Lowest Mileage',
  'Closest Distance',
];

export interface FallbackStepConfig {
  pauseAds: boolean;
  notifyAdmins: boolean;
  /** Each entry formatted as "First Last (email@company.com)" */
  admins: string[];
}

export const ADMIN_OPTIONS: string[] = [
  'John Doe (john.doe@company.com)',
  'Michael Stuart (m.stuart@company.com)',
  'Olivia Douglas (olivia.d@company.com)',
  'Sarah Chen (sarah.chen@company.com)',
  'David Kim (david.kim@company.com)',
  'Priya Patel (priya.patel@company.com)',
];

export function createDefaultFallbackStep(): FallbackStepConfig {
  return {
    pauseAds: true,
    notifyAdmins: true,
    admins: ADMIN_OPTIONS.slice(0, 3),
  };
}

export function getFallbackTitle({ pauseAds, notifyAdmins }: FallbackStepConfig): string {
  if (pauseAds && notifyAdmins) return 'Fallback: Pause Offer and Notify Admin';
  if (pauseAds) return 'Fallback: Pause Offer';
  if (notifyAdmins) return 'Fallback: Notify Admin';
  return 'Fallback: No Action';
}

export function getFallbackDescription({ pauseAds, notifyAdmins }: FallbackStepConfig): string {
  const parts: string[] = [];
  if (pauseAds) parts.push("ads containing the 'Out of Stock' offer will be paused");
  if (notifyAdmins) parts.push('all selected admins will be notified');
  if (parts.length === 0) return 'No action will be taken.';
  const text = parts.join(' and ');
  return text.charAt(0).toUpperCase() + text.slice(1) + '.';
}

/** Pulls the email out of an "First Last (email@company.com)" admin entry. */
export function extractAdminEmail(admin: string): string {
  return admin.match(/\(([^)]+)\)/)?.[1] ?? admin;
}

let stepIdCounter = 0;
export function createDefaultStep(): WorkflowStepConfig {
  stepIdCounter += 1;
  return {
    id: `step-${Date.now()}-${stepIdCounter}`,
    name: '',
    replacementMethod: 'same-ymmt',
    filters: [],
    strategy: ['Highest PVI'],
  };
}
