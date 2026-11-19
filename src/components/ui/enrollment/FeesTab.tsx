import { IconButton, InputAdornment, TextField } from '@mui/material';
import { Close } from '@mui/icons-material';
import type { AdditionalFee, EnrollmentSettings } from '../../../data/enrollmentSettings';
import { FIELD_LABEL_STYLE, HELPER_TEXT_STYLE, LINK_BUTTON_STYLE, TEXT_FIELD_SX } from './shared';

// Doc fee + additional fees, split out of the former "Fees and Disclosures" page. Not mounted anywhere
// yet — it moves to its own Account Settings tab later.

interface FeesTabProps {
  settings: EnrollmentSettings;
  onChange: (patch: Partial<EnrollmentSettings>) => void;
}

export const FeesTab = ({ settings, onChange }: FeesTabProps) => {
  const addFee = () => {
    const fee: AdditionalFee = { id: `fee-${Date.now()}`, label: '', amount: null };
    onChange({ additionalFees: [...settings.additionalFees, fee] });
  };

  const updateFee = (id: string, patch: Partial<AdditionalFee>) => {
    onChange({ additionalFees: settings.additionalFees.map((f) => (f.id === id ? { ...f, ...patch } : f)) });
  };

  const removeFee = (id: string) => {
    onChange({ additionalFees: settings.additionalFees.filter((f) => f.id !== id) });
  };

  return (
    <div>
      <p style={{ ...HELPER_TEXT_STYLE, marginBottom: 16 }}>
        Constellation appends these fees to the end of the legal disclosure when they are missing from the disclosure copy.
      </p>

      <div style={{ marginBottom: 16 }}>
        <div style={FIELD_LABEL_STYLE}>Doc Fee</div>
        <TextField
          size="small"
          value={settings.docFee ?? ''}
          onChange={(e) => {
            const value = e.target.value.trim();
            const parsed = value === '' ? null : Number(value);
            onChange({ docFee: parsed !== null && Number.isNaN(parsed) ? settings.docFee : parsed });
          }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
          sx={{ width: 160, ...TEXT_FIELD_SX }}
        />
        <p style={{ ...HELPER_TEXT_STYLE, marginTop: 6 }}>Dealership document fee included in the legal disclosure. Leave blank if none applies.</p>
      </div>

      <div style={FIELD_LABEL_STYLE}>Additional Fees</div>
      <p style={{ ...HELPER_TEXT_STYLE, marginBottom: 8 }}>Government fees and any other fees that must be included in the legal disclosure.</p>
      {settings.additionalFees.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
          {settings.additionalFees.map((fee) => (
            <div key={fee.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TextField
                size="small"
                placeholder="Fee name"
                value={fee.label}
                onChange={(e) => updateFee(fee.id, { label: e.target.value })}
                sx={{ flex: 1, ...TEXT_FIELD_SX }}
              />
              <TextField
                size="small"
                placeholder="0.00"
                value={fee.amount ?? ''}
                onChange={(e) => {
                  const value = e.target.value.trim();
                  const parsed = value === '' ? null : Number(value);
                  updateFee(fee.id, { amount: parsed !== null && Number.isNaN(parsed) ? fee.amount : parsed });
                }}
                slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
                sx={{ width: 140, ...TEXT_FIELD_SX }}
              />
              <IconButton size="small" onClick={() => removeFee(fee.id)}>
                <Close style={{ fontSize: 16, color: '#686576' }} />
              </IconButton>
            </div>
          ))}
        </div>
      )}
      <button style={LINK_BUTTON_STYLE} onClick={addFee}>+ Add New Fee</button>
    </div>
  );
};
