import type { ReactNode } from 'react';
import { Button, CircularProgress } from '@mui/material';

// Figma <Button> (Av3): sentence/capitalized label, 100px radius, no shadow. Sizes live here.
const FONT_SIZE = 14;
const LINE_HEIGHT = '24px';
const CONTAINED_PADDING = '6px 16px';
const OUTLINED_PADDING = '5px 15px';
const TEXT_PADDING = '6px 8px';
const SPINNER_SIZE = 16;
const SPINNER_GAP = 8;

const PRIMARY = '#473bab';
const PRIMARY_HOVER = '#3d3396';
const DISABLED_BG = 'rgba(0,0,0,0.12)';
const DISABLED_TEXT = 'rgba(0,0,0,0.38)';

export type FeeButtonVariant = 'contained' | 'outlined' | 'text';

interface FeeButtonProps {
  variant?: FeeButtonVariant;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  /** Shows a small inline spinner after the label and disables the button. */
  loading?: boolean;
  type?: 'button' | 'submit';
}

export const FeeButton = ({ variant = 'contained', children, onClick, disabled, loading = false, type = 'button' }: FeeButtonProps) => (
  <Button
    type={type}
    variant={variant}
    disableElevation
    onClick={onClick}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    sx={{
      textTransform: 'capitalize', fontSize: FONT_SIZE, fontWeight: 500, letterSpacing: '0.4px', lineHeight: LINE_HEIGHT,
      borderRadius: '100px', minWidth: 0, whiteSpace: 'nowrap', gap: `${SPINNER_GAP}px`,
      padding: variant === 'contained' ? CONTAINED_PADDING : variant === 'outlined' ? OUTLINED_PADDING : TEXT_PADDING,
      ...(variant === 'contained' && {
        background: PRIMARY, color: '#ffffff',
        '&:hover': { background: PRIMARY_HOVER },
        '&.Mui-disabled': { background: DISABLED_BG, color: DISABLED_TEXT },
      }),
      ...(variant === 'outlined' && {
        color: PRIMARY, borderColor: PRIMARY,
        '&.Mui-disabled': { color: DISABLED_TEXT, borderColor: DISABLED_BG },
      }),
      ...(variant === 'text' && {
        color: PRIMARY,
        '&.Mui-disabled': { color: DISABLED_TEXT },
      }),
    }}
  >
    {children}
    {loading && <CircularProgress size={SPINNER_SIZE} thickness={4} sx={{ color: DISABLED_TEXT }} aria-label="Loading" />}
  </Button>
);
