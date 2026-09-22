// Mock variable database for the Disclosure Snippet Builder — the set of {variableName} tokens
// the AI templatizer is allowed to use when converting a raw disclosure into a reusable snippet,
// and that the "Add Variable" / click-to-replace pickers in the snippet editor search over.
// There is no real variables backend yet (see DisclosureSnippetDialog.tsx), so this file is the
// single place to add, rename, or re-describe a variable.

export interface DisclosureVariable {
  /** Used inside the disclosure text as {key}. */
  key: string;
  /** Human label shown in the variable picker's search list. */
  label: string;
  /** Grouping shown as a section header in the picker. */
  category: string;
  /** Substituted in for {key} when rendering the Preview tab. */
  sampleValue: string;
}

export const DISCLOSURE_VARIABLES: DisclosureVariable[] = [
  // Vehicle
  { key: 'vehicleModel', label: 'Vehicle Model', category: 'Vehicle', sampleValue: 'X3 xDrive30i' },
  { key: 'modelYear', label: 'Model Year', category: 'Vehicle', sampleValue: '2025' },
  { key: 'vin', label: 'VIN', category: 'Vehicle', sampleValue: '5UX43DP08S9T12345' },
  { key: 'vinNumber', label: 'VIN Number', category: 'Vehicle', sampleValue: '5UX43DP08S9T12345' },
  { key: 'msrp', label: 'MSRP', category: 'Vehicle', sampleValue: '52,750' },
  { key: 'vehicleSalesPrice', label: 'Total MSRP (After Dealer Participation)', category: 'Vehicle', sampleValue: '51,550' },
  { key: 'dealerDiscount', label: 'Dealer Discount', category: 'Vehicle', sampleValue: '1,200' },
  { key: 'leaseSuggestedDealerDiscount', label: 'Lease Suggested Dealer Discount', category: 'Vehicle', sampleValue: '1,200' },

  // Payment
  { key: 'totalDueAtSigning', label: 'Total Due at Signing', category: 'Payment', sampleValue: '2,999' },
  { key: 'monthlyPayment', label: 'Monthly Payment', category: 'Payment', sampleValue: '429' },
  { key: 'downPayment', label: 'Down Payment', category: 'Payment', sampleValue: '2,999' },
  { key: 'apr', label: 'APR', category: 'Payment', sampleValue: '4.9' },
  { key: 'termMonths', label: 'Term (Months)', category: 'Payment', sampleValue: '36' },
  { key: 'milesPerYear', label: 'Miles Per Year', category: 'Payment', sampleValue: '10,000' },
  { key: 'centsPerMile', label: 'Cents Per Mile Over', category: 'Payment', sampleValue: '0.20' },
  { key: 'securityDeposit', label: 'Security Deposit', category: 'Payment', sampleValue: '0' },
  { key: 'docFee', label: 'Doc Fee', category: 'Payment', sampleValue: '85' },

  // Offer
  { key: 'leaseExpirationDate', label: 'Lease Expiration Date', category: 'Offer', sampleValue: '11/30/2026' },
  { key: 'offerExpirationDate', label: 'Offer Expiration Date', category: 'Offer', sampleValue: '11/30/2026' },
  { key: 'dealerName', label: 'Dealer Name', category: 'Offer', sampleValue: 'Honda Downtown LA' },

  // Rebates (1–6, matching the fixed boilerplate paragraph appended to every generated snippet)
  ...[1, 2, 3, 4, 5, 6].flatMap((n) => [
    { key: `leaseRebate${n}Amount`, label: `Lease Rebate ${n} Amount`, category: 'Rebates', sampleValue: n === 1 ? '1,000' : '0' },
    { key: `leaseRebate${n}Name`, label: `Lease Rebate ${n} Name`, category: 'Rebates', sampleValue: n === 1 ? 'Loyalty Credit' : '' },
    { key: `leaseRebate${n}Disclosure`, label: `Lease Rebate ${n} Disclosure`, category: 'Rebates', sampleValue: n === 1 ? 'Must qualify for BMW Loyalty pricing.' : '' },
  ]),

  // Dealer Fees (1–6, matching the fixed boilerplate paragraph appended to every generated snippet)
  ...[1, 2, 3, 4, 5, 6].flatMap((n) => [
    { key: `leaseDealerFee${n}Name`, label: `Lease Dealer Fee ${n} Name`, category: 'Dealer Fees', sampleValue: n === 1 ? 'Doc Fee' : '' },
    { key: `leaseDealerFee${n}Value`, label: `Lease Dealer Fee ${n} Value`, category: 'Dealer Fees', sampleValue: n === 1 ? '85' : '0' },
  ]),

  // VIN list
  { key: 'dynamicVinList', label: 'Dynamic VIN List', category: 'VIN', sampleValue: '5UX43DP08S9T12345, 5UX43DP09S9T12346' },
  { key: 'VIN', label: 'VIN (Uppercase)', category: 'VIN', sampleValue: '5UX43DP08S9T12345' },
];

export function getDisclosureVariable(key: string): DisclosureVariable | undefined {
  return DISCLOSURE_VARIABLES.find((v) => v.key === key);
}
