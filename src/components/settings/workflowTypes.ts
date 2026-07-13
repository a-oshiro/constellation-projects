export type ReplacementMethod = 'same-ymmt' | 'different-ymmt';

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

// ── Approval requirement ─────────────────────────────────────────────────────

export type ApprovalRequirement = 'auto-swap' | 'request-approval';

export const APPROVAL_REQUIREMENTS: { value: ApprovalRequirement; label: string; helper: string }[] = [
  {
    value: 'auto-swap',
    label: 'Auto-Swap Offers',
    helper: 'Offers will be automatically replaced with the best recommendation. A confirmation email will be sent to the Project and Offers task owners.',
  },
  {
    value: 'request-approval',
    label: 'Request Approval',
    helper: 'An email will be sent to Project and Offers task owners to approve the replacement.',
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
