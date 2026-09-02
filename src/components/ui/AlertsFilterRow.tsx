import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { IconButton } from '@mui/material';
import type { Alert, AlertStatus, Offer } from '../../data/types';
import {
  ALERT_FILTER_FIELD_ORDER, DATE_PRESETS, LIFECYCLE_STEP_LABELS, APPROVAL_LABELS, APPROVAL_OPTIONS, MODEL_TYPE_OPTIONS,
  buildAlertFilterOptions, hasActiveAlertFilters, dateRangeLabel, getAlertFilterFieldCount,
} from '../../utils/alertFilters';
import type { AlertFilterState, AlertFilterFieldKey } from '../../utils/alertFilters';
import { approvalOptionIcon } from './AlertsFilterPanel';
import { CompactFilterSelect, FIELD_WIDTH } from './CompactFilterSelect';
import { MoreFiltersMenu } from './MoreFiltersMenu';
import type { MoreFilterFieldDescriptor } from './MoreFiltersMenu';
import { FiltersIconWithBadge } from './AlertsKanbanBoard';

const GAP = 8;

/**
 * Sort by, Signal Type, and Model Type are hidden from the Filter Row for now — still available in
 * the left panel. This is also the row's fixed priority order: fields render left-to-right in this
 * order regardless of selection, with as many as fit shown as their own pill and the rest folded
 * into More Filters — the set of visible fields never reshuffles as the user makes selections.
 */
const ROW_FIELD_ORDER: AlertFilterFieldKey[] = ALERT_FILTER_FIELD_ORDER.filter(
  (k) => k !== 'sortOrder' && k !== 'signalTypes' && k !== 'modelTypes',
);
const FIELD_COUNT = ROW_FIELD_ORDER.length;

function getFieldLabel(key: AlertFilterFieldKey): string {
  switch (key) {
    case 'sortOrder': return 'Sort by';
    case 'signalTypes': return 'Signal Type';
    case 'dateRange': return 'Date Range';
    case 'lifecycleSteps': return 'Lifecycle step';
    case 'approvals': return 'Approvals';
    case 'modelTypes': return 'Model Type';
    case 'years': return 'Year';
    case 'makes': return 'Make';
    case 'models': return 'Model';
    case 'trims': return 'Trim';
  }
}

interface AlertFilterOptionsLike {
  signalTypes: string[];
  years: number[];
  makes: string[];
  models: string[];
  trims: string[];
}

/**
 * Every field's config (options, current value, and how to change it) in one place — rendered as its
 * own CompactFilterSelect pill when visible, or as an entry in the More Filters cascading menu when it
 * doesn't fit the row. `any` here mirrors CompactFilterSelect's own generic-erased usage below; each
 * case still builds fully-typed options/value/getters, only the descriptor's shape is loosened.
 */
interface FieldDescriptor {
  key: AlertFilterFieldKey;
  label: string;
  count: number;
  multiple: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getOptionKey: (v: any) => string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getOptionLabel: (v: any) => string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderOptionIcon?: (v: any) => ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (v: any[]) => void;
}

function buildFieldDescriptor(
  key: AlertFilterFieldKey,
  state: AlertFilterState,
  onChange: (updates: Partial<AlertFilterState>) => void,
  options: AlertFilterOptionsLike,
): FieldDescriptor {
  const label = getFieldLabel(key);
  const count = getAlertFilterFieldCount(state, key);

  switch (key) {
    case 'sortOrder':
      return {
        key, label, count, multiple: false,
        options: ['newest', 'oldest'],
        value: [state.sortOrder],
        getOptionKey: (v) => v,
        getOptionLabel: (v) => (v === 'newest' ? 'Newest' : 'Oldest'),
        onChange: (v) => onChange({ sortOrder: v[0] ?? 'newest' }),
      };
    case 'signalTypes':
      return {
        key, label, count, multiple: true,
        options: options.signalTypes,
        value: state.signalTypes,
        getOptionKey: (v) => v,
        getOptionLabel: (v) => v,
        onChange: (v) => onChange({ signalTypes: v }),
      };
    case 'dateRange': {
      // A custom range (set via the left panel) isn't one of the row's own presets — add it as a
      // synthetic option so the field still displays it instead of falling back to the placeholder.
      const dateOptions = state.datePreset === 'custom'
        ? [...DATE_PRESETS, { key: 'custom' as const, label: dateRangeLabel(state), withinDays: null }]
        : DATE_PRESETS;
      return {
        key, label, count, multiple: false,
        options: dateOptions,
        value: dateOptions.filter((p) => p.key === state.datePreset),
        getOptionKey: (p) => p.key,
        getOptionLabel: (p) => p.label,
        onChange: (v) => {
          const preset = v[0];
          if (preset && preset.key !== 'custom') onChange({ datePreset: preset.key, startDate: '', endDate: '' });
        },
      };
    }
    case 'lifecycleSteps':
      return {
        key, label, count, multiple: true,
        options: Object.keys(LIFECYCLE_STEP_LABELS) as AlertStatus[],
        value: state.lifecycleSteps,
        getOptionKey: (v) => v,
        getOptionLabel: (v) => LIFECYCLE_STEP_LABELS[v as AlertStatus],
        onChange: (v) => onChange({ lifecycleSteps: v }),
      };
    case 'approvals':
      return {
        key, label, count, multiple: true,
        options: APPROVAL_OPTIONS,
        value: state.approvals,
        getOptionKey: (v) => v,
        getOptionLabel: (v) => APPROVAL_LABELS[v as keyof typeof APPROVAL_LABELS],
        renderOptionIcon: (v) => approvalOptionIcon(v, 16),
        onChange: (v) => onChange({ approvals: v }),
      };
    case 'modelTypes':
      return {
        key, label, count, multiple: true,
        options: MODEL_TYPE_OPTIONS,
        value: state.modelTypes,
        getOptionKey: (v) => v,
        getOptionLabel: (v) => v,
        onChange: (v) => onChange({ modelTypes: v }),
      };
    case 'years':
      return {
        key, label, count, multiple: true,
        options: options.years,
        value: state.years,
        getOptionKey: (v) => String(v),
        getOptionLabel: (v) => String(v),
        onChange: (v) => onChange({ years: v }),
      };
    case 'makes':
      return {
        key, label, count, multiple: true,
        options: options.makes,
        value: state.makes,
        getOptionKey: (v) => v,
        getOptionLabel: (v) => v,
        onChange: (v) => onChange({ makes: v }),
      };
    case 'models':
      return {
        key, label, count, multiple: true,
        options: options.models,
        value: state.models,
        getOptionKey: (v) => v,
        getOptionLabel: (v) => v,
        onChange: (v) => onChange({ models: v }),
      };
    case 'trims':
      return {
        key, label, count, multiple: true,
        options: options.trims,
        value: state.trims,
        getOptionKey: (v) => v,
        getOptionLabel: (v) => v,
        onChange: (v) => onChange({ trims: v }),
      };
  }
}

function renderFieldControl(descriptor: FieldDescriptor): ReactNode {
  // Date Range already shows its one selection as the field's own text, so a "Filtering by:" tooltip
  // on top of that would be redundant — every other field keeps the tooltip.
  const showFilterTooltip = descriptor.key !== 'dateRange';
  return (
    <CompactFilterSelect
      label={descriptor.label}
      multiple={descriptor.multiple}
      count={descriptor.count}
      showFilterTooltip={showFilterTooltip}
      options={descriptor.options}
      value={descriptor.value}
      getOptionKey={descriptor.getOptionKey}
      getOptionLabel={descriptor.getOptionLabel}
      renderOptionIcon={descriptor.renderOptionIcon}
      onChange={descriptor.onChange}
    />
  );
}

interface AlertsFilterRowProps {
  alerts: Alert[];
  offers: Offer[];
  state: AlertFilterState;
  onChange: (updates: Partial<AlertFilterState>) => void;
  onReset: () => void;
  filterPanelOpen: boolean;
  onToggleFilterPanel: () => void;
  activeFilterFieldCount: number;
  leading: ReactNode;
  trailing: ReactNode;
}

interface FilterRowLayoutState {
  onLine1: boolean;
  /** How many fields (in priority order) render as their own pill — the rest move into More Filters. */
  visibleCount: number;
  showMoreFilters: boolean;
  /** Last-resort fallback for viewports too narrow even for a single field + More Filters: let
   * everything wrap across lines instead of trying to cram into the cascading menu. */
  wraps: boolean;
}

export function AlertsFilterRow({
  alerts, offers, state, onChange, onReset, filterPanelOpen, onToggleFilterPanel,
  activeFilterFieldCount, leading, trailing,
}: AlertsFilterRowProps) {
  const options = useMemo(() => buildAlertFilterOptions(alerts, offers), [alerts, offers]);

  const outerRef = useRef<HTMLDivElement | null>(null);
  const leadingRef = useRef<HTMLDivElement | null>(null);
  const trailingRef = useRef<HTMLDivElement | null>(null);
  const iconCloneRef = useRef<HTMLDivElement | null>(null);
  const clearCloneRef = useRef<HTMLSpanElement | null>(null);

  const [layout, setLayout] = useState<FilterRowLayoutState>({
    onLine1: true,
    visibleCount: FIELD_COUNT,
    showMoreFilters: false,
    wraps: false,
  });

  useLayoutEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;

    const recompute = () => {
      const outerWidth = outer.clientWidth;
      if (outerWidth <= 0) return;

      const leadingWidth = leadingRef.current?.offsetWidth ?? 0;
      const trailingWidth = trailingRef.current?.offsetWidth ?? 0;
      const iconWidth = iconCloneRef.current?.offsetWidth ?? 0;
      const clearWidth = clearCloneRef.current?.offsetWidth ?? 0;

      // leading | filterRow | spacer | trailing — three gaps separate these four flex children.
      const row1Available = outerWidth - leadingWidth - trailingWidth - GAP * 3;
      const fullWidth = outerWidth;

      // Every field — and the More Filters pill itself — is a fixed FIELD_WIDTH, so fitting is pure
      // arithmetic: width needed for K individual pills, plus one more pill for More Filters unless
      // K covers every field, plus the always-present funnel icon and Clear Filters link.
      const neededWidth = (visibleCount: number) => {
        const pillCount = visibleCount + (visibleCount < FIELD_COUNT ? 1 : 0);
        return pillCount * (FIELD_WIDTH + GAP) + iconWidth + GAP + clearWidth;
      };

      // Largest K (0..FIELD_COUNT) whose needed width fits `available`, or -1 if even K=0 (just the
      // sole More Filters/"Filters" pill) doesn't fit.
      const maxFitting = (available: number) => {
        for (let k = FIELD_COUNT; k >= 0; k--) {
          if (neededWidth(k) <= available) return k;
        }
        return -1;
      };

      const kLine1 = maxFitting(row1Available);
      if (kLine1 === FIELD_COUNT) {
        setLayout({ onLine1: true, visibleCount: FIELD_COUNT, showMoreFilters: false, wraps: false });
        return;
      }
      if (kLine1 >= 0) {
        setLayout({ onLine1: true, visibleCount: kLine1, showMoreFilters: true, wraps: false });
        return;
      }

      const kLine2 = maxFitting(fullWidth);
      if (kLine2 >= 0) {
        setLayout({ onLine1: false, visibleCount: kLine2, showMoreFilters: kLine2 < FIELD_COUNT, wraps: false });
        return;
      }
      setLayout({ onLine1: false, visibleCount: FIELD_COUNT, showMoreFilters: false, wraps: true });
    };

    recompute();
    const observer = new ResizeObserver(recompute);
    observer.observe(outer);
    return () => observer.disconnect();
    // activeFilterFieldCount can change the funnel icon badge's digit count, which changes its
    // measured clone width — everything else the fit math reads comes straight off the DOM refs.
  }, [activeFilterFieldCount]);

  // Fields render left-to-right in ROW_FIELD_ORDER regardless of selection — only how many fit
  // (layout.visibleCount) changes with available width.
  const visibleKeys = useMemo(() => ROW_FIELD_ORDER.slice(0, layout.visibleCount), [layout.visibleCount]);
  const hiddenKeys = useMemo(() => ROW_FIELD_ORDER.slice(layout.visibleCount), [layout.visibleCount]);

  const hiddenDescriptors = useMemo(
    () => hiddenKeys.map((key) => buildFieldDescriptor(key, state, onChange, options)),
    [hiddenKeys, state, onChange, options],
  );
  const moreFiltersTotalCount = useMemo(
    () => hiddenDescriptors.reduce((sum, d) => sum + d.count, 0),
    [hiddenDescriptors],
  );
  const moreFiltersLabel = visibleKeys.length === 0 ? 'Filters' : 'More Filters';

  const filterFieldsContent = (
    <>
      {visibleKeys.map((key) => (
        <div key={key}>{renderFieldControl(buildFieldDescriptor(key, state, onChange, options))}</div>
      ))}
      {layout.showMoreFilters && (
        <MoreFiltersMenu
          label={moreFiltersLabel}
          totalCount={moreFiltersTotalCount}
          fields={hiddenDescriptors as unknown as MoreFilterFieldDescriptor[]}
        />
      )}
      <IconButton
        size="large"
        onClick={onToggleFilterPanel}
        sx={{
          padding: '5px', flexShrink: 0,
          color: filterPanelOpen || hasActiveAlertFilters(state) ? '#473bab' : '#1f1d25',
          '&:hover': { background: '#f0eeff', color: '#473bab' },
        }}
      >
        <FiltersIconWithBadge count={activeFilterFieldCount} />
      </IconButton>
      <button
        onClick={onReset}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', fontSize: 12,
          fontFamily: 'Roboto, sans-serif', color: '#473bab', fontWeight: 500,
          letterSpacing: '0.46px', whiteSpace: 'nowrap', flexShrink: 0,
        }}
      >
        Clear Filters
      </button>
    </>
  );

  return (
    <div ref={outerRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: GAP }}>
        <div ref={leadingRef} style={{ display: 'flex', alignItems: 'center', gap: GAP, flexShrink: 0 }}>
          {leading}
        </div>
        {layout.onLine1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: GAP, minWidth: 0 }}>
            {filterFieldsContent}
          </div>
        )}
        <div style={{ flex: 1 }} />
        <div ref={trailingRef} style={{ flexShrink: 0 }}>
          {trailing}
        </div>
      </div>

      {!layout.onLine1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: GAP, flexWrap: layout.wraps ? 'wrap' : 'nowrap', marginTop: GAP }}>
          {filterFieldsContent}
        </div>
      )}

      {/* Hidden measurement clones for the icon + Clear Filters link — fields (and More Filters) are a fixed FIELD_WIDTH, no measurement needed. */}
      <div aria-hidden style={{ position: 'absolute', visibility: 'hidden', height: 0, overflow: 'hidden', pointerEvents: 'none', top: 0, left: 0, display: 'flex', gap: GAP }}>
        <div ref={iconCloneRef}>
          <IconButton size="large" sx={{ padding: '5px' }}>
            <FiltersIconWithBadge count={activeFilterFieldCount} />
          </IconButton>
        </div>
        <span ref={clearCloneRef} style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 500, letterSpacing: '0.46px', whiteSpace: 'nowrap' }}>
          Clear Filters
        </span>
      </div>
    </div>
  );
}
