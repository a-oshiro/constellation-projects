import { Autocomplete, TextField } from '@mui/material';
import type { ReactNode } from 'react';

export const FIELD_WIDTH = 140;

const ACTIVE_PURPLE = '#473bab';

/** Selection-count badge, matching FiltersIconWithBadge's look (AlertsKanbanBoard.tsx). */
function CountBadge({ count }: { count: number }) {
  return (
    <span
      style={{
        minWidth: 16,
        height: 16,
        padding: '0 4px',
        borderRadius: 8,
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

/** Field content is always the label plus a count badge (when active) — never the selected values themselves. */
function LabelWithCount({ label, count }: { label: string; count: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', flex: '1 1 auto', minWidth: 0 }}>
      <span
        style={{
          fontSize: 13,
          fontFamily: 'Roboto, sans-serif',
          color: count > 0 ? ACTIVE_PURPLE : '#1f1d25',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {label}
      </span>
      {count > 0 && <CountBadge count={count} />}
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
  getOptionKey: (v: T) => string;
  getOptionLabel: (v: T) => string;
  renderOptionIcon?: (v: T) => ReactNode;
  onChange: (v: T[]) => void;
}

export function CompactFilterSelect<T>({
  label, options, value, multiple, count, getOptionKey, getOptionLabel, renderOptionIcon, onChange,
}: CompactFilterSelectProps<T>) {
  const active = count > 0;
  // MUI skips calling renderValue at all for an empty multi-select array (nothing to render as
  // tags), so an unselected field falls back to the native input's placeholder for its label —
  // renderValue only takes over once there's a count to badge.
  const inputTakesSpace = count === 0;

  return (
    <Autocomplete
      multiple={multiple}
      disableCloseOnSelect={multiple}
      disableClearable={!multiple}
      options={options}
      value={(multiple ? value : (value[0] ?? null)) as T}
      getOptionLabel={(v) => getOptionLabel(v as T)}
      isOptionEqualToValue={(a, b) => getOptionKey(a) === getOptionKey(b)}
      onChange={(_, v) => onChange(multiple ? (v as T[]) : (v ? [v as T] : []))}
      renderOption={renderOptionIcon ? (props, option) => {
        const { key, ...rest } = props;
        return (
          <li key={key} {...rest} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {renderOptionIcon(option)}
            {getOptionLabel(option)}
          </li>
        );
      } : undefined}
      // MUI v9's renderValue (replacing renderTags) covers single-select too — used here to show
      // the field's label + count badge instead of the selected values, once there's a count.
      renderValue={count > 0 ? () => <LabelWithCount label={label} count={count} /> : undefined}
      renderInput={(params) => <TextField {...params} placeholder={count === 0 ? label : undefined} size="small" />}
      size="small"
      // The field itself stays a fixed FIELD_WIDTH, but the dropdown shouldn't inherit that — size
      // it to its own content so option labels never wrap onto a second line.
      slotProps={{
        popper: { style: { width: 'fit-content', minWidth: FIELD_WIDTH } },
        paper: { sx: { '& .MuiAutocomplete-option': { whiteSpace: 'nowrap' } } },
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
          // Once there's a count, the label + badge (renderValue) owns the row's space — the native
          // input collapses to 0 so it doesn't compete for room or duplicate the label as a placeholder.
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
  );
}
