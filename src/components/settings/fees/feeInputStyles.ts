// Figma <TextField> (outlined, small) as used across the Fees tab: filled #f9fafa, #dddce0 border,
// 36px tall, body2 (12px) text. Shared by FeeTextField and FeeSelectField; sizes live here.
export const INPUT_FONT_SIZE = 12;
export const INPUT_HEIGHT = 36;
export const INPUT_PADDING_X = 8;

/** Styles for an MUI OutlinedInput root (TextField's `.MuiOutlinedInput-root`, or a Select itself). */
export const FEE_INPUT_ROOT_SX = {
  background: '#f9fafa', fontSize: INPUT_FONT_SIZE, letterSpacing: '0.17px', color: '#1f1d25',
  height: INPUT_HEIGHT, borderRadius: '4px', paddingLeft: `${INPUT_PADDING_X}px`,
  '& fieldset': { borderColor: '#dddce0' },
  '&:hover fieldset': { borderColor: '#9b96b0' },
  '&.Mui-focused fieldset': { borderColor: '#473bab', borderWidth: 1 },
} as const;

export const FEE_TEXT_FIELD_SX = {
  '& .MuiOutlinedInput-root': FEE_INPUT_ROOT_SX,
  '& .MuiOutlinedInput-input': { padding: `6px ${INPUT_PADDING_X}px 6px 0` },
  '& .MuiInputAdornment-root p': { fontSize: INPUT_FONT_SIZE, color: '#1f1d25' },
} as const;
