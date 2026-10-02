import { useEffect, useRef, useState } from 'react';
import { IconButton, Switch } from '@mui/material';
import { ChevronLeft, ChevronRight, TaskAlt } from '@mui/icons-material';
import type { AssetCommentAnchor, Offer, ReviewStatus, Template } from '../../data/types';
import type { AlertAssetEntry } from '../../utils/overviewAssets';
import { CommentableAssetPreview, type AssetTextSelection } from './CommentableAssetPreview';
import { AssetStatusBadge } from './AlertApprovalWidgets';
import { QcTagList } from './QcTagList';
import { AlertAssetCarousel } from './AlertAssetCarousel';
import type { ColumnEntry } from './FloatingCommentColumn';
import { AssetCommentPopovers } from './AssetCommentPopovers';
import type { QcTag } from '../../utils/alertQc';

/**
 * The dialog's main content: one asset, contain-fit within an 800x600 box (shrunk further whenever the
 * stage is smaller, so the whole asset is always visible) while keeping the template's own proportions
 * (title + dimensions left-aligned above it), with its QC tags pinned top-left (clicking one opens the QC
 * warnings panel on that warning), and a carousel of every other asset below
 * — replaces the old inline-email-canvas as the dialog's primary view. Comment-by-click/drag-highlight is
 * unchanged (same CommentableAssetPreview mechanism); this component just focuses it on one offer at a
 * time instead of stacking every offer's asset in a scrolling email.
 *
 * The asset is always centered in the stage. Its comments open as boxes over the asset itself, next to
 * their pin/highlight (see AssetCommentPopovers), so they always stay within the preview area.
 */

const MAX_ASSET_WIDTH = 800;
const MAX_ASSET_HEIGHT = 600;
/** Width reserved by the flanking prev/next chevrons (36px button + 12px gap) on each side of the asset,
 * when they're rendered — the asset itself (not the chevrons) is what gets centered/shifted, so this offset
 * is subtracted back out when positioning the row that wraps both chevrons and the asset. */
const CHEVRON_SPACE = 48;
/** Duration + easing shared by every part of the carousel's open/close animation. */
const CAROUSEL_TRANSITION = '0.3s ease-in-out';



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
  onCreatePin: (anchor: AssetCommentAnchor) => void;
  onTextSelected: (selection: AssetTextSelection | null) => void;
  approvalStatus: ReviewStatus;
  approvalDisabled?: boolean;
  onApprove: () => void;
  onReject: () => void;
  onUndo: () => void;
  onRequestPreview: () => void;
  onShowOfferCard: () => void;
  /** The focused asset's QC tags (same list its Offer Card shows); clicking one opens the QC panel on it. */
  qcTags: QcTag[];
  /** The tag whose warning the open QC panel is focused on — outlined. */
  activeQcKey: string | null;
  onSelectQcTag: (tag: QcTag) => void;
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
  /** Whether the carousel section (group-by row + thumbnail strip) is expanded — visible by default,
   * collapsible via the toggle button just above it or the Shift+P shortcut. */
  showCarousel: boolean;
  onToggleShowCarousel: () => void;
  pendingOnlyFilter: boolean;
  onTogglePendingOnlyFilter: () => void;
  onPrevAsset: () => void;
  onNextAsset: () => void;
  /** Whether any offer across the whole alert (not just the filtered carousel) is still unreviewed — controls the "Approve All Assets" button. */
  hasPendingAssets: boolean;
  onApproveAllAssets: () => void;
  // Asset-track comment threads (for the focused asset only) — opened as boxes over the asset. While
  // `showComments` is off, neither the boxes nor the pins/highlights render (a pending draft still does).
  showComments: boolean;
  /** Comment ids whose boxes are open, in the order they were opened. */
  openCommentIds: string[];
  onCloseComment: (commentId: string) => void;
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
  registerAnchorRef, onCreatePin, onTextSelected, approvalStatus, approvalDisabled, onApprove, onReject, onUndo,
  onRequestPreview, onShowOfferCard, qcTags, activeQcKey, onSelectQcTag, focusedKey, carouselGroups, hasMultipleAssets, onSelectEntry, reviewForEntry, groupBy, onChangeGroupBy,
  showCarousel, onToggleShowCarousel, pendingOnlyFilter, onTogglePendingOnlyFilter,
  onPrevAsset, onNextAsset, hasPendingAssets, onApproveAllAssets, showComments, openCommentIds, onCloseComment, showResolved, commentEntries,
  registerCommentRef, onCancelPendingComment, onSendPendingComment, onToggleResolved, onDeleteComment,
  onJumpToAnchor, onReply, onToggleReaction,
}: AlertAssetFocusViewProps) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const [stageWidth, setStageWidth] = useState(0);
  const [stageHeight, setStageHeight] = useState(0);
  const [titleHeight, setTitleHeight] = useState(0);
  const [carouselToggleHovered, setCarouselToggleHovered] = useState(false);

  const totalCarouselEntries = carouselGroups.reduce((n, g) => n + g.entries.length, 0);
  // Toggling "pending only" can hide the currently-focused asset entirely (it's reviewed and filtered
  // out) — rather than show a reviewed asset the carousel below no longer lists, swap in this message.
  const showAllReviewedMessage = pendingOnlyFilter && totalCarouselEntries === 0;
  const canStepAssets = totalCarouselEntries > 1;
  const chevronSpace = canStepAssets ? CHEVRON_SPACE : 0;

  // The stage's size (and the title block above the asset) bound how large the asset may render. The
  // title block isn't always mounted (the "all reviewed" message replaces it), so it's observed when present.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const update = () => {
      setStageWidth(stage.clientWidth);
      setStageHeight(stage.clientHeight);
      setTitleHeight(titleRef.current?.offsetHeight ?? 0);
    };
    const ro = new ResizeObserver(update);
    ro.observe(stage);
    if (titleRef.current) ro.observe(titleRef.current);
    update();
    return () => ro.disconnect();
  }, [showAllReviewedMessage]);

  // Contain-fit the focused asset within an 800x600 box, preserving the template's own proportions — the
  // square template fills it at 600x600 (height-bound); every wider-than-tall template scales to fill the
  // full 800 width, capped at 600 tall if its aspect ratio is close to square. When the stage is smaller
  // than that (minus the flanking chevrons and the title block), the box shrinks to what's available so
  // the asset is never cut off. Before the first measurement the stage reports 0, so the max box is used.
  const fitWidth = stageWidth > 0 ? Math.min(MAX_ASSET_WIDTH, stageWidth - 2 * chevronSpace) : MAX_ASSET_WIDTH;
  const fitHeight = stageHeight > 0 ? Math.min(MAX_ASSET_HEIGHT, stageHeight - titleHeight) : MAX_ASSET_HEIGHT;
  const assetScale = Math.max(0, Math.min(fitWidth / template.width, fitHeight / template.height));
  const assetWidth = Math.round(template.width * assetScale);
  const assetHeight = Math.round(template.height * assetScale);

  // The asset is always centered in the stage.
  const assetLeft = (stageWidth - assetWidth) / 2;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* The "stage": the focused asset, centered both ways within whatever space is left above the
          carousel. Its own height never changes with the focused asset's aspect ratio (flex: 1 always
          consumes exactly the remaining space), so the carousel below never moves when a shorter/wider
          asset is focused. */}
      <div ref={stageRef} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'auto' }}>
      {showAllReviewedMessage ? (
        <div style={{ width: assetWidth, margin: '0 auto', minHeight: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, textAlign: 'center' }}>
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
      <div ref={titleRef} style={{ width: assetWidth, marginLeft: assetLeft, alignSelf: 'flex-start' }}>
        <p style={{ margin: '0 0 2px', fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.1px' }}>
          {title}
        </p>
        <p style={{ margin: '0 0 12px', fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#686576', letterSpacing: '0.17px' }}>
          {dimensions}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, alignSelf: 'flex-start', marginLeft: assetLeft - chevronSpace }}>
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
      <div style={{ position: 'relative', width: assetWidth, height: assetHeight }}>
        <CommentableAssetPreview
          assetKey={focusedKey}
          offer={offer}
          template={template}
          backgroundUrl={backgroundUrl}
          pins={showComments ? pins : []}
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

        <QcTagList
          tags={qcTags}
          activeKey={activeQcKey}
          onSelect={onSelectQcTag}
          style={{ position: 'absolute', top: 8, left: 8, zIndex: 6 }}
        />

        <AssetCommentPopovers
          width={assetWidth}
          height={assetHeight}
          entries={commentEntries}
          showResolved={showResolved}
          openIds={showComments ? openCommentIds : []}
          onCloseComment={onCloseComment}
          activeAnchorId={activeAnchorId}
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
      </div>

      {hasMultipleAssets && (
        <div style={{ flexShrink: 0, width: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* A 120x4 gray notch that morphs into a labelled pill on hover. The row stays a fixed 12px (the
              pill overflows it vertically) so nothing around it shifts while the notch grows; with the
              carousel hidden, the negative margin eats into the canvas's bottom padding so the notch sits
              near the canvas's bottom edge. */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 12, marginBottom: showCarousel ? 0 : -12, transition: `margin-bottom ${CAROUSEL_TRANSITION}` }}>
            <button
              onClick={onToggleShowCarousel}
              onMouseEnter={() => setCarouselToggleHovered(true)}
              onMouseLeave={() => setCarouselToggleHovered(false)}
              onFocus={() => setCarouselToggleHovered(true)}
              onBlur={() => setCarouselToggleHovered(false)}
              title={`${showCarousel ? 'Hide' : 'Reveal'} carousel (Shift+P)`}
              aria-label={showCarousel ? 'Hide carousel' : 'Reveal carousel'}
              style={{
                position: 'relative', zIndex: 1, flexShrink: 0,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                boxSizing: 'border-box', padding: 0, overflow: 'hidden', borderRadius: 100, border: 'none',
                background: '#cac9cf',
                width: carouselToggleHovered ? 136 : 120,
                height: carouselToggleHovered ? 28 : 4,
                transition: 'width 0.18s ease, height 0.18s ease',
              }}
            >
              <span
                style={{
                  fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#ffffff', whiteSpace: 'nowrap',
                  opacity: carouselToggleHovered ? 1 : 0, transition: 'opacity 0.12s ease',
                  transitionDelay: carouselToggleHovered ? '0.08s' : '0s',
                }}
              >
                {showCarousel ? 'Hide carousel' : 'Reveal carousel'}
              </span>
            </button>
          </div>
          {/* Always mounted so opening/closing can animate: the grid row eases between 0fr and 1fr (an
              auto-height transition) while the contents fade. Inert while closed so it can't be tabbed into. */}
          <div
            inert={!showCarousel}
            style={{
              display: 'grid', gridTemplateRows: showCarousel ? '1fr' : '0fr', marginTop: showCarousel ? 8 : 0,
              opacity: showCarousel ? 1 : 0,
              transition: `grid-template-rows ${CAROUSEL_TRANSITION}, margin-top ${CAROUSEL_TRANSITION}, opacity ${CAROUSEL_TRANSITION}`,
            }}
          >
            <div style={{ minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 8 }}>
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
          </div>
        </div>
      )}
    </div>
  );
};
