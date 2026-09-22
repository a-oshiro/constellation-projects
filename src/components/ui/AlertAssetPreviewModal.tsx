import { useRef } from 'react';
import ReactDOM from 'react-dom';
import { IconButton } from '@mui/material';
import { Check, ChevronLeft, ChevronRight, DeleteOutlined, Close } from '@mui/icons-material';
import type { Offer, ReviewStatus, Template } from '../../data/types';
import { CommentableAssetPreview } from './CommentableAssetPreview';
import { ReviewStatusChip } from './AlertApprovalWidgets';
import { Tooltip } from './Tooltip';

/**
 * Zoomed-in asset preview: a dark-overlay modal centered on screen, showing the asset up to 600x600
 * (letterboxed to its template's aspect ratio), with prev/next controls to step through the same set of
 * assets the compact carousel shows.
 */

const MAX_SIZE = 600;
const tooltipPopperProps = { popper: { style: { zIndex: 100050 } } };

interface AlertAssetPreviewModalProps {
  offer: Offer;
  template: Template;
  backgroundUrl: string;
  onClose: () => void;
  approvalStatus: ReviewStatus;
  approvalDisabled?: boolean;
  /** True when this asset is rejected because its offer was removed, not by a direct decision here — the
   * chip then has no Undo (that has to happen in Review Offers instead) and explains itself on hover. */
  autoRejectedByOffer?: boolean;
  onApprove: () => void;
  onReject: () => void;
  onUndo: () => void;
  /** Zero-based position of `offer` within the currently-visible asset list, and that list's length —
   * powers the carousel control that lets the user step through every visible asset without leaving the
   * enlarged view. */
  currentIndex: number;
  totalCount: number;
  onPrev: () => void;
  onNext: () => void;
}

export const AlertAssetPreviewModal = ({
  offer, template, backgroundUrl, onClose,
  approvalStatus, approvalDisabled, autoRejectedByOffer, onApprove, onReject, onUndo,
  currentIndex, totalCount, onPrev, onNext,
}: AlertAssetPreviewModalProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const ratio = template.width / template.height;
  const boxWidth = ratio >= 1 ? MAX_SIZE : MAX_SIZE * ratio;

  return ReactDOM.createPortal(
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 100040, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative', width: MAX_SIZE, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', top: -44, right: 0, background: 'rgba(255,255,255,0.16)', color: '#ffffff', '&:hover': { background: 'rgba(255,255,255,0.24)' } }}
        >
          <Close />
        </IconButton>

        <div
          style={{ width: boxWidth, aspectRatio: `${template.width} / ${template.height}`, borderRadius: 8, overflow: 'hidden', boxShadow: '0px 12px 40px rgba(0,0,0,0.4)' }}
        >
          <CommentableAssetPreview offer={offer} template={template} backgroundUrl={backgroundUrl} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: boxWidth, marginTop: 16 }}>
          {totalCount > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton
                onClick={onPrev}
                sx={{ padding: '4px', background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(0,0,0,0.12)', boxShadow: '0px 1px 4px rgba(0,0,0,0.12)' }}
              >
                <ChevronLeft style={{ fontSize: 20, color: '#ffffff' }} />
              </IconButton>
              <span style={{ minWidth: 36, textAlign: 'center', fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#ffffff' }}>
                {currentIndex + 1}/{totalCount}
              </span>
              <IconButton
                onClick={onNext}
                sx={{ padding: '4px', background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(0,0,0,0.12)', boxShadow: '0px 1px 4px rgba(0,0,0,0.12)' }}
              >
                <ChevronRight style={{ fontSize: 20, color: '#ffffff' }} />
              </IconButton>
            </div>
          )}

          {approvalStatus === 'pending' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
              <button
                disabled={approvalDisabled}
                onClick={onReject}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid #d2323f', borderRadius: 100,
                  padding: '8px 18px', background: '#ffffff', color: '#d2323f', fontSize: 13, fontFamily: 'Roboto, sans-serif',
                  fontWeight: 500, letterSpacing: '0.46px',
                  cursor: approvalDisabled ? 'not-allowed' : 'pointer',
                  opacity: approvalDisabled ? 0.5 : 1,
                }}
              >
                <DeleteOutlined style={{ fontSize: 16 }} />
                Reject Asset
              </button>
              <button
                disabled={approvalDisabled}
                onClick={onApprove}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', borderRadius: 100,
                  padding: '8px 18px', background: '#4caf50', color: '#ffffff', fontSize: 13, fontFamily: 'Roboto, sans-serif',
                  fontWeight: 500, letterSpacing: '0.46px',
                  cursor: approvalDisabled ? 'not-allowed' : 'pointer',
                  opacity: approvalDisabled ? 0.5 : 1,
                }}
              >
                <Check style={{ fontSize: 16 }} />
                Approve Asset
              </button>
            </div>
          ) : (
            <div style={{ marginLeft: 'auto' }}>
              <Tooltip title={autoRejectedByOffer ? 'Asset offer rejected' : ''} disableHoverListener={!autoRejectedByOffer} slotProps={tooltipPopperProps}>
                <span>
                  <ReviewStatusChip
                    status={approvalStatus === 'approved' ? 'approved' : 'rejected'}
                    disabled={approvalDisabled}
                    onUndo={autoRejectedByOffer ? undefined : onUndo}
                    layout="static"
                  />
                </span>
              </Tooltip>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};
