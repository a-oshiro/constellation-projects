import { Autocomplete, Checkbox, TextField } from '@mui/material';
import type { ReactNode } from 'react';
import { Tooltip } from './Tooltip';

export const FIELD_WIDTH = 160;

const ACTIVE_PURPLE = '#473bab';

/** Selection-count badge, a small rounded square (not a circle/pill). */
function CountBadge({ count }: { count: number }) {
  return (
    <span
      style={{
        boxSizing: 'border-box',
        minWidth: 16,
        height: 16,
        padding: '0 3px',
        borderRadius: 2,
        background: ACTIVE_PURPLE,
        color: '#ffffff',
        fontSize: 10,
        lineHeight: '16px',
        fontFamily: 'Roboto, sans-serif',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {count}
    </span>
  );
}

function FieldText({ text, active }: { text: string; active: boolean }) {
  return (
    <span
      style={{
        fontSize: 13,
        fontFamily: 'Roboto, sans-serif',
        color: active ? ACTIVE_PURPLE : '#1f1d25',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {text}
    </span>
  );
}

/** Multi-select field content, once active: the field's own label plus a count badge — never the selected values themselves. */
function LabelWithCount({ label, count }: { label: string; count: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', flex: '1 1 auto', minWidth: 0 }}>
      <FieldText text={label} active={count > 0} />
      <CountBadge count={count} />
    </div>
  );
}

/** Single-select field content: the current selection itself (e.g. "All Time") — a single-select field only ever holds one value, so a count badge would be redundant. */
function SelectedValue({ text, active }: { text: string; active: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden', flex: '1 1 auto', minWidth: 0 }}>
      <FieldText text={text} active={active} />
    </div>
  );
}

interface CompactFilterSelectProps<T> {
  label: string;
  options: T[];
  value: T[];
  multiple: boolean;
  /** Number of selected items shown in the field's badge — computed by the caller so single-select "no selection" defaults (e.g. dateRange's "all") read as 0. */
  count: number;
  /** Whether hovering an active field shows a "Filtering by:" tooltip listing its selections — off for Date Range, which already shows its one selection as the field's own text. */
  showFilterTooltip: boolean;
  getOptionKey: (v: T) => string;
  getOptionLabel: (v: T) => string;
  renderOptionIcon?: (v: T) => ReactNode;
  onChange: (v: T[]) => void;
}

export function CompactFilterSelect<T>({
  label, options, value, multiple, count, showFilterTooltip, getOptionKey, getOptionLabel, renderOptionIcon, onChange,
}: CompactFilterSelectProps<T>) {
  const active = count > 0;
  // Multi-select fields fall back to the native input's placeholder for their label when nothing is
  // selected (MUI skips calling renderValue for an empty array) — single-select fields always have a
  // current selection to show via renderValue, so they never need the placeholder.
  const inputTakesSpace = multiple && count === 0;
  const selectedLabel = !multiple && value[0] !== undefined ? getOptionLabel(value[0]) : label;

  // An empty tooltip title disables the tooltip entirely, so this doubles as the "should it show at
  // all" check — inactive fields and fields that opt out (Date Range) get no title.
  const tooltipTitle = showFilterTooltip && active ? (
    <div>
      <div>Filtering by:</div>
      <ul style={{ margin: '4px 0 0', paddingLeft: 14 }}>
        {value.map((v) => <li key={getOptionKey(v)}>{getOptionLabel(v)}</li>)}
      </ul>
    </div>
  ) : '';

  return (
    <Tooltip title={tooltipTitle} placement="top">
      <div style={{ display: 'inline-flex' }}>
        <Autocomplete
          multiple={multiple}
          disableCloseOnSelect={multiple}
          disableClearable={!multiple}
          options={options}
          value={(multiple ? value : (value[0] ?? null)) as T}
          getOptionLabel={(v) => getOptionLabel(v as T)}
          isOptionEqualToValue={(a, b) => getOptionKey(a) === getOptionKey(b)}
          onChange={(_, v) => onChange(multiple ? (v as T[]) : (v ? [v as T] : []))}
          renderOption={multiple ? (props, option, state) => {
            const { key, ...rest } = props;
            return (
              <li key={key} {...rest} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Checkbox size="small" checked={state.selected} sx={{ padding: 0 }} />
                {renderOptionIcon?.(option)}
                {getOptionLabel(option)}
              </li>
            );
          } : undefined}
          // MUI v9's renderValue (replacing renderTags) covers single-select too — used here to show
          // either the field's label + count badge (multi-select, once active) or the current selection
          // itself (single-select, which always has exactly one value, e.g. Date Range's "All Time").
          renderValue={
            !multiple
              ? () => <SelectedValue text={selectedLabel} active={active} />
              : count > 0
                ? () => <LabelWithCount label={label} count={count} />
                : undefined
          }
          renderInput={(params) => <TextField {...params} placeholder={inputTakesSpace ? label : undefined} size="small" />}
          size="small"
          // The field itself stays a fixed FIELD_WIDTH, but the dropdown shouldn't inherit that — size
          // it to its own content so option labels never wrap onto a second line. bottom-start keeps the
          // menu's left edge flush with the field's left edge instead of centering under it.
          slotProps={{
            popper: { placement: 'bottom-start', style: { width: 'fit-content', minWidth: FIELD_WIDTH } },
            paper: { sx: { '& .MuiAutocomplete-option': { whiteSpace: 'nowrap', fontSize: 12, fontFamily: 'Roboto, sans-serif' } } },
          }}
          sx={{
            width: FIELD_WIDTH,
            flexShrink: 0,
            // Same chrome (colors, radius, font) as the left panel's INPUT_SX, plus a purple highlight
            // when the field has an active selection.
            '& .MuiOutlinedInput-root': {
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'nowrap',
              overflow: 'hidden',
              minHeight: 36,
              padding: '6px 8px !important',
              borderRadius: '4px',
              fontSize: 13,
              fontFamily: 'Roboto, sans-serif',
              background: active ? '#f0eeff' : '#f9fafa',
              '& fieldset': { borderColor: active ? ACTIVE_PURPLE : '#cac9cf' },
              '&:hover fieldset': { borderColor: ACTIVE_PURPLE },
              '&.Mui-focused fieldset': { borderColor: ACTIVE_PURPLE },
            },
            '& .MuiOutlinedInput-input': {
              padding: '0 !important',
              fontSize: 13,
              fontFamily: 'Roboto, sans-serif',
              textOverflow: 'ellipsis',
              // Once there's field content to show (badge or selection), it owns the row's space via
              // renderValue — the native input collapses to 0 so it doesn't compete for room or duplicate
              // that content as a placeholder.
              flex: inputTakesSpace ? '1 1 auto' : '0 0 0px',
              minWidth: inputTakesSpace ? 0 : '0px !important',
            },
            '& .MuiAutocomplete-endAdornment': {
              position: 'static',
              // MUI's default CSS pairs `top:50%` with `translateY(-50%)` to center it while absolutely
              // positioned; overriding only `position` leaves that transform in place, floating it upward.
              transform: 'none',
              flexShrink: 0,
            },
          }}
        />
      </div>
    </Tooltip>
  );
}
