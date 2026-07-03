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

export const FALLBACK_STEP = {
  title: 'Fallback: Pause Offer and Notify Admin',
  description: "Ads containing the 'Out of Stock' offer will be paused and all selected admins will be notified.",
  admins: ['John Doe', 'Michael Stuart', 'Olivia Douglas'],
};

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
