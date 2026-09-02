import type { Alert, AlertStatus, Offer } from '../data/types';

const DAY = 24 * 60 * 60 * 1000;

export type AlertSortOrder = 'newest' | 'oldest';
export type DateRangePreset = 'month' | 'quarter' | 'all' | 'custom';
export type ApprovalFilterKey =
  | 'approved_email' | 'pending_email' | 'rejected_email'
  | 'approved_assets' | 'pending_assets' | 'rejected_assets';

export interface AlertFilterState {
  sortOrder: AlertSortOrder;
  signalTypes: string[];
  datePreset: DateRangePreset;
  /** ISO 'YYYY-MM-DD', only read when datePreset === 'custom'. */
  startDate: string;
  endDate: string;
  lifecycleSteps: AlertStatus[];
  approvals: ApprovalFilterKey[];
  modelTypes: string[];
  years: number[];
  makes: string[];
  models: string[];
  trims: string[];
}

export const DEFAULT_ALERT_FILTER_STATE: AlertFilterState = {
  sortOrder: 'newest',
  signalTypes: [],
  datePreset: 'month',
  startDate: '',
  endDate: '',
  lifecycleSteps: [],
  approvals: [],
  modelTypes: [],
  years: [],
  makes: [],
  models: [],
  trims: [],
};

export const DATE_PRESETS: { key: DateRangePreset; label: string; withinDays: number | null }[] = [
  { key: 'month', label: 'This month', withinDays: 31 },
  { key: 'quarter', label: 'Last 3 months', withinDays: 92 },
  { key: 'all', label: 'All time', withinDays: null },
];

/** Only "Core Models" exists today — Offer has no other model-type distinction, so this is the sole option. */
export const MODEL_TYPE_OPTIONS = ['Core Models'];

export const LIFECYCLE_STEP_LABELS: Record<AlertStatus, string> = {
  generated: 'Generated',
  rejected: 'Changes Requested',
  approved: 'Approved',
  sent: 'Sent',
};

export const APPROVAL_LABELS: Record<ApprovalFilterKey, string> = {
  approved_email: 'Email Approved',
  pending_email: 'Pending Email Review',
  rejected_email: 'Email Changes Requested',
  approved_assets: 'Assets Approved',
  pending_assets: 'Pending Asset Review',
  rejected_assets: 'Asset Changes Requested',
};

/** Render order for the Approvals field, shared by the left panel and the Filter Row. */
export const APPROVAL_OPTIONS: ApprovalFilterKey[] = [
  'approved_email', 'approved_assets', 'pending_email', 'pending_assets', 'rejected_email', 'rejected_assets',
];

const APPROVAL_PREDICATES: Record<ApprovalFilterKey, (alert: Alert) => boolean> = {
  approved_email: (a) => a.emailStatus === 'approved',
  pending_email: (a) => a.emailStatus === 'pending',
  rejected_email: (a) => a.emailStatus === 'rejected',
  approved_assets: (a) => a.assetsStatus === 'approved',
  pending_assets: (a) => a.assetsStatus === 'pending',
  rejected_assets: (a) => a.assetsStatus === 'rejected',
};

/** No "Kickoff" flag exists on Alert yet — derived from the subject line, matching how the mock lifecycle emails are written. */
export function getSignalType(alert: Alert): string {
  return alert.subject.trim().toLowerCase().startsWith('kickoff') ? 'Kickoff' : 'Alert';
}

/** Placeholder until Offer carries a real model-type distinction — every alert is a Core Model today. */
export function getModelType(_alert: Alert): string {
  return 'Core Models';
}

function getDateRange(state: AlertFilterState): { start: number; end: number } | null {
  if (state.datePreset === 'all') return null;
  if (state.datePreset === 'custom') {
    if (!state.startDate && !state.endDate) return null;
    const start = state.startDate ? new Date(state.startDate).getTime() : -Infinity;
    const end = state.endDate ? new Date(state.endDate).getTime() + DAY - 1 : Infinity;
    return { start, end };
  }
  const withinDays = DATE_PRESETS.find((p) => p.key === state.datePreset)?.withinDays ?? null;
  if (withinDays == null) return null;
  return { start: Date.now() - withinDays * DAY, end: Infinity };
}

export interface AlertFilterOptions {
  signalTypes: string[];
  years: number[];
  makes: string[];
  models: string[];
  trims: string[];
}

/** Vehicle-facing option lists, resolved off each alert's featured offer. */
export function buildAlertFilterOptions(alerts: Alert[], offers: Offer[]): AlertFilterOptions {
  const offerById = new Map(offers.map((o) => [o.id, o]));
  const featuredOffers = alerts
    .map((a) => offerById.get(a.featuredOfferId))
    .filter((o): o is Offer => Boolean(o));

  return {
    signalTypes: [...new Set(alerts.map(getSignalType))].sort(),
    years: [...new Set(featuredOffers.map((o) => o.year))].sort((a, b) => a - b),
    makes: [...new Set(featuredOffers.map((o) => o.make))].sort(),
    models: [...new Set(featuredOffers.map((o) => o.model))].sort(),
    trims: [...new Set(featuredOffers.map((o) => o.trim))].filter(Boolean).sort(),
  };
}

export function applyAlertFilters(alerts: Alert[], offers: Offer[], state: AlertFilterState): Alert[] {
  const offerById = new Map(offers.map((o) => [o.id, o]));
  const range = getDateRange(state);

  const filtered = alerts.filter((alert) => {
    if (state.signalTypes.length > 0 && !state.signalTypes.includes(getSignalType(alert))) return false;
    if (range && (alert.createdAt < range.start || alert.createdAt > range.end)) return false;
    if (state.lifecycleSteps.length > 0 && !state.lifecycleSteps.includes(alert.status)) return false;
    if (state.approvals.length > 0 && !state.approvals.some((key) => APPROVAL_PREDICATES[key](alert))) return false;
    if (state.modelTypes.length > 0 && !state.modelTypes.includes(getModelType(alert))) return false;

    if (state.years.length > 0 || state.makes.length > 0 || state.models.length > 0 || state.trims.length > 0) {
      const offer = offerById.get(alert.featuredOfferId);
      if (!offer) return false;
      if (state.years.length > 0 && !state.years.includes(offer.year)) return false;
      if (state.makes.length > 0 && !state.makes.includes(offer.make)) return false;
      if (state.models.length > 0 && !state.models.includes(offer.model)) return false;
      if (state.trims.length > 0 && !state.trims.includes(offer.trim)) return false;
    }

    return true;
  });

  return filtered.sort((a, b) => (state.sortOrder === 'oldest' ? a.createdAt - b.createdAt : b.createdAt - a.createdAt));
}

export interface ActiveFilterChip {
  id: string;
  label: string;
  dimension: 'dateRange' | 'signalTypes' | 'lifecycleSteps' | 'approvals' | 'modelTypes' | 'years' | 'makes' | 'models' | 'trims';
  /** String form of the value this chip represents — omitted for the single dateRange chip. */
  value?: string;
}

export function dateRangeLabel(state: AlertFilterState): string {
  if (state.datePreset === 'custom') {
    return `${state.startDate || '…'} – ${state.endDate || '…'}`;
  }
  return DATE_PRESETS.find((p) => p.key === state.datePreset)?.label ?? '';
}

/** One chip per active filter value, for the "Filtering by" row above the board. */
export function getActiveFilterChips(state: AlertFilterState): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  if (state.datePreset !== 'all') {
    chips.push({ id: 'date', label: dateRangeLabel(state), dimension: 'dateRange' });
  }
  state.signalTypes.forEach((v) => chips.push({ id: `signal-${v}`, label: v, dimension: 'signalTypes', value: v }));
  state.lifecycleSteps.forEach((v) => chips.push({ id: `step-${v}`, label: LIFECYCLE_STEP_LABELS[v], dimension: 'lifecycleSteps', value: v }));
  state.approvals.forEach((v) => chips.push({ id: `appr-${v}`, label: APPROVAL_LABELS[v], dimension: 'approvals', value: v }));
  state.modelTypes.forEach((v) => chips.push({ id: `modeltype-${v}`, label: v, dimension: 'modelTypes', value: v }));
  state.years.forEach((v) => chips.push({ id: `year-${v}`, label: String(v), dimension: 'years', value: String(v) }));
  state.makes.forEach((v) => chips.push({ id: `make-${v}`, label: v, dimension: 'makes', value: v }));
  state.models.forEach((v) => chips.push({ id: `model-${v}`, label: v, dimension: 'models', value: v }));
  state.trims.forEach((v) => chips.push({ id: `trim-${v}`, label: v, dimension: 'trims', value: v }));

  return chips;
}

export function hasActiveAlertFilters(state: AlertFilterState): boolean {
  return getActiveFilterChips(state).length > 0;
}

/** Count of distinct filter fields with an active value (e.g. Signal Type, Date Range) — for the filter icon's badge. */
export function getActiveFilterFieldCount(state: AlertFilterState): number {
  return ALERT_FILTER_FIELD_ORDER
    .filter((k) => k !== 'sortOrder')
    .filter((k) => isAlertFilterFieldActive(state, k)).length;
}

export type AlertFilterFieldKey =
  | 'sortOrder' | 'signalTypes' | 'dateRange' | 'lifecycleSteps' | 'approvals'
  | 'modelTypes' | 'years' | 'makes' | 'models' | 'trims';

/** Mirrors the left panel's top-to-bottom field order — also the Filter Row's render order. */
export const ALERT_FILTER_FIELD_ORDER: AlertFilterFieldKey[] = [
  'sortOrder', 'signalTypes', 'dateRange', 'lifecycleSteps', 'approvals',
  'modelTypes', 'years', 'makes', 'models', 'trims',
];

const FIELD_ACTIVE_PREDICATES: Record<AlertFilterFieldKey, (s: AlertFilterState) => boolean> = {
  sortOrder: (s) => s.sortOrder !== DEFAULT_ALERT_FILTER_STATE.sortOrder,
  signalTypes: (s) => s.signalTypes.length > 0,
  dateRange: (s) => s.datePreset !== 'all',
  lifecycleSteps: (s) => s.lifecycleSteps.length > 0,
  approvals: (s) => s.approvals.length > 0,
  modelTypes: (s) => s.modelTypes.length > 0,
  years: (s) => s.years.length > 0,
  makes: (s) => s.makes.length > 0,
  models: (s) => s.models.length > 0,
  trims: (s) => s.trims.length > 0,
};

export function isAlertFilterFieldActive(state: AlertFilterState, key: AlertFilterFieldKey): boolean {
  return FIELD_ACTIVE_PREDICATES[key](state);
}

/** Count shown in a Filter Row field's selection badge — mirrors FIELD_ACTIVE_PREDICATES, but as a count rather than a boolean. */
const FIELD_COUNTS: Record<AlertFilterFieldKey, (s: AlertFilterState) => number> = {
  sortOrder: () => 0,
  signalTypes: (s) => s.signalTypes.length,
  dateRange: (s) => (s.datePreset === 'all' ? 0 : 1),
  lifecycleSteps: (s) => s.lifecycleSteps.length,
  approvals: (s) => s.approvals.length,
  modelTypes: (s) => s.modelTypes.length,
  years: (s) => s.years.length,
  makes: (s) => s.makes.length,
  models: (s) => s.models.length,
  trims: (s) => s.trims.length,
};

export function getAlertFilterFieldCount(state: AlertFilterState, key: AlertFilterFieldKey): number {
  return FIELD_COUNTS[key](state);
}

/** Removes exactly the value a single chip represents, leaving the rest of the filter state untouched. */
export function removeFilterChip(state: AlertFilterState, chip: ActiveFilterChip): AlertFilterState {
  switch (chip.dimension) {
    case 'dateRange':
      return { ...state, datePreset: 'all', startDate: '', endDate: '' };
    case 'signalTypes':
      return { ...state, signalTypes: state.signalTypes.filter((v) => v !== chip.value) };
    case 'lifecycleSteps':
      return { ...state, lifecycleSteps: state.lifecycleSteps.filter((v) => v !== chip.value) };
    case 'approvals':
      return { ...state, approvals: state.approvals.filter((v) => v !== chip.value) };
    case 'modelTypes':
      return { ...state, modelTypes: state.modelTypes.filter((v) => v !== chip.value) };
    case 'years':
      return { ...state, years: state.years.filter((v) => String(v) !== chip.value) };
    case 'makes':
      return { ...state, makes: state.makes.filter((v) => v !== chip.value) };
    case 'models':
      return { ...state, models: state.models.filter((v) => v !== chip.value) };
    case 'trims':
      return { ...state, trims: state.trims.filter((v) => v !== chip.value) };
    default:
      return state;
  }
}
