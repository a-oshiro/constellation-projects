import { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { IconButton, Menu, Switch } from '@mui/material';
import {
  Close, HistoryOutlined, MoreVert, Send, AddComment, ErrorOutlined, WarningAmberOutlined, ModeCommentOutlined,
  MailOutlined, DirectionsCarOutlined, ChevronRight,
} from '@mui/icons-material';
import type { Alert, AlertActivityEntry, AlertCommentAnchor, AssetCommentAnchor, EmailCommentAnchor, Offer } from '../../data/types';
import { useProject } from '../../context/ProjectContext';
import { formatRelativeTime } from '../../utils/relativeTime';
import { backgroundForOffer } from '../../utils/overviewAssets';
import { useResponsivePanelWidth } from '../../hooks/useResponsivePanelWidth';
import { useResizableWidth } from '../../hooks/useResizableWidth';
import { FloatingCommentButton, PENDING_ANCHOR_ID } from './AlertHighlightableText';
import type { ColumnEntry } from './FloatingCommentColumn';
import { AlertOfferEditPanel } from './AlertOfferEditPanel';
import { AlertAssetDetailsDialog } from './AlertAssetDetailsDialog';
import { AlertAssetFocusView, qcTagAnchorId } from './AlertAssetFocusView';
import { AlertGenerationFailedState } from './AlertGenerationFailedState';
import { AlertEmailPreviewPanel } from './AlertEmailPreviewPanel';
import { AssetsFooterWidget, EmailFooterWidget } from './AlertFooterWidgets';
import { AlertQcPanel } from './AlertQcPanel';
import { AlertOffersPanel, type OfferHighlightRequest } from './AlertOffersPanel';
import { AlertProjectSettingsPanel } from './AlertProjectSettingsPanel';
import { ProjectOverviewIcon } from './ProjectOverviewIcon';

const ACTION_LABEL: Record<AlertActivityEntry['action'], string> = {
  generated: 'Generated',
  email_approved: 'Email Approved',
  email_rejected: 'Email Rejected',
  assets_approved: 'Assets Approved',
  assets_rejected: 'Assets Rejected',
  rebuilt: 'Rebuilt',
  regenerated: 'Regenerated',
  sent: 'Sent',
  archived: 'Archived',
};

const DISABLED_TOOLTIP_REASON = 'Alert generation failed. Regenerate Alert to proceed with review.';

const footerButtonBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer',
  borderRadius: 100, padding: '6px 16px', fontSize: 14, fontFamily: 'Roboto, sans-serif',
  fontWeight: 500, letterSpacing: '0.4px', lineHeight: '24px', flexShrink: 0,
};

/** Shared shape for a not-yet-committed drag-selection, whether it came from the email body (an EmailCommentAnchor) or an asset creative (an AssetCommentAnchor). */
interface FloatingSelection {
  top: number;
  left: number;
  anchor: AlertCommentAnchor;
}

interface AlertDialogProps {
  alert: Alert;
  onClose: () => void;
}

export const AlertDialog = ({ alert, onClose }: AlertDialogProps) => {
  const {
    offers, currentProject, locked, setEmailReview, setOfferAssetReview, sendAlert, regenerateAlert, setAlertRecipients,
    addAlertComment, toggleAlertCommentResolved, deleteAlertComment, toggleAlertCommentReaction,
  } = useProject();

  const findOffer = (id: string) => offers.find((o) => o.id === id);
  const featuredOffer = findOffer(alert.featuredOfferId);
  const otherOffers = alert.otherOfferIds.map(findOffer).filter((o): o is Offer => Boolean(o));
  const allAlertOffers = featuredOffer ? [featuredOffer, ...otherOffers] : otherOffers;

  // The email preview opens by default — it's the first thing the user should see, since sending the
  // email is the whole point of reviewing the alert.
  const [rightPanel, setRightPanel] = useState<'history' | 'emailPreview' | 'offers' | 'qc' | 'projectSettings' | null>('emailPreview');
  const [showComments, setShowComments] = useState(true);
  const [showResolved, setShowResolved] = useState(false);
  const [commentsMenuAnchor, setCommentsMenuAnchor] = useState<HTMLElement | null>(null);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  /** Which editor the Offer Edit panel opens into — set alongside `editingOfferId` by whichever "Offer Card" row was clicked. */
  const [editingOfferView, setEditingOfferView] = useState<'vehicle' | 'offer'>('offer');
  const panelWidth = useResponsivePanelWidth();
  // Resizable right panels: each keeps the same default width as before, but the user can drag its left
  // edge to resize it (persists while the dialog stays open, even if the panel is toggled closed and back).
  const [projectSettingsDefaultWidth, setProjectSettingsDefaultWidth] = useState(() => Math.round((window.innerWidth - 32) * 0.5));
  useEffect(() => {
    const onResize = () => setProjectSettingsDefaultWidth(Math.round((window.innerWidth - 32) * 0.5));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  // Email/Offers/QC share one width so switching between them never jumps the layout — default 480px,
  // independent of which of the three is actually open. Project Settings keeps its own (wider) default.
  const sharedRightPanel = useResizableWidth(480, 400, 900);
  const projectSettingsPanel = useResizableWidth(projectSettingsDefaultWidth, 280, 900);
  /** Which offer's asset is expanded into the Asset Details dialog — the alert dialog stays mounted
   * underneath, so closing it (setDetailsOfferId(null)) needs no extra state to "return" to. */
  const [detailsOfferId, setDetailsOfferId] = useState<string | null>(null);
  /** Which offer's asset is shown at full size in the main asset-focus view. */
  const [focusedOfferId, setFocusedOfferId] = useState<string | null>(() => allAlertOffers[0]?.id ?? null);
  /** Set by an asset's "Offer Info" button — opens the Alert Offers panel on the Selected tab and
   * scrolls/flashes that offer's card there. `token` is a nonce so re-clicking the same asset's button
   * retriggers the scroll/flash even when `offerId` is unchanged. */
  const [highlightRequest, setHighlightRequest] = useState<OfferHighlightRequest | null>(null);
  /** Which QC side-card is open next to the focused asset — one of `legacy:{findingId}`, `creative:{offerId}`, or `deal:{offerId}`. One open at a time; click-outside closes it. */
  const [activeSideCardKey, setActiveSideCardKey] = useState<string | null>(null);
  /** When on, the carousel (and the offer this dialog can focus) is limited to offers still awaiting review. */
  const [pendingOnlyFilter, setPendingOnlyFilter] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [cursorHint, setCursorHint] = useState<{ x: number; y: number } | null>(null);
  const sideCardRef = useRef<HTMLDivElement>(null);

  // Margin commenting: a highlight/pin the user just created but hasn't sent a comment for yet, and the id
  // of a comment whose highlight/pin was just clicked (or vice versa) for a brief jump/emphasis.
  const [pendingAnchor, setPendingAnchor] = useState<AlertCommentAnchor | undefined>(undefined);
  const [activeAnchorId, setActiveAnchorId] = useState<string | null>(null);
  const [floatingSelection, setFloatingSelection] = useState<FloatingSelection | null>(null);
  const emailBodyRef = useRef<HTMLDivElement>(null);
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
      if (detailsOfferId) { setDetailsOfferId(null); return; }
      if (editingOfferId) { setEditingOfferId(null); return; }
      onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, detailsOfferId, editingOfferId]);

  // Bidirectional jump/emphasis: scroll both the comment card and its highlight/pin into view, then clear
  // the emphasis after a beat — no new dependency, just scrollIntoView + a timed state reset.
  useEffect(() => {
    if (!activeAnchorId) return;
    commentRefs.current.get(activeAnchorId)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    anchorRefs.current.get(activeAnchorId)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    const t = setTimeout(() => setActiveAnchorId(null), 1500);
    return () => clearTimeout(t);
  }, [activeAnchorId]);

  // Cursor-following hint: active from the moment the dialog opens, tracking the cursor anywhere on
  // screen, until the user clicks inside the email body content or 5 seconds elapse, whichever comes
  // first — no re-arming on hover. Only offered for alerts still awaiting a decision.
  const canShowCursorHint = !alert.generationFailure && (alert.status === 'generated' || alert.status === 'rejected');
  const hintDismissedRef = useRef(false);
  useEffect(() => {
    if (!canShowCursorHint) return;
    const handleMove = (e: MouseEvent) => {
      if (hintDismissedRef.current) return;
      setCursorHint({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMove);
    const autoHideTimer = setTimeout(() => {
      hintDismissedRef.current = true;
      setCursorHint(null);
    }, 5000);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      clearTimeout(autoHideTimer);
    };
  }, [canShowCursorHint]);

  // Generation-failed state: a hard failure blocks the normal asset/email views entirely and disables
  // every approve/reject control. QC findings are a separate, non-blocking overlay on the normal view.
  const failure = alert.generationFailure;
  const qcFindings = alert.qcFindings ?? [];
  const qcFindingsForOffer = (offerId: string) => qcFindings.filter((f) => f.offerId === offerId);
  const creativeQcResults = alert.creativeQc ?? [];
  const creativeQcForOffer = (offerId: string) => creativeQcResults.find((r) => r.offerId === offerId);
  const dealQc = alert.dealQc;
  const dealQcForOffer = (offerId: string) => dealQc?.offers.find((o) => o.offerId === offerId);
  const hasQcIssues =
    qcFindings.length > 0 ||
    creativeQcResults.some((r) => r.sections.some((s) => s.checks.some((c) => c.status === 'warning'))) ||
    !!dealQc?.offers.some((o) => o.mismatchedFields.length > 0);

  // Banner takes priority over the icon cluster's usual top-right slot — when visible, that cluster gets
  // pushed down below it instead of overlapping. Only the hard-failure banner remains here; non-blocking QC
  // issues are surfaced by the QC panel opening by default instead of a banner.
  const bannerVisible = !bannerDismissed && !!failure;
  const overlayTopOffset = bannerVisible ? 64 : 16;

  // Recipients: persisted once the user edits them; otherwise a plausible default drawn from the account name.
  const accountSlug = currentProject.accountName.toLowerCase().replace(/[^a-z0-9]+/g, '');
  const recipients = alert.recipients ?? ['marketing', 'sales', 'gm', 'advertising'].map((h) => `${h}@${accountSlug}.com`);

  const template = currentProject.templates[0];
  const hasBackgrounds = currentProject.backgrounds.length > 0;
  const bgFor = (o: Offer) => backgroundForOffer(o, offers, currentProject.backgrounds);
  const projectLocked = currentProject.isEvergreen && locked;

  const historyEntries = [...alert.activity].reverse();

  const isSent = alert.status === 'sent';
  const isArchived = !!alert.archivedAt;

  const handleSend = () => { sendAlert(alert.id); onClose(); };
  // The right panel is mutually exclusive: opening History/Email/Offers/QC/Project Settings cancels an
  // in-progress offer edit, and (via onEditOffer below) starting an offer edit closes whichever of these
  // was open.
  const openRightPanel = (panel: 'history' | 'emailPreview' | 'offers' | 'qc' | 'projectSettings') => {
    setEditingOfferId(null);
    setRightPanel((v) => (v === panel ? null : panel));
  };
  const focusAsset = (offerId: string) => setFocusedOfferId(offerId);
  const editOffer = (offerId: string, view: 'vehicle' | 'offer') => {
    setEditingOfferId(offerId);
    setEditingOfferView(view);
    setRightPanel(null);
    // Focus the offer being edited so the user can see its asset while they make changes.
    focusAsset(offerId);
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
  // A resolved comment's highlight/pin is hidden from the email/asset unless "Show Resolved" is on — the
  // comment *card* itself still respects this independently in FloatingCommentColumn.
  const highlightableComments = allComments.filter((c) => showResolved || !c.resolved);

  /** Every comment anchored to one offer's asset (plus their replies), regardless of resolved state — used by the Asset Details dialog, which always shows its full history. */
  const commentsForOffer = (offerId: string) => {
    const anchored = allComments.filter((c): c is typeof allComments[number] & { anchor: AssetCommentAnchor } => c.anchor?.kind === 'asset' && c.anchor.offerId === offerId);
    const anchoredIds = new Set(anchored.map((c) => c.id));
    const replies = allComments.filter((c) => c.parentCommentId && anchoredIds.has(c.parentCommentId));
    return [...anchored, ...replies];
  };

  /** Same, but respecting the resolved-highlight visibility rule — used for the inline pin/highlight overlay. */
  const pinsForOffer = (offerId: string) =>
    highlightableComments
      .filter((c): c is typeof allComments[number] & { anchor: AssetCommentAnchor } => c.anchor?.kind === 'asset' && c.anchor.offerId === offerId)
      .map((c) => ({ anchor: c.anchor, commentId: c.id }));

  /** Top-level comment thread anchored to one offer's asset, for the floating comment column next to the focused asset. */
  const assetColumnEntriesFor = (offerId: string): ColumnEntry[] =>
    allComments
      .filter((c) => !c.parentCommentId && c.anchor?.kind === 'asset' && c.anchor.offerId === offerId)
      .map((c) => ({ id: c.id, comment: c, replies: allComments.filter((r) => r.parentCommentId === c.id) }));

  /** Top-level comment thread anchored to the email body text, for the floating comment column in the Email Preview panel. */
  const emailColumnEntries: ColumnEntry[] = allComments
    .filter((c) => !c.parentCommentId && c.anchor?.kind === 'email')
    .map((c) => ({ id: c.id, comment: c, replies: allComments.filter((r) => r.parentCommentId === c.id) }));

  const emailAnchors = highlightableComments
    .filter((c): c is typeof allComments[number] & { anchor: EmailCommentAnchor } => c.anchor?.kind === 'email')
    .map((c) => ({ anchor: c.anchor, commentId: c.id }));
  // A highlight the user just made but hasn't sent a comment for yet — shown immediately, non-interactive,
  // and removed the moment it's cancelled or sent.
  const anchorsForParagraph = (index: number) => {
    const committed = emailAnchors.filter((a) => a.anchor.paragraphIndex === index);
    if (pendingAnchor?.kind === 'email' && pendingAnchor.paragraphIndex === index) {
      return [...committed, { anchor: pendingAnchor, commentId: PENDING_ANCHOR_ID }];
    }
    return committed;
  };

  const handleAnchorClick = (commentId: string) => setActiveAnchorId(commentId);

  const handleEmailMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.toString().trim().length === 0 || !emailBodyRef.current) {
      setFloatingSelection(null);
      return;
    }
    const range = selection.getRangeAt(0);
    if (!emailBodyRef.current.contains(range.startContainer)) { setFloatingSelection(null); return; }

    let node: Node | null = range.startContainer;
    let paragraphEl: HTMLElement | null = null;
    while (node && node !== emailBodyRef.current) {
      if (node instanceof HTMLElement && node.dataset.paragraphIndex !== undefined) { paragraphEl = node; break; }
      node = node.parentNode;
    }
    if (!paragraphEl) { setFloatingSelection(null); return; }

    const paragraphIndex = Number(paragraphEl.dataset.paragraphIndex);
    const preRange = document.createRange();
    preRange.selectNodeContents(paragraphEl);
    preRange.setEnd(range.startContainer, range.startOffset);
    const startOffset = preRange.toString().length;
    const quotedText = range.toString();
    const endOffset = startOffset + quotedText.length;

    const rect = range.getBoundingClientRect();
    setFloatingSelection({
      top: rect.top - 6,
      left: rect.right + 8,
      anchor: { kind: 'email', paragraphIndex, startOffset, endOffset, quotedText },
    });
  };

  const handleStartComment = () => {
    if (!floatingSelection) return;
    setPendingAnchor(floatingSelection.anchor);
    setFloatingSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleSendComment = (text: string, mentionedNames: string[]) => {
    if (!pendingAnchor) return;
    const track = pendingAnchor.kind === 'email' ? 'email' : 'assets';
    addAlertComment(alert.id, track, { text, mentionedNames, anchor: pendingAnchor });
    setPendingAnchor(undefined);
    setShowComments(true);
  };

  // Clicking anywhere in the dialog other than the open QC side-card or the tag that opened it closes it —
  // the gray background, a different asset, or the email body text all count as "outside".
  const handleDialogClick = (e: React.MouseEvent) => {
    const target = e.target as Node;

    if (activeSideCardKey) {
      const insideCard = sideCardRef.current?.contains(target);
      const insideTag = anchorRefs.current.get(qcTagAnchorId(activeSideCardKey))?.contains(target);
      if (!insideCard && !insideTag) setActiveSideCardKey(null);
    }
  };

  const editingOffer = editingOfferId ? offers.find((o) => o.id === editingOfferId) : undefined;
  const detailsOffer = detailsOfferId ? offers.find((o) => o.id === detailsOfferId) : undefined;
  const detailsBg = detailsOffer ? bgFor(detailsOffer) : undefined;
  const focusedOffer = focusedOfferId ? offers.find((o) => o.id === focusedOfferId) : undefined;
  const focusedBg = focusedOffer ? bgFor(focusedOffer) : undefined;

  const offerReviewFor = (offerId: string) => alert.offerReviews?.[offerId];
  const isOfferApproved = (offerId: string) => offerReviewFor(offerId)?.status === 'approved';

  // The pending-only filter narrows the carousel to offers still awaiting review — toggling it on while
  // focused on an already-reviewed asset jumps focus to the first still-pending one, if any.
  const pendingAlertOffers = allAlertOffers.filter((o) => (offerReviewFor(o.id)?.status ?? 'pending') === 'pending');
  const carouselOffers = pendingOnlyFilter ? pendingAlertOffers : allAlertOffers;
  const handleTogglePendingOnlyFilter = () => {
    setPendingOnlyFilter((v) => {
      const next = !v;
      if (next && focusedOfferId && !pendingAlertOffers.some((o) => o.id === focusedOfferId) && pendingAlertOffers[0]) {
        setFocusedOfferId(pendingAlertOffers[0].id);
      }
      return next;
    });
  };
  // Steps focus to the previous/next offer within whatever's currently in the carousel (respecting the
  // pending-only filter), wrapping at either end — shared by the flanking arrow buttons and the arrow-key
  // shortcut below.
  const stepFocusedOffer = (direction: 1 | -1) => {
    if (carouselOffers.length < 2 || !focusedOfferId) return;
    const idx = carouselOffers.findIndex((o) => o.id === focusedOfferId);
    if (idx === -1) return;
    const nextIdx = (idx + direction + carouselOffers.length) % carouselOffers.length;
    setFocusedOfferId(carouselOffers[nextIdx].id);
  };

  // Approving/rejecting the focused asset auto-advances to the next one in the carousel, so the user can
  // keep reviewing without clicking back into the carousel each time.
  const reviewFocusedOfferAndAdvance = (offerId: string, reviewStatus: 'approved' | 'rejected') => {
    setOfferAssetReview(alert.id, offerId, reviewStatus);
    if (carouselOffers.length < 2) return;
    const idx = carouselOffers.findIndex((o) => o.id === offerId);
    if (idx === -1) return;
    const nextIdx = (idx + 1) % carouselOffers.length;
    setFocusedOfferId(carouselOffers[nextIdx].id);
  };

  // Left/right arrow keys step through the carousel too — ignored while the user is typing anywhere
  // (comment composer, recipient field, enrollment settings, etc.) so it never hijacks normal text editing.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;
      stepFocusedOffer(e.key === 'ArrowLeft' ? -1 : 1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carouselOffers, focusedOfferId]);

  // Footer progress readout ("6 of 7 approved") and the assets progress ring's green/red split.
  const assetsTotalCount = allAlertOffers.length;
  const assetsApprovedCount = allAlertOffers.filter((o) => offerReviewFor(o.id)?.status === 'approved').length;
  const assetsRejectedCount = allAlertOffers.filter((o) => offerReviewFor(o.id)?.status === 'rejected').length;
  // Both tracks approved — the footer swaps its message and reveals the Send action.
  const readyToSend = alert.status === 'approved';

  // Only approves assets that haven't been reviewed at all — a rejected asset is left alone, since that
  // decision has to be resolved individually (Approve / Undo on its own card).
  const handleApproveRemainingAssets = () => {
    allAlertOffers.forEach((o) => {
      if (!offerReviewFor(o.id)) setOfferAssetReview(alert.id, o.id, 'approved');
    });
  };
  // Resets every offer's review back to pending — the footer's "Undo reviews" action once assets are done.
  const handleUndoAllAssetReviews = () => {
    allAlertOffers.forEach((o) => setOfferAssetReview(alert.id, o.id, 'pending'));
  };

  // Carousel within the Asset Details dialog — steps through allAlertOffers in order, wrapping at the ends.
  const detailsIndex = detailsOffer ? allAlertOffers.findIndex((o) => o.id === detailsOffer.id) : -1;
  const handleDetailsPrev = () => {
    if (allAlertOffers.length === 0 || detailsIndex === -1) return;
    const nextIndex = (detailsIndex - 1 + allAlertOffers.length) % allAlertOffers.length;
    setDetailsOfferId(allAlertOffers[nextIndex].id);
  };
  const handleDetailsNext = () => {
    if (allAlertOffers.length === 0 || detailsIndex === -1) return;
    const nextIndex = (detailsIndex + 1) % allAlertOffers.length;
    setDetailsOfferId(allAlertOffers[nextIndex].id);
  };

  const handleReply = (parentCommentId: string, text: string, mentionedNames: string[]) => {
    const parent = allComments.find((c) => c.id === parentCommentId);
    addAlertComment(alert.id, parent?.track ?? 'email', { text, mentionedNames, parentCommentId });
    setShowComments(true);
  };
  const handleToggleReaction = (commentId: string, emoji: string) => toggleAlertCommentReaction(alert.id, commentId, emoji);

  const focusedDealQcResult = focusedOffer ? dealQcForOffer(focusedOffer.id) : undefined;

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

            {/* Main content: the focused asset + carousel, with floating QC/offer cards and a floating
                comment column. position:relative here (not on the scrollable div below) so the approval
                widgets — placed as a sibling of the scrollable div, not a descendant of it — stay pinned in
                the corner instead of scrolling with the canvas's content. */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

              {/* Hard-failure banner only — pinned inside the gray preview area, 16px from the top/left/right
                  edges. Non-blocking QC issues no longer get a banner here; the QC panel opens by default
                  instead. Dismissible; resets each time the dialog is (re)opened since bannerDismissed lives
                  in local state. */}
              {bannerVisible && (
                <div
                  style={{
                    position: 'absolute', top: 16, left: 16, right: 16, zIndex: 7,
                    display: 'flex', alignItems: 'flex-start', gap: 8, padding: '12px 16px', borderRadius: 4,
                    background: '#FDEDED', color: '#5f2120',
                  }}
                >
                  <ErrorOutlined style={{ fontSize: 22, flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontFamily: 'Roboto, sans-serif', letterSpacing: '0.17px', lineHeight: 1.43 }}>
                    Failed alert generation. Please attempt to{' '}
                    <button
                      onClick={() => regenerateAlert(alert.id)}
                      style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', font: 'inherit', color: 'inherit', fontWeight: 700, textDecoration: 'underline' }}
                    >
                      Regenerate Alert
                    </button>
                    . If the error persists, contact the Product team.
                  </span>
                  <IconButton size="small" onClick={() => setBannerDismissed(true)} sx={{ padding: '4px', flexShrink: 0 }}>
                    <Close style={{ fontSize: 16, color: 'inherit' }} />
                  </IconButton>
                </div>
              )}

              <div
                style={{
                  flex: 1, overflow: 'auto', background: '#F4F5F6', padding: '24px 16px', position: 'relative',
                  ...(failure ? { display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}),
                }}
              >
                {failure ? (
                  <AlertGenerationFailedState failure={failure} onRegenerate={() => regenerateAlert(alert.id)} />
                ) : focusedOffer && template && focusedBg ? (
                  <AlertAssetFocusView
                    offer={focusedOffer}
                    template={template}
                    backgroundUrl={focusedBg.url}
                    title={focusedOffer.vehicleName}
                    dimensions={`${template.width} x ${template.height}`}
                    pins={pinsForOffer(focusedOffer.id)}
                    pendingAnchor={pendingAnchor?.kind === 'asset' && pendingAnchor.offerId === focusedOffer.id ? pendingAnchor : undefined}
                    activeAnchorId={activeAnchorId}
                    onPinClick={handleAnchorClick}
                    registerAnchorRef={registerAnchorRef}
                    anchorRefsMap={anchorRefs}
                    onCreatePin={(anchor) => { setPendingAnchor(anchor); setFloatingSelection(null); }}
                    onTextSelected={setFloatingSelection}
                    approvalStatus={offerReviewFor(focusedOffer.id)?.status ?? 'pending'}
                    approvalDisabled={isArchived}
                    onApprove={() => reviewFocusedOfferAndAdvance(focusedOffer.id, 'approved')}
                    onReject={() => reviewFocusedOfferAndAdvance(focusedOffer.id, 'rejected')}
                    onUndo={() => setOfferAssetReview(alert.id, focusedOffer.id, 'pending')}
                    onRequestPreview={() => setDetailsOfferId(focusedOffer.id)}
                    onShowOfferCard={() => { setActiveSideCardKey(null); showOfferInOffersPanel(focusedOffer.id); }}
                    legacyFindings={qcFindingsForOffer(focusedOffer.id)}
                    creativeQc={creativeQcForOffer(focusedOffer.id)}
                    dealQc={focusedDealQcResult && dealQc ? { result: focusedDealQcResult, checkedAt: dealQc.checkedAt, rulesetVersion: dealQc.rulesetVersion } : undefined}
                    activeSideCardKey={activeSideCardKey}
                    onToggleSideCard={(key) => setActiveSideCardKey((k) => (k === key ? null : key))}
                    sideCardRef={sideCardRef}
                    carouselOffers={carouselOffers}
                    hasMultipleOffers={allAlertOffers.length > 1}
                    bgFor={bgFor}
                    onSelectOffer={focusAsset}
                    reviewFor={(offerId) => offerReviewFor(offerId)?.status ?? 'pending'}
                    pendingOnlyFilter={pendingOnlyFilter}
                    onTogglePendingOnlyFilter={handleTogglePendingOnlyFilter}
                    onPrevOffer={() => stepFocusedOffer(-1)}
                    onNextOffer={() => stepFocusedOffer(1)}
                    hasPendingAssets={assetsApprovedCount + assetsRejectedCount < assetsTotalCount}
                    onApproveAllAssets={handleApproveRemainingAssets}
                    showComments={showComments}
                    showResolved={showResolved}
                    commentEntries={assetColumnEntriesFor(focusedOffer.id)}
                    registerCommentRef={registerCommentRef}
                    onCancelPendingComment={() => setPendingAnchor(undefined)}
                    onSendPendingComment={handleSendComment}
                    onToggleResolved={(commentId) => toggleAlertCommentResolved(alert.id, commentId)}
                    onDeleteComment={(commentId) => deleteAlertComment(alert.id, commentId)}
                    onJumpToAnchor={(commentId) => setActiveAnchorId(commentId)}
                    onReply={handleReply}
                    onToggleReaction={handleToggleReaction}
                  />
                ) : null}
              </div>

              {/* Project Settings/Email Preview/Offers/QC/Comments controls — pinned top-right of the canvas,
                  a sibling of the scrollable div (not a descendant of it) so it stays fixed in the corner
                  instead of scrolling with the canvas's content. Hidden while generation failed: there's
                  nothing to act on. Every icon in this group is a uniform 30x30px button. */}
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
                  onClick={() => openRightPanel('emailPreview')}
                  title="Email Preview"
                  sx={{ width: 30, height: 30, padding: 0, background: rightPanel === 'emailPreview' ? 'rgba(71,59,171,0.1)' : 'transparent' }}
                >
                  <MailOutlined style={{ fontSize: 20, color: rightPanel === 'emailPreview' ? '#473bab' : '#1f1d25' }} />
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
                  onClick={() => openRightPanel('qc')}
                  title="QC warnings"
                  sx={{
                    width: 30, height: 30, padding: 0,
                    background: rightPanel === 'qc'
                      ? (hasQcIssues ? '#c45500' : 'rgba(71,59,171,0.1)')
                      : (hasQcIssues ? '#FFF4E5' : 'transparent'),
                  }}
                >
                  <WarningAmberOutlined style={{
                    fontSize: 20,
                    color: rightPanel === 'qc'
                      ? (hasQcIssues ? '#FFCC80' : '#473bab')
                      : (hasQcIssues ? '#663C00' : '#1f1d25'),
                  }} />
                </IconButton>
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
              </div>
              )}

            </div>

            {/* Right panel — Activity History, Email Preview, Offers, QC warnings, or the offer editor: mutually exclusive */}
            {editingOffer && !projectLocked ? (
              <AlertOfferEditPanel
                key={`${editingOffer.id}-${editingOfferView}`}
                offer={editingOffer}
                initialView={editingOfferView}
                onBack={() => { setEditingOfferId(null); setRightPanel('offers'); }}
                onClose={() => setEditingOfferId(null)}
                onFocusAsset={() => focusAsset(editingOffer.id)}
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
            ) : rightPanel === 'emailPreview' ? (
              <AlertEmailPreviewPanel
                subject={alert.subject}
                preheader={alert.preheader}
                bodyParagraphs={alert.bodyParagraphs}
                vin={alert.vin}
                accountName={currentProject.accountName}
                featuredOffer={featuredOffer}
                otherOffers={otherOffers}
                template={template}
                hasBackgrounds={hasBackgrounds}
                bgFor={bgFor}
                isOfferApproved={isOfferApproved}
                recipients={recipients}
                onRecipientsChange={(next) => setAlertRecipients(alert.id, next)}
                emailBodyRef={emailBodyRef}
                onEmailMouseUp={handleEmailMouseUp}
                anchorsForParagraph={anchorsForParagraph}
                activeAnchorId={activeAnchorId}
                onHighlightClick={handleAnchorClick}
                registerAnchorRef={registerAnchorRef}
                anchorRefsMap={anchorRefs}
                showComments={showComments}
                showResolved={showResolved}
                commentEntries={emailColumnEntries}
                registerCommentRef={registerCommentRef}
                pendingAnchor={pendingAnchor?.kind === 'email' ? pendingAnchor : undefined}
                onCancelPendingComment={() => setPendingAnchor(undefined)}
                onSendPendingComment={handleSendComment}
                onToggleResolved={(commentId) => toggleAlertCommentResolved(alert.id, commentId)}
                onDeleteComment={(commentId) => deleteAlertComment(alert.id, commentId)}
                onJumpToAnchor={(commentId) => setActiveAnchorId(commentId)}
                onReply={handleReply}
                onToggleReaction={handleToggleReaction}
                onClose={() => setRightPanel(null)}
                panelWidth={sharedRightPanel.width}
                onResizeHandleMouseDown={sharedRightPanel.onResizeHandleMouseDown}
                emailStatus={alert.emailStatus}
              />
            ) : rightPanel === 'offers' ? (
              <AlertOffersPanel
                offers={allAlertOffers}
                projectOffers={currentProject.offers}
                locked={!!projectLocked}
                onEditOffer={editOffer}
                onClose={() => setRightPanel(null)}
                highlightRequest={highlightRequest}
                width={sharedRightPanel.width}
                onResizeHandleMouseDown={sharedRightPanel.onResizeHandleMouseDown}
              />
            ) : rightPanel === 'qc' ? (
              <AlertQcPanel
                creativeQc={alert.creativeQc}
                dealQc={alert.dealQc}
                offers={allAlertOffers}
                onClose={() => setRightPanel(null)}
                panelWidth={sharedRightPanel.width}
                onResizeHandleMouseDown={sharedRightPanel.onResizeHandleMouseDown}
              />
            ) : rightPanel === 'projectSettings' ? (
              <AlertProjectSettingsPanel
                project={currentProject}
                onClose={() => setRightPanel(null)}
                width={projectSettingsPanel.width}
                onResizeHandleMouseDown={projectSettingsPanel.onResizeHandleMouseDown}
              />
            ) : null}
          </div>

          {/* Footer — always visible so review progress reads at a glance even before either track is
              done; once both are approved it becomes the existing "ready to send" bar below. */}
          {/* Footer — always visible so review progress and the final Send action all live in one place. */}
          {!isSent && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '10px 16px', borderTop: '1px solid rgba(0,0,0,0.08)', flexShrink: 0, background: '#ffffff' }}>
              <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', flexShrink: 0 }}>
                {readyToSend ? 'Everything is approved. Send to the client when ready.' : 'Approve the assets and the email to send to the client.'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                <AssetsFooterWidget
                  approvedCount={assetsApprovedCount}
                  rejectedCount={assetsRejectedCount}
                  totalCount={assetsTotalCount}
                  status={alert.assetsStatus}
                  disabled={isArchived || !!failure}
                  disabledReason={failure ? DISABLED_TOOLTIP_REASON : undefined}
                  onApproveAll={handleApproveRemainingAssets}
                  onUndoAll={handleUndoAllAssetReviews}
                />
                <ChevronRight style={{ fontSize: 18, color: '#cac9cf', flexShrink: 0 }} />
                <EmailFooterWidget
                  status={alert.emailStatus}
                  disabled={isArchived || !!failure}
                  disabledReason={failure ? DISABLED_TOOLTIP_REASON : undefined}
                  onApprove={() => setEmailReview(alert.id, 'approved')}
                  onReject={() => setEmailReview(alert.id, 'rejected')}
                  onUndo={() => setEmailReview(alert.id, 'pending')}
                />
                {readyToSend && (
                  <>
                    <ChevronRight style={{ fontSize: 18, color: '#cac9cf', flexShrink: 0 }} />
                    <button
                      disabled={isArchived}
                      onClick={handleSend}
                      style={{ ...footerButtonBase, background: '#473bab', color: '#ffffff', opacity: isArchived ? 0.5 : 1, cursor: isArchived ? 'not-allowed' : 'pointer' }}
                    >
                      <Send style={{ fontSize: 16 }} />
                      Send
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
          {isSent && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16, padding: '10px 16px', borderTop: '1px solid rgba(0,0,0,0.08)', flexShrink: 0, background: '#ffffff' }}>
              <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#686576' }}>Email and Assets approved • Sent</span>
              <button onClick={onClose} style={{ ...footerButtonBase, background: 'transparent', color: '#473bab', border: '1px solid rgba(99,86,225,0.5)' }}>
                Close
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tooltip Chat Indicator / Tooltip Indicator */}
      {/* {cursorHint && (
        <div
          style={{
            position: 'fixed', top: cursorHint.y + 16, left: cursorHint.x + 16, zIndex: 100025, pointerEvents: 'none',
            background: '#473bab', color: '#ffffff', padding: '6px 10px', borderRadius: 6,
            fontSize: 12, fontFamily: 'Roboto, sans-serif', maxWidth: 240, display: 'flex', alignItems: 'top', gap: 6,
          }}
        >
          <AddComment style={{ fontSize: 16}} />
          <span>Highlight text or click anywhere on the assets to add comments.</span>
        </div>
      )} */}

      {floatingSelection && (
        <FloatingCommentButton top={floatingSelection.top} left={floatingSelection.left} onClick={handleStartComment} />
      )}

      {detailsOffer && template && detailsBg && (
        <AlertAssetDetailsDialog
          key={detailsOffer.id}
          offer={detailsOffer}
          template={template}
          backgroundUrl={detailsBg.url}
          background={detailsBg}
          projectId={currentProject.id}
          locked={!!projectLocked}
          comments={commentsForOffer(detailsOffer.id)}
          activeAnchorId={activeAnchorId}
          onClose={() => setDetailsOfferId(null)}
          onAddComment={(text, mentionedNames, anchor) => { addAlertComment(alert.id, 'assets', { text, mentionedNames, anchor }); setShowComments(true); }}
          onToggleResolved={(commentId) => toggleAlertCommentResolved(alert.id, commentId)}
          onDeleteComment={(commentId) => deleteAlertComment(alert.id, commentId)}
          onAnchorClick={handleAnchorClick}
          onEditOffer={(view) => editOffer(detailsOffer.id, view)}
          onReply={handleReply}
          onToggleReaction={handleToggleReaction}
          approvalStatus={alert.offerReviews?.[detailsOffer.id]?.status ?? 'pending'}
          approvalDisabled={isArchived || isSent}
          onApprove={() => setOfferAssetReview(alert.id, detailsOffer.id, 'approved')}
          onReject={() => setOfferAssetReview(alert.id, detailsOffer.id, 'rejected')}
          onUndo={() => setOfferAssetReview(alert.id, detailsOffer.id, 'pending')}
          currentIndex={detailsIndex}
          totalCount={allAlertOffers.length}
          onPrev={handleDetailsPrev}
          onNext={handleDetailsNext}
        />
      )}
    </>,
    document.body,
  );
};
