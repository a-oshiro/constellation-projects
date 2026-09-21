import { useState } from 'react';
import { IconButton } from '@mui/material';
import { Check, DeleteOutlined, Undo } from '@mui/icons-material';
import type { Offer, ReviewStatus } from '../../data/types';
import { OfferListCard } from './AlertOffersPanel';
import { Tooltip } from './Tooltip';

const tooltipPopperProps = { popper: { style: { zIndex: 100050 } } };

interface OfferReviewCardProps {
  offer: Offer;
  locked: boolean;
  approvalStatus: ReviewStatus;
  approvalDisabled?: boolean;
  onEditVehicle: () => void;
  onEditOffer: () => void;
  onApprove: () => void;
  onReject: () => void;
  onUndo: () => void;
}

/**
 * One offer tile in the offer-review dialog's grid — the same identity+pricing "Offer Card" used
 * elsewhere (`OfferListCard`), with a hover-only Approve/Remove overlay in the same visual spec as
 * `CommentableAssetPreview`'s asset-approval buttons. Unlike the asset stage's "Request Changes" (Sync)
 * icon, rejecting an offer here removes it from this review pass entirely, so it uses a trash icon.
 * Once decided, the hover buttons are replaced by a compact status pill with an Undo action.
 */
export const OfferReviewCard = ({
  offer, locked, approvalStatus, approvalDisabled, onEditVehicle, onEditOffer, onApprove, onReject, onUndo,
}: OfferReviewCardProps) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative' }}
    >
      <OfferListCard offer={offer} locked={locked} onEditVehicle={onEditVehicle} onEditOffer={onEditOffer} />

      {approvalStatus === 'pending' && hovered && (
        <div style={{ position: 'absolute', bottom: 8, right: 8, zIndex: 2, display: 'flex', gap: 6 }}>
          <Tooltip title="Remove Offer" slotProps={tooltipPopperProps}>
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
        <div
          style={{
            position: 'absolute', bottom: 8, right: 8, zIndex: 2, display: 'flex', alignItems: 'center', gap: 4,
            background: approvalStatus === 'approved' ? '#edf7ed' : '#FDEDED', borderRadius: 100, padding: '4px 6px 4px 10px',
            boxShadow: '0px 1px 5px rgba(0,0,0,0.12), 0px 2px 2px rgba(0,0,0,0.14)',
          }}
        >
          <span style={{
            fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 500, whiteSpace: 'nowrap',
            color: approvalStatus === 'approved' ? '#1b5e20' : '#5f2120',
          }}>
            {approvalStatus === 'approved' ? 'Approved' : 'Removed'}
          </span>
          <Tooltip title="Undo" slotProps={tooltipPopperProps}>
            <IconButton
              disabled={approvalDisabled}
              onClick={(e) => { e.stopPropagation(); onUndo(); }}
              sx={{ padding: '2px', width: 24, height: 24 }}
            >
              <Undo style={{ fontSize: 16, color: '#686576' }} />
            </IconButton>
          </Tooltip>
        </div>
      )}
    </div>
  );
};
