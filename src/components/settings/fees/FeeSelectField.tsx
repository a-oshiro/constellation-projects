import { MenuItem, Select } from '@mui/material';
import chevronDownIcon from '../../../assets/icons/fees/chevron-down-small.svg';
import { FeeFieldLabel } from './FeeTextField';
import { FEE_INPUT_ROOT_SX } from './feeInputStyles';

// Figma "Applies to" select: same input styling as FeeTextField, chevron-down-small icon on the right.
const ICON_SIZE = 24;
const MENU_FONT_SIZE = 12;

const ChevronIcon = ({ className }: { className?: string }) => (
  <img
    src={chevronDownIcon}
    alt=""
    width={ICON_SIZE}
    height={ICON_SIZE}
    className={className}
    style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
  />
);

interface FeeSelectFieldProps {
  id: string;
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  width?: number | string;
}

export const FeeSelectField = ({ id, label, value, options, onChange, width = '100%' }: FeeSelectFieldProps) => (
  <div style={{ width, minWidth: 0 }}>
    <FeeFieldLabel htmlFor={id}>{label}</FeeFieldLabel>
    <Select
      id={id}
      size="small"
      fullWidth
      value={value}
      onChange={(e) => onChange(e.target.value)}
      IconComponent={ChevronIcon}
      sx={{ ...FEE_INPUT_ROOT_SX, '& .MuiSelect-select': { padding: `6px ${ICON_SIZE + 8}px 6px 0` } }}
    >
      {options.map((o) => (
        <MenuItem key={o} value={o} sx={{ fontSize: MENU_FONT_SIZE }}>{o}</MenuItem>
      ))}
    </Select>
  </div>
);
