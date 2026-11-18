// ── FeeSync — MOCK ONLY ────────────────────────────────────────────────────────
// The Account Settings › Fees tab's FeeSync source is a prototype: nothing here calls a real FeeSync API.
// Every "request" is a local promise that resolves (or rejects) after a short delay, and every fee comes
// from the fixed lists below, which match the fees in the CP-14705 Figma file exactly.

import type { Account } from './accounts';
import type { AppNotification } from '../context/notifications';

export type FeeTreatment = 'Standard' | 'Optional' | 'Excluded';

export interface FeeSyncFee {
  id: string;
  name: string;
  /** Dollars. */
  amount: number;
  offerTypes: string;
  /** Shown as a grey "(Optional)" suffix after the name. */
  optional?: boolean;
  /** Only the "fees updated" view (Figma Flow 2) shows a Treatment column. */
  treatment?: FeeTreatment;
  /** Shows a "New" status chip after the name (Figma Flow 2). */
  isNew?: boolean;
}

/** Figma Flow 1 (setup) and Flow 3 (refresh): the fees a first pull and a manual refresh return. */
export const FEE_SYNC_FEES: FeeSyncFee[] = [
  { id: 'doc-fee', name: 'Doc Fee', amount: 899, offerTypes: 'APR, Finance, Lease, Cash' },
  { id: 'electronic-filing-fee', name: 'Electronic Filing Fee', amount: 50, offerTypes: 'Finance, Lease' },
  { id: 'tire-battery-fee', name: 'Tire & Battery Fee', amount: 5, offerTypes: 'APR, Finance, Lease, Cash' },
  { id: 'nitrogen-fill', name: 'Nitrogen Fill', amount: 199, offerTypes: 'APR, Finance, Lease, Cash', optional: true },
  { id: 'dealer-prep', name: 'Dealer Prep', amount: 595, offerTypes: 'APR, Finance, Cash' },
];

const CPO_INSPECTION_FEE: FeeSyncFee = { id: 'cpo-inspection-fee', name: 'CPO Inspection Fee', amount: 395, offerTypes: 'Used only' };

/** Figma "Connection is lost afterwards": the Flow 1 fees plus the CPO Inspection Fee. */
export const FEE_SYNC_FEES_EXTENDED: FeeSyncFee[] = [...FEE_SYNC_FEES, CPO_INSPECTION_FEE];

/** Figma Flow 2 (opened from the "Fees have been updated" notification): treatment per fee, two new fees. */
export const FEE_SYNC_UPDATED_FEES: FeeSyncFee[] = [
  { ...FEE_SYNC_FEES[0], treatment: 'Standard', isNew: true },
  { ...FEE_SYNC_FEES[1], treatment: 'Standard', isNew: true },
  { ...FEE_SYNC_FEES[2], treatment: 'Standard' },
  { ...FEE_SYNC_FEES[3], treatment: 'Optional' },
  { ...FEE_SYNC_FEES[4], treatment: 'Standard' },
  { ...CPO_INSPECTION_FEE, treatment: 'Excluded' },
];

// ── What Constellation doesn't use from FeeSync (Option 2b "See details" dialog) ─────────────────
// Known limitations, applied automatically on every sync: Used vehicles aren't supported, "Include in
// Total Sale Price" isn't bundled into the selling price, and lease capitalization is disabled.

export interface FeeSyncUsedVehicleFee {
  name: string;
  amount: number;
  /** `excluded`: the fee applies to Used vehicles only. `brand-only`: it also covers a brand, so it applies to that brand only. */
  handling: 'excluded' | 'brand-only';
}

export interface FeeSyncUnsupportedSetting {
  /** The FeeSync setting, as FeeSync names it. */
  setting: string;
  /** What Constellation does instead. */
  instead: string;
  affectedFees: string[];
}

export interface FeeSyncLimitations {
  usedVehicleFees: FeeSyncUsedVehicleFee[];
  unsupportedSettings: FeeSyncUnsupportedSetting[];
}

export const FEE_SYNC_LIMITATIONS: FeeSyncLimitations = {
  usedVehicleFees: [
    { name: 'Reconditioning Fee', amount: 895, handling: 'excluded' },
    { name: CPO_INSPECTION_FEE.name, amount: CPO_INSPECTION_FEE.amount, handling: 'excluded' },
    { name: 'Electronic Filing Fee', amount: 50, handling: 'excluded' },
  ],
  unsupportedSettings: [
    { setting: 'Include in Total Sale Price', instead: 'These fees are added on top of the selling price instead.', affectedFees: ['Doc Fee', 'Dealer Prep'] },
    { setting: 'Lease: Fee in cap cost', instead: 'The fee is charged separately instead of added to the cap cost.', affectedFees: ['Doc Fee', 'Electronic Filing Fee'] },
    { setting: 'Lease: Tax in cap cost', instead: 'The tax is charged separately instead of added to the cap cost.', affectedFees: ['Doc Fee', 'Tire & Battery Fee'] },
  ],
};

/** A FeeSync change that wasn't applied because applying it would break live offers; the previous setup is kept. */
export interface FeeSyncRejectedUpdate {
  feeName: string;
  change: string;
  reason: string;
  /** ISO time the update arrived. */
  receivedAt: string;
}

export const buildRejectedUpdate = (receivedAt: string): FeeSyncRejectedUpdate => ({
  feeName: 'Doc Fee',
  change: 'was changed to apply to Used vehicles only.',
  reason: 'Applying it would remove the fee from every offer, so the previous setup is still used.',
  receivedAt,
});

// ── Dealerships ────────────────────────────────────────────────────────────────

export interface FeeSyncDealership {
  name: string;
  brand: string;
  zipCode: string;
  /** Street, city, state and ZIP — shown as "Franchise supplying fees" once connected. */
  address: string;
}

/** Mock FeeSync franchise records, keyed by account id (accounts carry no address of their own). */
const DEALER_LOCATIONS: Record<string, { street: string; city: string; state: string; zip: string }> = {
  'acc-1': { street: '555 W 57th St', city: 'New York', state: 'NY', zip: '10019' },
  'acc-2': { street: '1302 Ninth Ave', city: 'Seattle', state: 'WA', zip: '98101' },
  'acc-3': { street: '1560 W Ogden Ave', city: 'Naperville', state: 'IL', zip: '60540' },
  'acc-4': { street: '1940 Rte 70 E', city: 'Cherry Hill', state: 'NJ', zip: '08003' },
  'acc-5': { street: '8001 Penn Ave S', city: 'Bloomington', state: 'MN', zip: '55431' },
  'acc-6': { street: '1700 N Central Expy', city: 'Plano', state: 'TX', zip: '75074' },
  'acc-7': { street: '1155 Alpharetta St', city: 'Roswell', state: 'GA', zip: '30075' },
  'acc-8': { street: '9200 Metcalf Ave', city: 'Overland Park', state: 'KS', zip: '66212' },
  'acc-9': { street: '17000 Chesterfield Airport Rd', city: 'Chesterfield', state: 'MO', zip: '63005' },
  'acc-10': { street: '1001 W Golf Rd', city: 'Schaumburg', state: 'IL', zip: '60194' },
  'acc-11': { street: '9800 E 116th St', city: 'Fishers', state: 'IN', zip: '46037' },
  'acc-12': { street: '8435 N Federal Blvd', city: 'Westminster', state: 'CO', zip: '80031' },
  'acc-13': { street: '1111 Walnut St', city: 'Cary', state: 'NC', zip: '27511' },
  'acc-14': { street: '1495 E Motorplex Loop', city: 'Gilbert', state: 'AZ', zip: '85297' },
  'acc-15': { street: '1600 Galleria Blvd', city: 'Franklin', state: 'TN', zip: '37067' },
  'acc-16': { street: '2400 N I-35', city: 'Round Rock', state: 'TX', zip: '78681' },
  'acc-17': { street: '13600 Southwest Fwy', city: 'Sugar Land', state: 'TX', zip: '77478' },
  'acc-18': { street: '1600 Westgate Cir', city: 'Brentwood', state: 'TN', zip: '37027' },
  'acc-19': { street: '8100 Hudson Rd', city: 'Woodbury', state: 'MN', zip: '55125' },
  'acc-20': { street: '1500 24th Ave NW', city: 'Norman', state: 'OK', zip: '73069' },
  'acc-21': { street: '5655 SH 121', city: 'Frisco', state: 'TX', zip: '75034' },
  'acc-22': { street: '1505 Mansell Rd', city: 'Alpharetta', state: 'GA', zip: '30009' },
  'acc-23': { street: '1815 Maplelawn Dr', city: 'Troy', state: 'MI', zip: '48084' },
  'acc-24': { street: '6100 Peachtree Dunwoody Rd', city: 'Sandy Springs', state: 'GA', zip: '30328' },
};

const FALLBACK_LOCATION = { street: '5000 Telegraph Rd', city: 'Bloomfield Hills', state: 'MI', zip: '48302' };

/** The FeeSync franchise this account matches — what the "Confirm dealership" screen offers. */
export function getFeeSyncDealership(account: Pick<Account, 'id' | 'name' | 'brand'>): FeeSyncDealership {
  const loc = DEALER_LOCATIONS[account.id] ?? FALLBACK_LOCATION;
  return {
    name: account.name,
    brand: account.brand,
    zipCode: loc.zip,
    address: `${loc.street}, ${loc.city}, ${loc.state} ${loc.zip}`,
  };
}

// ── Mock requests ──────────────────────────────────────────────────────────────

/** How long every mock request takes, so loading states are visible. */
export const FEE_SYNC_MOCK_DELAY_MS = 1200;

export class FeeSyncError extends Error {
  readonly code: number;
  constructor(message: string, code: number) {
    super(message);
    this.name = 'FeeSyncError';
    this.code = code;
  }
}

export interface FeeSyncPull {
  dealership: FeeSyncDealership;
  fees: FeeSyncFee[];
  /** ISO timestamp of this pull. */
  refreshedAt: string;
}

interface MockOptions {
  delayMs?: number;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** "Confirm dealership" — fails with error code 400 when `fail` is set (the simulation menu's error toggle). */
export async function mockConfirmDealership(
  dealership: FeeSyncDealership,
  { fail = false, delayMs = FEE_SYNC_MOCK_DELAY_MS }: MockOptions & { fail?: boolean } = {},
): Promise<FeeSyncPull> {
  await wait(delayMs);
  if (fail) throw new FeeSyncError('FeeSync connection failed.', 400);
  return { dealership, fees: FEE_SYNC_FEES, refreshedAt: new Date().toISOString() };
}

/** "Not your dealership? Connect with code" — any non-empty code connects to the account's mock franchise. */
export async function mockConnectWithCode(
  code: string,
  dealership: FeeSyncDealership,
  { delayMs = FEE_SYNC_MOCK_DELAY_MS }: MockOptions = {},
): Promise<FeeSyncPull> {
  await wait(delayMs);
  if (!code.trim()) throw new FeeSyncError('Enter a FeeSync account code.', 422);
  return { dealership, fees: FEE_SYNC_FEES, refreshedAt: new Date().toISOString() };
}

/** Manual refresh — returns the same fees (nothing new is pulled); fails while the connection is lost. */
export async function mockRefreshFees(
  currentFees: FeeSyncFee[],
  dealership: FeeSyncDealership,
  { connectionLost = false, delayMs = FEE_SYNC_MOCK_DELAY_MS }: MockOptions & { connectionLost?: boolean } = {},
): Promise<FeeSyncPull> {
  await wait(delayMs);
  if (connectionLost) throw new FeeSyncError('Unable to pull fees from FeeSync.', 503);
  return { dealership, fees: currentFees, refreshedAt: new Date().toISOString() };
}

// ── Formatting ─────────────────────────────────────────────────────────────────

/** "$899.00" */
export const formatFeeAmount = (amount: number) =>
  `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** "Nov 11, 2026 - 9:02 AM" */
export function formatRefreshTime(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${date} - ${time}`;
}

/** "Nov 11" */
export const formatShortDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

/** "1 fee" / "2 fees" */
export const pluralize = (count: number, singular: string, plural = `${singular}s`) => `${count} ${count === 1 ? singular : plural}`;

// ── Notification ───────────────────────────────────────────────────────────────

/** Query param the notification's link carries, so the Fees tab opens straight into FeeSync's updated fees. */
export const FEE_SYNC_NOTIFICATION_PARAM = 'feesync';
export const FEE_SYNC_NOTIFICATION_VALUE = 'updated';

/** Figma Flow 2's "Fees have been updated from FeeSync." activity notification, raised on app load. */
export const buildFeeSyncUpdatedNotification = (accountId: string, accountName: string): Omit<AppNotification, 'createdAt' | 'read'> => ({
  id: `feesync-updated:${accountId}`,
  audience: 'internal',
  source: 'Fees',
  title: 'Fees have been updated from FeeSync.',
  tags: ['Client Settings', accountName],
  href: `/settings/accounts/${accountId}/fees?${FEE_SYNC_NOTIFICATION_PARAM}=${FEE_SYNC_NOTIFICATION_VALUE}`,
});
