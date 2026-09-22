import { CheckCircle, WarningAmberOutlined } from '@mui/icons-material';
import type { DealQcFieldKey, DealQcOfferResult, DealQcResult, Offer } from '../../data/types';
import { formatRelativeTime } from '../../utils/relativeTime';

/**
 * "Deal QC" tab content — per screenshots 2/3: an intro line, a pass/fail advisory banner (green "All
 * checks passed" or amber "Some fields differ from the baseline offer"), and one "Offer used in email"
 * comparison card per offer, mirroring what the composed email actually rendered against each offer's
 * stored baseline.
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
  monthlyPayment: (b) => `${currency(b.monthlyPayment)}`,
  termMonths: (b) => `${b.termMonths} months`,
  msrp: (b) => currency(b.msrp),
  dueAtSigning: (b) => currency(b.dueAtSigning),
  mileagePerYear: (b) => `${b.mileagePerYear.toLocaleString('en-US')} mi/yr`,
  dealerDiscount: (b) => currency(b.dealerDiscount),
  lender: (b) => b.lender,
};

const FIELD_ORDER: DealQcFieldKey[] = ['monthlyPayment', 'termMonths', 'msrp', 'dueAtSigning', 'mileagePerYear', 'dealerDiscount', 'lender'];

const OfferComparisonCard = ({ result, offer }: { result: DealQcOfferResult; offer?: Offer }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    {offer && (
      <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25' }}>
        {offer.vehicleName}{offer.vin ? ` · VIN ${offer.vin}` : ''}
      </span>
    )}
    <div style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, padding: 12 }}>
      <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 600, color: '#9c99a9', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
        Offer used in email
      </span>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10 }}>
        {FIELD_ORDER.map((key) => {
          const mismatched = result.mismatchedFields.includes(key);
          return (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 10, fontFamily: 'Roboto, sans-serif', color: '#9c99a9', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                {FIELD_LABEL[key]}
              </span>
              <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: mismatched ? '#be0e1c' : '#1f1d25', fontWeight: mismatched ? 600 : 400 }}>
                {FIELD_VALUE[key](result.baseline)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
    <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#9c99a9', fontStyle: 'italic' }}>
      This offer card was rendered in the composed email.
    </span>
  </div>
);

interface DealQcTabContentProps {
  dealQc?: DealQcResult;
  offers: Offer[];
}

export const DealQcTabContent = ({ dealQc, offers }: DealQcTabContentProps) => {
  if (!dealQc || dealQc.offers.length === 0) {
    return (
      <div style={{ padding: '32px 16px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#686576' }}>
          No Deal QC issues to review for this alert.
        </p>
      </div>
    );
  }

  const allPassed = dealQc.offers.every((o) => o.mismatchedFields.length === 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576' }}>Checks all offers in this alert.</span>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', borderRadius: 8, background: allPassed ? '#edf7ed' : '#FFF4E5' }}>
        {allPassed
          ? <CheckCircle style={{ fontSize: 18, color: '#4caf50', flexShrink: 0, marginTop: 1 }} />
          : <WarningAmberOutlined style={{ fontSize: 18, color: '#663C00', flexShrink: 0, marginTop: 1 }} />}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: allPassed ? '#1b5e20' : '#663C00' }}>
            {allPassed ? 'All checks passed' : 'Some fields differ from the baseline offer'}
          </span>
          <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: allPassed ? '#1b5e20' : '#663C00' }}>
            Advisory only — this does not block sending or change the two human QC gates. Checked {formatRelativeTime(dealQc.checkedAt)} · ruleset {dealQc.rulesetVersion}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {dealQc.offers.map((offerResult) => (
          <OfferComparisonCard key={offerResult.offerId} result={offerResult} offer={offers.find((o) => o.id === offerResult.offerId)} />
        ))}
      </div>
    </div>
  );
};
