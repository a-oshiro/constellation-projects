import { useState } from 'react';
import { useSnackbar } from '../../../context/SnackbarContext';
import { formatShortDate, pluralize } from '../../../data/feeSync';
import type { FeeSyncDealership, FeeSyncFee, FeeSyncLimitations, FeeSyncRejectedUpdate } from '../../../data/feeSync';
import { FeeNotice, NoticeLink } from './FeeNotice';
import { FeeSectionCard } from './FeeSectionCard';
import { FeeSyncDetailsDialog } from './FeeSyncDetailsDialog';
import { FeeSyncFeesTable } from './FeeSyncFeesTable';
import { FeeSyncSummary } from './FeeSyncSummary';

// Figma connected state ("FeeSync Fees"): the connection-lost warning when simulated, the summary strip,
// the read-only fees table, then Option 2b's two lines under it: what Constellation doesn't use from FeeSync
// (info) and, when one arrived, the FeeSync update that wasn't applied (warning). Both open the details dialog.

interface FeeSyncConnectedCardProps {
  dealership: FeeSyncDealership;
  fees: FeeSyncFee[];
  refreshedAt: string | null;
  refreshing: boolean;
  connectionLost: boolean;
  limitations: FeeSyncLimitations;
  rejectedUpdate: FeeSyncRejectedUpdate | null;
  onRefresh: () => void;
}

export const FeeSyncConnectedCard = ({
  dealership, fees, refreshedAt, refreshing, connectionLost, limitations, rejectedUpdate, onRefresh,
}: FeeSyncConnectedCardProps) => {
  const { showSnackbar } = useSnackbar();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const excludedCount = limitations.usedVehicleFees.filter((f) => f.handling === 'excluded').length;
  const settingsCount = limitations.unsupportedSettings.length;
  const unusedParts = [
    excludedCount > 0 && pluralize(excludedCount, 'fee'),
    settingsCount > 0 && pluralize(settingsCount, 'FeeSync setting'),
  ].filter(Boolean).join(' and ');
  const unusedVerb = excludedCount + settingsCount === 1 ? 'isn’t' : 'aren’t';

  return (
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
      {!refreshing && (unusedParts || rejectedUpdate) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {unusedParts && (
            <FeeNotice tone="info">
              {unusedParts} {unusedVerb} used in Constellation. <NoticeLink onClick={() => setDetailsOpen(true)}>See details</NoticeLink>
            </FeeNotice>
          )}
          {rejectedUpdate && (
            <FeeNotice tone="warning" inline>
              1 FeeSync update wasn’t applied on {formatShortDate(rejectedUpdate.receivedAt)}.{' '}
              <NoticeLink onClick={() => setDetailsOpen(true)}>Review update</NoticeLink>
            </FeeNotice>
          )}
        </div>
      )}
      <FeeSyncDetailsDialog
        open={detailsOpen}
        brand={dealership.brand}
        limitations={limitations}
        rejectedUpdate={rejectedUpdate}
        onClose={() => setDetailsOpen(false)}
        // FeeSync is mocked: there's no FeeSync address to open in this prototype.
        onEditInFeeSync={() => showSnackbar({ message: 'FeeSync isn’t connected in this prototype.', duration: 4000 })}
      />
    </FeeSectionCard>
  );
};
