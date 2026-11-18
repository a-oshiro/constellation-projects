import type { ReactNode } from 'react';
import { InputAdornment, TextField } from '@mui/material';

import { FEE_TEXT_FIELD_SX } from './feeInputStyles';

// Figma <TextField> with its label above the field. Input sizes live in feeInputStyles.ts; label sizes here.
const LABEL_FONT_SIZE = 12;
const LABEL_GAP = 4;
const LABEL_PADDING_X = 4;

export const FeeFieldLabel = ({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) => (
  <label
    htmlFor={htmlFor}
    style={{
      display: 'block', padding: `0 ${LABEL_PADDING_X}px`, marginBottom: LABEL_GAP,
      fontSize: LABEL_FONT_SIZE, lineHeight: '12px', letterSpacing: '0.15px', color: '#686576', fontFamily: 'Roboto, sans-serif',
    }}
  >
    {children}
  </label>
);

interface FeeTextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Text shown inside the field before the value, e.g. "$". */
  prefix?: string;
  width?: number | string;
  autoFocus?: boolean;
  inputMode?: 'text' | 'decimal' | 'numeric';
}

export const FeeTextField = ({ id, label, value, onChange, placeholder, prefix, width = '100%', autoFocus, inputMode }: FeeTextFieldProps) => (
  <div style={{ width, minWidth: 0 }}>
    <FeeFieldLabel htmlFor={id}>{label}</FeeFieldLabel>
    <TextField
      id={id}
      size="small"
      fullWidth
      value={value}
      placeholder={placeholder}
      autoFocus={autoFocus}
      onChange={(e) => onChange(e.target.value)}
      slotProps={{
        htmlInput: { inputMode },
        input: prefix ? { startAdornment: <InputAdornment position="start" sx={{ marginRight: '4px' }}>{prefix}</InputAdornment> } : undefined,
      }}
      sx={FEE_TEXT_FIELD_SX}
    />
  </div>
);
