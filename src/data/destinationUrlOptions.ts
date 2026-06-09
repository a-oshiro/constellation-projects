// ── Editable URL options list ─────────────────────────────────────────────────
// Add, remove or edit entries here to update the available destination URLs
// across all HTML asset metadata panels.

export interface DestinationUrlOption {
  label: string;
  url: string;
}

export const DESTINATION_URL_OPTIONS: DestinationUrlOption[] = [
  { label: 'Specials X1', url: 'https://www.bmwseattle.com/specials/x1' },
  { label: 'New Inventory - X1', url: 'https://www.bmwseattle.com/inventory/new/x1' },
  { label: 'Offer Details X1', url: 'https://www.bmwseattle.com/offer-details/x1' },
  { label: 'Specials X3', url: 'https://www.bmwseattle.com/specials/x3' },
  { label: 'New Inventory - X3', url: 'https://www.bmwseattle.com/inventory/new/x3' },
  { label: 'Offer Details X3', url: 'https://www.bmwseattle.com/offer-details/x3' },
  { label: 'Specials i4', url: 'https://www.bmwseattle.com/specials/i4' },
  { label: 'New Inventory - i4', url: 'https://www.bmwseattle.com/inventory/new/i4' },
  { label: 'Offer Details i4', url: 'https://www.bmwseattle.com/offer-details/i4' },
  { label: 'Specials 3 Series', url: 'https://www.bmwseattle.com/specials/3-series' },
  { label: 'New Inventory - 3 Series', url: 'https://www.bmwseattle.com/inventory/new/3-series' },
  { label: 'Offer Details 3 Series', url: 'https://www.bmwseattle.com/offer-details/3-series' },
  { label: 'Value Trade', url: 'https://www.bmwseattle.com/value-trade' },
  { label: 'Contact Dealer', url: 'https://www.bmwseattle.com/contact' },
  { label: 'Build Your BMW', url: 'https://www.bmw.com/en/build-your-own.html' },
];

// ── CTA definitions per template type ────────────────────────────────────────
// Extend this map when adding new HTML templates with different CTAs.

export interface CtaField {
  key: string;
  label: string;
}

export const HTML_TEMPLATE_CTAS: Record<string, CtaField[]> = {
  // tmpl-3: BMW HTML 1100×560
  'tmpl-3': [
    { key: 'claimSpecial',  label: 'Claim Special – Destination URL' },
    { key: 'viewInventory', label: 'View Inventory – Destination URL' },
    { key: 'valueTrade',    label: 'Value Your Trade – Destination URL' },
    { key: 'offerDetails',  label: 'Offer Details – Destination URL' },
  ],
};

/** Returns the CTA fields for a given templateId, or [] if not an HTML template. */
export function getTemplateCtas(templateId: string): CtaField[] {
  return HTML_TEMPLATE_CTAS[templateId] ?? [];
}
