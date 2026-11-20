import type { FeeSyncDealership } from '../../../data/feeSync';
import { FeeButton } from './FeeButton';
import { FeeNotice, NoticeLink } from './FeeNotice';
import { FeeSectionCard } from './FeeSectionCard';
import { FeeSyncDealershipField } from './FeeSyncDealershipField';

// Figma "Dealership Field Interaction" + "Connection Fails": the account's FeeSync match is preselected in a
// searchable Dealership field (any dealership from the group can be picked), then Confirm dealership
// (inline spinner while confirming).

interface ConfirmDealershipCardProps {
  dealership: FeeSyncDealership;
  options: FeeSyncDealership[];
  confirming: boolean;
  /** Shows the "FeeSync connection failed" banner (Figma "Connection Fails"). */
  failed: boolean;
  errorCode?: number;
  onSelect: (dealership: FeeSyncDealership) => void;
  onConfirm: () => void;
}

export const ConfirmDealershipCard = ({ dealership, options, confirming, failed, errorCode = 400, onSelect, onConfirm }: ConfirmDealershipCardProps) => (
  <FeeSectionCard
    title="We identified this FeeSync account:"
    description="Confirm your account. You may search by dealership or code."
    descriptionSize="body2"
  >
    {failed && (
      <FeeNotice tone="error">
        FeeSync connection failed. Please try again in a few minutes. <NoticeLink>See details</NoticeLink> (Error code: {errorCode})
      </FeeNotice>
    )}

    <FeeSyncDealershipField value={dealership} options={options} onChange={onSelect} disabled={confirming} />

    <div>
      <FeeButton onClick={onConfirm} loading={confirming} capitalize={false}>Confirm dealership</FeeButton>
    </div>
  </FeeSectionCard>
);
