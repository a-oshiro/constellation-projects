import { useRef } from 'react';
import { IconButton, Switch } from '@mui/material';
import { ChevronLeft, ChevronRight, TaskAlt } from '@mui/icons-material';
import type {
  AssetCommentAnchor, CreativeQcResult, DealQcOfferResult, Offer, QcFinding, ReviewStatus, Template,
} from '../../data/types';
import type { AlertAssetEntry } from '../../utils/overviewAssets';
import { CommentableAssetPreview, type AssetTextSelection } from './CommentableAssetPreview';
import { AssetStatusBadge } from './AlertApprovalWidgets';
import { AlertQcFindingCard, QC_FINDING_ICON } from './AlertQcFindingCard';
import { AlertCreativeQcSideCard } from './AlertCreativeQcSideCard';
import { AlertDealQcSideCard } from './AlertDealQcSideCard';
import { AlertAssetCarousel } from './AlertAssetCarousel';
import { FloatingCommentColumn, type ColumnEntry } from './FloatingCommentColumn';
import { QC_FINDING_LABEL } from '../../utils/alertReview';

/**
 * The dialog's main content: one asset shown at 600x600 (title + dimensions left-aligned above it), with
 * QC warning tags + their floating detail cards to the left, and a carousel of every other asset below —
 * replaces the old inline-email-canvas as the dialog's primary view. Comment-by-click/drag-highlight is
 * unchanged (same CommentableAssetPreview mechanism); this component just focuses it on one offer at a
 * time instead of stacking every offer's asset in a scrolling email.
 */

const FOCUS_SIZE = 600;

export const qcTagAnchorId = (key: string) => `qc-tag-${key}`;

interface DealQcContext {
  result: DealQcOfferResult;
  checkedAt: number;
  rulesetVersion: string;
}

interface AlertAssetFocusViewProps {
  offer: Offer;
  template: Template;
  backgroundUrl: string;
  title: string;
  dimensions: string;
  pins: { anchor: AssetCommentAnchor; commentId: string }[];
  pendingAnchor?: AssetCommentAnchor;
  activeAnchorId: string | null;
  onPinClick: (commentId: string) => void;
  registerAnchorRef: (commentId: string, el: HTMLElement | null) => void;
  /** The same map registerAnchorRef writes into — needed directly by FloatingCommentColumn to look up each comment's anchor element. */
  anchorRefsMap: React.RefObject<Map<string, HTMLElement>>;
  onCreatePin: (anchor: AssetCommentAnchor) => void;
  onTextSelected: (selection: AssetTextSelection | null) => void;
  approvalStatus: ReviewStatus;
  approvalDisabled?: boolean;
  onApprove: () => void;
  onReject: () => void;
  onUndo: () => void;
  onRequestPreview: () => void;
  onShowOfferCard: () => void;
  legacyFindings: QcFinding[];
  creativeQc?: CreativeQcResult;
  dealQc?: DealQcContext;
  activeSideCardKey: string | null;
  onToggleSideCard: (key: string) => void;
  sideCardRef: React.RefObject<HTMLDivElement | null>;
  /** The focused asset's own key — highlights its thumbnail in the carousel. */
  focusedKey: string;
  /** Every asset currently visible in the carousel, grouped by vehicle or by template (per `groupBy`) and
   * already filtered by the pending-only toggle. Empty groups are omitted. */
  carouselGroups: { label: string; entries: AlertAssetEntry[] }[];
  /** Whether the alert has more than one asset at all (unaffected by the pending-only filter) — controls whether the carousel section (and its toggle row) renders. */
  hasMultipleAssets: boolean;
  onSelectEntry: (key: string) => void;
  reviewForEntry: (entry: AlertAssetEntry) => ReviewStatus;
  groupBy: 'vehicle' | 'template';
  onChangeGroupBy: (groupBy: 'vehicle' | 'template') => void;
  pendingOnlyFilter: boolean;
  onTogglePendingOnlyFilter: () => void;
  onPrevAsset: () => void;
  onNextAsset: () => void;
  /** Whether any offer across the whole alert (not just the filtered carousel) is still unreviewed — controls the "Approve All Assets" button. */
  hasPendingAssets: boolean;
  onApproveAllAssets: () => void;
  // Asset-track comment thread (for the focused offer only) — rendered here, to the right of the asset.
  showComments: boolean;
  showResolved: boolean;
  commentEntries: ColumnEntry[];
  registerCommentRef: (id: string, el: HTMLDivElement | null) => void;
  onCancelPendingComment: () => void;
  onSendPendingComment: (text: string, mentionedNames: string[]) => void;
  onToggleResolved: (commentId: string) => void;
  onDeleteComment: (commentId: string) => void;
  onJumpToAnchor: (commentId: string) => void;
  onReply: (parentCommentId: string, text: string, mentionedNames: string[]) => void;
  onToggleReaction: (commentId: string, emoji: string) => void;
}

export const AlertAssetFocusView = ({
  offer, template, backgroundUrl, title, dimensions, pins, pendingAnchor, activeAnchorId, onPinClick,
  registerAnchorRef, anchorRefsMap, onCreatePin, onTextSelected, approvalStatus, approvalDisabled, onApprove, onReject, onUndo,
  onRequestPreview, onShowOfferCard, legacyFindings, creativeQc, dealQc, activeSideCardKey, onToggleSideCard,
  sideCardRef, focusedKey, carouselGroups, hasMultipleAssets, onSelectEntry, reviewForEntry, groupBy, onChangeGroupBy,
  pendingOnlyFilter, onTogglePendingOnlyFilter,
  onPrevAsset, onNextAsset, hasPendingAssets, onApproveAllAssets, showComments, showResolved, commentEntries,
  registerCommentRef, onCancelPendingComment, onSendPendingComment, onToggleResolved, onDeleteComment,
  onJumpToAnchor, onReply, onToggleReaction,
}: AlertAssetFocusViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const creativeHasWarning = !!creativeQc?.sections.some((s) => s.checks.some((c) => c.status === 'warning'));
  const dealHasMismatch = !!dealQc && dealQc.result.mismatchedFields.length > 0;

  const activeLegacyFinding = activeSideCardKey?.startsWith('legacy:')
    ? legacyFindings.find((f) => `legacy:${f.id}` === activeSideCardKey)
    : undefined;
  const showCreativeCard = activeSideCardKey === `creative:${offer.id}` && creativeQc;
  const showDealCard = activeSideCardKey === `deal:${offer.id}` && dealQc;
  const totalCarouselEntries = carouselGroups.reduce((n, g) => n + g.entries.length, 0);
  // Toggling "pending only" can hide the currently-focused asset entirely (it's reviewed and filtered
  // out) — rather than show a reviewed asset the carousel below no longer lists, swap in this message.
  const showAllReviewedMessage = pendingOnlyFilter && totalCarouselEntries === 0;
  const canStepAssets = totalCarouselEntries > 1;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {showAllReviewedMessage ? (
        <div style={{ width: FOCUS_SIZE, margin: '0 auto', minHeight: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, textAlign: 'center' }}>
          <TaskAlt style={{ fontSize: 32, color: '#4caf50' }} />
          <p style={{ margin: 0, fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25' }}>
            All assets reviewed.
          </p>
          <p style={{ margin: 0, fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#686576', maxWidth: 320 }}>
            Click on "Pending only" below to display reviewed assets.
          </p>
        </div>
      ) : (
      <>
      <div style={{ width: FOCUS_SIZE, margin: '0 auto' }}>
        <p style={{ margin: '0 0 2px', fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.1px' }}>
          {title}
        </p>
        <p style={{ margin: '0 0 12px', fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#686576', letterSpacing: '0.17px' }}>
          {dimensions}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      {canStepAssets && (
        <IconButton
          onClick={onPrevAsset}
          title="Previous asset"
          sx={{
            flexShrink: 0, width: 36, height: 36, background: '#ffffff',
            boxShadow: '0px 1px 5px rgba(0,0,0,0.12), 0px 2px 2px rgba(0,0,0,0.14)', '&:hover': { background: '#fafafa' },
          }}
        >
          <ChevronLeft style={{ fontSize: 20 }} />
        </IconButton>
      )}
      <div ref={containerRef} style={{ position: 'relative', width: FOCUS_SIZE }}>
      <div style={{ position: 'relative', width: FOCUS_SIZE, aspectRatio: `${template.width} / ${template.height}` }}>
        <CommentableAssetPreview
          offer={offer}
          template={template}
          backgroundUrl={backgroundUrl}
          pins={pins}
          pendingAnchor={pendingAnchor}
          activeAnchorId={activeAnchorId}
          onPinClick={onPinClick}
          registerAnchorRef={registerAnchorRef}
          onCreatePin={onCreatePin}
          onTextSelected={onTextSelected}
          onRequestPreview={onRequestPreview}
          onShowOfferCard={onShowOfferCard}
          approvalStatus={approvalStatus}
          approvalDisabled={approvalDisabled}
          onApprove={onApprove}
          onReject={onReject}
        />

        {approvalStatus !== 'pending' && (
          <AssetStatusBadge
            label={approvalStatus === 'approved' ? 'Approved' : 'Rejected'}
            disabled={approvalDisabled}
            onUndo={onUndo}
          />
        )}

        {(legacyFindings.length > 0 || creativeHasWarning || dealHasMismatch) && (
          <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 6, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
            {legacyFindings.map((finding) => {
              const FindingIcon = QC_FINDING_ICON[finding.type];
              const key = `legacy:${finding.id}`;
              const isActive = activeSideCardKey === key;
              return (
                <button
                  key={key}
                  ref={(el) => registerAnchorRef(qcTagAnchorId(key), el)}
                  onClick={(e) => { e.stopPropagation(); onToggleSideCard(key); }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', border: 'none',
                    background: '#FDF4EC', borderRadius: 8, padding: '3px 8px 3px 6px',
                    outline: isActive ? '2px solid #c45500' : 'none',
                  }}
                >
                  <FindingIcon style={{ fontSize: 14, color: '#c45500', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: '#c45500', letterSpacing: '0.4px', whiteSpace: 'nowrap', opacity: 0.75 }}>
                    {QC_FINDING_LABEL[finding.type]}
                  </span>
                </button>
              );
            })}
            {creativeHasWarning && (() => {
              const key = `creative:${offer.id}`;
              const isActive = activeSideCardKey === key;
              return (
                <button
                  key={key}
                  ref={(el) => registerAnchorRef(qcTagAnchorId(key), el)}
                  onClick={(e) => { e.stopPropagation(); onToggleSideCard(key); }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', border: 'none',
                    background: '#FDF4EC', borderRadius: 8, padding: '3px 8px 3px 6px',
                    outline: isActive ? '2px solid #c45500' : 'none',
                  }}
                >
                  <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: '#c45500', letterSpacing: '0.4px', whiteSpace: 'nowrap', opacity: 0.75 }}>
                    Creative QC
                  </span>
                </button>
              );
            })()}
            {dealHasMismatch && (() => {
              const key = `deal:${offer.id}`;
              const isActive = activeSideCardKey === key;
              return (
                <button
                  key={key}
                  ref={(el) => registerAnchorRef(qcTagAnchorId(key), el)}
                  onClick={(e) => { e.stopPropagation(); onToggleSideCard(key); }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', border: 'none',
                    background: '#FDF4EC', borderRadius: 8, padding: '3px 8px 3px 6px',
                    outline: isActive ? '2px solid #c45500' : 'none',
                  }}
                >
                  <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: '#c45500', letterSpacing: '0.4px', whiteSpace: 'nowrap', opacity: 0.75 }}>
                    Deal QC
                  </span>
                </button>
              );
            })()}
          </div>
        )}

        {(activeLegacyFinding || showCreativeCard || showDealCard) && (
          <div ref={sideCardRef}>
            {activeLegacyFinding && <AlertQcFindingCard finding={activeLegacyFinding} />}
            {showCreativeCard && creativeQc && <AlertCreativeQcSideCard result={creativeQc} />}
            {showDealCard && dealQc && (
              <AlertDealQcSideCard result={dealQc.result} checkedAt={dealQc.checkedAt} rulesetVersion={dealQc.rulesetVersion} />
            )}
          </div>
        )}
      </div>

      <FloatingCommentColumn
        entries={showComments ? commentEntries : []}
        anchorRefs={anchorRefsMap}
        containerRef={containerRef}
        left={FOCUS_SIZE + 24}
        activeAnchorId={activeAnchorId}
        showResolved={showResolved}
        pendingAnchor={pendingAnchor}
        onCancelPending={onCancelPendingComment}
        onSendPending={onSendPendingComment}
        onToggleResolved={onToggleResolved}
        onDeleteComment={onDeleteComment}
        onJumpToAnchor={(c) => onJumpToAnchor(c.id)}
        registerCommentRef={registerCommentRef}
        onReply={onReply}
        onToggleReaction={onToggleReaction}
      />
      </div>
      {canStepAssets && (
        <IconButton
          onClick={onNextAsset}
          title="Next asset"
          sx={{
            flexShrink: 0, width: 36, height: 36, background: '#ffffff',
            boxShadow: '0px 1px 5px rgba(0,0,0,0.12), 0px 2px 2px rgba(0,0,0,0.14)', '&:hover': { background: '#fafafa' },
          }}
        >
          <ChevronRight style={{ fontSize: 20 }} />
        </IconButton>
      )}
      </div>
      </>
      )}

      {hasMultipleAssets && (
        <div style={{ marginTop: 16, width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576' }}>Group by</span>
              <div style={{ display: 'inline-flex', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 100, padding: 2 }}>
                {([
                  { value: 'vehicle', label: 'Vehicle' },
                  { value: 'template', label: 'Template' },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onChangeGroupBy(opt.value)}
                    style={{
                      border: 'none', cursor: 'pointer', borderRadius: 100, padding: '3px 12px',
                      fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 500,
                      background: groupBy === opt.value ? '#473bab' : 'transparent',
                      color: groupBy === opt.value ? '#ffffff' : '#686576',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0 }}>
              <Switch
                size="small"
                checked={pendingOnlyFilter}
                onChange={onTogglePendingOnlyFilter}
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#473bab' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { background: '#473bab' } }}
              />
              <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576' }}>Pending only</span>
            </label>
          </div>
          <AlertAssetCarousel
            groups={carouselGroups}
            focusedKey={focusedKey}
            onSelect={onSelectEntry}
            reviewFor={reviewForEntry}
          />
        </div>
      )}
    </div>
  );
};
