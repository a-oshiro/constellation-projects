import { useMemo, useState } from 'react';
import {
  TextField, IconButton, FormControl, InputLabel, Select, MenuItem, Button, InputAdornment,
} from '@mui/material';
import { Add, Close, DeleteOutlined, PlaylistAddOutlined, Search } from '@mui/icons-material';
import { FIELD_TYPES, fieldTypeHasOptions, normalizeFieldOptions } from '../../data/fields';
import type { Field, FieldType } from '../../data/fields';

const fieldSx = {
  '& .MuiInputLabel-root': { fontSize: 12 },
  '& .MuiOutlinedInput-input': { fontSize: 12 },
  '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#473bab' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#473bab' },
  '& .MuiFormHelperText-root': { fontSize: 11, marginLeft: 0 },
};

const LINK_BUTTON_SX = {
  textTransform: 'none', fontSize: 13, fontWeight: 500, letterSpacing: '0.46px',
  color: '#473bab', padding: '4px 5px', minWidth: 0,
  '&:hover': { background: 'rgba(99,86,225,0.04)' },
} as const;

interface OptionDraft {
  id: string;
  value: string;
}

const newOptionId = () => `opt-${Math.random().toString(36).slice(2)}`;

const toDrafts = (values: string[]): OptionDraft[] => values.map((value) => ({ id: newOptionId(), value }));

// Options stay alphabetical. Re-sorting happens when an option loses focus (not on every keystroke)
// so the row the user is typing into doesn't jump. Blank rows sink out on blur.
const sortDrafts = (drafts: OptionDraft[]): OptionDraft[] =>
  drafts
    .filter((d) => d.value.trim() !== '')
    .sort((a, b) => a.value.trim().localeCompare(b.value.trim(), undefined, { sensitivity: 'base', numeric: true }));

interface FieldPanelProps {
  onClose: () => void;
  onSave: (field: Field) => void;
  initialValue?: Field;
  existingFields: Field[];
}

export const FieldPanel = ({ onClose, onSave, initialValue, existingFields }: FieldPanelProps) => {
  const [name, setName] = useState(initialValue?.name ?? '');
  const [type, setType] = useState<FieldType | ''>(initialValue?.type ?? '');
  const [options, setOptions] = useState<OptionDraft[]>(() => toDrafts(initialValue?.values ?? []));
  const [optionFilter, setOptionFilter] = useState('');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [focusOptionId, setFocusOptionId] = useState<string | null>(null);

  const hasOptions = type !== '' && fieldTypeHasOptions(type);

  const trimmedName = name.trim();
  const nameTaken = existingFields.some(
    (f) => f.id !== initialValue?.id && f.name.trim().toLowerCase() === trimmedName.toLowerCase(),
  );

  // Option values that appear more than once (case-insensitive) are flagged inline.
  const duplicateKeys = useMemo(() => {
    const counts = new Map<string, number>();
    for (const o of options) {
      const key = o.value.trim().toLowerCase();
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return new Set([...counts].filter(([, count]) => count > 1).map(([key]) => key));
  }, [options]);

  const normalizedValues = normalizeFieldOptions(options.map((o) => o.value));

  const canSave =
    trimmedName !== '' &&
    !nameTaken &&
    type !== '' &&
    (!hasOptions || (normalizedValues.length > 0 && duplicateKeys.size === 0));

  const filterQuery = optionFilter.trim().toLowerCase();
  const visibleOptions = filterQuery
    ? options.filter((o) => o.value.trim() === '' || o.value.toLowerCase().includes(filterQuery))
    : options;

  const handleAddOption = () => {
    const draft = { id: newOptionId(), value: '' };
    setOptionFilter('');
    setOptions((prev) => [draft, ...prev]);
    setFocusOptionId(draft.id);
  };

  const handleOptionChange = (id: string, value: string) => {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, value } : o)));
  };

  const handleRemoveOption = (id: string) => {
    setOptions((prev) => prev.filter((o) => o.id !== id));
  };

  const handleAddBulk = () => {
    const incoming = bulkText.split(/\r?\n/);
    const existingKeys = new Set(options.map((o) => o.value.trim().toLowerCase()));
    const additions = normalizeFieldOptions(incoming).filter((v) => !existingKeys.has(v.toLowerCase()));
    setOptions((prev) => sortDrafts([...prev, ...toDrafts(additions)]));
    setBulkText('');
    setBulkOpen(false);
  };

  const handleSave = () => {
    if (!canSave || type === '') return;
    onSave({
      id: initialValue?.id ?? `fld-${Math.random().toString(36).slice(2)}`,
      name: trimmedName,
      // New fields created here are always Client fields; editing keeps the original source.
      source: initialValue?.source ?? 'Client',
      type,
      values: hasOptions ? normalizedValues : [],
    });
  };

  return (
    <div
      className="flex flex-col shrink-0 overflow-hidden"
      style={{ width: 320, background: '#ffffff', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
    >
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', flexShrink: 0,
      }}>
        <span style={{ fontSize: 16, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px' }}>
          {initialValue ? 'Edit Field' : 'New Field'}
        </span>
        <IconButton size="small" onClick={onClose} aria-label="Close" sx={{ padding: '4px' }}>
          <Close style={{ fontSize: 18, color: '#686576' }} />
        </IconButton>
      </div>

      {/* ── Fields ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '8px 16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <TextField
          label="Field Name"
          required
          size="small"
          fullWidth
          autoFocus={!initialValue}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={nameTaken}
          helperText={nameTaken ? 'A field with this name already exists.' : undefined}
          sx={fieldSx}
        />

        <FormControl size="small" fullWidth required>
          <InputLabel sx={{ fontSize: 12, '&.Mui-focused': { color: '#473bab' } }}>Field Type</InputLabel>
          <Select
            label="Field Type"
            value={type}
            onChange={(e) => setType(e.target.value as FieldType)}
            sx={{ fontSize: 12, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#473bab' } }}
          >
            {FIELD_TYPES.map((opt) => (
              <MenuItem key={opt} value={opt} sx={{ fontSize: 12 }}>{opt}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {hasOptions && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px' }}>
              Select Options:
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Button size="small" onClick={handleAddOption} startIcon={<Add style={{ fontSize: 18 }} />} sx={LINK_BUTTON_SX}>
                Add Option
              </Button>
              <Button
                size="small"
                onClick={() => setBulkOpen((open) => !open)}
                startIcon={<PlaylistAddOutlined style={{ fontSize: 18 }} />}
                sx={LINK_BUTTON_SX}
              >
                Add in Bulk
              </Button>
            </div>

            {bulkOpen && (
              <div style={{ background: '#f4f5f6', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <TextField
                  label="Options"
                  placeholder="One option per line"
                  multiline
                  minRows={4}
                  maxRows={10}
                  fullWidth
                  autoFocus
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  sx={{ ...fieldSx, '& .MuiOutlinedInput-root': { background: '#ffffff' } }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                  <Button size="small" onClick={() => { setBulkText(''); setBulkOpen(false); }} sx={LINK_BUTTON_SX}>
                    Cancel
                  </Button>
                  <Button size="small" onClick={handleAddBulk} disabled={bulkText.trim() === ''} sx={LINK_BUTTON_SX}>
                    Add Options
                  </Button>
                </div>
              </div>
            )}

            <TextField
              size="small"
              placeholder="Filter options..."
              value={optionFilter}
              onChange={(e) => setOptionFilter(e.target.value)}
              slotProps={{
                input: { startAdornment: <InputAdornment position="start"><Search style={{ fontSize: 18, color: '#9c99a9' }} /></InputAdornment> },
              }}
              sx={fieldSx}
            />

            {options.length === 0 && (
              <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px', padding: '4px 0' }}>
                Add at least one option.
              </span>
            )}
            {options.length > 0 && visibleOptions.length === 0 && (
              <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px', padding: '4px 0' }}>
                No options match “{optionFilter.trim()}”.
              </span>
            )}

            {visibleOptions.map((option) => {
              const isDuplicate = duplicateKeys.has(option.value.trim().toLowerCase());
              return (
                <div key={option.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Option name"
                    value={option.value}
                    autoFocus={option.id === focusOptionId}
                    onChange={(e) => handleOptionChange(option.id, e.target.value)}
                    onBlur={() => { setFocusOptionId(null); setOptions(sortDrafts); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                    error={isDuplicate}
                    helperText={isDuplicate ? 'Duplicate option' : undefined}
                    slotProps={{ htmlInput: { 'aria-label': 'Option name' } }}
                    sx={fieldSx}
                  />
                  <IconButton
                    size="small"
                    aria-label={`Remove ${option.value || 'option'}`}
                    onClick={() => handleRemoveOption(option.id)}
                    sx={{ padding: '6px', marginTop: '2px' }}
                  >
                    <DeleteOutlined style={{ fontSize: 20, color: '#686576' }} />
                  </IconButton>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8,
        padding: '12px 16px', flexShrink: 0,
      }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderRadius: 100, textTransform: 'capitalize', fontSize: 14, fontWeight: 500,
            letterSpacing: '0.4px', borderColor: 'rgba(99,86,225,0.5)', color: '#473bab',
            '&:hover': { borderColor: '#473bab', background: 'rgba(99,86,225,0.04)' },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!canSave}
          variant="contained"
          sx={{
            borderRadius: 100, textTransform: 'capitalize', fontSize: 14, fontWeight: 500,
            letterSpacing: '0.4px', background: '#473bab',
            '&:hover': { background: '#3d3396' },
          }}
        >
          Save
        </Button>
      </div>
    </div>
  );
};
