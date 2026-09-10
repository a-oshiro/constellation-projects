import { Payments, Speed, Sell } from '@mui/icons-material';
import type { QcFinding, QcFindingType } from '../../data/types';
import { QC_FINDING_LABEL } from '../../utils/alertReview';

/**
 * The amber detail card shown to the left of an asset when its QC warning tag is clicked — mirrors
 * AlertOfferCard's floating-to-the-left positioning and card styling, but themed for a non-blocking
 * QC finding (per Figma nodes 6183:171105/171134/171148): title row (icon + finding label + a
 * "Structured check" chip), a plain description, then an EXPECTED/ACTUAL two-column readout.
 */

export const QC_FINDING_ICON: Record<QcFindingType, React.ElementType> = {
  payment_consistency: Payments,
  mileage_consistency: Speed,
  selling_price_consistency: Sell,
};

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px',
};

const valueStyle: React.CSSProperties = {
  fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px', lineHeight: 1.43,
};

interface AlertQcFindingCardProps {
  finding: QcFinding;
}

export const AlertQcFindingCard = ({ finding }: AlertQcFindingCardProps) => {
  const Icon = QC_FINDING_ICON[finding.type];
  return (
    <div
      style={{
        position: 'absolute', top: 0, right: '100%', marginRight: 24, width: 320, flexShrink: 0,
        background: '#ffffff', borderRadius: 12, padding: 12, boxSizing: 'border-box',
        boxShadow: '0px 1px 9px rgba(0,0,0,0.12), 0px 6px 5px rgba(0,0,0,0.14), 0px 3px 2.5px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <Icon style={{ fontSize: 20, color: '#663C00', flexShrink: 0 }} />
          <span style={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.1px', whiteSpace: 'nowrap' }}>
            {QC_FINDING_LABEL[finding.type]}
          </span>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', background: 'rgba(17,16,20,0.04)', color: '#1f1d25',
          borderRadius: 8, padding: '3px 8px', fontSize: 11, letterSpacing: '0.16px', whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          Structured check
        </span>
      </div>

      <span style={valueStyle}>{finding.message}</span>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={sectionLabelStyle}>EXPECTED</span>
          <span style={valueStyle}>{finding.expectedLabel}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={sectionLabelStyle}>ACTUAL</span>
          <span style={valueStyle}>{finding.actualLabel}</span>
        </div>
      </div>
    </div>
  );
};
