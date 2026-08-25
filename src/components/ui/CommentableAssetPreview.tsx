import { useRef, useState } from 'react';
import { IconButton } from '@mui/material';
import { Fullscreen, Check, Close, DescriptionOutlined } from '@mui/icons-material';
import type { AssetCommentAnchor, Offer, ReviewStatus, Template } from '../../data/types';
import { FilledTemplatePreview } from './FilledTemplatePreview';
import { PENDING_ANCHOR_ID } from './AlertHighlightableText';
import { Tooltip } from './Tooltip';

const tooltipPopperProps = { popper: { style: { zIndex: 100050 } } };

/**
 * An asset creative (offer + template + background) that can be annotated the same way as the email body:
 * click anywhere to drop a pin, or drag-select a value/line of text to highlight it. Used both inline
 * (small, embedded in the email) and inside `AlertAssetPreviewModal` (large, 600x600) — anchors are
 * percentage-based so they render correctly at either size. Since `FilledTemplatePreview` renders template
 * copy as real DOM text (not canvas/image), `window.getSelection()` works here exactly like it does in the
 * email body, with no template-specific code required.
 */

interface AssetAnnotationOverlayProps {
  pins: { anchor: AssetCommentAnchor; commentId: string }[];
  pendingAnchor?: AssetCommentAnchor;
  activeAnchorId: string | null;
  onPinClick: (commentId: string) => void;
  registerAnchorRef: (commentId: string, el: HTMLElement | null) => void;
}

/** Renders each asset anchor as either a circular pin (point) or a highlighted rectangle (dragged text selection), plus an unsent preview of whichever one is currently pending. */
export const AssetAnnotationOverlay = ({ pins, pendingAnchor, activeAnchorId, onPinClick, registerAnchorRef }: AssetAnnotationOverlayProps) => (
  <>
    {pins.map(({ anchor, commentId }) => {
      const isActive = activeAnchorId === commentId;
      if (anchor.widthPct !== undefined) {
        return (
          <div
            key={commentId}
            ref={(el) => registerAnchorRef(commentId, el)}
            onClick={(e) => { e.stopPropagation(); onPinClick(commentId); }}
            style={{
              position: 'absolute', left: `${anchor.xPct}%`, top: `${anchor.yPct}%`,
              width: `${anchor.widthPct}%`, height: `${anchor.heightPct}%`,
              background: isActive ? 'rgba(99,86,225,0.32)' : 'rgba(99,86,225,0.16)',
              outline: isActive ? '2px solid #473bab' : '1px solid rgba(71,59,171,0.5)',
              cursor: 'pointer', borderRadius: 2, transition: 'background 0.3s', zIndex: 5,
            }}
          />
        );
      }
      const size = isActive ? 22 : 18;
      return (
        <div
          key={commentId}
          ref={(el) => registerAnchorRef(commentId, el)}
          onClick={(e) => { e.stopPropagation(); onPinClick(commentId); }}
          style={{
            position: 'absolute', left: `${anchor.xPct}%`, top: `${anchor.yPct}%`, transform: 'translate(-50%, -50%)',
            width: size, height: size, borderRadius: '50%', background: '#473bab', border: '2px solid #ffffff',
            boxShadow: '0px 1px 4px rgba(0,0,0,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', transition: 'width 0.2s, height 0.2s', zIndex: 5,
          }}
        >
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#ffffff' }} />
        </div>
      );
    })}
    {pendingAnchor && (pendingAnchor.widthPct !== undefined ? (
      <div
        ref={(el) => registerAnchorRef(PENDING_ANCHOR_ID, el)}
        style={{
          position: 'absolute', left: `${pendingAnchor.xPct}%`, top: `${pendingAnchor.yPct}%`,
          width: `${pendingAnchor.widthPct}%`, height: `${pendingAnchor.heightPct}%`,
          background: 'rgba(71,59,171,0.24)', border: '2px dashed #473bab', zIndex: 6, pointerEvents: 'none',
        }}
      />
    ) : (
      <div
        ref={(el) => registerAnchorRef(PENDING_ANCHOR_ID, el)}
        style={{
          position: 'absolute', left: `${pendingAnchor.xPct}%`, top: `${pendingAnchor.yPct}%`, transform: 'translate(-50%, -50%)',
          width: 18, height: 18, borderRadius: '50%', background: 'rgba(71,59,171,0.4)', border: '2px dashed #473bab',
          zIndex: 6, pointerEvents: 'none',
        }}
      />
    ))}
  </>
);

export interface AssetTextSelection {
  top: number;
  left: number;
  anchor: AssetCommentAnchor;
}

interface CommentableAssetPreviewProps {
  offer: Offer;
  template: Template;
  backgroundUrl: string;
  pins: { anchor: AssetCommentAnchor; commentId: string }[];
  pendingAnchor?: AssetCommentAnchor;
  activeAnchorId: string | null;
  onPinClick: (commentId: string) => void;
  registerAnchorRef: (commentId: string, el: HTMLElement | null) => void;
  onCreatePin: (anchor: AssetCommentAnchor) => void;
  onTextSelected: (selection: AssetTextSelection | null) => void;
  /** When passed, a small preview/zoom button appears on hover (top-right) — omitted inside the preview modal itself. */
  onRequestPreview?: () => void;
  /** When passed, a small "show offer info" button appears on hover, immediately to the left of the preview/zoom button — omitted inside the preview modal itself. */
  onShowOfferCard?: () => void;
  /** When passed (along with onApprove/onReject), hovering while `approvalStatus === 'pending'` reveals Approve/Request changes icon buttons bottom-right. Omitted where per-asset approval doesn't apply. */
  approvalStatus?: ReviewStatus;
  onApprove?: () => void;
  onReject?: () => void;
  approvalDisabled?: boolean;
}

export const CommentableAssetPreview = ({
  offer, template, backgroundUrl, pins, pendingAnchor, activeAnchorId, onPinClick,
  registerAnchorRef, onCreatePin, onTextSelected, onRequestPreview, onShowOfferCard,
  approvalStatus, onApprove, onReject, approvalDisabled,
}: CommentableAssetPreviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    // The asset can sit inside the email body (which has its own onMouseUp for email-text highlighting) —
    // stop the event there so that handler doesn't also run, see no `data-paragraph-index` ancestor, and
    // clear the selection state this handler is about to set.
    e.stopPropagation();
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.toString().trim().length === 0 || !containerRef.current) {
      onTextSelected(null);
      return;
    }
    const range = selection.getRangeAt(0);
    if (!containerRef.current.contains(range.startContainer)) { onTextSelected(null); return; }

    const containerRect = containerRef.current.getBoundingClientRect();
    const rangeRect = range.getBoundingClientRect();
    onTextSelected({
      top: rangeRect.top - 6,
      left: rangeRect.right + 8,
      anchor: {
        kind: 'asset',
        offerId: offer.id,
        xPct: ((rangeRect.left - containerRect.left) / containerRect.width) * 100,
        yPct: ((rangeRect.top - containerRect.top) / containerRect.height) * 100,
        widthPct: (rangeRect.width / containerRect.width) * 100,
        heightPct: (rangeRect.height / containerRect.height) * 100,
        quotedText: range.toString(),
      },
    });
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // A just-completed drag-selection is handled by handleMouseUp's floating-button flow instead — a plain
    // click (no selection) is what drops a pin.
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.toString().trim().length > 0) return;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    onCreatePin({
      kind: 'asset',
      offerId: offer.id,
      xPct: ((e.clientX - rect.left) / rect.width) * 100,
      yPct: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      style={{ position: 'relative', width: '100%', height: '100%', cursor: 'crosshair', borderRadius: 8, overflow: 'hidden', background: '#f0f2f4' }}
    >
      <FilledTemplatePreview template={template} offer={offer} backgroundUrl={backgroundUrl} />
      <AssetAnnotationOverlay
        pins={pins}
        pendingAnchor={pendingAnchor}
        activeAnchorId={activeAnchorId}
        onPinClick={onPinClick}
        registerAnchorRef={registerAnchorRef}
      />
      {onShowOfferCard && hovered && (
        <IconButton
          onClick={(e) => { e.stopPropagation(); onShowOfferCard(); }}
          sx={{
            position: 'absolute', top: 6, right: 48, zIndex: 7, background: 'rgba(0,0,0,0.25)', padding: '5px',  width: 36, height: 36,
            boxShadow: '0px 1px 5px rgba(0,0,0,0.12), 0px 2px 2px rgba(0,0,0,0.14)',
            '&:hover': { background: 'rgba(0,0,0,0.40)' },
          }}
        >
          <DescriptionOutlined style={{ fontSize: 18, color: '#ffffff' }} />
        </IconButton>
      )}
      {onRequestPreview && hovered && (
        <IconButton
          onClick={(e) => { e.stopPropagation(); onRequestPreview(); }}
          sx={{
            position: 'absolute', top: 6, right: 6, zIndex: 7, background: 'rgba(0,0,0,0.25)', padding: '5px',  width: 36, height: 36,
            boxShadow: '0px 1px 5px rgba(0,0,0,0.12), 0px 2px 2px rgba(0,0,0,0.14)',
            '&:hover': { background: 'rgba(0,0,0,0.40)' },
          }}
        >
          <Fullscreen style={{ fontSize: 18, color: '#ffffff' }} />
        </IconButton>
      )}
      {onApprove && onReject && hovered && approvalStatus === 'pending' && (
        <div style={{ position: 'absolute', bottom: 8, right: 8, zIndex: 7, display: 'flex', gap: 6 }}>
          <Tooltip title="Request changes" slotProps={tooltipPopperProps}>
            <IconButton
              disabled={approvalDisabled}
              onClick={(e) => { e.stopPropagation(); onReject(); }}
              sx={{
                background: '#ffffff', border: '1px solid #d2323f', padding: '5px', width: 36, height: 36,
                boxShadow: '0px 1px 5px rgba(0,0,0,0.12), 0px 2px 2px rgba(0,0,0,0.14)',
                '&:hover': { background: '#ffffff' },
              }}
            >
              <Close style={{ fontSize: 18, color: '#d2323f' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Approve" slotProps={tooltipPopperProps}>
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
    </div>
  );
};
