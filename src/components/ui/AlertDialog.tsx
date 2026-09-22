import { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { IconButton } from '@mui/material';
import {
  Close, HistoryOutlined, MoreVert, Send, ErrorOutlined, WarningAmberOutlined,
  MailOutlined, DirectionsCarOutlined, ImageOutlined, FactCheckOutlined,
} from '@mui/icons-material';
import type { AlertActivityEntry, Offer, ReviewStatus } from '../../data/types';
import type { Alert } from '../../data/types';
import { useProject } from '../../context/ProjectContext';
import { formatRelativeTime } from '../../utils/relativeTime';
import { backgroundForOffer } from '../../utils/overviewAssets';
import { CommentableAssetPreview } from './CommentableAssetPreview';
import { AlertOfferEditPanel } from './AlertOfferEditPanel';
import { AlertAssetPreviewModal } from './AlertAssetPreviewModal';
import { AlertEmailPreview } from './AlertEmailPreview';
import { ReviewFooter, ReviewStatusChip, ReviewVisibilityMenu } from './AlertApprovalWidgets';
import { AlertGenerationFailedState } from './AlertGenerationFailedState';
import { AlertQcFindingCard, QC_FINDING_ICON } from './AlertQcFindingCard';
import { AlertRecipientsPanel } from './AlertRecipientsPanel';
import { AlertOffersPanel, type OfferHighlightRequest } from './AlertOffersPanel';
import { AlertProjectSettingsPanel } from './AlertProjectSettingsPanel';
import { ProjectOverviewIcon } from './ProjectOverviewIcon';
import { Tooltip } from './Tooltip';
import { CATEGORY_STYLE, QC_FINDING_LABEL, REVIEW_DECISION_STYLE } from '../../utils/alertReview';

const tooltipPopperProps = { popper: { style: { zIndex: 100050 } } };

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

const REVIEW_PANEL_MIN_WIDTH = 400;
const REVIEW_PANEL_MAX_WIDTH = 600;
const REVIEW_PANEL_DEFAULT_WIDTH = 480;

// The History/Recipients/Enrollment Settings utility panels sit to the right of the Review panel, one at
// a time — each remembers its own resized width independently, starting from these defaults.
const UTILITY_PANEL_MIN_WIDTH = 250;
const UTILITY_PANEL_MAX_WIDTH = 900;
const HISTORY_PANEL_DEFAULT_WIDTH = 300;
const RECIPIENTS_PANEL_DEFAULT_WIDTH = 300;
const ENROLLMENT_PANEL_DEFAULT_WIDTH = 700;

const footerButtonBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer',
  borderRadius: 100, padding: '6px 16px', fontSize: 14, fontFamily: 'Roboto, sans-serif',
  fontWeight: 500, letterSpacing: '0.4px', lineHeight: '24px', flexShrink: 0,
};

interface AlertDialogProps {
  alert: Alert;
  onClose: () => void;
}

/** One button in the big right panel's vertical tab strip (Offers / Assets). */
const ReviewTabStripButton = ({
  icon: Icon, label, active, onClick,
}: { icon: React.ElementType; label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      border: 'none', borderRadius: 8, padding: '10px 4px', cursor: 'pointer',
      background: active ? 'rgba(99,86,225,0.08)' : 'transparent',
    }}
  >
    <Icon style={{ fontSize: 20, color: active ? '#473bab' : '#686576' }} />
    <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: active ? 500 : 400, color: active ? '#473bab' : '#686576', letterSpacing: '0.17px' }}>
      {label}
    </span>
  </button>
);

/** Drag-to-resize a panel's width, growing/shrinking within [min, max] as the pointer moves — `direction`
 * is 1 for a handle on the panel's right edge (dragging right grows it) or -1 for a handle on its left
 * edge (dragging left grows it). */
function useResizableWidth(defaultWidth: number, min: number, max: number) {
  const [width, setWidth] = useState(defaultWidth);
  const dragStateRef = useRef<{ startX: number; startWidth: number; direction: 1 | -1 } | null>(null);

  const startResize = (direction: 1 | -1) => (e: React.MouseEvent) => {
    e.preventDefault();
    dragStateRef.current = { startX: e.clientX, startWidth: width, direction };
    const onMouseMove = (ev: MouseEvent) => {
      const drag = dragStateRef.current;
      if (!drag) return;
      const delta = (ev.clientX - drag.startX) * drag.direction;
      setWidth(Math.min(max, Math.max(min, drag.startWidth + delta)));
    };
    const onMouseUp = () => {
      dragStateRef.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return { width, startResize };
}

/** The thin draggable strip between a resizable panel and its neighbor. `divider` keeps a permanent 1px
 * line down its center (for boundaries with no other visual separation, e.g. two white panels sitting
 * side by side) on top of the usual hover highlight. */
const ResizeHandle = ({ onMouseDown, divider }: { onMouseDown: (e: React.MouseEvent) => void; divider?: boolean }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative', width: 6, flexShrink: 0, cursor: 'col-resize', background: hovered ? 'rgba(71,59,171,0.2)' : 'transparent' }}
    >
      {divider && (
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(0,0,0,0.08)' }} />
      )}
    </div>
  );
};

/**
 * The single alert review dialog. The email preview is always the center canvas, building up as offers
 * and (mainly) assets are approved. Offer review and asset review run in parallel and both live in one
 * big, collapsible review panel (toggled via the canvas's "Reviews" button), switched via a vertical tab
 * strip — both tracks are available the moment the dialog opens. History, Recipients, and Enrollment
 * Settings open as a mutually-exclusive utility panel to the right of the review panel, triggered from
 * icons in the dialog header. Every panel's width is user-resizable by dragging its inner edge.
 */
export const AlertDialog = ({ alert, onClose }: AlertDialogProps) => {
  const {
    offers, currentProject, locked, setOfferReview, setAssetReview, sendAlert, regenerateAlert, setAlertRecipients,
    reorderAlertOffers,
  } = useProject();
  /** History/Recipients/Enrollment Settings — mutually exclusive, shown to the right of the (collapsible) Review panel. */
  const [utilityPanel, setUtilityPanel] = useState<'history' | 'recipients' | 'enrollmentSettings' | null>(null);
  /** The big Offers/Assets review panel is collapsible via the canvas's "Reviews" toggle — open by default. */
  const [reviewPanelOpen, setReviewPanelOpen] = useState(true);
  const [activeReviewTab, setActiveReviewTab] = useState<'offers' | 'assets'>('offers');
  const [showApprovedOffers, setShowApprovedOffers] = useState(true);
  const [showRejectedOffers, setShowRejectedOffers] = useState(true);
  const [showApprovedAssets, setShowApprovedAssets] = useState(true);
  const [showRejectedAssets, setShowRejectedAssets] = useState(true);
  const [assetsMenuAnchor, setAssetsMenuAnchor] = useState<HTMLElement | null>(null);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  /** Which editor the Offer Edit panel opens into — set alongside `editingOfferId` by whichever "Offer Card" row was clicked. */
  const [editingOfferView, setEditingOfferView] = useState<'vehicle' | 'offer'>('offer');
  const { width: reviewPanelWidth, startResize: startReviewResize } = useResizableWidth(REVIEW_PANEL_DEFAULT_WIDTH, REVIEW_PANEL_MIN_WIDTH, REVIEW_PANEL_MAX_WIDTH);
  // Each utility panel remembers its own width independently, so switching between them (or reopening
  // the same one later) keeps whatever the user last resized it to.
  const historyPanelResize = useResizableWidth(HISTORY_PANEL_DEFAULT_WIDTH, UTILITY_PANEL_MIN_WIDTH, UTILITY_PANEL_MAX_WIDTH);
  const recipientsPanelResize = useResizableWidth(RECIPIENTS_PANEL_DEFAULT_WIDTH, UTILITY_PANEL_MIN_WIDTH, UTILITY_PANEL_MAX_WIDTH);
  const enrollmentPanelResize = useResizableWidth(ENROLLMENT_PANEL_DEFAULT_WIDTH, UTILITY_PANEL_MIN_WIDTH, UTILITY_PANEL_MAX_WIDTH);
  const activeUtilityPanelResize = utilityPanel === 'history' ? historyPanelResize : utilityPanel === 'recipients' ? recipientsPanelResize : utilityPanel === 'enrollmentSettings' ? enrollmentPanelResize : null;
  const [previewOfferId, setPreviewOfferId] = useState<string | null>(null);
  /** Set by an asset's "Offer Info" button — switches to the Offers tab and scrolls/flashes that offer's
   * card there. `token` is a nonce so re-clicking the same asset's button retriggers the scroll/flash even
   * when `offerId` is unchanged. */
  const [highlightRequest, setHighlightRequest] = useState<OfferHighlightRequest | null>(null);
  const [activeQcFindingId, setActiveQcFindingId] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const qcCardRef = useRef<HTMLDivElement>(null);
  const anchorRefs = useRef<Map<string, HTMLElement>>(new Map());
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

  const findOffer = (id: string) => offers.find((o) => o.id === id);
  const featuredOfferSource = findOffer(alert.featuredOfferId);
  const otherOffersSource = alert.otherOfferIds.map(findOffer).filter((o): o is Offer => Boolean(o));
  const allAlertOffers = featuredOfferSource ? [featuredOfferSource, ...otherOffersSource] : otherOffersSource;

  // Generation-failed state: a hard failure blocks the normal preview entirely and disables every
  // approve/reject control. QC findings are a separate, non-blocking overlay on the normal view.
  const failure = alert.generationFailure;
  const qcFindings = alert.qcFindings ?? [];
  const qcFindingsForOffer = (offerId: string) => qcFindings.filter((f) => f.offerId === offerId);
  const activeQcFinding = activeQcFindingId ? qcFindings.find((f) => f.id === activeQcFindingId) : undefined;
  const qcCardAnchorId = (findingId: string) => `qc-tag-${findingId}`;

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

  const isFullyReviewed = alert.status === 'approved' || alert.status === 'sent';
  const isSent = alert.status === 'sent';
  const isArchived = !!alert.archivedAt;
  const reviewDisabled = isArchived || isSent || !!failure;

  const handleSend = () => { sendAlert(alert.id); onClose(); };
  const openUtilityPanel = (panel: 'history' | 'recipients' | 'enrollmentSettings') => {
    setEditingOfferId(null);
    setUtilityPanel((v) => (v === panel ? null : panel));
  };

  const editOffer = (offerId: string, view: 'vehicle' | 'offer') => {
    setEditingOfferId(offerId);
    setEditingOfferView(view);
  };
  // Switches to the Offers tab and scrolls/flashes the given offer's card there, revealing it first if a
  // show/hide toggle currently hides it. `token` just needs to change on every call (even for the same
  // offerId) so AlertOffersPanel's effect retriggers — a monotonically incrementing ref serves that with
  // no impure calls.
  const highlightTokenRef = useRef(0);
  const jumpToOffer = (offerId: string) => {
    const status = reviewFor(offerId);
    if (status === 'approved') setShowApprovedOffers(true);
    if (status === 'rejected') setShowRejectedOffers(true);
    setEditingOfferId(null);
    setActiveReviewTab('offers');
    highlightTokenRef.current += 1;
    setHighlightRequest({ offerId, token: highlightTokenRef.current });
  };

  // Clicking anywhere in the dialog other than the open QC finding card or the tag that opened it closes
  // it — the gray background, a different asset, or elsewhere in the dialog all count as "outside".
  const handleDialogClick = (e: React.MouseEvent) => {
    const target = e.target as Node;
    if (activeQcFindingId) {
      const insideCard = qcCardRef.current?.contains(target);
      const insideTag = anchorRefs.current.get(qcCardAnchorId(activeQcFindingId))?.contains(target);
      if (!insideCard && !insideTag) setActiveQcFindingId(null);
    }
  };

  // ── Offer Review track ──────────────────────────────────────────────────────────────────────────────
  const reviewFor = (offerId: string) => alert.offerReviews?.[offerId]?.status ?? 'pending';
  const isOfferVisible = (offerId: string) => {
    const status = reviewFor(offerId);
    if (status === 'approved') return showApprovedOffers;
    if (status === 'rejected') return showRejectedOffers;
    return true;
  };
  const pendingOffers = allAlertOffers.filter((o) => reviewFor(o.id) === 'pending');
  const offerEntries: { id: string; status: ReviewStatus }[] = allAlertOffers.map((o) => ({ id: o.id, status: reviewFor(o.id) }));
  const handleApproveRemainingOffers = () => { pendingOffers.forEach((o) => setOfferReview(alert.id, o.id, 'approved')); };
  const handleRejectOffer = (offerId: string) => { setOfferReview(alert.id, offerId, 'rejected'); };

  // ── Asset Review track ──────────────────────────────────────────────────────────────────────────────
  // An offer's asset is reviewable as soon as the alert exists (both tracks run in parallel) — a stage-1
  // rejection doesn't remove the asset from view, it auto-resolves it as Rejected instead (see below).
  const reviewableOffers = allAlertOffers.filter((o) => reviewFor(o.id) !== 'rejected');
  const assetReviewFor = (offerId: string) => alert.assetReviews?.[offerId];
  const isAssetAutoRejected = (offerId: string) => reviewFor(offerId) === 'rejected';
  const effectiveAssetStatus = (offerId: string): ReviewStatus => (isAssetAutoRejected(offerId) ? 'rejected' : (assetReviewFor(offerId)?.status ?? 'pending'));

  const visibleAssetOffers = allAlertOffers.filter((o) => {
    const status = effectiveAssetStatus(o.id);
    if (status === 'approved') return showApprovedAssets;
    if (status === 'rejected') return showRejectedAssets;
    return true;
  });
  const pendingAssetOffers = reviewableOffers.filter((o) => (assetReviewFor(o.id)?.status ?? 'pending') === 'pending');
  const assetEntries: { id: string; status: ReviewStatus }[] = reviewableOffers.map((o) => ({ id: o.id, status: assetReviewFor(o.id)?.status ?? 'pending' }));
  // Only approves assets that haven't been reviewed at all — an asset already Rejected is left alone,
  // since that decision has to be resolved individually (Approve / Undo on its own tile).
  const handleApproveRemainingAssets = () => { pendingAssetOffers.forEach((o) => setAssetReview(alert.id, o.id, 'approved')); };
  const handleAssetApprove = (offerId: string) => setAssetReview(alert.id, offerId, 'approved');
  const handleAssetReject = (offerId: string) => setAssetReview(alert.id, offerId, 'rejected');

  /** One offer's row in the Review Assets list — the generated creative, always-visible Approve/Reject
   * controls, QC findings, and (once decided) the compact status chip plus the green/red outline+tint. */
  const renderAssetTile = (offer: Offer) => {
    const bg = bgFor(offer);
    if (!template || !bg) return null;
    const status = effectiveAssetStatus(offer.id);
    const autoRejected = isAssetAutoRejected(offer.id);
    const decided = status !== 'pending';
    const findingsForThisOffer = qcFindingsForOffer(offer.id);

    return (
      <div
        key={offer.id}
        style={{
          position: 'relative', width: '100%', maxWidth: 400, aspectRatio: '1 / 1', flexShrink: 0, borderRadius: 8, overflow: 'hidden',
          ...(decided ? { outline: REVIEW_DECISION_STYLE[status].outline, outlineOffset: REVIEW_DECISION_STYLE[status].outlineOffset } : {}),
        }}
      >
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <CommentableAssetPreview
            offer={offer}
            template={template}
            backgroundUrl={bg.url}
            onRequestPreview={() => setPreviewOfferId(offer.id)}
            onShowOfferCard={() => { setActiveQcFindingId(null); jumpToOffer(offer.id); }}
            approvalStatus={status}
            approvalDisabled={reviewDisabled}
            onApprove={() => handleAssetApprove(offer.id)}
            onReject={() => handleAssetReject(offer.id)}
          />
          {decided && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none', background: REVIEW_DECISION_STYLE[status].background }} />
          )}
          {decided && (
            autoRejected ? (
              <div style={{ position: 'absolute', bottom: 8, right: 8, zIndex: 8 }}>
                <Tooltip title="Asset offer rejected" slotProps={tooltipPopperProps}>
                  <span><ReviewStatusChip status="rejected" disabled layout="static" /></span>
                </Tooltip>
              </div>
            ) : (
              <ReviewStatusChip status={status} disabled={reviewDisabled} onUndo={() => setAssetReview(alert.id, offer.id, 'pending')} />
            )
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
        {activeQcFinding && activeQcFinding.offerId === offer.id && (
          <div ref={qcCardRef} style={{ marginTop: 8 }}>
            <AlertQcFindingCard finding={activeQcFinding} />
          </div>
        )}
      </div>
    );
  };

  const editingOffer = editingOfferId ? offers.find((o) => o.id === editingOfferId) : undefined;
  const previewOffer = previewOfferId ? offers.find((o) => o.id === previewOfferId) : undefined;
  const previewBg = previewOffer ? bgFor(previewOffer) : undefined;
  const previewIndex = previewOffer ? visibleAssetOffers.findIndex((o) => o.id === previewOffer.id) : -1;
  const handlePreviewPrev = () => {
    if (visibleAssetOffers.length === 0 || previewIndex === -1) return;
    const nextIndex = (previewIndex - 1 + visibleAssetOffers.length) % visibleAssetOffers.length;
    setPreviewOfferId(visibleAssetOffers[nextIndex].id);
  };
  const handlePreviewNext = () => {
    if (visibleAssetOffers.length === 0 || previewIndex === -1) return;
    const nextIndex = (previewIndex + 1) % visibleAssetOffers.length;
    setPreviewOfferId(visibleAssetOffers[nextIndex].id);
  };
  // Deciding from the fullscreen modal closes it, returning to the list view.
  const handleModalApprove = () => { if (!previewOffer) return; handleAssetApprove(previewOffer.id); setPreviewOfferId(null); };
  const handleModalReject = () => { if (!previewOffer) return; handleAssetReject(previewOffer.id); setPreviewOfferId(null); };

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
          <span
            style={{
              display: 'inline-flex', alignItems: 'center', background: CATEGORY_STYLE[alert.category].background,
              color: CATEGORY_STYLE[alert.category].color, borderRadius: 8, padding: '2px 8px', fontSize: 11,
              fontFamily: 'Roboto, sans-serif', letterSpacing: '0.4px', whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            {alert.category}
          </span>
          <span style={{ flex: 1, minWidth: 0, fontSize: 15, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {alert.subject}
          </span>
          <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px', whiteSpace: 'nowrap' }}>
            {`Generated ${formatRelativeTime(alert.createdAt)} by AI AutoAgent`}
          </span>
          <IconButton size="small" onClick={() => openUtilityPanel('history')} title="History" sx={{ padding: '5px', background: utilityPanel === 'history' ? 'rgba(71,59,171,0.1)' : 'transparent' }}>
            <HistoryOutlined style={{ fontSize: 20, color: utilityPanel === 'history' ? '#473bab' : '#1f1d25' }} />
          </IconButton>
          <IconButton size="small" onClick={() => openUtilityPanel('recipients')} title="Recipients" sx={{ padding: '5px', background: utilityPanel === 'recipients' ? 'rgba(71,59,171,0.1)' : 'transparent' }}>
            <MailOutlined style={{ fontSize: 20, color: utilityPanel === 'recipients' ? '#473bab' : '#1f1d25' }} />
          </IconButton>
          <IconButton size="small" onClick={() => openUtilityPanel('enrollmentSettings')} title="Project Settings" sx={{ padding: '5px', background: utilityPanel === 'enrollmentSettings' ? 'rgba(71,59,171,0.1)' : 'transparent' }}>
            <ProjectOverviewIcon style={{ fontSize: 20, color: utilityPanel === 'enrollmentSettings' ? '#473bab' : '#1f1d25' }} />
          </IconButton>
          <IconButton size="small" onClick={onClose} sx={{ padding: '5px', background: 'rgba(17,16,20,0.08)', borderRadius: '100px' }}>
            <Close style={{ fontSize: 18, color: '#1f1d25' }} />
          </IconButton>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

            {/* Center canvas — the email preview, always visible, building up as offers/assets are approved */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
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

              {/* "Reviews" toggle — fixed to the email canvas's top-right corner (16px inset), a sibling of
                  the scrollable div below so it never scrolls with the email content. Shows/hides the big
                  Offers/Assets review panel. */}
              <div style={{ position: 'absolute', top: overlayTopOffset, right: 16, zIndex: 6 }}>
                <button
                  onClick={() => setReviewPanelOpen((v) => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, border: 'none', cursor: 'pointer', borderRadius: 8,
                    padding: '6px 12px', fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500,
                    background: reviewPanelOpen ? 'rgba(71,59,171,0.1)' : '#F4F5F6',
                    color: reviewPanelOpen ? '#473bab' : '#686576',
                  }}
                >
                  <FactCheckOutlined style={{ fontSize: 18 }} />
                  Reviews
                </button>
              </div>

              <div
                style={{
                  flex: 1, overflow: 'auto', background: '#F4F5F6', padding: '24px 16px',
                  ...(failure ? { display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}),
                }}
              >
                {failure ? (
                  <AlertGenerationFailedState failure={failure} onRegenerate={() => regenerateAlert(alert.id)} />
                ) : (
                  <AlertEmailPreview
                    alert={alert}
                    featuredOffer={emailPreviewFeatured}
                    otherOffers={emailPreviewOthers}
                    template={template}
                    accountName={currentProject.accountName}
                    bgFor={bgFor}
                    onReorderOtherOffers={reviewDisabled ? undefined : (next) => {
                      reorderAlertOffers(alert.id, reorderVisibleWithinFull(alert.otherOfferIds, next.map((o) => o.id)));
                    }}
                  />
                )}
              </div>
            </div>

            {/* Review panel — collapsible via the canvas's "Reviews" toggle. The vertical Offers/Assets tab
                strip is always visible while open; editing an offer only replaces the Review Offers
                content next to it, not the whole panel. */}
            {reviewPanelOpen && (
            <>
            <ResizeHandle onMouseDown={startReviewResize(-1)} />
            <div style={{ width: reviewPanelWidth, flexShrink: 0, display: 'flex', overflow: 'hidden' }}>
              <nav style={{ width: 72, flexShrink: 0, borderRight: '1px solid rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', gap: 4, padding: '16px 8px' }}>
                <ReviewTabStripButton icon={DirectionsCarOutlined} label="Offers" active={activeReviewTab === 'offers'} onClick={() => { setEditingOfferId(null); setActiveReviewTab('offers'); }} />
                <ReviewTabStripButton icon={ImageOutlined} label="Assets" active={activeReviewTab === 'assets'} onClick={() => { setEditingOfferId(null); setActiveReviewTab('assets'); }} />
              </nav>

              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {editingOffer && !projectLocked ? (
                  <AlertOfferEditPanel
                    key={`${editingOffer.id}-${editingOfferView}`}
                    offer={editingOffer}
                    initialView={editingOfferView}
                    onBack={() => setEditingOfferId(null)}
                    onClose={() => setEditingOfferId(null)}
                    onFocusAsset={() => {}}
                  />
                ) : (
                  <>
                    {activeReviewTab === 'offers' ? (
                      <AlertOffersPanel
                        offers={allAlertOffers}
                        projectOffers={currentProject.offers}
                        locked={!!projectLocked}
                        onEditOffer={editOffer}
                        highlightRequest={highlightRequest}
                        reviewStatusFor={reviewFor}
                        approvalDisabled={reviewDisabled}
                        onApproveOffer={(id) => setOfferReview(alert.id, id, 'approved')}
                        onRejectOffer={handleRejectOffer}
                        onUndoOfferReview={(id) => setOfferReview(alert.id, id, 'pending')}
                        isOfferVisible={isOfferVisible}
                        showApproved={showApprovedOffers}
                        showRejected={showRejectedOffers}
                        onToggleShowApproved={() => setShowApprovedOffers((v) => !v)}
                        onToggleShowRejected={() => setShowRejectedOffers((v) => !v)}
                        onClosePanel={() => setReviewPanelOpen(false)}
                      />
                    ) : (
                      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
                          <span style={{ flex: 1, fontSize: 15, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25' }}>Review Assets</span>
                          <IconButton size="small" onClick={(e) => setAssetsMenuAnchor(e.currentTarget)} sx={{ padding: '4px' }}>
                            <MoreVert style={{ fontSize: 20, color: '#686576' }} />
                          </IconButton>
                          <ReviewVisibilityMenu
                            anchorEl={assetsMenuAnchor}
                            onClose={() => setAssetsMenuAnchor(null)}
                            showApproved={showApprovedAssets}
                            showRejected={showRejectedAssets}
                            onToggleShowApproved={() => setShowApprovedAssets((v) => !v)}
                            onToggleShowRejected={() => setShowRejectedAssets((v) => !v)}
                          />
                          <IconButton size="small" onClick={() => setReviewPanelOpen(false)} title="Close" sx={{ padding: '4px' }}>
                            <Close style={{ fontSize: 18, color: '#686576' }} />
                          </IconButton>
                        </div>

                        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                          {template && hasBackgrounds && visibleAssetOffers.length > 0 ? (
                            visibleAssetOffers.map(renderAssetTile)
                          ) : (
                            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0', color: '#686576', fontSize: 13, fontFamily: 'Roboto, sans-serif', textAlign: 'center' }}>
                              Nothing to show — use the menu above to reveal approved or rejected assets.
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Footer — plain bar, not a floating widget: reviewed count on the left, Approve All (or the completion message) on the right */}
                    <div style={{ flexShrink: 0, padding: '12px 16px', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                      {activeReviewTab === 'offers' ? (
                        <ReviewFooter
                          kind="offers"
                          items={offerEntries}
                          disabled={reviewDisabled}
                          onApproveAll={handleApproveRemainingOffers}
                        />
                      ) : (
                        <ReviewFooter
                          kind="assets"
                          items={assetEntries}
                          disabled={reviewDisabled}
                          disabledReason={failure ? DISABLED_TOOLTIP_REASON : undefined}
                          onApproveAll={handleApproveRemainingAssets}
                        />
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
            </>
            )}

            {/* Utility panel — History, Recipients, or Enrollment Settings: mutually exclusive, resizable,
                always to the right of the Review panel (or of the email canvas, if that panel is closed). */}
            {utilityPanel && activeUtilityPanelResize && (
              <>
                <ResizeHandle onMouseDown={activeUtilityPanelResize.startResize(-1)} divider />
                <div style={{ width: activeUtilityPanelResize.width, flexShrink: 0, overflow: 'hidden', display: 'flex' }}>
                  {utilityPanel === 'history' ? (
                    <div style={{ width: '100%', overflowY: 'auto', padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <span style={{ fontSize: 15, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25' }}>Alert Activity History</span>
                        <IconButton size="small" onClick={() => setUtilityPanel(null)} sx={{ padding: '4px' }}>
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
                  ) : utilityPanel === 'recipients' ? (
                    <AlertRecipientsPanel
                      recipients={recipients}
                      onChange={(next) => setAlertRecipients(alert.id, next)}
                      onClose={() => setUtilityPanel(null)}
                    />
                  ) : (
                    <AlertProjectSettingsPanel
                      project={currentProject}
                      onClose={() => setUtilityPanel(null)}
                    />
                  )}
                </div>
              </>
            )}
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

      {previewOffer && template && previewBg && (
        <AlertAssetPreviewModal
          key={previewOffer.id}
          offer={previewOffer}
          template={template}
          backgroundUrl={previewBg.url}
          onClose={() => setPreviewOfferId(null)}
          approvalStatus={effectiveAssetStatus(previewOffer.id)}
          approvalDisabled={reviewDisabled}
          autoRejectedByOffer={isAssetAutoRejected(previewOffer.id)}
          onApprove={handleModalApprove}
          onReject={handleModalReject}
          onUndo={() => setAssetReview(alert.id, previewOffer.id, 'pending')}
          currentIndex={previewIndex}
          totalCount={visibleAssetOffers.length}
          onPrev={handlePreviewPrev}
          onNext={handlePreviewNext}
        />
      )}
    </>,
    document.body,
  );
};

/** Reorders the subsequence of `fullIds` that appears in `visibleReorderedIds`, in the order given, while
 * leaving every id not currently visible (and therefore not part of the reorder) in its existing slot. */
function reorderVisibleWithinFull(fullIds: string[], visibleReorderedIds: string[]): string[] {
  const visibleSet = new Set(visibleReorderedIds);
  let cursor = 0;
  return fullIds.map((id) => (visibleSet.has(id) ? visibleReorderedIds[cursor++] : id));
}
