import { Skeleton } from '@mui/material';
import { formatFeeAmount } from '../../../data/feeSync';
import type { FeeSyncFee } from '../../../data/feeSync';
import { StatusChip } from './StatusChip';

// Figma read-only FeeSync fees table (<TableHead> with left dividers): Fee · Amount · Offer types, plus a
// Treatment column when any fee has one (Flow 2). Skeleton rows while refreshing (Flow 3). Sizes live here.
const HEADER_FONT_SIZE = 14;
const CELL_FONT_SIZE = 12;
const CELL_PADDING = 16;
const AMOUNT_COL_WIDTH = 120;
const TREATMENT_COL_WIDTH = 120;
const HEADER_DIVIDER_HEIGHT = 24;
const NAME_CHIP_GAP = 8;
const TREATMENT_CHIP_FONT_SIZE = 11;
const TREATMENT_CHIP_PADDING = '3px 10px';
const SKELETON_HEIGHT = 16;
const SKELETON_RADIUS = 4;
/** Skeleton widths vary per cell between these percentages of the cell, so rows don't look uniform. */
const SKELETON_MIN_WIDTH_PCT = 40;
const SKELETON_MAX_WIDTH_PCT = 95;

/**
 * A width that looks random but is stable for a given cell (a hash of fee id + column), so the
 * skeletons don't jump around on every re-render while refreshing.
 */
const skeletonWidth = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const span = SKELETON_MAX_WIDTH_PCT - SKELETON_MIN_WIDTH_PCT;
  return `${SKELETON_MIN_WIDTH_PCT + (Math.abs(h) % (span + 1))}%`;
};

const DIVIDER = '1px solid rgba(0,0,0,0.12)';
const CELL_TEXT = {
  fontSize: CELL_FONT_SIZE, lineHeight: 1.43, letterSpacing: '0.17px', color: '#1f1d25',
  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
};

interface Column {
  key: 'name' | 'amount' | 'offerTypes' | 'treatment';
  label: string;
  width?: number;
}

interface FeeSyncFeesTableProps {
  fees: FeeSyncFee[];
  loading: boolean;
}

export const FeeSyncFeesTable = ({ fees, loading }: FeeSyncFeesTableProps) => {
  const showTreatment = fees.some((f) => f.treatment);
  const columns: Column[] = [
    { key: 'name', label: 'Fee' },
    { key: 'amount', label: 'Amount', width: AMOUNT_COL_WIDTH },
    { key: 'offerTypes', label: 'Offer types' },
    ...(showTreatment ? [{ key: 'treatment' as const, label: 'Treatment', width: TREATMENT_COL_WIDTH }] : []),
  ];
  const colStyle = (c: Column) => (c.width ? { width: c.width, flexShrink: 0 } : { flex: 1, minWidth: 0 });

  return (
    <div role="table" aria-label="FeeSync fees" aria-busy={loading} style={{ width: '100%', fontFamily: 'Roboto, sans-serif' }}>
      <div role="row" style={{ display: 'flex', borderBottom: DIVIDER }}>
        {columns.map((c) => (
          <div
            key={c.key}
            role="columnheader"
            style={{ ...colStyle(c), display: 'flex', alignItems: 'center', gap: CELL_PADDING, padding: `${CELL_PADDING}px ${CELL_PADDING}px ${CELL_PADDING}px 0`, boxSizing: 'border-box' }}
          >
            <span aria-hidden style={{ width: 1, height: HEADER_DIVIDER_HEIGHT, background: 'rgba(0,0,0,0.12)', flexShrink: 0 }} />
            <span style={{ fontSize: HEADER_FONT_SIZE, fontWeight: 500, lineHeight: '24px', letterSpacing: '0.17px', color: '#1f1d25', whiteSpace: 'nowrap' }}>{c.label}</span>
          </div>
        ))}
      </div>

      {fees.map((fee) => (
        <div key={fee.id} role="row" style={{ display: 'flex', alignItems: 'stretch', borderBottom: DIVIDER }}>
          {columns.map((c) => (
            <div key={c.key} role="cell" style={{ ...colStyle(c), display: 'flex', alignItems: 'center', padding: CELL_PADDING, boxSizing: 'border-box' }}>
              {loading
                ? <Skeleton variant="rounded" height={SKELETON_HEIGHT} sx={{ width: skeletonWidth(`${fee.id}:${c.key}`), borderRadius: `${SKELETON_RADIUS}px` }} />
                : <FeeCell fee={fee} column={c.key} />}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const FeeCell = ({ fee, column }: { fee: FeeSyncFee; column: Column['key'] }) => {
  switch (column) {
    case 'name':
      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: NAME_CHIP_GAP, minWidth: 0 }}>
          <span style={CELL_TEXT}>
            {fee.name}
            {fee.optional && <span style={{ color: '#686576' }}> (Optional)</span>}
          </span>
          {fee.isNew && <StatusChip tone="info" label="New" />}
        </span>
      );
    case 'amount':
      return <span style={CELL_TEXT}>{formatFeeAmount(fee.amount)}</span>;
    case 'offerTypes':
      return <span style={CELL_TEXT}>{fee.offerTypes}</span>;
    case 'treatment':
      return fee.treatment ? (
        <span style={{
          display: 'inline-flex', alignItems: 'center', height: 24, boxSizing: 'border-box', padding: TREATMENT_CHIP_PADDING, borderRadius: 8,
          background: 'rgba(17,16,20,0.04)', fontSize: TREATMENT_CHIP_FONT_SIZE, lineHeight: '18px', letterSpacing: '0.16px', color: '#1f1d25',
        }}>
          {fee.treatment}
        </span>
      ) : null;
  }
};
