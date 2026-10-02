import { useTheme } from '@mui/material/styles';
import type { Offer } from '../../data/types';
import { qcFlashOutline } from '../../utils/alertQc';

const pillStyle = (needsReview: boolean): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', borderRadius: 8, padding: '3px 10px', fontSize: 11, fontFamily: 'Roboto, sans-serif',
  fontWeight: 700, letterSpacing: '0.4px', whiteSpace: 'nowrap', flexShrink: 0,
  background: needsReview ? '#FDF4EC' : '#edf7ed',
  color: needsReview ? '#c45500' : '#1b5e20',
});

/**
 * The outer per-offer container both QC tabs stack: offer name + VIN (with a pass/needs-review pill) on
 * top, then whatever the tab puts below — warnings first, then details. `qcKey` is what a QC tag click
 * scrolls to; `flashed` turns its gray outline into a 2px warning-orange one after such a jump.
 */
export const QcOfferContainer = ({ offer, needsReview, qcKey, flashed, children }: {
  offer?: Offer;
  needsReview: boolean;
  qcKey: string;
  flashed: boolean;
  children: React.ReactNode;
}) => {
  const theme = useTheme();
  return (
  <div
    data-qc-key={qcKey}
    style={{
      border: '1px solid rgba(0,0,0,0.12)', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 12,
      background: '#ffffff', ...qcFlashOutline(flashed, theme.palette.warning.main),
    }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 600, color: '#1f1d25' }}>
          {offer?.vehicleName ?? 'Unknown offer'}
        </span>
        {offer?.vin && (
          <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576' }}>VIN {offer.vin}</span>
        )}
      </div>
      <span style={pillStyle(needsReview)}>{needsReview ? 'QC: needs review' : 'QC passed'}</span>
    </div>
    {children}
  </div>
  );
};
