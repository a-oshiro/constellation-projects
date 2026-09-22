import { useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { IconButton } from '@mui/material';
import { Cancel, Check, ChevronLeft, ChevronRight, Close, OpenInNew } from '@mui/icons-material';
import type { AlertComment, AssetCommentAnchor, Background, Offer, ReviewStatus, Template } from '../../data/types';
import { CommentableAssetPreview, type AssetTextSelection } from './CommentableAssetPreview';
import { FloatingCommentColumn, type ColumnEntry } from './FloatingCommentColumn';
import { FloatingCommentButton, PENDING_ANCHOR_ID } from './AlertHighlightableText';
import { AssetStatusBadge } from './AlertApprovalWidgets';
import { OfferListCard } from './AlertOffersPanel';
import { getProjectPathById } from '../../data/projects';
import bmwLogoSrc from '../../assets/bmw-logo.png';

/**
 * "Asset Details" dialog — replaces the old black-overlay zoom modal (AlertAssetPreviewModal). Same
 * commenting mechanism and prev/next carousel as before, but the "expand" action now opens this two-column
 * layout instead of just a bigger preview: the asset stays centered, and a dedicated Metadata column
 * (Offer / Template / Styles — what AlertOfferCard used to float to the left of an asset) sits to its
 * right. Portal-mounted as a sibling on top of AlertDialog, which stays mounted underneath — closing this
 * dialog is just unmounting it, so the alert dialog is exactly as the user left it.
 */

const MAX_SIZE = 520;
const METADATA_WIDTH = 300;

interface AlertAssetDetailsDialogProps {
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
  onEditOffer: (view: 'vehicle' | 'offer') => void;
  onReply: (parentCommentId: string, text: string, mentionedNames: string[]) => void;
  onToggleReaction: (commentId: string, emoji: string) => void;
  approvalStatus: ReviewStatus;
  approvalDisabled?: boolean;
  onApprove: () => void;
  onReject: () => void;
  onUndo: () => void;
  currentIndex: number;
  totalCount: number;
  onPrev: () => void;
  onNext: () => void;
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 10, fontFamily: 'Roboto, sans-serif', fontWeight: 600, color: '#9c99a9', letterSpacing: '0.4px', textTransform: 'uppercase',
};

const openTaskPage = (path: string) => window.open(path, '_blank', 'noopener,noreferrer');

export const AlertAssetDetailsDialog = ({
  offer, template, backgroundUrl, background, projectId, locked, comments, activeAnchorId, onClose,
  onAddComment, onToggleResolved, onDeleteComment, onAnchorClick, onEditOffer, onReply, onToggleReaction,
  approvalStatus, approvalDisabled, onApprove, onReject, onUndo,
  currentIndex, totalCount, onPrev, onNext,
}: AlertAssetDetailsDialogProps) => {
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
      style={{ position: 'fixed', inset: 0, zIndex: 100060, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 20 }}
      >
        <div ref={containerRef} style={{ position: 'relative', width: boxWidth, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
              approvalStatus={approvalStatus}
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
                    display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid #be0e1c', borderRadius: 100,
                    padding: '8px 18px', background: '#ffffff', color: '#be0e1c', fontSize: 13, fontFamily: 'Roboto, sans-serif',
                    fontWeight: 500, letterSpacing: '0.46px',
                    cursor: approvalDisabled ? 'not-allowed' : 'pointer',
                    opacity: approvalDisabled ? 0.5 : 1,
                  }}
                >
                  <Cancel style={{ fontSize: 16 }} />
                  Reject
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
                  label={approvalStatus === 'approved' ? 'Approved' : 'Rejected'}
                  disabled={approvalDisabled}
                  onUndo={onUndo}
                  layout="static"
                />
              </div>
            )}
          </div>

          <FloatingCommentColumn
            entries={entries}
            anchorRefs={anchorRefs}
            containerRef={containerRef}
            left={boxWidth + 16}
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

        {/* Metadata column */}
        <div
          style={{
            width: METADATA_WIDTH, flexShrink: 0, background: '#ffffff', borderRadius: 12, padding: 16,
            boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 16, maxHeight: MAX_SIZE + 60, overflowY: 'auto',
          }}
        >
          <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 600, color: '#1f1d25' }}>Metadata</span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={sectionTitleStyle}>Offer</span>
            <OfferListCard
              offer={offer}
              locked={locked}
              onEditVehicle={() => onEditOffer('vehicle')}
              onEditOffer={() => onEditOffer('offer')}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={sectionTitleStyle}>Template</span>
              <IconButton size="small" onClick={() => openTaskPage(getProjectPathById(projectId, 'templates'))} sx={{ padding: '2px' }} title="Open Templates">
                <OpenInNew style={{ fontSize: 13, color: '#686576' }} />
              </IconButton>
            </div>
            <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25' }}>{template.name}</span>
            <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576' }}>{template.width} x {template.height}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={sectionTitleStyle}>Styles</span>
              <IconButton size="small" onClick={() => openTaskPage(getProjectPathById(projectId, 'theme-and-logos'))} sx={{ padding: '2px' }} title="Open Theme and Logos">
                <OpenInNew style={{ fontSize: 13, color: '#686576' }} />
              </IconButton>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {background && (
                <img src={background.url} alt="" style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover' }} />
              )}
              <img src={bmwLogoSrc} alt="" style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'contain', background: '#f0f2f4' }} />
            </div>
          </div>
        </div>

        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', top: -44, right: 0, background: 'rgba(255,255,255,0.16)', color: '#ffffff', '&:hover': { background: 'rgba(255,255,255,0.24)' } }}
        >
          <Close />
        </IconButton>
      </div>

      {floatingSelection && (
        <FloatingCommentButton top={floatingSelection.top} left={floatingSelection.left} onClick={handleStartComment} />
      )}
    </div>,
    document.body,
  );
};
