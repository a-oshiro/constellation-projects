import { useLayoutEffect, useRef, useState } from 'react';
import { Autocomplete, TextField, Chip } from '@mui/material';
import type { ReactNode } from 'react';
import { CHIP_SX as PANEL_CHIP_SX } from './AlertsFilterPanel';

export const FIELD_WIDTH = 140;
const CHIP_GAP = 4;

// Same chip look as the left panel's fields, plus fit-content sizing and ellipsis truncation for
// when a chip's label doesn't fit. flexShrink must stay 1 (not 0) so the chip yields room to a
// sibling "+N" badge instead of claiming the whole container via its own maxWidth:100%.
const CHIP_SX = {
  ...PANEL_CHIP_SX,
  width: 'fit-content',
  maxWidth: '100%',
  minWidth: 0,
  flexShrink: 1,
  '& .MuiChip-label': {
    ...PANEL_CHIP_SX['& .MuiChip-label'],
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  '& .MuiChip-deleteIcon': {
    ...PANEL_CHIP_SX['& .MuiChip-deleteIcon'],
    flexShrink: 0,
  },
};

type GetItemProps = (args: { index: number }) => Record<string, unknown>;

/**
 * Shows as many selected-value chips as fit the field's available width (measured against hidden
 * clones, same idiom as StrategySummary in ManageWorkflowDialog.tsx), falling back to a plain-text
 * "+N" for the rest.
 */
function FittingChips<T>({
  tagValue, getItemProps, getOptionLabel, renderOptionIcon,
}: {
  tagValue: T[];
  getItemProps: GetItemProps;
  getOptionLabel: (v: T) => string;
  renderOptionIcon?: (v: T) => ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cloneRefs = useRef<Array<HTMLElement | null>>([]);
  const moreRefs = useRef<Array<HTMLElement | null>>([]);
  const [visibleCount, setVisibleCount] = useState(tagValue.length);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || tagValue.length === 0) { setVisibleCount(0); return; }

    const available = container.clientWidth;
    const itemWidths = cloneRefs.current.slice(0, tagValue.length).map((el) => el?.offsetWidth ?? 0);

    // prefixWidths[k] = rendered width of the first k chips, gaps included.
    const prefixWidths = [0];
    itemWidths.forEach((w, i) => {
      prefixWidths.push(prefixWidths[i] + w + (i > 0 ? CHIP_GAP : 0));
    });

    if (prefixWidths[tagValue.length] <= available) {
      setVisibleCount(tagValue.length);
      return;
    }

    // At least one chip always shows (CSS-truncated if needed) — "+N" only covers items beyond it.
    for (let k = tagValue.length - 1; k >= 1; k--) {
      const remaining = tagValue.length - k;
      const badgeWidth = moreRefs.current[remaining - 1]?.offsetWidth ?? 0;
      if (prefixWidths[k] + CHIP_GAP + badgeWidth <= available) {
        setVisibleCount(k);
        return;
      }
    }
    setVisibleCount(1);
  }, [tagValue, getOptionLabel]);

  const visible = tagValue.slice(0, visibleCount);
  const remaining = tagValue.length - visibleCount;

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: CHIP_GAP, flex: '1 1 auto', minWidth: 0, overflow: 'hidden' }}>
      {visible.map((option, i) => {
        const { key, ...itemProps } = getItemProps({ index: i });
        return (
          <Chip
            key={key as string}
            {...itemProps}
            label={getOptionLabel(option)}
            icon={renderOptionIcon ? renderOptionIcon(option) : undefined}
            sx={CHIP_SX}
          />
        );
      })}
      {remaining > 0 && (
        <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', whiteSpace: 'nowrap', flexShrink: 0 }}>
          +{remaining}
        </span>
      )}

      {/* Hidden measurement clones — same chip markup, used to compute how many fit. */}
      <div aria-hidden style={{ position: 'absolute', visibility: 'hidden', height: 0, overflow: 'hidden', pointerEvents: 'none', top: 0, left: 0, display: 'flex', gap: CHIP_GAP }}>
        {tagValue.map((option, i) => (
          <div key={i} ref={(el) => { cloneRefs.current[i] = el; }}>
            <Chip label={getOptionLabel(option)} icon={renderOptionIcon ? renderOptionIcon(option) : undefined} sx={CHIP_SX} />
          </div>
        ))}
        {tagValue.map((_, i) => (
          <span key={i} ref={(el) => { moreRefs.current[i] = el; }} style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', whiteSpace: 'nowrap' }}>
            +{i + 1}
          </span>
        ))}
      </div>
    </div>
  );
}

interface CompactFilterSelectProps<T> {
  label: string;
  options: T[];
  value: T[];
  multiple: boolean;
  getOptionKey: (v: T) => string;
  getOptionLabel: (v: T) => string;
  renderOptionIcon?: (v: T) => ReactNode;
  onChange: (v: T[]) => void;
}

export function CompactFilterSelect<T>({
  label, options, value, multiple, getOptionKey, getOptionLabel, renderOptionIcon, onChange,
}: CompactFilterSelectProps<T>) {
  // MUI v9 removed `renderTags` in favor of `renderValue` — same idea, but it also covers single-select.
  const renderValue = (val: unknown, getItemProps: GetItemProps) => {
    const tagValue = val as T[];
    if (tagValue.length === 0) return null;
    return (
      <FittingChips
        tagValue={tagValue}
        getItemProps={getItemProps}
        getOptionLabel={getOptionLabel}
        renderOptionIcon={renderOptionIcon}
      />
    );
  };

  // With a multi-select value, FittingChips owns the row's flexible space — the native input
  // collapses to ~0 so it doesn't compete for room. Otherwise (empty, or single-select) it's the
  // only content and should fill the field normally.
  const inputTakesSpace = !(multiple && value.length > 0);

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
      renderValue={multiple ? renderValue : undefined}
      renderInput={(params) => (
        <TextField {...params} placeholder={value.length === 0 ? label : undefined} size="small" />
      )}
      size="small"
      sx={{
        width: FIELD_WIDTH,
        flexShrink: 0,
        // Same chrome (colors, radius, font) as the left panel's INPUT_SX.
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
          background: '#f9fafa',
          '& fieldset': { borderColor: '#cac9cf' },
          '&:hover fieldset': { borderColor: '#9b96b0' },
          '&.Mui-focused fieldset': { borderColor: '#473bab' },
        },
        '& .MuiOutlinedInput-input': {
          padding: '0 !important',
          fontSize: 13,
          fontFamily: 'Roboto, sans-serif',
          textOverflow: 'ellipsis',
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
