import { useMemo } from 'react';
import { IconButton, Select, MenuItem, Autocomplete, TextField, Chip } from '@mui/material';
import { Close, ArrowDownward, ArrowUpward } from '@mui/icons-material';
import { useProject } from '../../context/ProjectContext';
import { useLayout } from '../../context/LayoutContext';
import { STATUS_LABELS, hasActiveFilters } from '../../utils/assetFilters';
import type { SortByOption, FilterState } from '../../utils/assetFilters';
import type { AssetStatus } from '../../data/types';

const SORT_OPTIONS: { value: SortByOption; label: string }[] = [
  { value: 'default', label: 'Default Order' },
  { value: 'template', label: 'Template' },
  { value: 'offer', label: 'Offer' },
  { value: 'dimension', label: 'Dimension' },
];

const LABEL_STYLE = {
  fontSize: 12,
  fontFamily: 'Roboto, sans-serif',
  color: '#686576',
  letterSpacing: '0.15px',
  lineHeight: '1.33',
  marginBottom: 4,
};

const INPUT_SX = {
  '& .MuiOutlinedInput-root': {
    background: '#f9fafa',
    borderRadius: '4px',
    minHeight: 36,
    padding: '6px 8px 6px 8px',
    fontSize: 13,
    fontFamily: 'Roboto, sans-serif',
    '& fieldset': { borderColor: '#cac9cf' },
    '&:hover fieldset': { borderColor: '#9b96b0' },
    '&.Mui-focused fieldset': { borderColor: '#473bab' },
  },
  '& .MuiOutlinedInput-input': {
    padding: '0 !important',
    fontSize: 13,
  },
  '& .MuiAutocomplete-input': {
    padding: '0 !important',
    minWidth: '60px !important',
  },
};

const CHIP_SX = {
  background: '#f0f2f4',
  borderRadius: '8px',
  height: 24,
  maxHeight: 24,
  '& .MuiChip-label': {
    fontSize: 11,
    fontFamily: 'Roboto, sans-serif',
    color: '#1f1d25',
    letterSpacing: '0.16px',
    padding: '0 6px',
  },
  '& .MuiChip-deleteIcon': {
    fontSize: 16,
    opacity: 0.26,
    color: '#1f1d25',
    margin: '0 4px 0 -2px',
  },
};

interface FieldProps<T> {
  label: string;
  options: T[];
  value: T[];
  getLabel: (v: T) => string;
  onChange: (v: T[]) => void;
}

function MultiSelectField<T>({ label, options, value, getLabel, onChange }: FieldProps<T>) {
  return (
    <div>
      <div style={LABEL_STYLE}>{label}</div>
      <Autocomplete
        multiple
        disableCloseOnSelect
        options={options}
        value={value}
        getOptionLabel={getLabel}
        isOptionEqualToValue={(a, b) => getLabel(a) === getLabel(b)}
        onChange={(_, v) => onChange(v as T[])}
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((option, index) => {
            const { key, ...tagProps } = getTagProps({ index });
            return (
              <Chip
                key={key}
                label={getLabel(option)}
                {...tagProps}
                sx={CHIP_SX}
              />
            );
          })
        }
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={value.length === 0 ? 'All' : undefined}
            sx={INPUT_SX}
          />
        )}
        sx={{ '& .MuiOutlinedInput-root': { flexWrap: 'wrap', gap: '4px', padding: '4px 8px !important' } }}
        size="small"
        ChipProps={{ sx: CHIP_SX }}
        slotProps={{
          paper: {
            sx: {
              fontSize: 13,
              fontFamily: 'Roboto, sans-serif',
              '& .MuiAutocomplete-option': { fontSize: 13, fontFamily: 'Roboto, sans-serif' },
            },
          },
        }}
      />
    </div>
  );
}

interface FilterPanelProps {
  width?: number;
}

export const FilterPanel = ({ width = 280 }: FilterPanelProps) => {
  const { assets } = useProject();
  const { filterState, updateFilterState, resetFilterState, closeFilterPanel } = useLayout();

  const options = useMemo(() => {
    const dimensions = [...new Set(assets.map(a => `${a.width} x ${a.height}`))].sort();
    const statuses = [...new Set(assets.map(a => a.status))] as AssetStatus[];
    const years = [...new Set(assets.map(a => a.offer.year))].sort((a, b) => a - b);
    const makes = [...new Set(assets.map(a => a.offer.make))].sort();
    const models = [...new Set(assets.map(a => a.offer.model))].sort();
    return { dimensions, statuses, years, makes, models };
  }, [assets]);

  const isActive = hasActiveFilters(filterState);

  const update = <K extends keyof FilterState>(key: K, val: FilterState[K]) =>
    updateFilterState({ [key]: val } as Partial<FilterState>);

  return (
    <div
      style={{
        width,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff',
        borderRadius: 8,
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        margin: '8px 0 8px 8px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px 12px 16px',
          flexShrink: 0,
          borderBottom: '1px solid #f0f2f4',
        }}
      >
        <span style={{ fontSize: 16, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25' }}>
          Filters
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {isActive && (
            <button
              onClick={resetFilterState}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontFamily: 'Roboto, sans-serif',
                color: '#473bab',
                fontWeight: 500,
                letterSpacing: '0.46px',
                padding: '2px 6px',
                borderRadius: 100,
              }}
            >
              Clear all
            </button>
          )}
          <IconButton size="small" onClick={closeFilterPanel} sx={{ padding: '5px' }}>
            <Close style={{ fontSize: 20, color: '#686576' }} />
          </IconButton>
        </div>
      </div>

      {/* Fields */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Sort By */}
        <div>
          <div style={LABEL_STYLE}>Sort By</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <Select
              value={filterState.sortBy}
              onChange={(e) => update('sortBy', e.target.value as SortByOption)}
              size="small"
              sx={{
                flex: 1,
                background: '#f9fafa',
                borderRadius: '4px',
                fontSize: 13,
                fontFamily: 'Roboto, sans-serif',
                minHeight: 36,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cac9cf' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#9b96b0' },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#473bab' },
                '& .MuiSelect-select': { padding: '7px 12px', fontSize: 13, fontFamily: 'Roboto, sans-serif' },
              }}
            >
              {SORT_OPTIONS.map(o => (
                <MenuItem key={o.value} value={o.value} sx={{ fontSize: 13, fontFamily: 'Roboto, sans-serif' }}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
            <IconButton
              size="small"
              onClick={() => update('sortDesc', !filterState.sortDesc)}
              sx={{
                padding: '7px',
                borderRadius: '4px',
                border: '1px solid #cac9cf',
                background: filterState.sortDesc ? '#f0eeff' : '#f9fafa',
                color: filterState.sortDesc ? '#473bab' : '#686576',
                '&:hover': { background: '#f0eeff', borderColor: '#473bab', color: '#473bab' },
              }}
            >
              {filterState.sortDesc
                ? <ArrowUpward style={{ fontSize: 18 }} />
                : <ArrowDownward style={{ fontSize: 18 }} />
              }
            </IconButton>
          </div>
        </div>

        {/* Asset Type */}
        <MultiSelectField
          label="Asset Type"
          options={['Image', 'HTML']}
          value={filterState.assetTypes}
          getLabel={(v) => v}
          onChange={(v) => update('assetTypes', v)}
        />

        {/* Dimensions */}
        <MultiSelectField
          label="Dimensions"
          options={options.dimensions}
          value={filterState.dimensions}
          getLabel={(v) => v}
          onChange={(v) => update('dimensions', v)}
        />

        {/* Status */}
        <MultiSelectField
          label="Status"
          options={options.statuses}
          value={filterState.statuses}
          getLabel={(v) => STATUS_LABELS[v] ?? v}
          onChange={(v) => update('statuses', v)}
        />

        {/* Year */}
        <MultiSelectField
          label="Year"
          options={options.years}
          value={filterState.years}
          getLabel={(v) => String(v)}
          onChange={(v) => update('years', v)}
        />

        {/* Make */}
        <MultiSelectField
          label="Make"
          options={options.makes}
          value={filterState.makes}
          getLabel={(v) => v}
          onChange={(v) => update('makes', v)}
        />

        {/* Model */}
        <MultiSelectField
          label="Model"
          options={options.models}
          value={filterState.models}
          getLabel={(v) => v}
          onChange={(v) => update('models', v)}
        />
      </div>
    </div>
  );
};
