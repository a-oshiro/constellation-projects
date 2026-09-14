import { useState, useEffect, useCallback } from 'react';
import {
  IconButton, Switch, Checkbox, InputAdornment, TextField,
} from '@mui/material';
import {
  Close, Calculate, Add, CalendarToday, InfoOutlined,
  CheckCircle, WarningAmber, Delete,
} from '@mui/icons-material';
import { AppTextField } from './AppTextField';
import { AppSelect } from './AppSelect';
import type {
  Offer, OfferTypeData, LeaseOfferData, FinanceOfferData,
  PurchaseOfferData, ZDLeaseOfferData, CustomOfferData,
  Rebate, CustomField,
} from '../../data/types';

const TERM_OPTIONS = ['24', '36', '39', '48', '60', '72'].map((v) => ({ value: v, label: `${v} months` }));
const MILES_OPTIONS = ['5000', '7500', '10000', '12000', '15000'].map((v) => ({ value: v, label: `${v} mi/yr` }));

interface OfferDetailsProps {
  offer: Offer;
  offerType: OfferTypeData;
  onClose: () => void;
  onSave: (offerId: string, offerTypeId: string, draft: Record<string, unknown>) => void;
  /** Suppresses the built-in title row (offer type name) — for callers that provide their own outer title/close affordance. */
  hideHeader?: boolean;
  /** When provided, replaces the footer's secondary button with a "Back" button wired to this instead of the default (clear draft only) — used by the alert dialog's offer editor, which gates leaving with unsaved changes behind a confirmation dialog. */
  onBack?: () => void;
  /** Where to navigate after a successful Save — defaults to `onBack` (falling back to `onClose`). Kept
   * separate from `onBack` so saving never re-triggers that button's unsaved-changes confirmation gate:
   * the changes are already saved, so there's nothing left to lose. */
  onSaved?: () => void;
  /** Fires whenever the unsaved-changes state changes — lets a caller (e.g. `onBack`'s confirmation gate) know whether there's anything to lose. */
  onDirtyChange?: (dirty: boolean) => void;
  /** Overrides the panel's fixed width (defaults to 360, matching the standalone Offers task page). */
  width?: number;
  /** Optional content rendered above the form fields, inside the same scrollable area — e.g. the alert
   * dialog editor's Offer Card, which should scroll together with the fields rather than stay pinned. */
  topContent?: React.ReactNode;
}

// ── Field helpers ─────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', marginBottom: 12 }}>
      {children}
    </div>
  );
}

function FieldGroup({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {children}
    </div>
  );
}

function AddRow({ label, onAdd }: { label: string; onAdd: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16 }}>
      <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>{label}</span>
      <button
        onClick={onAdd}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 2,
          border: 'none', background: 'transparent',
          cursor: 'pointer', color: '#473bab',
          fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, padding: 0,
        }}
      >
        <Add style={{ fontSize: 16 }} /> add
      </button>
    </div>
  );
}

function DollarField(props: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  fullWidth?: boolean;
}) {
  return (
    <AppTextField
      label={props.label}
      type="number"
      value={props.value != null ? String(props.value) : ''}
      onChange={(e) => props.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
      slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> } }}
      style={props.fullWidth ? { gridColumn: '1 / -1' } : undefined}
    />
  );
}

function PercentField(props: { label: string; value: number | undefined; onChange: (v: number | undefined) => void }) {
  return (
    <AppTextField
      label={props.label}
      type="number"
      value={props.value != null ? String(props.value) : ''}
      onChange={(e) => props.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
      slotProps={{ input: { startAdornment: <InputAdornment position="start">%</InputAdornment> } }}
    />
  );
}

function NumberField(props: { label: string; value: number | undefined; onChange: (v: number | undefined) => void }) {
  return (
    <AppTextField
      label={props.label}
      type="number"
      value={props.value != null ? String(props.value) : ''}
      onChange={(e) => props.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
      slotProps={{ input: { startAdornment: <InputAdornment position="start">#</InputAdornment> } }}
    />
  );
}

// ── Form: Lease ───────────────────────────────────────────────────────────────

/** Read-only fee line-item table — dealer/optional fees are flat per-dealer amounts, not per-vehicle
 * data, so (per CP-13922) these are the same fixed values for every Lease offer. */
function FeesTable({ title, description, rows, total }: {
  title: string;
  description?: string;
  rows: { label: string; amount: number }[];
  total?: number;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>{title}</div>
        {description && (
          <div style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', marginTop: 2 }}>{description}</div>
        )}
      </div>
      <div style={{ border: '1px solid rgba(0,0,0,0.12)', borderRadius: 12, overflow: 'hidden' }}>
        {rows.map((row, i) => (
          <div
            key={row.label}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12,
              borderTop: i === 0 ? 'none' : '1px solid rgba(0,0,0,0.12)',
            }}
          >
            <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>{row.label}</span>
            <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>${row.amount.toLocaleString()}</span>
          </div>
        ))}
        {total != null && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderTop: '1px solid rgba(0,0,0,0.12)' }}>
            <span style={{ fontSize: 12, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>Total Fees</span>
            <span style={{ fontSize: 12, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>${total.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}

const DEALER_FEES = [
  { label: 'Dealer Documentation Fee', amount: 175 },
  { label: 'Electronic Filling Fee', amount: 50 },
  { label: 'Admin Fee', amount: 60 },
  { label: 'Clear Mask Fee', amount: 15 },
];
const DEALER_FEES_TOTAL = DEALER_FEES.reduce((sum, f) => sum + f.amount, 0);

const OPTIONAL_FEES = [
  { label: 'Dealer Inspection Fee', amount: 100 },
  { label: 'VIN Etching', amount: 200 },
  { label: 'Nitrogen Tire Fill', amount: 300 },
];

const REBATE_STATUS_STYLE: Record<Rebate['status'], { background: string; color: string }> = {
  applied: { background: 'rgba(46,125,50,0.10)', color: '#2e7d32' },
  non_stackable: { background: 'rgba(230,81,0,0.10)', color: '#e65100' },
  available: { background: 'rgba(2,136,209,0.08)', color: '#01579b' },
};

function LeaseForm({ data, onChange }: {
  data: Partial<LeaseOfferData>;
  onChange: (field: keyof LeaseOfferData, value: unknown) => void;
}) {
  const [calculatorOn, setCalculatorOn] = useState(false);
  const [draftRebates, setDraftRebates] = useState<Rebate[]>(data.rebates ?? []);

  const handleFieldChange = useCallback((field: keyof LeaseOfferData, value: unknown) => {
    onChange(field, value);
    if (calculatorOn && (field === 'monthlyPayment' || field === 'term' || field === 'downPayment')) {
      const mp = field === 'monthlyPayment' ? Number(value) : Number(data.monthlyPayment ?? 0);
      const term = field === 'term' ? Number(value) : Number(data.term ?? 0);
      const dp = field === 'downPayment' ? Number(value) : Number(data.downPayment ?? 0);
      onChange('salesPrice', mp * term + dp);
      onChange('totalDueAtSigning', mp + dp);
    }
  }, [calculatorOn, data, onChange]);

  const handleRebateToggle = (id: string, checked: boolean) => {
    const next = draftRebates.map(r => r.id === id ? { ...r, checked } : r);
    setDraftRebates(next);
    onChange('rebates', next);
  };

  // Computed/read-only fields — derived from the editable payment fields, not stored themselves.
  const term = data.term ?? 0;
  const milesPerYear = data.milesPerYear ?? 0;
  const totalLeaseMileage = term > 0 && milesPerYear > 0 ? Math.round((term / 12) * milesPerYear) : undefined;
  const totalPayment = data.monthlyPayment != null && term > 0 ? data.monthlyPayment * term : undefined;

  return (
    <>
      {/* Offer Calculator */}
      <div style={{ marginBottom: 20 }}>
        <SectionTitle>Payment Summary</SectionTitle>
        <div style={{ background: '#f4f5f6', borderRadius: 8, padding: '4px 8px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Calculate style={{ fontSize: 20, color: '#686576', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#686576', lineHeight: 1.4 }}>
                Offer Calculator
              </div>
              <div style={{ fontSize: 10, fontFamily: 'Roboto, sans-serif', color: '#686576', lineHeight: 1.4 }}>
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
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#473bab', opacity: 1 },
                '& .MuiSwitch-track': { backgroundColor: '#cac9cf', opacity: 1 },
              }}
            />
          </div>

          <AppTextField
            label="Monthly Payment $"
            type="number"
            value={data.monthlyPayment != null ? String(data.monthlyPayment) : ''}
            onChange={(e) => handleFieldChange('monthlyPayment', e.target.value === '' ? undefined : Number(e.target.value))}
          />
          <FieldGroup>
            <AppSelect
              label="Term"
              value={data.term != null ? String(data.term) : ''}
              onChange={(v) => handleFieldChange('term', Number(v))}
              options={TERM_OPTIONS}
            />
            <AppTextField
              label="Down Payment $"
              type="number"
              value={data.downPayment != null ? String(data.downPayment) : ''}
              onChange={(e) => handleFieldChange('downPayment', e.target.value === '' ? undefined : Number(e.target.value))}
            />
            <AppTextField
              label="Sales Price $"
              type="number"
              value={data.salesPrice != null ? String(data.salesPrice) : ''}
              onChange={(e) => handleFieldChange('salesPrice', e.target.value === '' ? undefined : Number(e.target.value))}
            />
            <AppSelect
              label="Miles Per Year"
              value={data.milesPerYear != null ? String(data.milesPerYear) : ''}
              onChange={(v) => handleFieldChange('milesPerYear', Number(v))}
              options={MILES_OPTIONS}
            />
          </FieldGroup>
        </div>

        <div style={{ marginTop: 12 }}>
          <AppTextField
            label="Total Lease Mileage"
            value={totalLeaseMileage != null ? totalLeaseMileage.toLocaleString() : ''}
            disabled
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <AppTextField
            label="Total Due at Signing $"
            type="number"
            value={data.totalDueAtSigning != null ? String(data.totalDueAtSigning) : ''}
            onChange={(e) => handleFieldChange('totalDueAtSigning', e.target.value === '' ? undefined : Number(e.target.value))}
            slotProps={{ input: { endAdornment: <InputAdornment position="end"><InfoOutlined style={{ fontSize: 14, color: '#9c99a9' }} /></InputAdornment> } }}
          />
          <AppTextField
            label="Total Payment $"
            value={totalPayment != null ? totalPayment.toLocaleString() : ''}
            disabled
          />
          <AppTextField
            label="Offer Start Date"
            value={data.startDate ?? ''}
            onChange={(e) => handleFieldChange('startDate', e.target.value)}
            slotProps={{ input: { endAdornment: <InputAdornment position="end"><CalendarToday style={{ fontSize: 14, color: '#9c99a9' }} /></InputAdornment> } }}
          />
          <AppTextField
            label="Offer Expiration Date"
            value={data.expirationDate ?? ''}
            onChange={(e) => handleFieldChange('expirationDate', e.target.value)}
            slotProps={{ input: { endAdornment: <InputAdornment position="end"><CalendarToday style={{ fontSize: 14, color: '#9c99a9' }} /></InputAdornment> } }}
          />
        </div>
      </div>

      <FeesTable title="Dealer Fees" rows={DEALER_FEES} total={DEALER_FEES_TOTAL} />
      <FeesTable title="Optional Fees" description="Optional fees are not included in the offer’s costs." rows={OPTIONAL_FEES} />

      {/* Rebates */}
      <div style={{ paddingBottom: 8 }}>
        <SectionTitle>Rebates &amp; Conditionals</SectionTitle>
        <div style={{ border: '1px solid rgba(0,0,0,0.12)', borderRadius: 12, padding: '0 12px' }}>
          <button style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            border: 'none', background: 'transparent', cursor: 'pointer',
            color: '#473bab', fontSize: 13, fontFamily: 'Roboto, sans-serif',
            fontWeight: 500, padding: '10px 0',
          }}>
            <Add style={{ fontSize: 16 }} /> Add
          </button>
          {draftRebates.map((r, i) => {
            const dimmed = r.status === 'non_stackable';
            const statusStyle = REBATE_STATUS_STYLE[r.status];
            return (
              <div key={r.id}>
                {i === 0 && <div style={{ height: 1, background: '#f0f0f0' }} />}
                <div style={{ display: 'flex', alignItems: 'center', padding: '10px 0', gap: 8 }}>
                  <Checkbox
                    checked={r.checked}
                    onChange={(e) => handleRebateToggle(r.id, e.target.checked)}
                    size="small"
                    sx={{ padding: '2px', flexShrink: 0, color: '#cac9cf', '&.Mui-checked': { color: '#473bab' } }}
                  />
                  <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: dimmed ? '#9c99a9' : '#1f1d25', flex: 1, opacity: dimmed ? 0.5 : 1 }}>
                    {r.name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 3,
                      background: statusStyle.background, color: statusStyle.color,
                      fontSize: 11, fontWeight: 500, fontFamily: 'Roboto, sans-serif',
                      borderRadius: 100, padding: '2px 7px', whiteSpace: 'nowrap',
                    }}>
                      {r.status === 'applied' && <CheckCircle style={{ fontSize: 12 }} />}
                      {r.status === 'non_stackable' && <WarningAmber style={{ fontSize: 12 }} />}
                      {r.status === 'applied' ? 'Applied' : r.status === 'non_stackable' ? 'Non-stackable' : 'Available'}
                    </span>
                    <span style={{
                      fontSize: 13, fontWeight: 500, fontFamily: 'Roboto, sans-serif',
                      color: dimmed ? '#9c99a9' : '#1f1d25',
                      textDecoration: dimmed ? 'line-through' : 'none',
                    }}>
                      ${r.amount.toLocaleString()}
                    </span>
                    <InfoOutlined style={{ fontSize: 14, color: '#9c99a9' }} />
                  </div>
                </div>
                {i < draftRebates.length - 1 && <div style={{ height: 1, background: '#f0f0f0' }} />}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ── Form: Finance ─────────────────────────────────────────────────────────────

function FinanceForm({ data, onChange }: {
  data: Partial<FinanceOfferData>;
  onChange: (field: keyof FinanceOfferData, value: unknown) => void;
}) {
  return (
    <FieldGroup>
      <PercentField label="Rate" value={data.rate} onChange={(v) => onChange('rate', v)} />
      <NumberField label="Term" value={data.term} onChange={(v) => onChange('term', v)} />
      <DollarField label="Payment" value={data.payment} onChange={(v) => onChange('payment', v)} />
      <DollarField label="Finance Down Payment" value={data.financeDownPayment} onChange={(v) => onChange('financeDownPayment', v)} />
      <DollarField label="Amount Financed" value={data.amountFinanced} onChange={(v) => onChange('amountFinanced', v)} />
      <DollarField label="Sales Price" value={data.salesPrice} onChange={(v) => onChange('salesPrice', v)} />
      <NumberField label="Min FICO" value={data.minFico} onChange={(v) => onChange('minFico', v)} />
    </FieldGroup>
  );
}

// ── Form: Purchase ────────────────────────────────────────────────────────────

function PurchaseForm({ data, onChange }: {
  data: Partial<PurchaseOfferData>;
  onChange: (field: keyof PurchaseOfferData, value: unknown) => void;
}) {
  return (
    <>
      <SectionTitle>Price Structure</SectionTitle>
      <FieldGroup>
        <DollarField label="Final Price" value={data.finalPrice} onChange={(v) => onChange('finalPrice', v)} />
        <DollarField label="Dealer Discount" value={data.dealerDiscount} onChange={(v) => onChange('dealerDiscount', v)} />
      </FieldGroup>
      <div style={{ marginTop: 12, marginBottom: 20 }}>
        <DollarField label="Savings Off MSRP" value={data.savingsOffMsrp} onChange={(v) => onChange('savingsOffMsrp', v)} />
      </div>

      <div style={{ height: 1, background: '#f0f0f0', marginBottom: 16 }} />
      <SectionTitle>Rebates &amp; Conditionals</SectionTitle>
      <AddRow label="Purchase Rebate" onAdd={() => {}} />
      <AddRow label="Purchase Cond. Rebate" onAdd={() => {}} />
      <AddRow label="Purchase Manual Input" onAdd={() => {}} />

      <div style={{ height: 1, background: '#f0f0f0', marginBottom: 16 }} />
      <SectionTitle>Advanced Pricing</SectionTitle>
      <FieldGroup>
        <DollarField label="Dealer Enrolled Price" value={data.dealerEnrolledPrice} onChange={(v) => onChange('dealerEnrolledPrice', v)} />
        <PercentField label="Percentage Off MSRP" value={data.percentageOffMsrp} onChange={(v) => onChange('percentageOffMsrp', v)} />
      </FieldGroup>
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <AppTextField
          label="Savings Off MSRP Title"
          value={data.savingsOffMsrpTitle ?? ''}
          onChange={(e) => onChange('savingsOffMsrpTitle', e.target.value)}
        />
        <AppTextField
          label="Savings Off MSRP Desc"
          value={data.savingsOffMsrpDesc ?? ''}
          onChange={(e) => onChange('savingsOffMsrpDesc', e.target.value)}
        />
        <AppTextField
          label="Final Price Name"
          value={data.finalPriceName ?? ''}
          onChange={(e) => onChange('finalPriceName', e.target.value)}
        />
      </div>

      <div style={{ height: 1, background: '#f0f0f0', margin: '16px 0' }} />
      <SectionTitle>Disclosures</SectionTitle>
      <TextField
        label="Additional Purchase Disclosure"
        multiline
        rows={4}
        value={data.additionalPurchaseDisclosure ?? ''}
        onChange={(e) => onChange('additionalPurchaseDisclosure', e.target.value)}
        fullWidth
        size="small"
        sx={{
          '& .MuiInputLabel-root': { fontSize: 13 },
          '& .MuiOutlinedInput-input': { fontSize: 13 },
          '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#473bab' },
          '& .MuiInputLabel-root.Mui-focused': { color: '#473bab' },
        }}
      />
    </>
  );
}

// ── Form: ZD Lease ────────────────────────────────────────────────────────────

function ZDLeaseForm({ data, onChange }: {
  data: Partial<ZDLeaseOfferData>;
  onChange: (field: keyof ZDLeaseOfferData, value: unknown) => void;
}) {
  return (
    <>
      <FieldGroup>
        <NumberField label="No. of Payments" value={data.noOfPayments} onChange={(v) => onChange('noOfPayments', v)} />
        <DollarField label="Monthly Payment" value={data.monthlyPayment} onChange={(v) => onChange('monthlyPayment', v)} />
        <DollarField label="Vehicle Sales Price" value={data.vehicleSalesPrice} onChange={(v) => onChange('vehicleSalesPrice', v)} />
        <DollarField label="Miles Per Year" value={data.milesPerYear} onChange={(v) => onChange('milesPerYear', v)} />
      </FieldGroup>

      <div style={{ marginTop: 16 }}>
        <AddRow label="ZD Lease Rebate" onAdd={() => {}} />
        <AddRow label="ZD Lease Manual Input" onAdd={() => {}} />
      </div>

      <FieldGroup>
        <DollarField label="Cap Cost" value={data.capCost} onChange={(v) => onChange('capCost', v)} />
        <DollarField label="Cap Cost Reduction" value={data.capCostReduction} onChange={(v) => onChange('capCostReduction', v)} />
        <DollarField label="Net Adj. Cap Cost" value={data.netAdjCapCost} onChange={(v) => onChange('netAdjCapCost', v)} />
        <DollarField label="Total Lease Charge" value={data.totalLeaseCharge} onChange={(v) => onChange('totalLeaseCharge', v)} />
        <DollarField label="Residual Sales Value" value={data.residualSalesValue} onChange={(v) => onChange('residualSalesValue', v)} />
        <DollarField label="Cents Per Mile" value={data.centsPerMile} onChange={(v) => onChange('centsPerMile', v)} />
        <DollarField label="T.d at S. Incl. Rebates" value={data.tdAtSInclRebates} onChange={(v) => onChange('tdAtSInclRebates', v)} />
        <DollarField label="Termination Fee" value={data.terminationFee} onChange={(v) => onChange('terminationFee', v)} />
        <DollarField label="FICO" value={data.fico} onChange={(v) => onChange('fico', v)} />
        <DollarField label="Acquisition Fee" value={data.acquisitionFee} onChange={(v) => onChange('acquisitionFee', v)} />
        <DollarField label="Security Deposit" value={data.securityDeposit} onChange={(v) => onChange('securityDeposit', v)} />
      </FieldGroup>

      <div style={{ marginTop: 12 }}>
        <TextField
          label="Additional ZD Lease Disclosure"
          multiline
          rows={4}
          value={data.additionalZdLeaseDisclosure ?? ''}
          onChange={(e) => onChange('additionalZdLeaseDisclosure', e.target.value)}
          fullWidth
          size="small"
          sx={{
            '& .MuiInputLabel-root': { fontSize: 13 },
            '& .MuiOutlinedInput-input': { fontSize: 13 },
            '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#473bab' },
            '& .MuiInputLabel-root.Mui-focused': { color: '#473bab' },
          }}
        />
      </div>
    </>
  );
}

// ── Form: Custom ──────────────────────────────────────────────────────────────

function CustomForm({ data, onChange }: {
  data: Partial<CustomOfferData>;
  onChange: (field: keyof CustomOfferData, value: unknown) => void;
}) {
  const fields = data.customFields ?? [];

  const addField = () => {
    const next: CustomField[] = [...fields, { id: `cf-${Date.now()}`, name: '', value: '' }];
    onChange('customFields', next);
  };

  const updateField = (id: string, key: 'name' | 'value', val: string) => {
    const next = fields.map(f => f.id === id ? { ...f, [key]: val } : f);
    onChange('customFields', next);
  };

  const removeField = (id: string) => {
    onChange('customFields', fields.filter(f => f.id !== id));
  };

  return (
    <>
      <p style={{ fontSize: 13, color: '#686576', fontFamily: 'Roboto, sans-serif', margin: '0 0 16px' }}>
        The first three fields will be shown in the entry card and in the asset
      </p>
      <button
        onClick={addField}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          border: 'none', background: 'transparent', cursor: 'pointer',
          color: '#473bab', fontSize: 13, fontFamily: 'Roboto, sans-serif',
          fontWeight: 500, padding: '0 0 16px',
        }}
      >
        <Add style={{ fontSize: 16 }} /> New Field
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {fields.map((f) => (
          <div key={f.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <AppTextField
              label="Field Name"
              value={f.name}
              onChange={(e) => updateField(f.id, 'name', e.target.value)}
              style={{ flex: 1 }}
            />
            <AppTextField
              label="Value"
              value={f.value}
              onChange={(e) => updateField(f.id, 'value', e.target.value)}
              style={{ flex: 1 }}
            />
            <IconButton size="small" onClick={() => removeField(f.id)} sx={{ flexShrink: 0 }}>
              <Delete style={{ fontSize: 16, color: '#9c99a9' }} />
            </IconButton>
          </div>
        ))}
      </div>

      {fields.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{
            border: '1px solid #e0e0e0', borderRadius: 8, padding: '10px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#f9fafa',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20, color: '#473bab' }}>{'{}'}</span>
              <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>
                Variables from Templates
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 12, border: '1px solid #e0e0e0', borderRadius: 100,
                padding: '2px 10px', fontFamily: 'Roboto, sans-serif', color: '#686576',
              }}>
                1 template
              </span>
            </div>
          </div>
        </div>
      )}

      {fields.length === 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{
            border: '1px solid #e0e0e0', borderRadius: 8, padding: '10px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#f9fafa',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20, color: '#473bab' }}>{'{}'}</span>
              <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>
                Variables from Templates
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 12, border: '1px solid #e0e0e0', borderRadius: 100,
                padding: '2px 10px', fontFamily: 'Roboto, sans-serif', color: '#686576',
              }}>
                1 template
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export const OfferDetails = ({ offer, offerType, onClose, onSave, hideHeader, onBack, onSaved, onDirtyChange, width = 360, topContent }: OfferDetailsProps) => {
  const [draft, setDraft] = useState<Record<string, unknown>>({});

  useEffect(() => {
    setDraft({});
  }, [offerType.id]);

  useEffect(() => {
    onDirtyChange?.(Object.keys(draft).length > 0);
  }, [draft, onDirtyChange]);

  const merged = { ...offerType, ...draft } as Record<string, unknown>;

  const handleChange = useCallback((field: string, value: unknown) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = () => {
    onSave(offer.id, offerType.id, draft);
    setDraft({});
    (onSaved ?? onBack ?? onClose)();
  };

  const handleCancel = () => setDraft({});

  return (
    <div
      className="flex flex-col shrink-0 overflow-hidden"
      style={{
        width,
        background: '#ffffff',
        margin: '8px 8px 8px 0',
        borderRadius: 8,
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}
    >
      {/* Header */}
      {!hideHeader && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderBottom: '1px solid #f0f0f0', flexShrink: 0,
        }}>
          <span style={{ fontSize: 15, fontWeight: 600, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>
            {offerType.type}
          </span>
          <IconButton size="small" onClick={onClose} sx={{ padding: '4px' }}>
            <Close style={{ fontSize: 18, color: '#686576' }} />
          </IconButton>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '16px 16px 8px' }}>
        {topContent && <div style={{ marginBottom: 20 }}>{topContent}</div>}
        {offerType.type === 'Lease' && (
          <LeaseForm
            data={merged as Partial<LeaseOfferData>}
            onChange={(field, value) => handleChange(field as string, value)}
          />
        )}
        {offerType.type === 'Finance' && (
          <FinanceForm
            data={merged as Partial<FinanceOfferData>}
            onChange={(field, value) => handleChange(field as string, value)}
          />
        )}
        {offerType.type === 'Purchase' && (
          <PurchaseForm
            data={merged as Partial<PurchaseOfferData>}
            onChange={(field, value) => handleChange(field as string, value)}
          />
        )}
        {offerType.type === 'ZD Lease' && (
          <ZDLeaseForm
            data={merged as Partial<ZDLeaseOfferData>}
            onChange={(field, value) => handleChange(field as string, value)}
          />
        )}
        {offerType.type === 'Custom' && (
          <CustomForm
            data={merged as Partial<CustomOfferData>}
            onChange={(field, value) => handleChange(field as string, value)}
          />
        )}
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8,
        padding: '12px 16px', borderTop: '1px solid #f0f0f0', flexShrink: 0,
      }}>
        <button
          onClick={onBack ?? handleCancel}
          style={{
            padding: '6px 20px', borderRadius: 100,
            border: '1px solid #473bab', background: 'transparent',
            color: '#473bab', fontSize: 14, fontWeight: 500,
            fontFamily: 'Roboto, sans-serif', cursor: 'pointer', letterSpacing: '0.4px',
          }}
        >
          {onBack ? 'Back' : 'Cancel'}
        </button>
        <button
          onClick={handleSave}
          style={{
            padding: '6px 20px', borderRadius: 100,
            border: 'none', background: '#473bab', color: '#ffffff',
            fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif',
            cursor: 'pointer', letterSpacing: '0.4px',
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
};
