import { useState } from 'react';
import { IconButton } from '@mui/material';
import { Check, DeleteOutlined } from '@mui/icons-material';
import type { Offer, ReviewStatus } from '../../data/types';
import { OfferListCard } from './AlertOffersPanel';
import { ReviewStatusChip } from './AlertApprovalWidgets';
import { Tooltip } from './Tooltip';

const tooltipPopperProps = { popper: { style: { zIndex: 100050 } } };

interface OfferReviewCardProps {
  offer: Offer;
  locked: boolean;
  approvalStatus: ReviewStatus;
  approvalDisabled?: boolean;
  /** Briefly tints the card to call out one jumped-to from elsewhere (e.g. the asset carousel's Offer Info button) — purely visual, forwarded to the underlying `OfferListCard`. */
  highlighted?: boolean;
  onEditVehicle: () => void;
  onEditOffer: () => void;
  onApprove: () => void;
  onReject: () => void;
  onUndo: () => void;
}

/**
 * One offer's row in the Review Offers list — the same identity+pricing "Offer Card" used elsewhere
 * (`OfferListCard`), with an always-visible Approve/Reject overlay while pending. Once decided, those
 * buttons are replaced by the same compact `ReviewStatusChip` the asset tiles use, so both tracks match.
 */
export const OfferReviewCard = ({
  offer, locked, approvalStatus, approvalDisabled, highlighted, onEditVehicle, onEditOffer, onApprove, onReject, onUndo,
}: OfferReviewCardProps) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative' }}
    >
      <OfferListCard
        offer={offer}
        locked={locked}
        onEditVehicle={onEditVehicle}
        onEditOffer={onEditOffer}
        highlighted={highlighted}
        reviewStatus={approvalStatus === 'pending' ? undefined : approvalStatus}
      />

      {approvalStatus === 'pending' && hovered && (
        <div style={{ position: 'absolute', bottom: 8, right: 8, zIndex: 2, display: 'flex', gap: 6 }}>
          <Tooltip title="Reject Offer" slotProps={tooltipPopperProps}>
            <IconButton
              disabled={approvalDisabled}
              onClick={(e) => { e.stopPropagation(); onReject(); }}
              sx={{
                background: '#ffffff', padding: '5px', width: 36, height: 36, outline: '1px solid #d2323f',
                boxShadow: '0px 1px 5px rgba(0,0,0,0.12), 0px 2px 2px rgba(0,0,0,0.14)',
                '&:hover': { background: '#fdeded' },
              }}
            >
              <DeleteOutlined style={{ fontSize: 18, color: '#d2323f' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Approve Offer" slotProps={tooltipPopperProps}>
            <IconButton
              disabled={approvalDisabled}
              onClick={(e) => { e.stopPropagation(); onApprove(); }}
              sx={{
                background: '#4caf50', padding: '5px', width: 36, height: 36,
                boxShadow: '0px 1px 5px rgba(0,0,0,0.12), 0px 2px 2px rgba(0,0,0,0.14)',
                '&:hover': { background: '#43a047' },
              }}
            >
              <Check style={{ fontSize: 18, color: '#ffffff' }} />
            </IconButton>
          </Tooltip>
        </div>
      )}

      {approvalStatus !== 'pending' && (
        <ReviewStatusChip status={approvalStatus} disabled={approvalDisabled} onUndo={onUndo} />
      )}
    </div>
  );
};
