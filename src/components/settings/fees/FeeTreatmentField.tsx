import { FormControlLabel, Radio, RadioGroup } from '@mui/material';

// Figma "Fee treatment": Upfront (checked) and Cap Cost, both disabled for now, plus a "Coming soon" chip.
// Sizes live here.
const LABEL_FONT_SIZE = 11;
const OPTION_FONT_SIZE = 14;
const OPTIONS_GAP = 16;
const CHIP_FONT_SIZE = 11;
const CHIP_PADDING = '3px 10px';
const PADDING_TOP = 16;
const GAP = 4;

const CAPTION = { margin: 0, fontSize: LABEL_FONT_SIZE, lineHeight: 1.66, letterSpacing: '0.4px', color: '#686576', fontFamily: 'Roboto, sans-serif' } as const;

export const FeeTreatmentField = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, paddingTop: PADDING_TOP, borderTop: '1px solid rgba(0,0,0,0.12)', width: '100%' }}>
    <p id="fee-treatment-label" style={CAPTION}>Fee treatment</p>
    <div style={{ display: 'flex', alignItems: 'center', gap: OPTIONS_GAP, flexWrap: 'wrap' }}>
      <RadioGroup row aria-labelledby="fee-treatment-label" value="upfront" sx={{ gap: `${OPTIONS_GAP}px` }}>
        {[{ value: 'upfront', label: 'Upfront' }, { value: 'cap-cost', label: 'Cap Cost' }].map((o) => (
          <FormControlLabel
            key={o.value}
            value={o.value}
            disabled
            control={<Radio />}
            label={o.label}
            sx={{ margin: 0, '& .MuiFormControlLabel-label': { fontSize: OPTION_FONT_SIZE, letterSpacing: '0.15px' } }}
          />
        ))}
      </RadioGroup>
      <span style={{
        display: 'inline-flex', alignItems: 'center', minHeight: 24, boxSizing: 'border-box', padding: CHIP_PADDING, borderRadius: 8,
        background: 'rgba(17,16,20,0.04)', fontSize: CHIP_FONT_SIZE, lineHeight: '18px', letterSpacing: '0.16px', color: '#1f1d25',
        fontFamily: 'Roboto, sans-serif',
      }}>
        Coming soon
      </span>
    </div>
    <p style={CAPTION}>Dealer fees are included in the total due at signing. Capitalized cost support is coming soon.</p>
  </div>
);
