import { InputAdornment, TextField } from '@mui/material';
import type { EnrollmentSettings } from '../../../data/enrollmentSettings';
import { BODY_TEXT_STYLE, TEXT_FIELD_SX } from './shared';

interface AgedDiscountsTabProps {
  settings: EnrollmentSettings;
  onChange: (patch: Partial<EnrollmentSettings>) => void;
}

const CELL_LABEL_STYLE = { margin: 0, fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px' };
const CELL_SUB_STYLE = { margin: '2px 0 0', fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px' };

export const AgedDiscountsTab = ({ settings, onChange }: AgedDiscountsTabProps) => {
  const editableWindows = settings.agedDiscounts.filter((w) => w.editable);
  const setCount = editableWindows.filter((w) => w.discountPct != null).length;

  const updateDiscount = (id: string, value: string) => {
    const parsed = value.trim() === '' ? null : Number(value);
    onChange({
      agedDiscounts: settings.agedDiscounts.map((w) => (w.id === id ? { ...w, discountPct: parsed !== null && Number.isNaN(parsed) ? w.discountPct : parsed } : w)),
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <p style={{ ...BODY_TEXT_STYLE, marginBottom: 8 }}>
          The extra percentage off applied at each aging window, from 30 to 180+ days in inventory.
        </p>
        <p style={{ ...BODY_TEXT_STYLE, color: '#686576' }}>
          Each percentage is the total discount off MSRP once a vehicle's days on lot pass that window — it replaces the
          previous window rather than stacking on it. Nothing fires between windows: a unit at 70 days advertises the 60-day
          amount until it crosses 75.
        </p>
      </div>

      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', padding: '0 0 8px', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
          <span style={{ fontSize: 12, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px' }}>Aging Window</span>
          <span style={{ fontSize: 12, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px' }}>Discount</span>
        </div>
        {settings.agedDiscounts.map((w) => (
          <div key={w.id} style={{ display: 'grid', gridTemplateColumns: '220px 1fr', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <div>
              <p style={CELL_LABEL_STYLE}>{w.label}</p>
              <p style={CELL_SUB_STYLE}>{w.dayRange}</p>
            </div>
            {w.editable ? (
              <TextField
                size="small"
                placeholder="0.00"
                value={w.discountPct ?? ''}
                onChange={(e) => updateDiscount(w.id, e.target.value)}
                sx={{ width: 160, ...TEXT_FIELD_SX }}
                slotProps={{ input: { endAdornment: <InputAdornment position="end">%</InputAdornment> } }}
              />
            ) : (
              <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px' }}>
                Vehicles under 60 days follow the model and trim level discounts set in New vehicles and offers.
              </span>
            )}
          </div>
        ))}
        <p style={{ margin: '12px 0 0', fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px' }}>
          {setCount} of {editableWindows.length} windows set
        </p>
      </div>
    </div>
  );
};
