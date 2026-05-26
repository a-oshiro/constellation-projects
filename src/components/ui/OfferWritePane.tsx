import { useState, useEffect, useCallback } from 'react';
import { IconButton, Switch, Checkbox, InputAdornment } from '@mui/material';
import {
  Close, Calculate, Add, CalendarToday, InfoOutlined,
  CheckCircle, WarningAmber,
} from '@mui/icons-material';
import { AppTextField } from './AppTextField';
import { AppSelect } from './AppSelect';
import type { Offer, Rebate } from '../../data/types';

const TERM_OPTIONS = ['24', '36', '39', '48', '60'].map((v) => ({ value: v, label: `${v} months` }));
const MILES_OPTIONS = ['5000', '7500', '10000', '12000', '15000'].map((v) => ({ value: v, label: `${v} mi/yr` }));

interface OfferWritePaneProps {
  offer: Offer;
  onClose: () => void;
  onSave: (id: string, updated: Partial<Offer>) => void;
}

export const OfferWritePane = ({ offer, onClose, onSave }: OfferWritePaneProps) => {
  const [draft, setDraft] = useState<Partial<Offer>>({});
  const [draftRebates, setDraftRebates] = useState<Rebate[]>(offer.rebates);
  const [calculatorOn, setCalculatorOn] = useState(false);

  useEffect(() => {
    setDraft({});
    setDraftRebates(offer.rebates);
    setCalculatorOn(false);
  }, [offer.id]);

  const val = <K extends keyof Offer>(field: K): Offer[K] =>
    (draft[field] !== undefined ? draft[field] : offer[field]) as Offer[K];

  const handleFieldChange = useCallback(
    (field: keyof Offer, value: unknown) => {
      setDraft((prev) => {
        const next = { ...prev, [field]: value };

        if (calculatorOn && ['monthlyPayment', 'term', 'downPayment'].includes(field as string)) {
          const mp =
            field === 'monthlyPayment' ? Number(value) : Number(prev.monthlyPayment ?? offer.monthlyPayment);
          const term =
            field === 'term' ? Number(value) : Number(prev.term ?? offer.term);
          const dp =
            field === 'downPayment' ? Number(value) : Number(prev.downPayment ?? offer.downPayment);

          next.salesPrice = mp * term + dp;
          next.totalDueAtSigning = mp + dp;
        }

        return next;
      });
    },
    [calculatorOn, offer],
  );

  const handleRebateToggle = (id: string, checked: boolean) => {
    setDraftRebates((prev) => prev.map((r) => (r.id === id ? { ...r, checked } : r)));
  };

  const handleSave = () => {
    onSave(offer.id, { ...draft, rebates: draftRebates });
    setDraft({});
    onClose();
  };

  const handleCancel = () => {
    setDraft({});
    setDraftRebates(offer.rebates);
  };

  return (
    <div
      className="flex flex-col shrink-0 overflow-hidden"
      style={{
        width: 360,
        background: '#ffffff',
        margin: '8px 8px 8px 0',
        borderRadius: 8,
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}
    >
      {/* ── Header ────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: 15,
            fontWeight: 600,
            fontFamily: 'Roboto, sans-serif',
            color: '#1f1d25',
          }}
        >
          {offer.vehicleName}
        </span>
        <IconButton size="small" onClick={onClose} sx={{ padding: '4px' }}>
          <Close style={{ fontSize: 18, color: '#686576' }} />
        </IconButton>
      </div>

      {/* ── Scrollable content ────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '16px 16px 8px' }}>

        {/* Payment Summary */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'Roboto, sans-serif',
              color: '#1f1d25',
              marginBottom: 12,
            }}
          >
            Payment Summary
          </div>

          {/* Offer Calculator toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(71,59,171,0.06)',
              borderRadius: 8,
              padding: '8px 10px 8px 10px',
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: '#473bab',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Calculate style={{ fontSize: 14, color: '#ffffff' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: 'Roboto, sans-serif',
                  color: '#1f1d25',
                  lineHeight: 1.4,
                }}
              >
                Offer Calculator
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontFamily: 'Roboto, sans-serif',
                  color: '#686576',
                  lineHeight: 1.4,
                }}
              >
                Edits in these fields recalculate the Lease
              </div>
            </div>
            <Switch
              checked={calculatorOn}
              onChange={(e) => setCalculatorOn(e.target.checked)}
              size="small"
              sx={{
                flexShrink: 0,
                '& .MuiSwitch-switchBase.Mui-checked': { color: '#ffffff' },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                  backgroundColor: '#473bab',
                  opacity: 1,
                },
                '& .MuiSwitch-track': { backgroundColor: '#cac9cf', opacity: 1 },
              }}
            />
          </div>

          {/* Fields 2-column grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <AppTextField
              label="Monthly Payment $"
              type="number"
              value={String(val('monthlyPayment'))}
              onChange={(e) => handleFieldChange('monthlyPayment', Number(e.target.value))}
            />
            <AppSelect
              label="Term"
              value={String(val('term'))}
              onChange={(v) => handleFieldChange('term', Number(v))}
              options={TERM_OPTIONS}
            />
            <AppTextField
              label="Down Payment $"
              type="number"
              value={String(val('downPayment'))}
              onChange={(e) => handleFieldChange('downPayment', Number(e.target.value))}
            />
            <AppTextField
              label="Sales Price $"
              type="number"
              value={String(val('salesPrice'))}
              onChange={(e) => handleFieldChange('salesPrice', Number(e.target.value))}
            />
            <AppTextField
              label="Total Due at Signing $"
              type="number"
              value={String(val('totalDueAtSigning'))}
              onChange={(e) => handleFieldChange('totalDueAtSigning', Number(e.target.value))}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <InfoOutlined style={{ fontSize: 14, color: '#9c99a9' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <AppSelect
              label="Miles Per Year"
              value={String(val('milesPerYear'))}
              onChange={(v) => handleFieldChange('milesPerYear', Number(v))}
              options={MILES_OPTIONS}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <AppTextField
              label="Expiration Date"
              value={val('expirationDate')}
              onChange={(e) => handleFieldChange('expirationDate', e.target.value)}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <CalendarToday style={{ fontSize: 14, color: '#9c99a9' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#f0f0f0', marginBottom: 16 }} />

        {/* Rebates & Conditionals */}
        <div style={{ paddingBottom: 8 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'Roboto, sans-serif',
              color: '#1f1d25',
              marginBottom: 12,
            }}
          >
            Rebates &amp; Conditionals
          </div>

          <button
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: '#473bab',
              fontSize: 13,
              fontFamily: 'Roboto, sans-serif',
              fontWeight: 500,
              padding: '0 0 12px',
            }}
          >
            <Add style={{ fontSize: 16 }} />
            Add
          </button>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {draftRebates.map((r, i) => {
              const dimmed = r.status === 'non_stackable';
              return (
                <div key={r.id}>
                  {i > 0 && <div style={{ height: 1, background: '#f0f0f0' }} />}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 0',
                      gap: 8,
                    }}
                  >
                    <Checkbox
                      checked={r.checked}
                      onChange={(e) => handleRebateToggle(r.id, e.target.checked)}
                      size="small"
                      sx={{
                        padding: '2px',
                        flexShrink: 0,
                        color: '#cac9cf',
                        '&.Mui-checked': { color: '#473bab' },
                      }}
                    />
                    <span
                      style={{
                        fontSize: 13,
                        fontFamily: 'Roboto, sans-serif',
                        color: dimmed ? '#9c99a9' : '#1f1d25',
                        flex: 1,
                      }}
                    >
                      {r.name}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      {r.status === 'applied' && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            background: 'rgba(46, 125, 50, 0.10)',
                            color: '#2e7d32',
                            fontSize: 11,
                            fontWeight: 500,
                            fontFamily: 'Roboto, sans-serif',
                            borderRadius: 100,
                            padding: '2px 7px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <CheckCircle style={{ fontSize: 12 }} />
                          Applied
                        </span>
                      )}
                      {r.status === 'non_stackable' && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            background: 'rgba(230, 81, 0, 0.10)',
                            color: '#e65100',
                            fontSize: 11,
                            fontWeight: 500,
                            fontFamily: 'Roboto, sans-serif',
                            borderRadius: 100,
                            padding: '2px 7px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <WarningAmber style={{ fontSize: 12 }} />
                          Non-stackable
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          fontFamily: 'Roboto, sans-serif',
                          color: dimmed ? '#9c99a9' : '#1f1d25',
                          textDecoration: dimmed ? 'line-through' : 'none',
                        }}
                      >
                        ${r.amount.toLocaleString()}
                      </span>
                      <InfoOutlined style={{ fontSize: 14, color: '#9c99a9' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 8,
          padding: '12px 16px',
          borderTop: '1px solid #f0f0f0',
          flexShrink: 0,
        }}
      >
        <button
          onClick={handleCancel}
          style={{
            padding: '6px 20px',
            borderRadius: 100,
            border: '1px solid #473bab',
            background: 'transparent',
            color: '#473bab',
            fontSize: 14,
            fontWeight: 500,
            fontFamily: 'Roboto, sans-serif',
            cursor: 'pointer',
            letterSpacing: '0.4px',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          style={{
            padding: '6px 20px',
            borderRadius: 100,
            border: 'none',
            background: '#473bab',
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 500,
            fontFamily: 'Roboto, sans-serif',
            cursor: 'pointer',
            letterSpacing: '0.4px',
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
};
