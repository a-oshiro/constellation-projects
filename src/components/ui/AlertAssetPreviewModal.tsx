import { useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { IconButton } from '@mui/material';
import { Check, ChevronLeft, ChevronRight, Sync, Close } from '@mui/icons-material';
import type { AlertComment, AssetCommentAnchor, Background, Offer, ReviewStatus, Template } from '../../data/types';
import { CommentableAssetPreview, type AssetTextSelection } from './CommentableAssetPreview';
import { FloatingCommentColumn, type ColumnEntry } from './FloatingCommentColumn';
import { FloatingCommentButton, PENDING_ANCHOR_ID } from './AlertHighlightableText';
import { AlertOfferCard } from './AlertOfferCard';
import { AssetStatusBadge } from './AlertApprovalWidgets';

/**
 * Zoomed-in asset preview: a dark-overlay modal centered on screen, showing the asset up to 600x600
 * (letterboxed to its template's aspect ratio) with the same pin/highlight commenting as the inline
 * version — anchors are percentage-based, so annotations made here show up on the small inline asset too.
 */

const MAX_SIZE = 600;

interface AlertAssetPreviewModalProps {
  offer: Offer;
  template: Template;
  backgroundUrl: string;
  background: Background;
  projectId: string;
  locked: boolean;
  comments: AlertComment[];
  activeAnchorId: string | null;
  onClose: () => void;
  onAddComment: (text: string, mentionedNames: string[], anchor: AssetCommentAnchor) => void;
  onToggleResolved: (commentId: string) => void;
  onDeleteComment: (commentId: string) => void;
  onAnchorClick: (commentId: string) => void;
  onEditOffer: () => void;
  onReply: (parentCommentId: string, text: string, mentionedNames: string[]) => void;
  onToggleReaction: (commentId: string, emoji: string) => void;
  approvalStatus: ReviewStatus;
  approvalDisabled?: boolean;
  /** Present once approvalStatus is no longer 'pending' — who made the decision and when, for the status badge. */
  reviewActorName?: string;
  reviewTimestamp?: number;
  onApprove: () => void;
  onReject: () => void;
  onUndo: () => void;
  /** Zero-based position of `offer` within the alert's full asset list, and that list's length — powers
   * the carousel control that lets the user step through every asset without leaving the enlarged view. */
  currentIndex: number;
  totalCount: number;
  onPrev: () => void;
  onNext: () => void;
}

export const AlertAssetPreviewModal = ({
  offer, template, backgroundUrl, background, projectId, locked, comments, activeAnchorId, onClose,
  onAddComment, onToggleResolved, onDeleteComment, onAnchorClick, onEditOffer, onReply, onToggleReaction,
  approvalStatus, approvalDisabled, reviewActorName, reviewTimestamp, onApprove, onReject, onUndo,
  currentIndex, totalCount, onPrev, onNext,
}: AlertAssetPreviewModalProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const anchorRefs = useRef<Map<string, HTMLElement>>(new Map());
  const registerAnchorRef = (id: string, el: HTMLElement | null) => {
    if (el) anchorRefs.current.set(id, el); else anchorRefs.current.delete(id);
  };

  const [pendingAnchor, setPendingAnchor] = useState<AssetCommentAnchor | undefined>(undefined);
  const [floatingSelection, setFloatingSelection] = useState<AssetTextSelection | null>(null);

  const ratio = template.width / template.height;
  const boxWidth = ratio >= 1 ? MAX_SIZE : MAX_SIZE * ratio;

  const pins = comments
    .filter((c): c is AlertComment & { anchor: AssetCommentAnchor } => !!c.anchor && c.anchor.kind === 'asset')
    .map((c) => ({ anchor: c.anchor, commentId: c.id }));
  const displayPins = pendingAnchor ? [...pins, { anchor: pendingAnchor, commentId: PENDING_ANCHOR_ID }] : pins;
  const entries: ColumnEntry[] = comments
    .filter((c) => !c.parentCommentId)
    .map((c) => ({
      id: c.id,
      comment: c,
      replies: comments.filter((r) => r.parentCommentId === c.id),
    }));

  const handleSend = (text: string, mentionedNames: string[]) => {
    if (!pendingAnchor) return;
    onAddComment(text, mentionedNames, pendingAnchor);
    setPendingAnchor(undefined);
  };

  const handleStartComment = () => {
    if (!floatingSelection) return;
    setPendingAnchor(floatingSelection.anchor);
    setFloatingSelection(null);
    window.getSelection()?.removeAllRanges();
  };

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

        <div style={{ width: boxWidth, aspectRatio: `${template.width} / ${template.height}`, borderRadius: 8, overflow: 'hidden', boxShadow: '0px 12px 40px rgba(0,0,0,0.4)' }}>
          <CommentableAssetPreview
            offer={offer}
            template={template}
            backgroundUrl={backgroundUrl}
            pins={displayPins}
            pendingAnchor={pendingAnchor}
            activeAnchorId={activeAnchorId}
            onPinClick={onAnchorClick}
            registerAnchorRef={registerAnchorRef}
            onCreatePin={setPendingAnchor}
            onTextSelected={setFloatingSelection}
          />
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
                  display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid #E17613', borderRadius: 100,
                  padding: '8px 18px', background: '#ffffff', color: '#E17613', fontSize: 13, fontFamily: 'Roboto, sans-serif',
                  fontWeight: 500, letterSpacing: '0.46px',
                  cursor: approvalDisabled ? 'not-allowed' : 'pointer',
                  opacity: approvalDisabled ? 0.5 : 1,
                }}
              >
                <Sync style={{ fontSize: 16 }} />
                Request Asset Changes
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
              <AssetStatusBadge
                label={approvalStatus === 'approved' ? 'Asset Approved' : 'Changes Requested'}
                actorName={reviewActorName ?? ''}
                timestamp={reviewTimestamp ?? 0}
                onUndo={onUndo}
                onApproveChanges={approvalStatus === 'rejected' ? onApprove : undefined}
                layout="static"
              />
            </div>
          )}
        </div>

        <AlertOfferCard
          offer={offer}
          template={template}
          background={background}
          projectId={projectId}
          locked={locked}
          onEditOffer={onEditOffer}
        />

        <FloatingCommentColumn
          entries={entries}
          anchorRefs={anchorRefs}
          containerRef={containerRef}
          left={MAX_SIZE + 16}
          activeAnchorId={activeAnchorId}
          showResolved
          pendingAnchor={pendingAnchor}
          onCancelPending={() => setPendingAnchor(undefined)}
          onSendPending={handleSend}
          onToggleResolved={onToggleResolved}
          onDeleteComment={onDeleteComment}
          onJumpToAnchor={(c) => onAnchorClick(c.id)}
          registerCommentRef={() => {}}
          onReply={onReply}
          onToggleReaction={onToggleReaction}
        />
      </div>

      {floatingSelection && (
        <FloatingCommentButton top={floatingSelection.top} left={floatingSelection.left} onClick={handleStartComment} />
      )}
    </div>,
    document.body,
  );
};
