import { useState } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import chevronDownIcon from '../../../assets/icons/fees/chevron-down-small-rounded.svg';
import { matchesFeeSyncDealership } from '../../../data/feeSync';
import type { FeeSyncDealership } from '../../../data/feeSync';
import { FeeFieldLabel } from './FeeTextField';
import { FEE_INPUT_ROOT_SX, INPUT_FONT_SIZE, INPUT_PADDING_X } from './feeInputStyles';

// Figma "Dealership Field Interaction": an Autocomplete preselected with the account's FeeSync match,
// showing "Name (code)". Typing searches the group by dealer name, dealer code or ZIP; each option shows
// the name over "ZIP Code" and "Dealer code". Sizes live here.
const FIELD_WIDTH = 320;
const ICON_SIZE = 24;
const ICON_RIGHT = 4;
const FOCUS_BORDER = 'rgba(99,86,225,0.7)';
const MENU_OFFSET = 2;
const MENU_MAX_HEIGHT = 360;
const MENU_PADDING_Y = 8;
const OPTION_MIN_HEIGHT = 36;
const OPTION_PADDING = '4px 4px 4px 16px';
const ZIP_WIDTH = 96;
const META_GAP = 12;
const META_FONT_SIZE = 11;

const PRIMARY_TEXT = '#1f1d25';
const SECONDARY_TEXT = '#686576';

const ChevronIcon = () => <img src={chevronDownIcon} alt="" width={ICON_SIZE} height={ICON_SIZE} style={{ display: 'block' }} />;

interface FeeSyncDealershipFieldProps {
  value: FeeSyncDealership;
  options: FeeSyncDealership[];
  onChange: (dealership: FeeSyncDealership) => void;
  disabled?: boolean;
}

export const FeeSyncDealershipField = ({ value, options, onChange, disabled }: FeeSyncDealershipFieldProps) => {
  const [inputValue, setInputValue] = useState(value.name);
  // While the field shows the selection (not a search), the code follows the name in secondary text.
  const showingSelection = inputValue === value.name;

  return (
    <div style={{ width: FIELD_WIDTH, maxWidth: '100%' }}>
      <FeeFieldLabel htmlFor="feesync-dealership">Dealership</FeeFieldLabel>
      <Autocomplete
        id="feesync-dealership"
        value={value}
        options={options}
        disabled={disabled}
        disableClearable
        autoHighlight
        size="small"
        inputValue={inputValue}
        onInputChange={(_, next) => setInputValue(next)}
        onChange={(_, next) => { if (next) onChange(next); }}
        getOptionLabel={(o) => o.name}
        getOptionKey={(o) => o.code}
        isOptionEqualToValue={(a, b) => a.code === b.code}
        filterOptions={(list, { inputValue: query }) => list.filter((o) => matchesFeeSyncDealership(o, query))}
        noOptionsText="No dealerships found"
        popupIcon={<ChevronIcon />}
        renderInput={(params) => (
          <div style={{ position: 'relative' }}>
            <TextField
              {...params}
              placeholder="Search by dealership or code"
              sx={{
                '& .MuiOutlinedInput-root': {
                  ...FEE_INPUT_ROOT_SX,
                  padding: `0 ${ICON_SIZE + ICON_RIGHT}px 0 ${INPUT_PADDING_X}px !important`,
                  '&.Mui-focused fieldset': { borderColor: FOCUS_BORDER, borderWidth: 2 },
                },
                '& .MuiAutocomplete-input': {
                  padding: '6px 0 !important', fontSize: INPUT_FONT_SIZE,
                  ...(showingSelection && { color: 'transparent', caretColor: PRIMARY_TEXT }),
                },
                '& .MuiAutocomplete-endAdornment': { right: `${ICON_RIGHT}px !important` },
                '& .MuiAutocomplete-popupIndicator': { padding: 0 },
              }}
            />
            {showingSelection && (
              <span
                aria-hidden
                style={{
                  position: 'absolute', left: INPUT_PADDING_X, right: ICON_SIZE + ICON_RIGHT + 4, top: '50%', transform: 'translateY(-50%)',
                  pointerEvents: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  fontSize: INPUT_FONT_SIZE, lineHeight: 1.43, letterSpacing: '0.17px', color: disabled ? 'rgba(0,0,0,0.38)' : PRIMARY_TEXT,
                  fontFamily: 'Roboto, sans-serif',
                }}
              >
                {value.name} <span style={{ color: disabled ? 'inherit' : SECONDARY_TEXT }}>({value.code})</span>
              </span>
            )}
          </div>
        )}
        renderOption={(props, option) => {
          const { key, ...rest } = props as typeof props & { key: string };
          return (
            <li key={key} {...rest} style={{ minHeight: OPTION_MIN_HEIGHT, padding: OPTION_PADDING }}>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, fontFamily: 'Roboto, sans-serif' }}>
                <span style={{ fontSize: INPUT_FONT_SIZE, lineHeight: 1.43, letterSpacing: '0.17px', color: PRIMARY_TEXT }}>{option.name}</span>
                <span style={{ display: 'flex', gap: META_GAP, fontSize: META_FONT_SIZE, lineHeight: 1.66, letterSpacing: '0.4px', color: SECONDARY_TEXT }}>
                  <span style={{ width: ZIP_WIDTH, flexShrink: 0 }}>ZIP Code: {option.zipCode}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>Dealer code: {option.code}</span>
                </span>
              </div>
            </li>
          );
        }}
        slotProps={{
          popper: { modifiers: [{ name: 'offset', options: { offset: [0, MENU_OFFSET] } }] },
          paper: { elevation: 8, sx: { borderRadius: '4px', '& .MuiAutocomplete-noOptions': { fontSize: INPUT_FONT_SIZE, color: SECONDARY_TEXT } } },
          listbox: { sx: { maxHeight: MENU_MAX_HEIGHT, padding: `${MENU_PADDING_Y}px 0` } },
        }}
      />
    </div>
  );
};
