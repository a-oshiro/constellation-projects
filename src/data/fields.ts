// ── Client Settings › Fields ─────────────────────────────────────────────────
// Client fields are created from Client Settings › Fields. Global fields come from Platform
// Settings (not built yet) — they can be edited from Client Settings but not deleted there.

export type FieldSource = 'Client' | 'Global';

export type FieldType = 'Select' | 'Multi Select' | 'Plain Text' | 'Date';

export interface Field {
  id: string;
  name: string;
  source: FieldSource;
  type: FieldType;
  /** Always sorted alphabetically. Empty for Plain Text and Date fields. */
  values: string[];
}

export const FIELD_TYPES: FieldType[] = ['Select', 'Multi Select', 'Plain Text', 'Date'];

export const fieldTypeHasOptions = (type: FieldType) => type === 'Select' || type === 'Multi Select';

/** Trims, drops blanks, dedupes case-insensitively and sorts alphabetically. */
export function normalizeFieldOptions(options: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of options) {
    const value = raw.trim();
    const key = value.toLowerCase();
    if (!value || seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true }));
}

const field = (id: string, name: string, source: FieldSource, type: FieldType, values: string[] = []): Field => ({
  id, name, source, type, values: normalizeFieldOptions(values),
});

export const INITIAL_FIELDS: Field[] = [
  field('fld-account', 'Account', 'Client', 'Select', [
    'ABC Hyundai', 'Autobahn Porsche', 'Baker INFINITI Charleston', 'BMW of Manhattan', 'BMW of Brooklyn',
    'Crevier BMW', 'Hendrick Honda', 'Jaguar Land Rover Austin', 'Lexus of Pleasanton', 'MINI of Sterling',
    'Park Place Lexus', 'Porsche Beverly Hills', 'Toyota of Orlando',
  ]),
  field('fld-additional-lease-disclosure', 'additional lease disclosure', 'Client', 'Plain Text'),
  field('fld-asset-expiration-date', 'asset expiration date', 'Client', 'Date'),
  field('fld-asset-type', 'asset type', 'Client', 'Select', ['Display', 'Email', 'Misc', 'Social', 'Website']),
  field('fld-brand', 'brand', 'Global', 'Select', [
    'Acura', 'Audi', 'BMW', 'Chevrolet', 'Chrysler', 'GMC', 'Honda', 'Kia', 'Lexus', 'MINI',
    'Nissan', 'Subaru', 'Toyota', 'Volkswagen',
  ]),
  field('fld-channel', 'channel', 'Global', 'Multi Select', ['Google', 'Meta', 'Programmatic', 'TikTok']),
  field('fld-collection', 'Collection', 'Client', 'Select', [
    'Amusement Park Beach', 'Blue Sky Road', 'Blue Water Lot', 'Campsite Trailer',
    'Mist Sunrise Boardwalk', 'White Modern Building',
  ]),
  field('fld-cta', 'cta', 'Client', 'Plain Text'),
  field('fld-disclosure', 'disclosure', 'Global', 'Plain Text'),
  field('fld-fluency-ready', 'Fluency Ready', 'Client', 'Select', ['Approved', 'Pending']),
  field('fld-holidays', 'Holidays', 'Client', 'Multi Select', ['Labor Day', 'July 4th', 'Veterans Day', 'Memorial Day']),
  field('fld-launch-date', 'launch date', 'Global', 'Date'),
  field('fld-make', 'make', 'Global', 'Select', [
    'Acura', 'Audi', 'BMW', 'Buick', 'Cadillac', 'Chevrolet', 'Chrysler', 'Dodge', 'Ford', 'GMC',
    'Honda', 'Hyundai', 'Infiniti', 'Jeep', 'Kia', 'Land Rover', 'Lexus', 'Lincoln', 'Mazda',
    'Mercedes-Benz', 'MINI', 'Nissan', 'Porsche', 'Ram', 'Subaru', 'Toyota',
  ]),
  field('fld-model', 'model', 'Global', 'Select', [
    '3 Series', '5 Series', '228', '230i', '330i', '530i', '540i', '550e', '1500', 'A3 Sedan',
    'A4', 'Accord', 'Camry', 'CR-V', 'Civic', 'Equinox', 'Explorer', 'F-150', 'RAV4', 'Silverado',
    'Tiguan', 'X1', 'X3', 'X5', 'X7',
  ]),
  field('fld-offer-headline', 'offer headline', 'Client', 'Plain Text'),
  field('fld-region', 'region', 'Global', 'Multi Select', ['Central', 'Northeast', 'Southeast', 'Southwest', 'West']),
];
