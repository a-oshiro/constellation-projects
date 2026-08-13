import { useMemo } from 'react';
import { IconButton, Select, MenuItem, Autocomplete, TextField, Chip } from '@mui/material';
import { Close, CheckCircle, Cancel } from '@mui/icons-material';
import type { Alert, AlertStatus, Offer } from '../../data/types';
import {
  DATE_PRESETS, MODEL_TYPE_OPTIONS, LIFECYCLE_STEP_LABELS, APPROVAL_LABELS,
  buildAlertFilterOptions, hasActiveAlertFilters,
} from '../../utils/alertFilters';
import type { AlertFilterState, ApprovalFilterKey } from '../../utils/alertFilters';
import { DEFAULT_ALERT_FILTER_STATE } from '../../utils/alertFilters';

const LABEL_STYLE = {
  fontSize: 12,
  fontFamily: 'Roboto, sans-serif',
  color: '#686576',
  letterSpacing: '0.15px',
  lineHeight: '1.33',
  marginBottom: 4,
};

const SECTION_LABEL_STYLE = {
  fontSize: 11,
  fontFamily: 'Roboto, sans-serif',
  fontWeight: 500,
  color: '#9c99a9',
  letterSpacing: '0.5px',
  textTransform: 'uppercase' as const,
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
            return <Chip key={key} label={getLabel(option)} {...tagProps} sx={CHIP_SX} />;
          })
        }
        renderInput={(params) => (
          <TextField {...params} placeholder={value.length === 0 ? 'All' : undefined} sx={INPUT_SX} />
        )}
        sx={{ '& .MuiOutlinedInput-root': { flexWrap: 'wrap', gap: '4px', padding: '4px 8px !important' } }}
        size="small"
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

const APPROVAL_OPTIONS: ApprovalFilterKey[] = ['approved_email', 'approved_assets', 'rejected_email', 'rejected_assets'];

function ApprovalsField({ value, onChange }: { value: ApprovalFilterKey[]; onChange: (v: ApprovalFilterKey[]) => void }) {
  const icon = (key: ApprovalFilterKey, fontSize: number) =>
    key.startsWith('approved')
      ? <CheckCircle style={{ fontSize, color: '#4caf50' }} />
      : <Cancel style={{ fontSize, color: '#d2323f' }} />;

  return (
    <div>
      <div style={LABEL_STYLE}>Approvals</div>
      <Autocomplete
        multiple
        disableCloseOnSelect
        options={APPROVAL_OPTIONS}
        value={value}
        getOptionLabel={(v) => APPROVAL_LABELS[v]}
        onChange={(_, v) => onChange(v as ApprovalFilterKey[])}
        renderOption={(props, option) => {
          const { key, ...rest } = props;
          return (
            <li key={key} {...rest} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {icon(option, 16)}
              {APPROVAL_LABELS[option]}
            </li>
          );
        }}
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((option, index) => {
            const { key, ...tagProps } = getTagProps({ index });
            return <Chip key={key} icon={icon(option, 14)} label={APPROVAL_LABELS[option]} {...tagProps} sx={CHIP_SX} />;
          })
        }
        renderInput={(params) => (
          <TextField {...params} placeholder={value.length === 0 ? 'All' : undefined} sx={INPUT_SX} />
        )}
        sx={{ '& .MuiOutlinedInput-root': { flexWrap: 'wrap', gap: '4px', padding: '4px 8px !important' } }}
        size="small"
      />
    </div>
  );
}

interface AlertsFilterPanelProps {
  alerts: Alert[];
  offers: Offer[];
  state: AlertFilterState;
  onChange: (updates: Partial<AlertFilterState>) => void;
  onClose: () => void;
  width?: number;
}

export const AlertsFilterPanel = ({ alerts, offers, state, onChange, onClose, width = 280 }: AlertsFilterPanelProps) => {
  const options = useMemo(() => buildAlertFilterOptions(alerts, offers), [alerts, offers]);
  const isActive = hasActiveAlertFilters(state);

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', flexShrink: 0, borderBottom: '1px solid #f0f2f4' }}>
        <span style={{ fontSize: 16, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25' }}>
          Alerts Filters
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {isActive && (
            <button
              onClick={() => onChange(DEFAULT_ALERT_FILTER_STATE)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', fontSize: 12,
                fontFamily: 'Roboto, sans-serif', color: '#473bab', fontWeight: 500,
                letterSpacing: '0.46px', padding: '2px 6px', borderRadius: 100,
              }}
            >
              Clear all
            </button>
          )}
          <IconButton size="small" onClick={onClose} sx={{ padding: '5px' }}>
            <Close style={{ fontSize: 20, color: '#686576' }} />
          </IconButton>
        </div>
      </div>

      {/* Fields */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Sort by */}
        <div>
          <div style={LABEL_STYLE}>Sort by</div>
          <Select
            value={state.sortOrder}
            onChange={(e) => onChange({ sortOrder: e.target.value as AlertFilterState['sortOrder'] })}
            size="small"
            fullWidth
            sx={{
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
            <MenuItem value="newest" sx={{ fontSize: 13, fontFamily: 'Roboto, sans-serif' }}>Newest</MenuItem>
            <MenuItem value="oldest" sx={{ fontSize: 13, fontFamily: 'Roboto, sans-serif' }}>Oldest</MenuItem>
          </Select>
        </div>

        {/* TYPE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={SECTION_LABEL_STYLE}>Type</span>
          <MultiSelectField
            label="Signal Type"
            options={options.signalTypes}
            value={state.signalTypes}
            getLabel={(v) => v}
            onChange={(v) => onChange({ signalTypes: v })}
          />
        </div>

        {/* DATE RANGE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={SECTION_LABEL_STYLE}>Date Range</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={LABEL_STYLE}>Start date</div>
              <TextField
                type="date"
                size="small"
                fullWidth
                value={state.startDate}
                onChange={(e) => onChange({ datePreset: 'custom', startDate: e.target.value })}
                sx={INPUT_SX}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={LABEL_STYLE}>End date</div>
              <TextField
                type="date"
                size="small"
                fullWidth
                value={state.endDate}
                onChange={(e) => onChange({ datePreset: 'custom', endDate: e.target.value })}
                sx={INPUT_SX}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {DATE_PRESETS.map((preset) => (
              <button
                key={preset.key}
                onClick={() => onChange({ datePreset: preset.key, startDate: '', endDate: '' })}
                style={{
                  flex: 1, border: 'none', cursor: 'pointer', borderRadius: 6, padding: '4px 8px',
                  fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 500, whiteSpace: 'nowrap',
                  background: state.datePreset === preset.key ? '#473bab' : '#f0f2f4',
                  color: state.datePreset === preset.key ? '#ffffff' : '#1f1d25',
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* STATUS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={SECTION_LABEL_STYLE}>Status</span>
          <MultiSelectField
            label="Lifecycle step"
            options={Object.keys(LIFECYCLE_STEP_LABELS) as AlertStatus[]}
            value={state.lifecycleSteps}
            getLabel={(v) => LIFECYCLE_STEP_LABELS[v]}
            onChange={(v) => onChange({ lifecycleSteps: v })}
          />
          <ApprovalsField value={state.approvals} onChange={(v) => onChange({ approvals: v })} />
        </div>

        {/* VEHICLE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={SECTION_LABEL_STYLE}>Vehicle</span>
          <MultiSelectField
            label="Model Type"
            options={MODEL_TYPE_OPTIONS}
            value={state.modelTypes}
            getLabel={(v) => v}
            onChange={(v) => onChange({ modelTypes: v })}
          />
          <MultiSelectField
            label="Year"
            options={options.years}
            value={state.years}
            getLabel={(v) => String(v)}
            onChange={(v) => onChange({ years: v })}
          />
          <MultiSelectField
            label="Make"
            options={options.makes}
            value={state.makes}
            getLabel={(v) => v}
            onChange={(v) => onChange({ makes: v })}
          />
          <MultiSelectField
            label="Model"
            options={options.models}
            value={state.models}
            getLabel={(v) => v}
            onChange={(v) => onChange({ models: v })}
          />
          <MultiSelectField
            label="Trim"
            options={options.trims}
            value={state.trims}
            getLabel={(v) => v}
            onChange={(v) => onChange({ trims: v })}
          />
        </div>
      </div>
    </div>
  );
};
