import { IconButton, Skeleton, Tooltip } from '@mui/material';
import refreshIcon from '../../../assets/icons/fees/refresh.svg';
import { formatRefreshTime } from '../../../data/feeSync';
import type { FeeSyncDealership } from '../../../data/feeSync';
import { StatusChip } from './StatusChip';

// Figma connected-state strip: Franchise supplying fees · Status · Last refresh (with the manual refresh
// button). #f9fafa fill, 8px radius, 12px padding. Sizes live here.
const PADDING = 12;
const GAP = 12;
const RADIUS = 8;
const FRANCHISE_WIDTH = 320;
const COLUMN_WIDTH = 160;
const LABEL_FONT_SIZE = 11;
const VALUE_FONT_SIZE = 12;
const REFRESH_ICON_SIZE = 18;
const COLUMN_GAP = 2;
const SKELETON_RADIUS = 4;

const LABEL = { margin: 0, fontSize: LABEL_FONT_SIZE, lineHeight: 1.66, letterSpacing: '0.4px', color: '#686576' } as const;
const VALUE = { margin: 0, fontSize: VALUE_FONT_SIZE, lineHeight: 1.43, letterSpacing: '0.17px', color: '#1f1d25' } as const;

interface FeeSyncSummaryProps {
  dealership: FeeSyncDealership;
  connectionLost: boolean;
  refreshedAt: string | null;
  refreshing: boolean;
  onRefresh: () => void;
}

export const FeeSyncSummary = ({ dealership, connectionLost, refreshedAt, refreshing, onRefresh }: FeeSyncSummaryProps) => (
  <div style={{
    display: 'flex', alignItems: 'flex-start', gap: GAP, padding: PADDING, borderRadius: RADIUS, background: '#f9fafa',
    width: '100%', boxSizing: 'border-box', flexWrap: 'wrap', fontFamily: 'Roboto, sans-serif',
  }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: COLUMN_GAP, width: FRANCHISE_WIDTH, maxWidth: '100%' }}>
      <p style={LABEL}>Franchise supplying fees</p>
      <p style={VALUE}>{dealership.name} · {dealership.brand} · {dealership.address}</p>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: COLUMN_GAP, width: COLUMN_WIDTH }}>
      <p style={LABEL}>Status</p>
      {connectionLost ? <StatusChip tone="warning" label="Connection Lost" /> : <StatusChip tone="success" label="Connected" />}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: COLUMN_GAP, width: COLUMN_WIDTH }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <p style={LABEL}>Last refresh</p>
        <Tooltip title="Refresh fees">
          <span>
            <IconButton aria-label="Refresh fees" onClick={onRefresh} disabled={refreshing} sx={{ padding: 0, '&.Mui-disabled': { opacity: 0.5 } }}>
              <img src={refreshIcon} alt="" width={REFRESH_ICON_SIZE} height={REFRESH_ICON_SIZE} />
            </IconButton>
          </span>
        </Tooltip>
      </div>
      {refreshing
        ? <Skeleton variant="rounded" width={118} height={12} sx={{ marginTop: '4px', borderRadius: `${SKELETON_RADIUS}px` }} aria-label="Refreshing" />
        : <p style={VALUE}>{refreshedAt ? formatRefreshTime(refreshedAt) : '—'}</p>}
    </div>
  </div>
);
