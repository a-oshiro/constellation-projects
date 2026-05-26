import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

interface AppSelectProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
}

export const AppSelect = ({
  label,
  value,
  onChange,
  options,
  disabled,
  size = 'small',
  fullWidth = true,
}: AppSelectProps) => (
  <FormControl size={size} fullWidth={fullWidth} disabled={disabled}>
    {label && <InputLabel sx={{ fontSize: 13 }}>{label}</InputLabel>}
    <Select
      value={value}
      label={label}
      onChange={(e) => onChange(e.target.value as string)}
      sx={{
        fontSize: 14,
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6d28d9' },
      }}
    >
      {options.map((opt) => (
        <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: 14 }}>
          {opt.label}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);
