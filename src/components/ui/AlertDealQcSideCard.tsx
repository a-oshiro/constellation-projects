import { CheckCircle, WarningAmberOutlined } from '@mui/icons-material';
import type { DealQcFieldKey, DealQcOfferResult } from '../../data/types';
import { formatRelativeTime } from '../../utils/relativeTime';

/**
 * Floating card to the left of the focused asset, shown when its "Deal QC" tag is clicked — same
 * floating-left shell as AlertOfferCard/AlertQcFindingCard, condensed from the full Deal QC tab content
 * (DealQcTabContent) down to just this one offer's baseline comparison.
 */

const FIELD_LABEL: Record<DealQcFieldKey, string> = {
  monthlyPayment: 'Monthly Payment',
  termMonths: 'Term',
  msrp: 'MSRP',
  dueAtSigning: 'Due at Signing',
  mileagePerYear: 'Mileage',
  dealerDiscount: 'Dealer Discount',
  lender: 'Lender',
};

const currency = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`;

const FIELD_VALUE: Record<DealQcFieldKey, (b: DealQcOfferResult['baseline']) => string> = {
  monthlyPayment: (b) => `${currency(b.monthlyPayment)}/mo`,
  termMonths: (b) => `${b.termMonths} months`,
  msrp: (b) => currency(b.msrp),
  dueAtSigning: (b) => currency(b.dueAtSigning),
  mileagePerYear: (b) => `${b.mileagePerYear.toLocaleString('en-US')} mi/yr`,
  dealerDiscount: (b) => currency(b.dealerDiscount),
  lender: (b) => b.lender,
};

const FIELD_ORDER: DealQcFieldKey[] = ['monthlyPayment', 'termMonths', 'msrp', 'dueAtSigning', 'mileagePerYear', 'dealerDiscount', 'lender'];

interface AlertDealQcSideCardProps {
  result: DealQcOfferResult;
  checkedAt: number;
  rulesetVersion: string;
}

export const AlertDealQcSideCard = ({ result, checkedAt, rulesetVersion }: AlertDealQcSideCardProps) => {
  const hasMismatch = result.mismatchedFields.length > 0;

  return (
    <div
      style={{
        position: 'absolute', top: 0, right: '100%', marginRight: 24, width: 300, flexShrink: 0,
        background: '#ffffff', borderRadius: 12, padding: 12, boxSizing: 'border-box',
        boxShadow: '0px 1px 9px rgba(0,0,0,0.12), 0px 6px 5px rgba(0,0,0,0.14), 0px 3px 2.5px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {hasMismatch
          ? <WarningAmberOutlined style={{ fontSize: 20, color: '#663C00', flexShrink: 0 }} />
          : <CheckCircle style={{ fontSize: 20, color: '#4caf50', flexShrink: 0 }} />}
        <span style={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.1px' }}>
          Deal QC
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {FIELD_ORDER.map((key) => {
          const mismatched = result.mismatchedFields.includes(key);
          return (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 10, fontFamily: 'Roboto, sans-serif', color: '#9c99a9', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                {FIELD_LABEL[key]}
              </span>
              <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: mismatched ? '#be0e1c' : '#1f1d25', fontWeight: mismatched ? 600 : 400 }}>
                {FIELD_VALUE[key](result.baseline)}
              </span>
            </div>
          );
        })}
      </div>

      <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#9c99a9', letterSpacing: '0.4px' }}>
        Checked {formatRelativeTime(checkedAt)} · ruleset {rulesetVersion}
      </span>
    </div>
  );
};
