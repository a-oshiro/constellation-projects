import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { IconButton } from '@mui/material';
import type { Alert, AlertStatus, Offer } from '../../data/types';
import {
  ALERT_FILTER_FIELD_ORDER, DATE_PRESETS, LIFECYCLE_STEP_LABELS, APPROVAL_LABELS, APPROVAL_OPTIONS, MODEL_TYPE_OPTIONS,
  buildAlertFilterOptions, hasActiveAlertFilters, getMustShowFilterFields,
  getOptionalFilterFields, dateRangeLabel, getAlertFilterFieldCount,
} from '../../utils/alertFilters';
import type { AlertFilterState, AlertFilterFieldKey, AlertsViewMode } from '../../utils/alertFilters';
import { approvalOptionIcon } from './AlertsFilterPanel';
import { CompactFilterSelect, FIELD_WIDTH } from './CompactFilterSelect';
import { FiltersIconWithBadge } from './AlertsKanbanBoard';

const GAP = 8;

/** Sort by, Signal Type, and Model Type are hidden from the Filter Row for now — still available in the left panel. */
const ROW_FIELD_ORDER: AlertFilterFieldKey[] = ALERT_FILTER_FIELD_ORDER.filter(
  (k) => k !== 'sortOrder' && k !== 'signalTypes' && k !== 'modelTypes',
);

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

function renderFieldControl(
  key: AlertFilterFieldKey,
  state: AlertFilterState,
  onChange: (updates: Partial<AlertFilterState>) => void,
  options: AlertFilterOptionsLike,
): ReactNode {
  const label = getFieldLabel(key);
  const count = getAlertFilterFieldCount(state, key);
  // Date Range already shows its one selection as the field's own text, so a "Filtering by:" tooltip
  // on top of that would be redundant — every other field keeps the tooltip.
  const showFilterTooltip = key !== 'dateRange';

  switch (key) {
    case 'sortOrder':
      return (
        <CompactFilterSelect
          label={label}
          multiple={false}
          count={count}
          showFilterTooltip={showFilterTooltip}
          options={['newest', 'oldest'] as const}
          value={[state.sortOrder]}
          getOptionKey={(v) => v}
          getOptionLabel={(v) => (v === 'newest' ? 'Newest' : 'Oldest')}
          onChange={(v) => onChange({ sortOrder: v[0] ?? 'newest' })}
        />
      );
    case 'signalTypes':
      return (
        <CompactFilterSelect
          label={label}
          multiple
          count={count}
          showFilterTooltip={showFilterTooltip}
          options={options.signalTypes}
          value={state.signalTypes}
          getOptionKey={(v) => v}
          getOptionLabel={(v) => v}
          onChange={(v) => onChange({ signalTypes: v })}
        />
      );
    case 'dateRange': {
      // A custom range (set via the left panel) isn't one of the row's own presets — add it as a
      // synthetic option so the field still displays it instead of falling back to the placeholder.
      const dateOptions = state.datePreset === 'custom'
        ? [...DATE_PRESETS, { key: 'custom' as const, label: dateRangeLabel(state), withinDays: null }]
        : DATE_PRESETS;
      return (
        <CompactFilterSelect
          label={label}
          multiple={false}
          count={count}
          showFilterTooltip={showFilterTooltip}
          options={dateOptions}
          value={dateOptions.filter((p) => p.key === state.datePreset)}
          getOptionKey={(p) => p.key}
          getOptionLabel={(p) => p.label}
          onChange={(v) => {
            const preset = v[0];
            if (preset && preset.key !== 'custom') onChange({ datePreset: preset.key, startDate: '', endDate: '' });
          }}
        />
      );
    }
    case 'lifecycleSteps':
      return (
        <CompactFilterSelect
          label={label}
          multiple
          count={count}
          showFilterTooltip={showFilterTooltip}
          options={Object.keys(LIFECYCLE_STEP_LABELS) as AlertStatus[]}
          value={state.lifecycleSteps}
          getOptionKey={(v) => v}
          getOptionLabel={(v) => LIFECYCLE_STEP_LABELS[v]}
          onChange={(v) => onChange({ lifecycleSteps: v })}
        />
      );
    case 'approvals':
      return (
        <CompactFilterSelect
          label={label}
          multiple
          count={count}
          showFilterTooltip={showFilterTooltip}
          options={APPROVAL_OPTIONS}
          value={state.approvals}
          getOptionKey={(v) => v}
          getOptionLabel={(v) => APPROVAL_LABELS[v]}
          renderOptionIcon={(v) => approvalOptionIcon(v, 16)}
          onChange={(v) => onChange({ approvals: v })}
        />
      );
    case 'modelTypes':
      return (
        <CompactFilterSelect
          label={label}
          multiple
          count={count}
          showFilterTooltip={showFilterTooltip}
          options={MODEL_TYPE_OPTIONS}
          value={state.modelTypes}
          getOptionKey={(v) => v}
          getOptionLabel={(v) => v}
          onChange={(v) => onChange({ modelTypes: v })}
        />
      );
    case 'years':
      return (
        <CompactFilterSelect
          label={label}
          multiple
          count={count}
          showFilterTooltip={showFilterTooltip}
          options={options.years}
          value={state.years}
          getOptionKey={(v) => String(v)}
          getOptionLabel={(v) => String(v)}
          onChange={(v) => onChange({ years: v })}
        />
      );
    case 'makes':
      return (
        <CompactFilterSelect
          label={label}
          multiple
          count={count}
          showFilterTooltip={showFilterTooltip}
          options={options.makes}
          value={state.makes}
          getOptionKey={(v) => v}
          getOptionLabel={(v) => v}
          onChange={(v) => onChange({ makes: v })}
        />
      );
    case 'models':
      return (
        <CompactFilterSelect
          label={label}
          multiple
          count={count}
          showFilterTooltip={showFilterTooltip}
          options={options.models}
          value={state.models}
          getOptionKey={(v) => v}
          getOptionLabel={(v) => v}
          onChange={(v) => onChange({ models: v })}
        />
      );
    case 'trims':
      return (
        <CompactFilterSelect
          label={label}
          multiple
          count={count}
          showFilterTooltip={showFilterTooltip}
          options={options.trims}
          value={state.trims}
          getOptionKey={(v) => v}
          getOptionLabel={(v) => v}
          onChange={(v) => onChange({ trims: v })}
        />
      );
  }
}

interface AlertsFilterRowProps {
  alerts: Alert[];
  offers: Offer[];
  state: AlertFilterState;
  onChange: (updates: Partial<AlertFilterState>) => void;
  onReset: () => void;
  viewMode: AlertsViewMode;
  filterPanelOpen: boolean;
  onToggleFilterPanel: () => void;
  activeFilterFieldCount: number;
  leading: ReactNode;
  trailing: ReactNode;
}

interface FilterRowLayoutState {
  onLine1: boolean;
  optionalVisibleCount: number;
  mustShowWraps: boolean;
}

export function AlertsFilterRow({
  alerts, offers, state, onChange, onReset, viewMode, filterPanelOpen, onToggleFilterPanel,
  activeFilterFieldCount, leading, trailing,
}: AlertsFilterRowProps) {
  const options = useMemo(() => buildAlertFilterOptions(alerts, offers), [alerts, offers]);
  const mustShowKeys = useMemo(
    () => getMustShowFilterFields(state, viewMode).filter((k) => ROW_FIELD_ORDER.includes(k)),
    [state, viewMode],
  );
  const optionalKeys = useMemo(
    () => getOptionalFilterFields(state, viewMode).filter((k) => ROW_FIELD_ORDER.includes(k)),
    [state, viewMode],
  );

  const outerRef = useRef<HTMLDivElement | null>(null);
  const leadingRef = useRef<HTMLDivElement | null>(null);
  const trailingRef = useRef<HTMLDivElement | null>(null);
  const iconCloneRef = useRef<HTMLDivElement | null>(null);
  const clearCloneRef = useRef<HTMLSpanElement | null>(null);

  const [layout, setLayout] = useState<FilterRowLayoutState>({
    onLine1: true,
    optionalVisibleCount: optionalKeys.length,
    mustShowWraps: false,
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

      // Every field is a fixed FIELD_WIDTH now, so no per-field measurement is needed here.
      const mustShowWidth = mustShowKeys.length * (FIELD_WIDTH + GAP) + iconWidth + GAP + clearWidth;

      const growOptional = (available: number) => {
        let count = 0;
        let width = mustShowWidth;
        for (let i = 0; i < optionalKeys.length; i++) {
          const next = width + FIELD_WIDTH + GAP;
          if (next > available) break;
          width = next;
          count++;
        }
        return count;
      };

      if (mustShowWidth <= row1Available) {
        setLayout({ onLine1: true, optionalVisibleCount: growOptional(row1Available), mustShowWraps: false });
        return;
      }
      if (mustShowWidth <= fullWidth) {
        setLayout({ onLine1: false, optionalVisibleCount: growOptional(fullWidth), mustShowWraps: false });
        return;
      }
      setLayout({ onLine1: false, optionalVisibleCount: 0, mustShowWraps: true });
    };

    recompute();
    const observer = new ResizeObserver(recompute);
    observer.observe(outer);
    return () => observer.disconnect();
  }, [state, viewMode, options, mustShowKeys, optionalKeys]);

  const visibleKeys = useMemo(() => {
    const visible = new Set([...mustShowKeys, ...optionalKeys.slice(0, layout.optionalVisibleCount)]);
    return ROW_FIELD_ORDER.filter((k) => visible.has(k));
  }, [mustShowKeys, optionalKeys, layout.optionalVisibleCount]);

  const filterFieldsContent = (
    <>
      {visibleKeys.map((key) => (
        <div key={key}>{renderFieldControl(key, state, onChange, options)}</div>
      ))}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: GAP, flexWrap: layout.mustShowWraps ? 'wrap' : 'nowrap', marginTop: GAP }}>
          {filterFieldsContent}
        </div>
      )}

      {/* Hidden measurement clones for the icon + Clear Filters link — fields are a fixed FIELD_WIDTH, no measurement needed. */}
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
