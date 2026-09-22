import { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { IconButton, Menu, Switch } from '@mui/material';
import {
  Close, HistoryOutlined, MoreVert, Send, ErrorOutlined, WarningAmberOutlined, ModeCommentOutlined,
  MailOutlined, DirectionsCarOutlined, ImageOutlined, DraftsOutlined, CheckCircleOutlined, DeleteOutlined,
} from '@mui/icons-material';
import type { Alert, AlertActivityEntry, AlertComment, AssetCommentAnchor, Offer, OfferReviewEntry, ReviewStatus } from '../../data/types';
import { useProject } from '../../context/ProjectContext';
import { formatRelativeTime } from '../../utils/relativeTime';
import { backgroundForOffer } from '../../utils/overviewAssets';
import { scrollElementIntoViewCentered } from '../../utils/smoothScroll';
import { useResponsivePanelWidth } from '../../hooks/useResponsivePanelWidth';
import { FloatingCommentButton } from './AlertHighlightableText';
import { CommentableAssetPreview } from './CommentableAssetPreview';
import { FloatingCommentColumn, type ColumnEntry } from './FloatingCommentColumn';
import { AlertOfferEditPanel } from './AlertOfferEditPanel';
import { AlertAssetPreviewModal } from './AlertAssetPreviewModal';
import { AlertAssetCarousel } from './AlertAssetCarousel';
import { AlertEmailPreview } from './AlertEmailPreview';
import { ApprovalWidget, AssetStatusBadge } from './AlertApprovalWidgets';
import { AlertGenerationFailedState } from './AlertGenerationFailedState';
import { AlertQcFindingCard, QC_FINDING_ICON } from './AlertQcFindingCard';
import { AlertRecipientsPanel } from './AlertRecipientsPanel';
import { AlertOffersPanel, type OfferHighlightRequest } from './AlertOffersPanel';
import { AlertProjectSettingsPanel } from './AlertProjectSettingsPanel';
import { OfferReviewCard } from './OfferReviewCard';
import { ProjectOverviewIcon } from './ProjectOverviewIcon';
import { CATEGORY_STYLE, QC_FINDING_LABEL } from '../../utils/alertReview';

const ACTION_LABEL: Record<AlertActivityEntry['action'], string> = {
  generated: 'Generated',
  offers_reviewed: 'Offers Reviewed',
  assets_approved: 'Assets Approved',
  assets_rejected: 'Assets Changes Requested',
  rebuilt: 'Rebuilt',
  regenerated: 'Regenerated',
  sent: 'Sent',
  archived: 'Archived',
};

const DISABLED_TOOLTIP_REASON = 'Alert generation failed. Regenerate Alert to proceed with review.';

/** The main canvas's fixed content width — used both by the review canvases and, centered within it, the (narrower) email preview, so the floating comment column's right-margin math stays simple. */
const CONTENT_WIDTH = 700;
/** Email Preview panel's fixed width — wider than the other right panels so the 520px-wide email content (see `AlertEmailPreview`) isn't cramped. */
const EMAIL_PANEL_WIDTH = 520;

const footerButtonBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer',
  borderRadius: 100, padding: '6px 16px', fontSize: 14, fontFamily: 'Roboto, sans-serif',
  fontWeight: 500, letterSpacing: '0.4px', lineHeight: '24px', flexShrink: 0,
};

interface AlertDialogProps {
  alert: Alert;
  onClose: () => void;
}

/** One tab button in the left rail — icon, label, and a "N of M reviewed" subtitle. */
const ReviewTabButton = ({
  icon: Icon, label, subtitle, active, onClick,
}: { icon: React.ElementType; label: string; subtitle: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
      border: 'none', cursor: 'pointer', borderRadius: 8, padding: '10px 12px',
      background: active ? 'rgba(71,59,171,0.08)' : 'transparent',
    }}
  >
    <Icon style={{ fontSize: 20, color: active ? '#473bab' : '#686576', flexShrink: 0 }} />
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, gap: 2 }}>
      <span style={{ fontSize: 13, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: active ? '#473bab' : '#1f1d25', letterSpacing: '0.1px' }}>
        {label}
      </span>
      <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px' }}>
        {subtitle}
      </span>
    </div>
  </button>
);

/** Icon button toggling whether already-decided (approved/removed) items stay hidden from their canvas — replaces the old expand/collapse accordion. */
const ReviewVisibilityToggle = ({
  icon: Icon, active, showLabel, hideLabel, onClick,
}: { icon: React.ElementType; active: boolean; showLabel: string; hideLabel: string; onClick: () => void }) => (
  <IconButton
    size="small"
    onClick={onClick}
    title={active ? hideLabel : showLabel}
    sx={{ width: 30, height: 30, padding: 0, background: active ? 'rgba(71,59,171,0.1)' : 'transparent' }}
  >
    <Icon style={{ fontSize: 18, color: active ? '#473bab' : '#686576' }} />
  </IconButton>
);

/** Reorders the subsequence of `fullIds` that appears in `visibleReorderedIds`, in the order given, while
 * leaving every id not currently visible (and therefore not part of the reorder) in its existing slot. */
function reorderVisibleWithinFull(fullIds: string[], visibleReorderedIds: string[]): string[] {
  const visibleSet = new Set(visibleReorderedIds);
  let cursor = 0;
  return fullIds.map((id) => (visibleSet.has(id) ? visibleReorderedIds[cursor++] : id));
}

/**
 * The single alert review dialog: offer review and asset review now run in parallel (both are generated
 * together), so this dialog no longer gates one behind the other. A left-rail tab switcher lets the user
 * move between the Offer Review canvas and the Asset Review canvas at any time; the Email Preview is
 * available as a right panel throughout, building up as offers/assets are approved, and the Send footer
 * appears once both tracks are fully approved.
 */
export const AlertDialog = ({ alert, onClose }: AlertDialogProps) => {
  const {
    offers, currentProject, locked, setOfferReview, setAssetReview, sendAlert, regenerateAlert, setAlertRecipients,
    reorderAlertOffers, addAlertComment, toggleAlertCommentResolved, deleteAlertComment, toggleAlertCommentReaction,
  } = useProject();
  const [activeTab, setActiveTab] = useState<'offers' | 'assets'>('offers');
  const [rightPanel, setRightPanel] = useState<'history' | 'recipients' | 'offers' | 'projectSettings' | 'emailPreview' | null>(null);
  const [showComments, setShowComments] = useState(true);
  const [showResolved, setShowResolved] = useState(false);
  const [showApprovedOffers, setShowApprovedOffers] = useState(false);
  const [showRemovedOffers, setShowRemovedOffers] = useState(false);
  const [showApprovedAssets, setShowApprovedAssets] = useState(false);
  const [showRemovedAssets, setShowRemovedAssets] = useState(false);
  const [selectedAssetOfferId, setSelectedAssetOfferId] = useState<string | null>(null);
  const [commentsMenuAnchor, setCommentsMenuAnchor] = useState<HTMLElement | null>(null);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  /** Which editor the Offer Edit panel opens into — set alongside `editingOfferId` by whichever "Offer Card" row was clicked. */
  const [editingOfferView, setEditingOfferView] = useState<'vehicle' | 'offer'>('offer');
  const panelWidth = useResponsivePanelWidth();
  const [previewOfferId, setPreviewOfferId] = useState<string | null>(null);
  /** Set by an asset's "Offer Info" button — opens the Alert Offers panel on the Selected tab and
   * scrolls/flashes that offer's card there. `token` is a nonce so re-clicking the same asset's button
   * retriggers the scroll/flash even when `offerId` is unchanged. */
  const [highlightRequest, setHighlightRequest] = useState<OfferHighlightRequest | null>(null);
  const [activeQcFindingId, setActiveQcFindingId] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const qcCardRef = useRef<HTMLDivElement>(null);

  // Margin commenting (Asset Review only): a pin the user just created but hasn't sent a comment for yet,
  // and the id of a comment whose pin was just clicked (or vice versa) for a brief jump/emphasis.
  const [pendingAnchor, setPendingAnchor] = useState<AssetCommentAnchor | undefined>(undefined);
  const [activeAnchorId, setActiveAnchorId] = useState<string | null>(null);
  const [floatingSelection, setFloatingSelection] = useState<{ top: number; left: number; anchor: AssetCommentAnchor } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const commentRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const anchorRefs = useRef<Map<string, HTMLElement>>(new Map());
  const registerCommentRef = (id: string, el: HTMLDivElement | null) => {
    if (el) commentRefs.current.set(id, el); else commentRefs.current.delete(id);
  };
  const registerAnchorRef = (id: string, el: HTMLElement | null) => {
    if (el) anchorRefs.current.set(id, el); else anchorRefs.current.delete(id);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (previewOfferId) { setPreviewOfferId(null); return; }
      if (editingOfferId) { setEditingOfferId(null); return; }
      onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, previewOfferId, editingOfferId]);

  // Bidirectional jump/emphasis: scroll both the comment card and its pin into view, then clear the
  // emphasis after a beat — no new dependency, just scrollIntoView + a timed state reset.
  useEffect(() => {
    if (!activeAnchorId) return;
    commentRefs.current.get(activeAnchorId)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    anchorRefs.current.get(activeAnchorId)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    const t = setTimeout(() => setActiveAnchorId(null), 1500);
    return () => clearTimeout(t);
  }, [activeAnchorId]);

  const findOffer = (id: string) => offers.find((o) => o.id === id);
  const featuredOffer = findOffer(alert.featuredOfferId);
  const otherOffers = alert.otherOfferIds.map(findOffer).filter((o): o is Offer => Boolean(o));
  const allAlertOffers = featuredOffer ? [featuredOffer, ...otherOffers] : otherOffers;
  // Offers and assets are reviewed in parallel now — every offer's asset is reviewable as soon as the
  // alert exists, not gated behind a stage-1 decision. Only a stage-1 rejection removes an offer's asset
  // from Asset Review (and from the email) entirely.
  const reviewableOffers = allAlertOffers.filter((o) => alert.offerReviews?.[o.id]?.status !== 'rejected');

  // Generation-failed state: a hard failure blocks the normal preview entirely and disables every
  // approve/request-changes control. QC findings are a separate, non-blocking overlay on the normal view.
  const failure = alert.generationFailure;
  const qcFindings = alert.qcFindings ?? [];
  const qcFindingsForOffer = (offerId: string) => qcFindings.filter((f) => f.offerId === offerId);
  const activeQcFinding = activeQcFindingId ? qcFindings.find((f) => f.id === activeQcFindingId) : undefined;
  const qcCardAnchorId = (findingId: string) => `qc-tag-${findingId}`;

  // Banner takes priority over the Recipients/comments controls' usual top-left/top-right slot — when
  // visible, those get pushed down below it instead of overlapping.
  const bannerVisible = !bannerDismissed && (!!failure || qcFindings.length > 0);
  const overlayTopOffset = bannerVisible ? 64 : 16;

  // Recipients: persisted once the user edits them; otherwise a plausible default drawn from the account name.
  const accountSlug = currentProject.accountName.toLowerCase().replace(/[^a-z0-9]+/g, '');
  const recipients = alert.recipients ?? ['marketing', 'sales', 'gm', 'advertising'].map((h) => `${h}@${accountSlug}.com`);

  const template = currentProject.templates[0];
  const hasBackgrounds = currentProject.backgrounds.length > 0;
  const bgFor = (o: Offer) => backgroundForOffer(o, offers, currentProject.backgrounds);
  const projectLocked = currentProject.isEvergreen && locked;

  const historyEntries = [...alert.activity].reverse();

  // 'approved' means both review tracks are fully approved ("Approved and Sent" in the Kanban).
  const isFullyReviewed = alert.status === 'approved' || alert.status === 'sent';
  const isSent = alert.status === 'sent';
  const isArchived = !!alert.archivedAt;
  const disabled = isArchived || isSent;

  const handleSend = () => { sendAlert(alert.id); onClose(); };
  // The right panel is mutually exclusive: opening History/Recipients/Offers/Project Settings/Email
  // Preview cancels an in-progress offer edit, and (via onEditOffer below) starting an offer edit closes
  // whichever of these was open.
  const openRightPanel = (panel: 'history' | 'recipients' | 'offers' | 'projectSettings' | 'emailPreview') => {
    setEditingOfferId(null);
    setRightPanel((v) => (v === panel ? null : panel));
  };
  // Scrolls the Offer Review canvas to `offerId`'s card (if currently mounted) and makes it the Asset
  // Review canvas's large preview — whichever tab the user is on, editing/jumping to an offer keeps both
  // canvases in sync so switching tabs lands on the right item.
  const handleSelectAsset = (offerId: string) => {
    setSelectedAssetOfferId(offerId);
    const container = scrollContainerRef.current;
    const target = anchorRefs.current.get(offerCardAnchorId(offerId));
    if (container && target) scrollElementIntoViewCentered(container, target);
  };
  const editOffer = (offerId: string, view: 'vehicle' | 'offer') => {
    setEditingOfferId(offerId);
    setEditingOfferView(view);
    setRightPanel(null);
    // Scroll the canvas so the offer being edited is visible — lets the user watch their edits land on
    // the asset while they make them.
    handleSelectAsset(offerId);
  };
  // Opens the Alert Offers panel (always, never toggling it closed) on the offer's card, per the canvas
  // asset's "Offer Info" button. `token` just needs to change on every call (even for the same offerId) so
  // AlertOffersPanel's effect retriggers — a monotonically incrementing ref serves that with no impure calls.
  const highlightTokenRef = useRef(0);
  const showOfferInOffersPanel = (offerId: string) => {
    setEditingOfferId(null);
    setRightPanel('offers');
    highlightTokenRef.current += 1;
    setHighlightRequest({ offerId, token: highlightTokenRef.current });
  };

  const allComments = alert.comments ?? [];
  // A resolved comment's pin is hidden from the asset unless "Show Resolved" is on — the comment *card*
  // itself still respects this independently inside FloatingCommentColumn.
  const highlightableComments = allComments.filter((c) => showResolved || !c.resolved);

  /** Every comment anchored to one offer's asset (plus their replies), regardless of resolved state — used by the preview modal, which always shows its full history. */
  const commentsForOffer = (offerId: string): AlertComment[] => {
    const anchored = allComments.filter((c): c is AlertComment & { anchor: AssetCommentAnchor } => c.anchor?.kind === 'asset' && c.anchor.offerId === offerId);
    const anchoredIds = new Set(anchored.map((c) => c.id));
    const replies = allComments.filter((c) => c.parentCommentId && anchoredIds.has(c.parentCommentId));
    return [...anchored, ...replies];
  };

  /** Same, but respecting the resolved-pin visibility rule — used for the inline pin overlay. */
  const pinsForOffer = (offerId: string) =>
    highlightableComments
      .filter((c): c is AlertComment & { anchor: AssetCommentAnchor } => c.anchor?.kind === 'asset' && c.anchor.offerId === offerId)
      .map((c) => ({ anchor: c.anchor, commentId: c.id }));

  const columnEntries: ColumnEntry[] = allComments
    .filter((c) => !c.parentCommentId)
    .map((c) => ({
      id: c.id,
      comment: c,
      replies: allComments.filter((r) => r.parentCommentId === c.id),
    }));

  const handleAnchorClick = (commentId: string) => setActiveAnchorId(commentId);

  const handleStartComment = () => {
    if (!floatingSelection) return;
    setPendingAnchor(floatingSelection.anchor);
    setFloatingSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleSendComment = (text: string, mentionedNames: string[]) => {
    if (!pendingAnchor) return;
    addAlertComment(alert.id, 'assets', { text, mentionedNames, anchor: pendingAnchor });
    setPendingAnchor(undefined);
    setShowComments(true);
  };

  const offerCardAnchorId = (offerId: string) => `offer-card-${offerId}`;

  // Clicking anywhere in the dialog other than the open QC finding card or the tag that opened it closes
  // it — the gray background, a different asset, or elsewhere in the canvas all count as "outside".
  const handleDialogClick = (e: React.MouseEvent) => {
    const target = e.target as Node;

    if (activeQcFindingId) {
      const insideCard = qcCardRef.current?.contains(target);
      const insideTag = anchorRefs.current.get(qcCardAnchorId(activeQcFindingId))?.contains(target);
      if (!insideCard && !insideTag) setActiveQcFindingId(null);
    }
  };

  const assetReviewFor = (offerId: string) => alert.assetReviews?.[offerId];

  /** One offer's large-preview content in the Asset Review carousel — the generated creative plus the
   * same hover Approve/Reject-or-Remove controls `CommentableAssetPreview` already provides, QC findings,
   * and comment pins. Only ever invoked for the carousel's currently-selected offer. */
  const renderAssetTile = (offer: Offer) => {
    const bg = bgFor(offer);
    if (!template || !bg) return null;
    const pins = pinsForOffer(offer.id);
    const pendingForThis = pendingAnchor?.offerId === offer.id ? pendingAnchor : undefined;
    const reviewEntry = assetReviewFor(offer.id);
    const approvalStatus = reviewEntry?.status ?? 'pending';
    const findingsForThisOffer = qcFindingsForOffer(offer.id);

    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <CommentableAssetPreview
          offer={offer}
          template={template}
          backgroundUrl={bg.url}
          pins={pins}
          pendingAnchor={pendingForThis}
          activeAnchorId={activeAnchorId}
          onPinClick={handleAnchorClick}
          registerAnchorRef={registerAnchorRef}
          onCreatePin={(anchor) => { setPendingAnchor(anchor); setFloatingSelection(null); }}
          onTextSelected={setFloatingSelection}
          onRequestPreview={() => setPreviewOfferId(offer.id)}
          onShowOfferCard={() => { setActiveQcFindingId(null); showOfferInOffersPanel(offer.id); }}
          approvalStatus={approvalStatus}
          approvalDisabled={isArchived}
          onApprove={() => setAssetReview(alert.id, offer.id, 'approved')}
          onReject={() => setAssetReview(alert.id, offer.id, 'rejected')}
        />
        {reviewEntry && (
          <AssetStatusBadge
            label={reviewEntry.status === 'approved' ? 'Approved' : 'Removed'}
            actorName={reviewEntry.actorName}
            timestamp={reviewEntry.timestamp}
            disabled={isArchived}
            onUndo={() => setAssetReview(alert.id, offer.id, 'pending')}
          />
        )}
        {findingsForThisOffer.length > 0 && (
          <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 6, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
            {findingsForThisOffer.map((finding) => {
              const FindingIcon = QC_FINDING_ICON[finding.type];
              const isActive = activeQcFindingId === finding.id;
              return (
                <button
                  key={finding.id}
                  ref={(el) => registerAnchorRef(qcCardAnchorId(finding.id), el)}
                  onClick={(e) => { e.stopPropagation(); setActiveQcFindingId((id) => (id === finding.id ? null : finding.id)); }}
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
          </div>
        )}
      </div>
    );
  };

  const editingOffer = editingOfferId ? offers.find((o) => o.id === editingOfferId) : undefined;
  const previewOffer = previewOfferId ? offers.find((o) => o.id === previewOfferId) : undefined;
  const previewBg = previewOffer ? bgFor(previewOffer) : undefined;

  // ── Offer Review track ──────────────────────────────────────────────────────────────────────────────
  const reviewFor = (offerId: string) => alert.offerReviews?.[offerId]?.status ?? 'pending';
  const visibleOffers = allAlertOffers.filter((o) => {
    const status = reviewFor(o.id);
    if (status === 'approved') return showApprovedOffers;
    if (status === 'rejected') return showRemovedOffers;
    return true;
  });
  const offersDecidedCount = allAlertOffers.filter((o) => reviewFor(o.id) !== 'pending').length;
  const pendingOffers = allAlertOffers.filter((o) => reviewFor(o.id) === 'pending');
  const offerEntries: { id: string; status: ReviewStatus }[] = allAlertOffers.map((o) => ({ id: o.id, status: reviewFor(o.id) }));
  const approvedOfferEntries = allAlertOffers
    .map((o) => alert.offerReviews?.[o.id])
    .filter((e): e is OfferReviewEntry => !!e && e.status === 'approved');
  const rejectedOfferEntries = allAlertOffers
    .map((o) => alert.offerReviews?.[o.id])
    .filter((e): e is OfferReviewEntry => !!e && e.status === 'rejected');
  const offerApproverNames = [...new Set(approvedOfferEntries.map((e) => e.actorName))];
  const lastOfferApprovedTimestamp = approvedOfferEntries.length
    ? Math.max(...approvedOfferEntries.map((e) => e.timestamp))
    : undefined;
  const lastOfferRejectedEntry = rejectedOfferEntries.length
    ? rejectedOfferEntries.reduce((latest, e) => (e.timestamp > latest.timestamp ? e : latest))
    : undefined;
  const handleApproveRemainingOffers = () => { pendingOffers.forEach((o) => setOfferReview(alert.id, o.id, 'approved')); };
  const handleUndoAllOfferReviews = () => { allAlertOffers.forEach((o) => setOfferReview(alert.id, o.id, 'pending')); };
  // Jumping to an offer via the widget reveals it first (if hidden by a toggle), then scrolls to it once
  // it's actually mounted.
  const handleSelectOffer = (offerId: string) => {
    const status = reviewFor(offerId);
    if (status === 'approved') setShowApprovedOffers(true);
    if (status === 'rejected') setShowRemovedOffers(true);
    requestAnimationFrame(() => handleSelectAsset(offerId));
  };

  // ── Asset Review track ──────────────────────────────────────────────────────────────────────────────
  const visibleAssetOffers = reviewableOffers.filter((o) => {
    const status = assetReviewFor(o.id)?.status ?? 'pending';
    if (status === 'approved') return showApprovedAssets;
    if (status === 'rejected') return showRemovedAssets;
    return true;
  });
  const assetsDecidedCount = reviewableOffers.filter((o) => (assetReviewFor(o.id)?.status ?? 'pending') !== 'pending').length;
  const pendingAssetOffers = reviewableOffers.filter((o) => (assetReviewFor(o.id)?.status ?? 'pending') === 'pending');

  const assetEntries: { id: string; status: ReviewStatus }[] = reviewableOffers.map((o) => ({ id: o.id, status: assetReviewFor(o.id)?.status ?? 'pending' }));
  const approvedAssetEntries = reviewableOffers
    .map((o) => assetReviewFor(o.id))
    .filter((e): e is OfferReviewEntry => !!e && e.status === 'approved');
  const rejectedAssetEntries = reviewableOffers
    .map((o) => assetReviewFor(o.id))
    .filter((e): e is OfferReviewEntry => !!e && e.status === 'rejected');
  const approverNames = [...new Set(approvedAssetEntries.map((e) => e.actorName))];
  const lastApprovedTimestamp = approvedAssetEntries.length
    ? Math.max(...approvedAssetEntries.map((e) => e.timestamp))
    : undefined;
  const lastRejectedEntry = rejectedAssetEntries.length
    ? rejectedAssetEntries.reduce((latest, e) => (e.timestamp > latest.timestamp ? e : latest))
    : undefined;

  const handleUndoAllAssetReviews = () => {
    reviewableOffers.forEach((o) => setAssetReview(alert.id, o.id, 'pending'));
  };
  // Only approves assets that haven't been reviewed at all — an asset already Removed is left alone,
  // since that decision has to be resolved individually (Approve / Undo on its own tile).
  const handleApproveRemainingAssets = () => {
    pendingAssetOffers.forEach((o) => setAssetReview(alert.id, o.id, 'approved'));
  };
  const handleSelectAssetFromWidget = (offerId: string) => {
    const status = assetReviewFor(offerId)?.status ?? 'pending';
    if (status === 'approved') setShowApprovedAssets(true);
    if (status === 'rejected') setShowRemovedAssets(true);
    setSelectedAssetOfferId(offerId);
  };

  const effectiveSelectedAssetId = selectedAssetOfferId && visibleAssetOffers.some((o) => o.id === selectedAssetOfferId)
    ? selectedAssetOfferId
    : visibleAssetOffers[0]?.id ?? null;

  // Carousel within the enlarged asset preview — steps through reviewableOffers in order, wrapping at the ends.
  const previewIndex = previewOffer ? reviewableOffers.findIndex((o) => o.id === previewOffer.id) : -1;
  const handlePreviewPrev = () => {
    if (reviewableOffers.length === 0 || previewIndex === -1) return;
    const nextIndex = (previewIndex - 1 + reviewableOffers.length) % reviewableOffers.length;
    setPreviewOfferId(reviewableOffers[nextIndex].id);
  };
  const handlePreviewNext = () => {
    if (reviewableOffers.length === 0 || previewIndex === -1) return;
    const nextIndex = (previewIndex + 1) % reviewableOffers.length;
    setPreviewOfferId(reviewableOffers[nextIndex].id);
  };

  const handleReply = (parentCommentId: string, text: string, mentionedNames: string[]) => {
    addAlertComment(alert.id, 'assets', { text, mentionedNames, parentCommentId });
    setShowComments(true);
  };
  const handleToggleReaction = (commentId: string, emoji: string) => toggleAlertCommentReaction(alert.id, commentId, emoji);

  // The email builds up from whichever offers have had their asset approved so far; once every asset is
  // approved (or the alert has been sent), every reviewable offer qualifies.
  const emailPreviewOffers = isFullyReviewed ? reviewableOffers : reviewableOffers.filter((o) => assetReviewFor(o.id)?.status === 'approved');
  const emailPreviewFeatured = emailPreviewOffers.find((o) => o.id === alert.featuredOfferId);
  const emailPreviewOthers = emailPreviewOffers.filter((o) => o.id !== alert.featuredOfferId);

  return ReactDOM.createPortal(
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 100000, background: 'rgba(0,0,0,0.4)' }}
      />
      <div
        onClick={handleDialogClick}
        style={{
          position: 'fixed', inset: 16, zIndex: 100001,
          background: '#ffffff', borderRadius: 16, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0px 8px 40px 8px rgba(0,0,0,0.14), 0px 20px 30px 4px rgba(0,0,0,0.12), 0px 10px 12px -6px rgba(0,0,0,0.2)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }}>
          <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {alert.subject}
          </span>
          <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px', whiteSpace: 'nowrap' }}>
            {`Generated ${formatRelativeTime(alert.createdAt)} by AI AutoAgent`}
          </span>
          <IconButton size="small" onClick={() => openRightPanel('history')} sx={{ padding: '5px', background: rightPanel === 'history' ? 'rgba(71,59,171,0.1)' : 'transparent' }}>
            <HistoryOutlined style={{ fontSize: 20, color: rightPanel === 'history' ? '#473bab' : '#1f1d25' }} />
          </IconButton>
          <IconButton size="small" onClick={onClose} sx={{ padding: '5px', background: 'rgba(17,16,20,0.08)', borderRadius: '100px' }}>
            <Close style={{ fontSize: 18, color: '#1f1d25' }} />
          </IconButton>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

            {/* Left rail — alert type/reasoning, and the Offer Review / Asset Review tab switcher */}
            <div style={{ width: 280, flexShrink: 0, borderRight: '1px solid rgba(0,0,0,0.08)', overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <span
                  style={{
                    display: 'inline-flex', alignItems: 'center', background: CATEGORY_STYLE[alert.category].background,
                    color: CATEGORY_STYLE[alert.category].color, borderRadius: 8, padding: '2px 8px', fontSize: 11,
                    fontFamily: 'Roboto, sans-serif', letterSpacing: '0.4px', whiteSpace: 'nowrap', marginBottom: 12,
                  }}
                >
                  Alert Type: {alert.category}
                </span>
                <p style={{ margin: 0, fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px', lineHeight: 1.5 }}>
                  {alert.reasoning}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <ReviewTabButton
                  icon={DirectionsCarOutlined}
                  label="Offer Review"
                  subtitle={`${offersDecidedCount} of ${allAlertOffers.length} offers reviewed`}
                  active={activeTab === 'offers'}
                  onClick={() => setActiveTab('offers')}
                />
                <ReviewTabButton
                  icon={ImageOutlined}
                  label="Asset Review"
                  subtitle={`${assetsDecidedCount} of ${reviewableOffers.length} assets reviewed`}
                  active={activeTab === 'assets'}
                  onClick={() => setActiveTab('assets')}
                />
              </div>
            </div>

            {/* Main content: the active tab's canvas, with a floating comment column during asset review.
                position:relative here (not on the scrollable div below) so the toolbar/approval widget —
                placed as siblings of the scrollable div, not descendants of it — stay pinned in the corner
                instead of scrolling with the canvas's content. */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

              {/* Generic error/warning banner — pinned inside the gray preview area, 16px from the top/left/
                  right edges. Red for a hard generation failure (with a Regenerate Alert action), amber for
                  non-blocking QC findings (advisory only, no action). Dismissible; resets each time the dialog
                  is (re)opened since bannerDismissed lives in local state. */}
              {bannerVisible && (
                <div
                  style={{
                    position: 'absolute', top: 16, left: 16, right: 16, zIndex: 7,
                    display: 'flex', alignItems: 'flex-start', gap: 8, padding: '12px 16px', borderRadius: 4,
                    background: failure ? '#FDEDED' : '#FFF4E5', color: failure ? '#5f2120' : '#663C00',
                  }}
                >
                  {failure
                    ? <ErrorOutlined style={{ fontSize: 22, flexShrink: 0 }} />
                    : <WarningAmberOutlined style={{ fontSize: 22, flexShrink: 0 }} />}
                  <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontFamily: 'Roboto, sans-serif', letterSpacing: '0.17px', lineHeight: 1.43 }}>
                    {failure ? (
                      <>
                        Failed alert generation. Please attempt to{' '}
                        <button
                          onClick={() => regenerateAlert(alert.id)}
                          style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', font: 'inherit', color: 'inherit', fontWeight: 700, textDecoration: 'underline' }}
                        >
                          Regenerate Alert
                        </button>
                        . If the error persists, contact the Product team.
                      </>
                    ) : (
                      <>
                        This Alert contains <b>{qcFindings.length} QC Finding{qcFindings.length === 1 ? '' : 's'}.</b> These are <b>advisory only</b> – you may still approve and send this Alert forward.
                      </>
                    )}
                  </span>
                  <IconButton size="small" onClick={() => setBannerDismissed(true)} sx={{ padding: '4px', flexShrink: 0 }}>
                    <Close style={{ fontSize: 16, color: 'inherit' }} />
                  </IconButton>
                </div>
              )}

              <div
                ref={scrollContainerRef}
                style={{
                  flex: 1, overflow: 'auto', background: '#F4F5F6', padding: '24px 16px', position: 'relative',
                  ...(failure ? { display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}),
                }}
              >
                <div ref={contentRef} style={{ position: 'relative', width: CONTENT_WIDTH, margin: '0 auto' }}>
                  {failure ? (
                    <AlertGenerationFailedState failure={failure} onRegenerate={() => regenerateAlert(alert.id)} />
                  ) : activeTab === 'offers' ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 16 }}>
                        <ReviewVisibilityToggle
                          icon={CheckCircleOutlined}
                          active={showApprovedOffers}
                          showLabel="Show Approved Offers"
                          hideLabel="Hide Approved Offers"
                          onClick={() => setShowApprovedOffers((v) => !v)}
                        />
                        <ReviewVisibilityToggle
                          icon={DeleteOutlined}
                          active={showRemovedOffers}
                          showLabel="Show Removed Offers"
                          hideLabel="Hide Removed Offers"
                          onClick={() => setShowRemovedOffers((v) => !v)}
                        />
                      </div>

                      {visibleOffers.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                          {visibleOffers.map((offer) => (
                            <div key={offer.id} ref={(el) => registerAnchorRef(offerCardAnchorId(offer.id), el)}>
                              <OfferReviewCard
                                offer={offer}
                                locked={!!projectLocked}
                                approvalStatus={reviewFor(offer.id)}
                                approvalDisabled={disabled}
                                onEditVehicle={() => editOffer(offer.id, 'vehicle')}
                                onEditOffer={() => editOffer(offer.id, 'offer')}
                                onApprove={() => setOfferReview(alert.id, offer.id, 'approved')}
                                onReject={() => setOfferReview(alert.id, offer.id, 'rejected')}
                                onUndo={() => setOfferReview(alert.id, offer.id, 'pending')}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0', color: '#686576', fontSize: 13, fontFamily: 'Roboto, sans-serif' }}>
                          Nothing to show — use the buttons above to reveal approved or removed offers.
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 16 }}>
                        <ReviewVisibilityToggle
                          icon={CheckCircleOutlined}
                          active={showApprovedAssets}
                          showLabel="Show Approved Assets"
                          hideLabel="Hide Approved Assets"
                          onClick={() => setShowApprovedAssets((v) => !v)}
                        />
                        <ReviewVisibilityToggle
                          icon={DeleteOutlined}
                          active={showRemovedAssets}
                          showLabel="Show Removed Assets"
                          hideLabel="Hide Removed Assets"
                          onClick={() => setShowRemovedAssets((v) => !v)}
                        />
                      </div>

                      {template && hasBackgrounds && visibleAssetOffers.length > 0 ? (
                        <>
                          <AlertAssetCarousel
                            offers={visibleAssetOffers}
                            selectedOfferId={effectiveSelectedAssetId}
                            onSelect={setSelectedAssetOfferId}
                            template={template}
                            bgFor={bgFor}
                            renderLarge={renderAssetTile}
                          />
                          {activeQcFinding && activeQcFinding.offerId === effectiveSelectedAssetId && (
                            <div ref={qcCardRef} style={{ marginTop: 12 }}>
                              <AlertQcFindingCard finding={activeQcFinding} />
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0', color: '#686576', fontSize: 13, fontFamily: 'Roboto, sans-serif' }}>
                          Nothing to show — use the buttons above to reveal approved or removed assets.
                        </div>
                      )}

                      <FloatingCommentColumn
                        entries={showComments ? columnEntries : []}
                        anchorRefs={anchorRefs}
                        containerRef={contentRef}
                        left={CONTENT_WIDTH + 24}
                        activeAnchorId={activeAnchorId}
                        showResolved={showResolved}
                        pendingAnchor={pendingAnchor}
                        onCancelPending={() => setPendingAnchor(undefined)}
                        onSendPending={handleSendComment}
                        onToggleResolved={(commentId) => toggleAlertCommentResolved(alert.id, commentId)}
                        onDeleteComment={(commentId) => deleteAlertComment(alert.id, commentId)}
                        onJumpToAnchor={(c) => setActiveAnchorId(c.id)}
                        registerCommentRef={registerCommentRef}
                        onReply={handleReply}
                        onToggleReaction={handleToggleReaction}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Project Settings/Recipients/Offers/Email Preview/Comments controls — pinned top-right of
                  the canvas, a sibling of the scrollable div (not a descendant of it) so it stays fixed in
                  the corner instead of scrolling with the canvas's content. Hidden while generation failed:
                  there's nothing to act on. Available from either tab (per CP-13922); only the comments
                  toggle stays specific to Asset Review, since comments anchor to asset previews. */}
              {!failure && (
              <div style={{
                position: 'absolute', top: overlayTopOffset, right: 16, zIndex: 6, display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(244,245,246,0.9)', backdropFilter: 'blur(4px)', borderRadius: 8, padding: '4px 8px',
              }}>
                <IconButton
                  size="small"
                  onClick={() => openRightPanel('projectSettings')}
                  title="Project Settings"
                  sx={{ width: 30, height: 30, padding: 0, background: rightPanel === 'projectSettings' ? 'rgba(71,59,171,0.1)' : 'transparent' }}
                >
                  <ProjectOverviewIcon style={{ fontSize: 20, color: rightPanel === 'projectSettings' ? '#473bab' : '#1f1d25' }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => openRightPanel('recipients')}
                  sx={{ width: 30, height: 30, padding: 0, background: rightPanel === 'recipients' ? 'rgba(71,59,171,0.1)' : 'transparent' }}
                >
                  <MailOutlined style={{ fontSize: 20, color: rightPanel === 'recipients' ? '#473bab' : '#1f1d25' }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => openRightPanel('offers')}
                  title="Offers"
                  sx={{ width: 30, height: 30, padding: 0, background: rightPanel === 'offers' ? 'rgba(71,59,171,0.1)' : 'transparent' }}
                >
                  <DirectionsCarOutlined style={{ fontSize: 20, color: rightPanel === 'offers' ? '#473bab' : '#1f1d25' }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => openRightPanel('emailPreview')}
                  title="Email Preview"
                  sx={{ width: 30, height: 30, padding: 0, background: rightPanel === 'emailPreview' ? 'rgba(71,59,171,0.1)' : 'transparent' }}
                >
                  <DraftsOutlined style={{ fontSize: 20, color: rightPanel === 'emailPreview' ? '#473bab' : '#1f1d25' }} />
                </IconButton>
                {activeTab === 'assets' && (
                  <>
                    <IconButton
                      size="small"
                      onClick={() => setShowComments((v) => !v)}
                      title={showComments ? 'Hide comments' : 'Show comments'}
                      sx={{ width: 30, height: 30, padding: 0, background: showComments ? 'rgba(71,59,171,0.1)' : 'transparent', '&:hover': { background: 'rgba(0,0,0,0.04)' } }}
                    >
                      <ModeCommentOutlined style={{ fontSize: 18, color: showComments ? '#473bab' : '#1f1d25' }} />
                    </IconButton>
                    <IconButton size="small" onClick={(e) => setCommentsMenuAnchor(e.currentTarget)} sx={{ width: 30, height: 30, padding: 0 }}>
                      <MoreVert style={{ fontSize: 20, color: '#686576' }} />
                    </IconButton>
                    <Menu
                      anchorEl={commentsMenuAnchor}
                      open={!!commentsMenuAnchor}
                      onClose={() => setCommentsMenuAnchor(null)}
                      sx={{ zIndex: 100050 }}
                    >
                      <div
                        onClick={() => setShowResolved((v) => !v)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', cursor: 'pointer' }}
                      >
                        <Switch
                          size="small"
                          checked={showResolved}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => setShowResolved((v) => !v)}
                          sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#473bab' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { background: '#473bab' } }}
                        />
                        <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>Show resolved comments</span>
                      </div>
                    </Menu>
                  </>
                )}
              </div>
              )}

              {/* Floating approval widget — pinned bottom-right of the canvas, one per tab. A sibling of
                  the scrollable canvas div above (not a descendant of it), so it stays fixed in the corner
                  instead of scrolling with the canvas's content. */}
              {!failure && (
                <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10 }}>
                  {activeTab === 'offers' ? (
                    <ApprovalWidget
                      kind="offers"
                      items={offerEntries}
                      approverNames={offerApproverNames}
                      lastApprovedTimestamp={lastOfferApprovedTimestamp}
                      lastRejectedActorName={lastOfferRejectedEntry?.actorName}
                      lastRejectedTimestamp={lastOfferRejectedEntry?.timestamp}
                      disabled={disabled}
                      onApproveRemaining={handleApproveRemainingOffers}
                      onUndoAllReviews={handleUndoAllOfferReviews}
                      onSelectItem={handleSelectOffer}
                    />
                  ) : (
                    <ApprovalWidget
                      kind="assets"
                      items={assetEntries}
                      approverNames={approverNames}
                      lastApprovedTimestamp={lastApprovedTimestamp}
                      lastRejectedActorName={lastRejectedEntry?.actorName}
                      lastRejectedTimestamp={lastRejectedEntry?.timestamp}
                      disabled={disabled}
                      disabledReason={failure ? DISABLED_TOOLTIP_REASON : undefined}
                      onApproveRemaining={handleApproveRemainingAssets}
                      onUndoAllReviews={handleUndoAllAssetReviews}
                      onSelectItem={handleSelectAssetFromWidget}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Right panel — Activity History, Recipients, Offers, Email Preview, Project Settings, or the offer editor: mutually exclusive */}
            {editingOffer && !projectLocked ? (
              <AlertOfferEditPanel
                key={`${editingOffer.id}-${editingOfferView}`}
                offer={editingOffer}
                initialView={editingOfferView}
                onBack={() => { setEditingOfferId(null); setRightPanel('offers'); }}
                onClose={() => setEditingOfferId(null)}
                onFocusAsset={() => handleSelectAsset(editingOffer.id)}
              />
            ) : rightPanel === 'history' ? (
              <div style={{ width: panelWidth, flexShrink: 0, borderLeft: '1px solid rgba(0,0,0,0.08)', overflowY: 'auto', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25' }}>Alert Activity History</span>
                  <IconButton size="small" onClick={() => setRightPanel(null)} sx={{ padding: '4px' }}>
                    <Close style={{ fontSize: 16, color: '#686576' }} />
                  </IconButton>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {historyEntries.map((entry) => (
                    <div key={entry.id}>
                      <p style={{ margin: 0, fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#9c99a9', letterSpacing: '0.4px' }}>
                        {formatRelativeTime(entry.timestamp)}
                      </p>
                      <p style={{ margin: '2px 0 4px', fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25' }}>
                        {ACTION_LABEL[entry.action]}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {entry.actorAvatar && (
                          <img src={entry.actorAvatar} alt="" style={{ width: 18, height: 18, borderRadius: '50%' }} />
                        )}
                        <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px' }}>
                          by {entry.actorEmail ?? entry.actorName}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : rightPanel === 'recipients' ? (
              <AlertRecipientsPanel
                recipients={recipients}
                onChange={(next) => setAlertRecipients(alert.id, next)}
                onClose={() => setRightPanel(null)}
              />
            ) : rightPanel === 'offers' ? (
              <AlertOffersPanel
                offers={allAlertOffers}
                projectOffers={currentProject.offers}
                locked={!!projectLocked}
                onEditOffer={editOffer}
                onClose={() => setRightPanel(null)}
                highlightRequest={highlightRequest}
              />
            ) : rightPanel === 'emailPreview' ? (
              <div style={{ width: EMAIL_PANEL_WIDTH, flexShrink: 0, borderLeft: '1px solid rgba(0,0,0,0.08)', overflowY: 'auto', padding: 16, background: '#F4F5F6' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25' }}>Email Preview</span>
                  <IconButton size="small" onClick={() => setRightPanel(null)} sx={{ padding: '4px' }}>
                    <Close style={{ fontSize: 16, color: '#686576' }} />
                  </IconButton>
                </div>
                <AlertEmailPreview
                  alert={alert}
                  featuredOffer={emailPreviewFeatured}
                  otherOffers={emailPreviewOthers}
                  template={template}
                  accountName={currentProject.accountName}
                  bgFor={bgFor}
                  onReorderOtherOffers={disabled ? undefined : (next) => {
                    reorderAlertOffers(alert.id, reorderVisibleWithinFull(alert.otherOfferIds, next.map((o) => o.id)));
                  }}
                />
              </div>
            ) : rightPanel === 'projectSettings' ? (
              <AlertProjectSettingsPanel
                project={currentProject}
                onClose={() => setRightPanel(null)}
              />
            ) : null}
          </div>

          {/* Footer — appears once every offer and every asset is approved, offering the final Send action */}
          {alert.status === 'approved' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16, padding: '10px 16px', borderTop: '1px solid rgba(0,0,0,0.08)', flexShrink: 0, background: '#ffffff' }}>
              <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#686576' }}>Offers and Assets fully reviewed • Ready to Send</span>
              <button onClick={onClose} style={{ ...footerButtonBase, background: 'transparent', color: '#473bab', border: '1px solid rgba(99,86,225,0.5)' }}>
                Cancel
              </button>
              <button
                disabled={isArchived}
                onClick={handleSend}
                style={{ ...footerButtonBase, background: '#473bab', color: '#ffffff', opacity: isArchived ? 0.5 : 1, cursor: isArchived ? 'not-allowed' : 'pointer' }}
              >
                <Send style={{ fontSize: 16 }} />
                Send
              </button>
            </div>
          )}
          {isSent && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16, padding: '10px 16px', borderTop: '1px solid rgba(0,0,0,0.08)', flexShrink: 0, background: '#ffffff' }}>
              <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#686576' }}>Offers and Assets fully reviewed • Sent</span>
              <button onClick={onClose} style={{ ...footerButtonBase, background: 'transparent', color: '#473bab', border: '1px solid rgba(99,86,225,0.5)' }}>
                Close
              </button>
            </div>
          )}
        </div>
      </div>

      {floatingSelection && (
        <FloatingCommentButton top={floatingSelection.top} left={floatingSelection.left} onClick={handleStartComment} />
      )}

      {previewOffer && template && previewBg && (
        <AlertAssetPreviewModal
          key={previewOffer.id}
          offer={previewOffer}
          template={template}
          backgroundUrl={previewBg.url}
          background={previewBg}
          projectId={currentProject.id}
          locked={!!projectLocked}
          comments={commentsForOffer(previewOffer.id)}
          activeAnchorId={activeAnchorId}
          onClose={() => setPreviewOfferId(null)}
          onAddComment={(text, mentionedNames, anchor) => { addAlertComment(alert.id, 'assets', { text, mentionedNames, anchor }); setShowComments(true); }}
          onToggleResolved={(commentId) => toggleAlertCommentResolved(alert.id, commentId)}
          onDeleteComment={(commentId) => deleteAlertComment(alert.id, commentId)}
          onAnchorClick={handleAnchorClick}
          onEditOffer={(view) => editOffer(previewOffer.id, view)}
          onReply={handleReply}
          onToggleReaction={handleToggleReaction}
          approvalStatus={assetReviewFor(previewOffer.id)?.status ?? 'pending'}
          approvalDisabled={isArchived || isSent}
          reviewActorName={assetReviewFor(previewOffer.id)?.actorName}
          reviewTimestamp={assetReviewFor(previewOffer.id)?.timestamp}
          onApprove={() => setAssetReview(alert.id, previewOffer.id, 'approved')}
          onReject={() => setAssetReview(alert.id, previewOffer.id, 'rejected')}
          onUndo={() => setAssetReview(alert.id, previewOffer.id, 'pending')}
          currentIndex={previewIndex}
          totalCount={reviewableOffers.length}
          onPrev={handlePreviewPrev}
          onNext={handlePreviewNext}
        />
      )}
    </>,
    document.body,
  );
};
