import { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { IconButton, Menu, Switch } from '@mui/material';
import {
  Close, HistoryOutlined, MoreVert, PictureAsPdfOutlined, Refresh, Send, AddComment,
} from '@mui/icons-material';
import type { Alert, AlertActivityEntry, AlertComment, AlertCommentAnchor, AssetCommentAnchor, EmailCommentAnchor, Offer, OfferReviewEntry, ReviewStatus } from '../../data/types';
import { useProject } from '../../context/ProjectContext';
import { formatRelativeTime } from '../../utils/relativeTime';
import { backgroundForOffer } from '../../utils/overviewAssets';
import { scrollElementIntoViewCentered } from '../../utils/smoothScroll';
import { HighlightableParagraph, FloatingCommentButton, PENDING_ANCHOR_ID } from './AlertHighlightableText';
import { CommentableAssetPreview } from './CommentableAssetPreview';
import { FloatingCommentColumn, type ColumnEntry } from './FloatingCommentColumn';
import { AlertOfferCard } from './AlertOfferCard';
import { AlertOfferEditPanel } from './AlertOfferEditPanel';
import { AlertAssetPreviewModal } from './AlertAssetPreviewModal';
import { EmailApprovalWidget, AssetApprovalWidget, AssetStatusBadge } from './AlertApprovalWidgets';

const ACTION_LABEL: Record<AlertActivityEntry['action'], string> = {
  generated: 'Generated',
  email_approved: 'Email Approved',
  email_rejected: 'Email Rejected',
  assets_approved: 'Assets Approved',
  assets_rejected: 'Assets Rejected',
  rebuilt: 'Rebuilt',
  sent: 'Sent',
  archived: 'Archived',
};

/** Most recent activity entry for a given review track — powers both the footer badge and the Undo action. */
function lastActivityFor(alert: Alert, track: 'email' | 'assets'): AlertActivityEntry | undefined {
  const actions = track === 'email' ? ['email_approved', 'email_rejected'] : ['assets_approved', 'assets_rejected'];
  return [...alert.activity].reverse().find((e) => actions.includes(e.action));
}

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
    offers, currentProject, locked, setEmailReview, setOfferAssetReview, sendAlert,
    addAlertComment, toggleAlertCommentResolved, deleteAlertComment, toggleAlertCommentReaction,
  } = useProject();
  const [showHistory, setShowHistory] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [showResolved, setShowResolved] = useState(false);
  const [commentsMenuAnchor, setCommentsMenuAnchor] = useState<HTMLElement | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [previewOfferId, setPreviewOfferId] = useState<string | null>(null);
  const [activeOfferCardOfferId, setActiveOfferCardOfferId] = useState<string | null>(null);
  const [cursorHint, setCursorHint] = useState<{ x: number; y: number } | null>(null);
  const offerCardRef = useRef<HTMLDivElement>(null);

  // Margin commenting: a highlight/pin the user just created but hasn't sent a comment for yet, and the id
  // of a comment whose highlight/pin was just clicked (or vice versa) for a brief jump/emphasis.
  const [pendingAnchor, setPendingAnchor] = useState<AlertCommentAnchor | undefined>(undefined);
  const [activeAnchorId, setActiveAnchorId] = useState<string | null>(null);
  const [floatingSelection, setFloatingSelection] = useState<FloatingSelection | null>(null);
  const emailBodyRef = useRef<HTMLDivElement>(null);
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
  // screen, until the user clicks inside the email body content — no auto-hide timer, no re-arming on
  // hover. Only offered for alerts still awaiting a decision.
  const canShowCursorHint = alert.status === 'generated' || alert.status === 'rejected';
  const hintDismissedRef = useRef(false);
  useEffect(() => {
    if (!canShowCursorHint) return;
    const handleMove = (e: MouseEvent) => {
      if (hintDismissedRef.current) return;
      setCursorHint({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [canShowCursorHint]);
  const dismissCursorHint = () => {
    hintDismissedRef.current = true;
    setCursorHint(null);
  };

  const findOffer = (id: string) => offers.find((o) => o.id === id);
  const featuredOffer = findOffer(alert.featuredOfferId);
  const otherOffers = alert.otherOfferIds.map(findOffer).filter((o): o is Offer => Boolean(o));

  const template = currentProject.templates[0];
  const hasBackgrounds = currentProject.backgrounds.length > 0;
  const bgFor = (o: Offer) => backgroundForOffer(o, offers, currentProject.backgrounds);
  const projectLocked = currentProject.isEvergreen && locked;

  const historyEntries = [...alert.activity].reverse();

  const emailActivity = lastActivityFor(alert, 'email');
  const isSent = alert.status === 'sent';
  const isArchived = !!alert.archivedAt;

  const handleSend = () => { sendAlert(alert.id); onClose(); };
  const toggleHistory = () => setShowHistory((v) => !v);
  // Manual "refresh" of the email canvas — a visual reassurance for the user that everything reflects
  // their latest edits, since this view is already always in sync with local state.
  const handleRefreshEmail = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 700);
  };

  const allComments = alert.comments ?? [];
  // A resolved comment's highlight/pin is hidden from the email/asset unless "Show Resolved" is on — the
  // comment *card* itself still respects this independently inside FloatingCommentColumn.
  const highlightableComments = allComments.filter((c) => showResolved || !c.resolved);

  /** Every comment anchored to one offer's asset (plus their replies), regardless of resolved state — used by the preview modal, which always shows its full history. */
  const commentsForOffer = (offerId: string): AlertComment[] => {
    const anchored = allComments.filter((c): c is AlertComment & { anchor: AssetCommentAnchor } => c.anchor?.kind === 'asset' && c.anchor.offerId === offerId);
    const anchoredIds = new Set(anchored.map((c) => c.id));
    const replies = allComments.filter((c) => c.parentCommentId && anchoredIds.has(c.parentCommentId));
    return [...anchored, ...replies];
  };

  /** Same, but respecting the resolved-highlight visibility rule — used for the inline pin/highlight overlay. */
  const pinsForOffer = (offerId: string) =>
    highlightableComments
      .filter((c): c is AlertComment & { anchor: AssetCommentAnchor } => c.anchor?.kind === 'asset' && c.anchor.offerId === offerId)
      .map((c) => ({ anchor: c.anchor, commentId: c.id }));

  const emailAnchors = highlightableComments
    .filter((c): c is AlertComment & { anchor: EmailCommentAnchor } => c.anchor?.kind === 'email')
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

  const assetStatusAnchorId = (offerId: string) => `asset-status-${offerId}`;

  // Clicking anywhere in the dialog other than the open offer info card or the asset it belongs to closes
  // it — the gray background, a different asset, or the email body text all count as "outside".
  const handleDialogClick = (e: React.MouseEvent) => {
    if (!activeOfferCardOfferId) return;
    const target = e.target as Node;
    if (offerCardRef.current?.contains(target)) return;
    const activeAssetEl = anchorRefs.current.get(assetStatusAnchorId(activeOfferCardOfferId));
    if (activeAssetEl?.contains(target)) return;
    setActiveOfferCardOfferId(null);
  };

  const renderInlineAsset = (offer: Offer) => {
    const bg = bgFor(offer);
    if (!template || !bg) return null;
    const pins = pinsForOffer(offer.id);
    const pendingForThis = pendingAnchor?.kind === 'asset' && pendingAnchor.offerId === offer.id ? pendingAnchor : undefined;
    const reviewEntry = alert.offerReviews?.[offer.id];
    const approvalStatus = reviewEntry?.status ?? 'pending';

    return (
      <div
        key={offer.id}
        ref={(el) => registerAnchorRef(assetStatusAnchorId(offer.id), el)}
        style={{ position: 'relative', marginBottom: 20 }}
      >
        <div style={{ position: 'relative', width: '100%', aspectRatio: `${template.width} / ${template.height}` }}>
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
            onShowOfferCard={() => setActiveOfferCardOfferId((id) => (id === offer.id ? null : offer.id))}
            approvalStatus={approvalStatus}
            approvalDisabled={isArchived}
            onApprove={() => setOfferAssetReview(alert.id, offer.id, 'approved')}
            onReject={() => setOfferAssetReview(alert.id, offer.id, 'rejected')}
          />
          {reviewEntry && (
            <AssetStatusBadge
              label={reviewEntry.status === 'approved' ? 'Approved' : 'Changes Requested'}
              actorName={reviewEntry.actorName}
              timestamp={reviewEntry.timestamp}
              disabled={isArchived}
              onUndo={() => setOfferAssetReview(alert.id, offer.id, 'pending')}
              onApproveChanges={reviewEntry.status === 'rejected' ? () => setOfferAssetReview(alert.id, offer.id, 'approved') : undefined}
            />
          )}
        </div>
        {activeOfferCardOfferId === offer.id && (
          <div ref={offerCardRef}>
            <AlertOfferCard
              offer={offer}
              template={template}
              background={bg}
              projectId={currentProject.id}
              locked={!!projectLocked}
              onEditOffer={() => setEditingOfferId(offer.id)}
            />
          </div>
        )}
      </div>
    );
  };

  const editingOffer = editingOfferId ? offers.find((o) => o.id === editingOfferId) : undefined;
  const previewOffer = previewOfferId ? offers.find((o) => o.id === previewOfferId) : undefined;
  const previewBg = previewOffer ? bgFor(previewOffer) : undefined;

  const allAlertOffers = featuredOffer ? [featuredOffer, ...otherOffers] : otherOffers;
  const offerReviewFor = (offerId: string) => alert.offerReviews?.[offerId];

  const columnEntries: ColumnEntry[] = allComments
    .filter((c) => !c.parentCommentId)
    .map((c) => ({
      id: c.id,
      comment: c,
      replies: allComments.filter((r) => r.parentCommentId === c.id),
    }));

  const assetEntries: { offerId: string; status: ReviewStatus }[] = allAlertOffers.map((o) => ({ offerId: o.id, status: offerReviewFor(o.id)?.status ?? 'pending' }));
  const approvedOfferEntries = allAlertOffers
    .map((o) => offerReviewFor(o.id))
    .filter((e): e is OfferReviewEntry => !!e && e.status === 'approved');
  const rejectedOfferEntries = allAlertOffers
    .map((o) => offerReviewFor(o.id))
    .filter((e): e is OfferReviewEntry => !!e && e.status === 'rejected');
  const approverNames = [...new Set(approvedOfferEntries.map((e) => e.actorName))];
  const lastApprovedTimestamp = approvedOfferEntries.length
    ? Math.max(...approvedOfferEntries.map((e) => e.timestamp))
    : undefined;
  const lastRejectedEntry = rejectedOfferEntries.length
    ? rejectedOfferEntries.reduce((latest, e) => (e.timestamp > latest.timestamp ? e : latest))
    : undefined;

  const handleUndoAllAssetReviews = () => {
    allAlertOffers.forEach((o) => setOfferAssetReview(alert.id, o.id, 'pending'));
  };
  // Only approves assets that haven't been reviewed at all — an asset already in Changes Requested is left
  // alone, since that decision has to be resolved individually (Approve Changes / Undo on its own card).
  const handleApproveRemainingAssets = () => {
    allAlertOffers.forEach((o) => {
      if (!offerReviewFor(o.id)) setOfferAssetReview(alert.id, o.id, 'approved');
    });
  };
  const handleSelectAsset = (offerId: string) => {
    const container = scrollContainerRef.current;
    const target = anchorRefs.current.get(assetStatusAnchorId(offerId));
    if (container && target) scrollElementIntoViewCentered(container, target);
  };

  // Carousel within the enlarged asset preview — steps through allAlertOffers in order, wrapping at the ends.
  const previewIndex = previewOffer ? allAlertOffers.findIndex((o) => o.id === previewOffer.id) : -1;
  const handlePreviewPrev = () => {
    if (allAlertOffers.length === 0 || previewIndex === -1) return;
    const nextIndex = (previewIndex - 1 + allAlertOffers.length) % allAlertOffers.length;
    setPreviewOfferId(allAlertOffers[nextIndex].id);
  };
  const handlePreviewNext = () => {
    if (allAlertOffers.length === 0 || previewIndex === -1) return;
    const nextIndex = (previewIndex + 1) % allAlertOffers.length;
    setPreviewOfferId(allAlertOffers[nextIndex].id);
  };

  const handleReply = (parentCommentId: string, text: string, mentionedNames: string[]) => {
    const parent = allComments.find((c) => c.id === parentCommentId);
    addAlertComment(alert.id, parent?.track ?? 'email', { text, mentionedNames, parentCommentId });
    setShowComments(true);
  };
  const handleToggleReaction = (commentId: string, emoji: string) => toggleAlertCommentReaction(alert.id, commentId, emoji);

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
          <IconButton size="small" onClick={toggleHistory} sx={{ padding: '5px', background: showHistory ? 'rgba(71,59,171,0.1)' : 'transparent' }}>
            <HistoryOutlined style={{ fontSize: 20, color: showHistory ? '#473bab' : '#1f1d25' }} />
          </IconButton>
          <IconButton size="small" onClick={onClose} sx={{ padding: '5px', background: 'rgba(17,16,20,0.08)', borderRadius: '100px' }}>
            <Close style={{ fontSize: 18, color: '#1f1d25' }} />
          </IconButton>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

            {/* Main content: email + inline assets, with floating offer cards and a floating comment column.
                position:relative here (not on the scrollable div below) so the approval widgets — placed as a
                sibling of the scrollable div, not a descendant of it — stay pinned in the corner instead of
                scrolling with the canvas's content. */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
              <div
                ref={scrollContainerRef}
                style={{ flex: 1, overflow: 'auto', background: '#F4F5F6', padding: '24px 16px', position: 'relative' }}
              >
                <div ref={contentRef} style={{ position: 'relative', width: 520, margin: '0 auto' }}>
                  <div
                    ref={emailBodyRef}
                    onMouseUp={handleEmailMouseUp}
                    onClickCapture={dismissCursorHint}
                    style={{ background: '#ffffff', borderRadius: 8, padding: '20px 20px 32px', width: 520, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', height: 'fit-content' }}
                  >
                    <p style={{ margin: 0, fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#9c99a9', letterSpacing: '0.4px' }}>
                      {alert.preheader}
                    </p>
                    <h1 style={{ margin: '6px 0 12px', fontSize: 18, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.15px', lineHeight: 1.3 }}>
                      {alert.subject}
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#473bab', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                        CI
                      </div>
                      <div>
                        <p style={{ margin: 0, fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25' }}>Constellation Insights</p>
                        <p style={{ margin: 0, fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576' }}>by {currentProject.accountName}</p>
                      </div>
                    </div>

                    {alert.bodyParagraphs.map((p, i) => (
                      <HighlightableParagraph
                        key={i}
                        text={p}
                        paragraphIndex={i}
                        anchors={anchorsForParagraph(i)}
                        activeAnchorId={activeAnchorId}
                        onHighlightClick={handleAnchorClick}
                        registerAnchorRef={registerAnchorRef}
                        style={{ margin: '0 0 12px', fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px', lineHeight: 1.5 }}
                      />
                    ))}
                    <HighlightableParagraph
                      text={alert.vin}
                      paragraphIndex={alert.bodyParagraphs.length}
                      anchors={anchorsForParagraph(alert.bodyParagraphs.length)}
                      activeAnchorId={activeAnchorId}
                      onHighlightClick={handleAnchorClick}
                      registerAnchorRef={registerAnchorRef}
                      style={{ margin: '0 0 20px', fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: '#1f1d25', letterSpacing: '0.17px' }}
                    />

                    {featuredOffer && template && hasBackgrounds && (
                      <div style={{ marginBottom: 16 }}>
                        <p style={{ margin: '0 0 8px', fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px' }}>
                          The recommended monthly payment for this YMMT to dominate this market is:
                        </p>
                        {renderInlineAsset(featuredOffer)}
                      </div>
                    )}

                    <button style={{ width: '100%', border: 'none', borderRadius: 8, background: '#473bab', color: '#ffffff', padding: '10px 12px', fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 600, letterSpacing: '0.46px', cursor: 'pointer', marginBottom: 20 }}>
                      SEND TO MY PAID MEDIA TEAM
                    </button>

                    {otherOffers.length > 0 && template && hasBackgrounds && (
                      <>
                        <p style={{ margin: '0 0 8px', fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px' }}>
                          These are the other YMMTs that you selected on your enrollment form that you are currently running on paid media:
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          {otherOffers.map(renderInlineAsset)}
                        </div>
                      </>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8 }}>
                      <PictureAsPdfOutlined style={{ fontSize: 20, color: '#be0e1c', flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {currentProject.accountName.replace(/\s+/g, '-')}-Competitive-Intelligence-Report.pdf
                        </p>
                        <p style={{ margin: 0, fontSize: 10, fontFamily: 'Roboto, sans-serif', color: '#686576' }}>PDF · Competitive Intelligence Report</p>
                      </div>
                    </div>
                  </div>

                  <FloatingCommentColumn
                    entries={showComments ? columnEntries : []}
                    anchorRefs={anchorRefs}
                    containerRef={contentRef}
                    left={520 + 24}
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
                </div>
              </div>

              {/* Manual refresh — pinned top-left of the canvas, a sibling of the scrollable div so it
                  doesn't scroll with the content. */}
              <IconButton
                onClick={handleRefreshEmail}
                title="Refresh email"
                sx={{
                  position: 'absolute', top: 12, left: 16, zIndex: 5, background: '#ffffff',
                  border: '1px solid rgba(0,0,0,0.12)', padding: '6px',
                  boxShadow: '0px 1px 4px rgba(0,0,0,0.12)', '&:hover': { background: '#ffffff' },
                }}
              >
                <Refresh style={{ fontSize: 18, color: '#473bab', animation: isRefreshing ? 'spin 0.7s linear' : 'none' }} />
              </IconButton>

              {/* Comments visibility controls — pinned top-right of the canvas, a sibling of the scrollable
                  div (not a descendant of it) so it stays fixed in the corner instead of scrolling with the
                  canvas's content. */}
              <div style={{
                position: 'absolute', top: 12, right: 16, zIndex: 5, display: 'flex', alignItems: 'center', gap: 12,
                background: 'rgba(244,245,246,0.9)', backdropFilter: 'blur(4px)', borderRadius: 8, padding: '4px 8px',
              }}>
                <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#9c99a9' }}>
                  Highlight text or click anywhere on the assets to add comments.
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Switch
                    size="small"
                    checked={showComments}
                    onChange={() => setShowComments((v) => !v)}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#473bab' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { background: '#473bab' } }}
                  />
                  <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: showComments ? '#473bab' : '#686576' }}>
                    Show Comments
                  </span>
                </div>
                <IconButton size="small" onClick={(e) => setCommentsMenuAnchor(e.currentTarget)} sx={{ padding: '4px' }}>
                  <MoreVert style={{ fontSize: 18, color: '#686576' }} />
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

              {/* Floating approval widgets — pinned bottom-right of the canvas, stacked: email (alert-wide)
                  above assets (per-offer, individually approved) — same pinned-overlay pattern as Show Resolved.
                  A sibling of the scrollable canvas div above (not a descendant of it), so it stays fixed in the
                  corner instead of scrolling with the canvas's content. */}
              <div
                style={{
                  position: 'absolute', bottom: 16, right: 16,
                  zIndex: 10, display: 'flex', flexDirection: 'column', gap: 8,
                }}
              >
                <AssetApprovalWidget
                  assets={assetEntries}
                  approverNames={approverNames}
                  lastApprovedTimestamp={lastApprovedTimestamp}
                  lastRejectedActorName={lastRejectedEntry?.actorName}
                  lastRejectedTimestamp={lastRejectedEntry?.timestamp}
                  disabled={isArchived || isSent}
                  onApproveRemaining={handleApproveRemainingAssets}
                  onUndoAllReviews={handleUndoAllAssetReviews}
                  onSelectAsset={handleSelectAsset}
                />
                <EmailApprovalWidget
                  status={alert.emailStatus}
                  actorName={emailActivity?.actorName}
                  timestamp={emailActivity?.timestamp}
                  disabled={isArchived || isSent}
                  onApprove={() => setEmailReview(alert.id, 'approved')}
                  onRequestChanges={() => setEmailReview(alert.id, 'rejected')}
                  onApproveChanges={() => setEmailReview(alert.id, 'approved')}
                  onUndo={() => setEmailReview(alert.id, 'pending')}
                />
              </div>
            </div>

            {/* Right panel — Activity History or the offer editor, mutually exclusive */}
            {showHistory ? (
              <div style={{ width: 260, flexShrink: 0, borderLeft: '1px solid rgba(0,0,0,0.08)', overflowY: 'auto', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25' }}>Alert Activity History</span>
                  <IconButton size="small" onClick={() => setShowHistory(false)} sx={{ padding: '4px' }}>
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
            ) : editingOffer && !projectLocked ? (
              <AlertOfferEditPanel key={editingOffer.id} offer={editingOffer} onClose={() => setEditingOfferId(null)} />
            ) : null}
          </div>

          {/* Combined footer — appears once both halves are approved, offering the final Send action */}
          {alert.status === 'approved' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16, padding: '10px 16px', borderTop: '1px solid rgba(0,0,0,0.08)', flexShrink: 0, background: '#ffffff' }}>
              <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#686576' }}>Email and Assets approved • Ready to Send</span>
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
              <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#686576' }}>Email and Assets approved • Sent</span>
              <button onClick={onClose} style={{ ...footerButtonBase, background: 'transparent', color: '#473bab', border: '1px solid rgba(99,86,225,0.5)' }}>
                Close
              </button>
            </div>
          )}
        </div>
      </div>

      {cursorHint && (
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
      )}

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
          onEditOffer={() => setEditingOfferId(previewOffer.id)}
          onReply={handleReply}
          onToggleReaction={handleToggleReaction}
          approvalStatus={alert.offerReviews?.[previewOffer.id]?.status ?? 'pending'}
          approvalDisabled={isArchived || isSent}
          reviewActorName={alert.offerReviews?.[previewOffer.id]?.actorName}
          reviewTimestamp={alert.offerReviews?.[previewOffer.id]?.timestamp}
          onApprove={() => setOfferAssetReview(alert.id, previewOffer.id, 'approved')}
          onReject={() => setOfferAssetReview(alert.id, previewOffer.id, 'rejected')}
          onUndo={() => setOfferAssetReview(alert.id, previewOffer.id, 'pending')}
          currentIndex={previewIndex}
          totalCount={allAlertOffers.length}
          onPrev={handlePreviewPrev}
          onNext={handlePreviewNext}
        />
      )}
    </>,
    document.body,
  );
};
