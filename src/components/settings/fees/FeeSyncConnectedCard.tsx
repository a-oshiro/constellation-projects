import type { FeeSyncDealership, FeeSyncFee } from '../../../data/feeSync';
import { FeeNotice, NoticeLink } from './FeeNotice';
import { FeeSectionCard } from './FeeSectionCard';
import { FeeSyncFeesTable } from './FeeSyncFeesTable';
import { FeeSyncSummary } from './FeeSyncSummary';

// Figma connected state ("FeeSync Fees"): the connection-lost warning when simulated, the summary strip,
// the read-only fees table, and the "may not be available" note.

interface FeeSyncConnectedCardProps {
  dealership: FeeSyncDealership;
  fees: FeeSyncFee[];
  refreshedAt: string | null;
  refreshing: boolean;
  connectionLost: boolean;
  onRefresh: () => void;
}

export const FeeSyncConnectedCard = ({ dealership, fees, refreshedAt, refreshing, connectionLost, onRefresh }: FeeSyncConnectedCardProps) => (
  <FeeSectionCard title="FeeSync Fees" description="Read-only. To change a fee, edit it in FeeSync then manually sync fees.">
    {connectionLost && (
      <FeeNotice tone="warning">Unable to get fees from FeeSync, your fees are out of date. Please check the connection.</FeeNotice>
    )}
    <FeeSyncSummary
      dealership={dealership}
      connectionLost={connectionLost}
      refreshedAt={refreshedAt}
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
    <FeeSyncFeesTable fees={fees} loading={refreshing} />
    {!refreshing && (
      <FeeNotice tone="info">
        Some fees from FeeSync may not be available here. <NoticeLink>See details</NoticeLink>
      </FeeNotice>
    )}
  </FeeSectionCard>
);
