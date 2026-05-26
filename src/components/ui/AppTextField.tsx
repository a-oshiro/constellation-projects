import type { TextFieldProps } from '@mui/material';
import { TextField } from '@mui/material';

type AppTextFieldProps = TextFieldProps;

export const AppTextField = ({ label, ...props }: AppTextFieldProps) => (
  <TextField
    label={label}
    size="small"
    fullWidth
    variant="outlined"
    {...props}
    sx={{
      '& .MuiInputLabel-root': { fontSize: 13 },
      '& .MuiOutlinedInput-input': { fontSize: 14 },
      '& .MuiOutlinedInput-root': {
        '&.Mui-focused fieldset': { borderColor: '#6d28d9' },
      },
      '& .MuiInputLabel-root.Mui-focused': { color: '#6d28d9' },
      ...props.sx,
    }}
  />
);
