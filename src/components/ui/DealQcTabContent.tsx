import { CheckCircle, WarningAmberOutlined } from '@mui/icons-material';
import type { DealQcFieldKey, DealQcOfferResult, DealQcResult, Offer, QcFinding } from '../../data/types';
import { formatRelativeTime } from '../../utils/relativeTime';
import { QC_FINDING_LABEL } from '../../utils/alertReview';
import { useTheme } from '@mui/material/styles';
import { QC_FINDING_ICON, qcFlashOutline } from '../../utils/alertQc';
import { QcOfferContainer } from './QcOfferContainer';

/**
 * "Deal QC" tab content — an intro line, a pass/fail advisory banner, then one container per offer with
 * deal data, stacked: offer name + VIN on top, that offer's warnings right below (structured findings such
 * as payment/mileage/selling price consistency, plus any fields that no longer match the baseline), then
 * the offer details — the "Offer used in email" comparison against the stored baseline. Offers with
 * warnings are listed first.
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

const smallLabelStyle: React.CSSProperties = {
  fontSize: 10, fontFamily: 'Roboto, sans-serif', color: '#9c99a9', letterSpacing: '0.4px', textTransform: 'uppercase',
};

const warningBoxStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 12px', borderRadius: 8, background: '#FFF4E5',
};

/** One structured finding (payment / mileage / selling price consistency) — its own scroll/flash target. */
const FindingWarning = ({ finding, flashed }: { finding: QcFinding; flashed: boolean }) => {
  const Icon = QC_FINDING_ICON[finding.type];
  const theme = useTheme();
  return (
    <div data-qc-key={`legacy:${finding.id}`} style={{ ...warningBoxStyle, ...qcFlashOutline(flashed, theme.palette.warning.main) }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon style={{ fontSize: 16, color: '#663C00', flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#663C00' }}>{QC_FINDING_LABEL[finding.type]}</span>
      </div>
      <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', lineHeight: 1.43 }}>{finding.message}</span>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={smallLabelStyle}>Expected</span>
          <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>{finding.expectedLabel}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={smallLabelStyle}>Actual</span>
          <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>{finding.actualLabel}</span>
        </div>
      </div>
    </div>
  );
};

const MismatchWarning = ({ fields }: { fields: DealQcFieldKey[] }) => (
  <div style={warningBoxStyle}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <WarningAmberOutlined style={{ fontSize: 16, color: '#663C00', flexShrink: 0 }} />
      <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#663C00' }}>Fields differ from the baseline offer</span>
    </div>
    <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>
      {fields.map((f) => FIELD_LABEL[f]).join(', ')}
    </span>
  </div>
);

/** The offer details: what the composed email rendered, with mismatched fields called out in red. */
const OfferDetailsGrid = ({ result }: { result: DealQcOfferResult }) => (
  <div style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
    <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 600, color: '#9c99a9', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
      Offer used in email
    </span>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {FIELD_ORDER.map((key) => {
        const mismatched = result.mismatchedFields.includes(key);
        return (
          <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={smallLabelStyle}>{FIELD_LABEL[key]}</span>
            <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: mismatched ? '#be0e1c' : '#1f1d25', fontWeight: mismatched ? 600 : 400 }}>
              {FIELD_VALUE[key](result.baseline)}
            </span>
          </div>
        );
      })}
    </div>
  </div>
);

interface DealQcTabContentProps {
  dealQc?: DealQcResult;
  /** Structured findings (payment / mileage / selling price consistency), shown under their offer. */
  findings: QcFinding[];
  /** Every offer in the alert, in display order. */
  offers: Offer[];
  /** Key of the container (`deal:<offerId>`) or finding (`legacy:<findingId>`) to highlight after a tag jump. */
  flashKey: string | null;
}

export const DealQcTabContent = ({ dealQc, findings, offers, flashKey }: DealQcTabContentProps) => {
  const rows = offers
    .map((offer) => ({
      offer,
      result: dealQc?.offers.find((o) => o.offerId === offer.id),
      offerFindings: findings.filter((f) => f.offerId === offer.id),
    }))
    .filter((r) => r.result || r.offerFindings.length > 0)
    .map((r) => ({ ...r, needsReview: r.offerFindings.length > 0 || (r.result?.mismatchedFields.length ?? 0) > 0 }));

  if (rows.length === 0) {
    return (
      <div style={{ padding: '32px 16px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#686576' }}>
          No Deal QC issues to review for this alert.
        </p>
      </div>
    );
  }

  const allPassed = rows.every((r) => !r.needsReview);
  const ordered = [...rows.filter((r) => r.needsReview), ...rows.filter((r) => !r.needsReview)];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576' }}>Checks all offers in this alert.</span>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', borderRadius: 8, background: allPassed ? '#edf7ed' : '#FFF4E5' }}>
        {allPassed
          ? <CheckCircle style={{ fontSize: 18, color: '#4caf50', flexShrink: 0, marginTop: 1 }} />
          : <WarningAmberOutlined style={{ fontSize: 18, color: '#663C00', flexShrink: 0, marginTop: 1 }} />}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: allPassed ? '#1b5e20' : '#663C00' }}>
            {allPassed ? 'All checks passed' : 'Some offers need review'}
          </span>
          <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: allPassed ? '#1b5e20' : '#663C00' }}>
            Advisory only — this does not block sending or change the two human QC gates.
            {dealQc && <> Checked {formatRelativeTime(dealQc.checkedAt)} · ruleset {dealQc.rulesetVersion}</>}
          </span>
        </div>
      </div>

      {ordered.map(({ offer, result, offerFindings, needsReview }) => {
        const key = `deal:${offer.id}`;
        return (
          <QcOfferContainer key={key} qcKey={key} offer={offer} needsReview={needsReview} flashed={flashKey === key}>
            {offerFindings.map((f) => (
              <FindingWarning key={f.id} finding={f} flashed={flashKey === `legacy:${f.id}`} />
            ))}
            {result && result.mismatchedFields.length > 0 && <MismatchWarning fields={result.mismatchedFields} />}
            {result && <OfferDetailsGrid result={result} />}
          </QcOfferContainer>
        );
      })}
    </div>
  );
};
