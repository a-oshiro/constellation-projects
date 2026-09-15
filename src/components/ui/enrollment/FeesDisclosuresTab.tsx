import { Checkbox, IconButton, InputAdornment, TextField } from '@mui/material';
import { Close } from '@mui/icons-material';
import type { AdditionalFee, DisclosureBlock, EnrollmentSettings } from '../../../data/enrollmentSettings';
import { BODY_TEXT_STYLE, FIELD_LABEL_STYLE, HELPER_TEXT_STYLE, LINK_BUTTON_STYLE, TEXT_FIELD_SX } from './shared';

interface FeesDisclosuresTabProps {
  settings: EnrollmentSettings;
  onChange: (patch: Partial<EnrollmentSettings>) => void;
}

export const FeesDisclosuresTab = ({ settings, onChange }: FeesDisclosuresTabProps) => {
  const updateDisclosure = (id: DisclosureBlock['id'], patch: Partial<DisclosureBlock>) => {
    onChange({ disclosures: settings.disclosures.map((d) => (d.id === id ? { ...d, ...patch } : d)) });
  };

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <p style={BODY_TEXT_STYLE}>
        Lease, cash, and finance disclosure copy that renders on offers for this account, plus the doc fee and additional fees
        included in the legal disclosure.
      </p>

      <div style={{ border: '1px solid #e0e0e0', borderRadius: 12, overflow: 'hidden' }}>
        {settings.disclosures.map((d, i) => (
          <div key={d.id} style={{ borderTop: i === 0 ? 'none' : '1px solid #e0e0e0', padding: '14px 16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Checkbox
                size="small"
                checked={d.enabled}
                onChange={(e) => updateDisclosure(d.id, { enabled: e.target.checked })}
                sx={{ padding: 0, '&.Mui-checked': { color: '#473bab' } }}
              />
              <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px' }}>
                {d.label}{d.optional ? ' — optional' : ''}
              </span>
            </label>
            {d.enabled && (
              <div style={{ paddingTop: 10, paddingLeft: 32 }}>
                <p style={{ ...HELPER_TEXT_STYLE, marginBottom: 6 }}>Provide the legal disclosure text for your {d.label.toLowerCase()}.</p>
                <TextField
                  multiline
                  minRows={7}
                  fullWidth
                  value={d.text}
                  onChange={(e) => updateDisclosure(d.id, { text: e.target.value })}
                  sx={{ ...TEXT_FIELD_SX, '& .MuiOutlinedInput-root': { ...TEXT_FIELD_SX['& .MuiOutlinedInput-root'], fontSize: 13, lineHeight: 1.6 } }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                  {d.id === 'lease' ? <button style={LINK_BUTTON_STYLE}>+ Add Format</button> : <span />}
                  <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#9c99a9' }}>{d.text.length} characters</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div>
        <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px' }}>
          Fees
        </p>
        <p style={{ ...HELPER_TEXT_STYLE, marginBottom: 12 }}>
          Constellation appends these fees to the end of the legal disclosure when they are missing from the copy above.
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
    </div>
  );
};
