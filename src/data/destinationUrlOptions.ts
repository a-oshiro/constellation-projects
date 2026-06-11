// ── Editable URL options list ─────────────────────────────────────────────────
// Add, remove or edit entries here to update the available destination URLs
// across all HTML asset metadata panels.

export interface DestinationUrlOption {
  label: string;
  url: string;
}

export const DESTINATION_URL_OPTIONS: DestinationUrlOption[] = [
  // X1
  { label: 'Specials X1', url: 'https://www.bmwseattle.com/specials/x1' },
  { label: 'New Inventory - X1', url: 'https://www.bmwseattle.com/inventory/new/x1' },
  { label: 'Offer Details X1', url: 'https://www.bmwseattle.com/offer-details/x1' },
  // X3
  { label: 'Specials X3', url: 'https://www.bmwseattle.com/specials/x3' },
  { label: 'New Inventory - X3', url: 'https://www.bmwseattle.com/inventory/new/x3' },
  { label: 'Offer Details X3', url: 'https://www.bmwseattle.com/offer-details/x3' },
  // X5
  { label: 'Specials X5', url: 'https://www.bmwseattle.com/specials/x5' },
  { label: 'New Inventory - X5', url: 'https://www.bmwseattle.com/inventory/new/x5' },
  { label: 'Offer Details X5', url: 'https://www.bmwseattle.com/offer-details/x5' },
  // X6
  { label: 'Specials X6', url: 'https://www.bmwseattle.com/specials/x6' },
  { label: 'New Inventory - X6', url: 'https://www.bmwseattle.com/inventory/new/x6' },
  { label: 'Offer Details X6', url: 'https://www.bmwseattle.com/offer-details/x6' },
  // X7
  { label: 'Specials X7', url: 'https://www.bmwseattle.com/specials/x7' },
  { label: 'New Inventory - X7', url: 'https://www.bmwseattle.com/inventory/new/x7' },
  { label: 'Offer Details X7', url: 'https://www.bmwseattle.com/offer-details/x7' },
  // i4
  { label: 'Specials i4', url: 'https://www.bmwseattle.com/specials/i4' },
  { label: 'New Inventory - i4', url: 'https://www.bmwseattle.com/inventory/new/i4' },
  { label: 'Offer Details i4', url: 'https://www.bmwseattle.com/offer-details/i4' },
  // i5
  { label: 'Specials i5', url: 'https://www.bmwseattle.com/specials/i5' },
  { label: 'New Inventory - i5', url: 'https://www.bmwseattle.com/inventory/new/i5' },
  { label: 'Offer Details i5', url: 'https://www.bmwseattle.com/offer-details/i5' },
  // iX
  { label: 'Specials iX', url: 'https://www.bmwseattle.com/specials/ix' },
  { label: 'New Inventory - iX', url: 'https://www.bmwseattle.com/inventory/new/ix' },
  { label: 'Offer Details iX', url: 'https://www.bmwseattle.com/offer-details/ix' },
  // 228i Gran Coupe
  { label: 'Specials 228i', url: 'https://www.bmwseattle.com/specials/228i' },
  { label: 'New Inventory - 228i', url: 'https://www.bmwseattle.com/inventory/new/228i' },
  { label: 'Offer Details 228i', url: 'https://www.bmwseattle.com/offer-details/228i' },
  // 330i / 3 Series
  { label: 'Specials 330i', url: 'https://www.bmwseattle.com/specials/330i' },
  { label: 'New Inventory - 330i', url: 'https://www.bmwseattle.com/inventory/new/330i' },
  { label: 'Offer Details 330i', url: 'https://www.bmwseattle.com/offer-details/330i' },
  { label: 'Specials 3 Series', url: 'https://www.bmwseattle.com/specials/3-series' },
  { label: 'New Inventory - 3 Series', url: 'https://www.bmwseattle.com/inventory/new/3-series' },
  { label: 'Offer Details 3 Series', url: 'https://www.bmwseattle.com/offer-details/3-series' },
  // Generic
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
  // tmpl-4: BMW HTML 720×300
  'tmpl-4': [
    { key: 'claimOffer',  label: 'Claim Offer – Destination URL' },
    { key: 'seeNewVehicles', label: 'See New Vehicles – Destination URL' },
    { key: 'tradeIn',    label: 'Trade-In – Destination URL' },
  ],
};

/** Returns the CTA fields for a given templateId, or [] if not an HTML template. */
export function getTemplateCtas(templateId: string): CtaField[] {
  return HTML_TEMPLATE_CTAS[templateId] ?? [];
}
