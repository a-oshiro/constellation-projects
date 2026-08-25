import { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { IconButton } from '@mui/material';
import {
  Close, HistoryOutlined, PictureAsPdfOutlined, Replay, Send, ChevronLeft, ChevronRight,
  Lock, Remove, Add, CheckCircle, Cancel, RadioButtonUnchecked,
} from '@mui/icons-material';
import type { Alert, AlertActivityEntry, AlertComment, AlertCommentAnchor, EmailCommentAnchor, AssetCommentAnchor, Background, Offer, Template, ReviewStatus } from '../../data/types';
import { useProject } from '../../context/ProjectContext';
import { FilledTemplatePreview } from './FilledTemplatePreview';
import { formatRelativeTime } from '../../utils/relativeTime';
import { backgroundForOffer } from '../../utils/overviewAssets';
import { formatReviewerName } from '../../utils/alertReview';
import { FooterReviewControls } from './AlertReviewFooterFlow';
import { ReviewPanel, HighlightableParagraph, FloatingCommentButton, AssetPinOverlay, PENDING_ANCHOR_ID } from './AlertReviewPanel';
import { AlertElementsSection } from './AlertElementsSidebar';

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

/** Most recent activity entry for a given review track — powers both the banner and the Undo action. */
function lastActivityFor(alert: Alert, track: 'email' | 'assets'): AlertActivityEntry | undefined {
  const actions = track === 'email' ? ['email_approved', 'email_rejected'] : ['assets_approved', 'assets_rejected'];
  return [...alert.activity].reverse().find((e) => actions.includes(e.action));
}

const footerButtonBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer',
  borderRadius: 100, padding: '6px 16px', fontSize: 14, fontFamily: 'Roboto, sans-serif',
  fontWeight: 500, letterSpacing: '0.4px', lineHeight: '24px', flexShrink: 0,
};

interface EmailAssetPreviewProps {
  offer: Offer;
  template: Template;
  backgroundUrl: string;
}

/** The same filled ad-creative asset shown in the dialog's Assets panel, embedded inline in the email body. */
const EmailAssetPreview = ({ offer, template, backgroundUrl }: EmailAssetPreviewProps) => (
  <div style={{
    width: '100%', aspectRatio: `${template.width} / ${template.height}`, position: 'relative',
    borderRadius: 8, overflow: 'hidden', background: '#f0f2f4', flexShrink: 0,
  }}>
    <FilledTemplatePreview template={template} offer={offer} backgroundUrl={backgroundUrl} />
  </div>
);

interface ApprovalListItemProps {
  label: string;
  status: ReviewStatus;
  actorName?: string;
  timestamp?: number;
  active: boolean;
  onClick: () => void;
}

/** Left-column tab: switches the active track and reflects its review state via icon + description. */
const ApprovalListItem = ({ label, status, actorName, timestamp, active, onClick }: ApprovalListItemProps) => {
  const icon = status === 'pending'
    ? <RadioButtonUnchecked style={{ fontSize: 16, color: '#9c99a9', flexShrink: 0 }} />
    : status === 'approved'
      ? <CheckCircle style={{ fontSize: 16, color: '#4caf50', flexShrink: 0 }} />
      : <Cancel style={{ fontSize: 16, color: '#d2323f', flexShrink: 0 }} />;

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
        border: 'none', cursor: 'pointer', borderRadius: 12, padding: 12, boxSizing: 'border-box',
        background: active ? 'rgba(99,86,225,0.08)' : 'transparent', fontFamily: 'inherit',
      }}
    >
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px' }}>{label}</span>
        {status === 'pending' ? (
          <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px' }}>Awaiting review</span>
        ) : (
          <>
            <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px' }}>
              {status === 'approved' ? 'Approved' : 'Rejected'} by {formatReviewerName(actorName ?? '')}
            </span>
            <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px' }}>
              {timestamp ? formatRelativeTime(timestamp) : ''}
            </span>
          </>
        )}
      </div>
      {icon}
    </button>
  );
};

const zoomButtonStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 28,
  background: 'transparent', border: 'none', cursor: 'default', color: '#473bab', padding: 0,
};

/** Purely decorative — matches the design; zoom and in-project editing aren't wired up yet. */
const AssetToolbarRow = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', flexShrink: 0 }}>
    <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid rgba(99,86,225,0.5)', borderRadius: 100, overflow: 'hidden' }}>
      <button style={zoomButtonStyle}><Remove style={{ fontSize: 16 }} /></button>
      <div style={{ width: 1, height: 20, background: 'rgba(99,86,225,0.5)' }} />
      <button style={zoomButtonStyle}><Replay style={{ fontSize: 15 }} /></button>
      <div style={{ width: 1, height: 20, background: 'rgba(99,86,225,0.5)' }} />
      <button style={zoomButtonStyle}><Add style={{ fontSize: 16 }} /></button>
    </div>
    <button
      disabled
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'default',
        background: 'transparent', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 100,
        padding: '4px 10px', fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#9c99a9',
      }}
    >
      Edit In Project
      <Lock style={{ fontSize: 14 }} />
    </button>
  </div>
);

interface ReviewModeToggleProps {
  mode: 'panel' | 'footer';
  onChange: (mode: 'panel' | 'footer') => void;
}

/** Floating widget (bottom-left of the viewport) for A/B-ing the two review UIs — the existing right side panel vs. the newer main-pane footer flow. */
const ReviewModeToggle = ({ mode, onChange }: ReviewModeToggleProps) => {
  const segmentBase: React.CSSProperties = {
    border: 'none', cursor: 'pointer', borderRadius: 100, padding: '6px 12px', fontSize: 12,
    fontFamily: 'Roboto, sans-serif', fontWeight: 500, letterSpacing: '0.4px', whiteSpace: 'nowrap',
  };

  return (
    <div
      style={{
        position: 'fixed', left: 24, bottom: 24, zIndex: 100010,
        background: '#ffffff', borderRadius: 12, padding: 8,
        boxShadow: '0px 8px 24px rgba(0,0,0,0.18), 0px 2px 8px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}
    >
      <span style={{ fontSize: 10, fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: '#9c99a9', letterSpacing: '0.6px', paddingLeft: 4 }}>
        REVIEW LAYOUT
      </span>
      <div style={{ display: 'flex', background: '#f0f2f4', borderRadius: 100, padding: 3, gap: 2 }}>
        <button
          onClick={() => onChange('panel')}
          style={{ ...segmentBase, background: mode === 'panel' ? '#473bab' : 'transparent', color: mode === 'panel' ? '#ffffff' : '#686576' }}
        >
          Side Panel
        </button>
        <button
          onClick={() => onChange('footer')}
          style={{ ...segmentBase, background: mode === 'footer' ? '#473bab' : 'transparent', color: mode === 'footer' ? '#ffffff' : '#686576' }}
        >
          Footer
        </button>
      </div>
    </div>
  );
};

interface AlertDialogProps {
  alert: Alert;
  onClose: () => void;
}

export const AlertDialog = ({ alert, onClose }: AlertDialogProps) => {
  const { offers, currentProject, setEmailReview, setAssetsReview, rebuildAlert, sendAlert, reviewAlertTrack, addAlertComment, toggleAlertCommentResolved } = useProject();
  const [activeTab, setActiveTab] = useState<'email' | 'assets'>('email');
  const [showHistory, setShowHistory] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  /** Lets the two review UIs (right panel vs. main-pane footer) be toggled and compared side by side. */
  const [reviewMode, setReviewMode] = useState<'panel' | 'footer'>('panel');

  // Side Panel commenting: a highlight/pin the user just created but hasn't sent a comment for yet,
  // and the id of a comment whose highlight/pin was just clicked (or vice versa) for a brief jump/emphasis.
  const [pendingAnchor, setPendingAnchor] = useState<AlertCommentAnchor | undefined>(undefined);
  const [activeAnchorId, setActiveAnchorId] = useState<string | null>(null);
  const [floatingSelection, setFloatingSelection] = useState<{ top: number; left: number; anchor: EmailCommentAnchor } | null>(null);
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
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // Switching tabs or the asset carousel invalidates an in-progress (unsent) anchor — simplest to
  // drop it rather than persist a draft across a context it no longer applies to. Adjusted during
  // render (React's recommended "reset on prop/state change" pattern) rather than in an effect, to
  // avoid an extra cascading render.
  const [prevTab, setPrevTab] = useState(activeTab);
  const [prevPreviewIndex, setPrevPreviewIndex] = useState(previewIndex);
  if (activeTab !== prevTab || previewIndex !== prevPreviewIndex) {
    setPrevTab(activeTab);
    setPrevPreviewIndex(previewIndex);
    setPendingAnchor(undefined);
    setFloatingSelection(null);
  }

  // Bidirectional jump/emphasis: scroll both the comment row and its highlight/pin into view, then
  // clear the emphasis after a beat — no new dependency, just scrollIntoView + a timed state reset.
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
  const rowOffers = featuredOffer ? [featuredOffer, ...otherOffers] : otherOffers;

  const template = currentProject.templates[0];
  const hasBackgrounds = currentProject.backgrounds.length > 0;
  const bgFor = (o: Offer) => backgroundForOffer(o, offers, currentProject.backgrounds);

  // Backgrounds actually utilized by this alert's assets, deduped — powers the Styles accordion grid.
  const styleBackgrounds: Background[] = [];
  const seenBgIds = new Set<string>();
  for (const o of rowOffers) {
    const bg = bgFor(o);
    if (bg && !seenBgIds.has(bg.id)) { seenBgIds.add(bg.id); styleBackgrounds.push(bg); }
  }

  const previewCount = rowOffers.length;
  const previewOffer = rowOffers[Math.min(previewIndex, Math.max(previewCount - 1, 0))];
  const showPreviewNav = previewCount > 1;
  const goToPrevPreview = () => setPreviewIndex((i) => (i - 1 + previewCount) % previewCount);
  const goToNextPreview = () => setPreviewIndex((i) => (i + 1) % previewCount);

  const historyEntries = [...alert.activity].reverse();

  const emailActivity = lastActivityFor(alert, 'email');
  const assetsActivity = lastActivityFor(alert, 'assets');
  const isSent = alert.status === 'sent';
  const isArchived = !!alert.archivedAt;

  const handleRebuild = () => { rebuildAlert(alert.id); onClose(); };
  const handleSend = () => { sendAlert(alert.id); onClose(); };
  const toggleHistory = () => setShowHistory((v) => !v);

  const activeStatus = activeTab === 'email' ? alert.emailStatus : alert.assetsStatus;
  const activeActivity = activeTab === 'email' ? emailActivity : assetsActivity;
  // Old-shape single-comment lookup, kept only to feed the untouched Footer flow (`FooterReviewControls`).
  const activeComment = (alert.comments ?? []).find((c) => c.track === activeTab);
  // New multi-comment list (oldest -> newest) powering the Side Panel's comment thread.
  const activeComments = (alert.comments ?? []).filter((c) => c.track === activeTab);

  const headerStatusText = activeStatus === 'pending' || !activeActivity
    ? `Generated ${formatRelativeTime(alert.createdAt)} by AI AutoAgent`
    : `${activeTab === 'email' ? 'Email' : 'Assets'} ${activeStatus === 'approved' ? 'approved' : 'rejected'} ${formatRelativeTime(activeActivity.timestamp)} by ${formatReviewerName(activeActivity.actorName)}`;

  const emailAnchors = (alert.comments ?? [])
    .filter((c): c is AlertComment & { anchor: EmailCommentAnchor } => c.track === 'email' && c.anchor?.kind === 'email')
    .map((c) => ({ anchor: c.anchor, commentId: c.id }));
  // A highlight the user just made but hasn't sent a comment for yet — shown immediately, non-interactive,
  // and removed the moment it's cancelled or sent (since it then either disappears or is replaced by the
  // real, now-committed anchor above).
  const anchorsForParagraph = (index: number) => {
    const committed = emailAnchors.filter((a) => a.anchor.paragraphIndex === index);
    if (pendingAnchor?.kind === 'email' && pendingAnchor.paragraphIndex === index) {
      return [...committed, { anchor: pendingAnchor, commentId: PENDING_ANCHOR_ID }];
    }
    return committed;
  };

  const assetAnchors = previewOffer
    ? (alert.comments ?? [])
        .filter((c): c is AlertComment & { anchor: AssetCommentAnchor } => c.track === 'assets' && c.anchor?.kind === 'asset' && c.anchor.offerId === previewOffer.id)
        .map((c) => ({ anchor: c.anchor, commentId: c.id }))
    : [];
  const pendingAssetPin = pendingAnchor?.kind === 'asset' && pendingAnchor.offerId === previewOffer?.id ? pendingAnchor : undefined;

  const handleAnchorClick = (commentId: string) => setActiveAnchorId(commentId);

  const jumpToAnchorFromComment = (comment: AlertComment) => {
    if (!comment.anchor) return;
    if (comment.anchor.kind === 'asset') {
      const offerId = comment.anchor.offerId;
      const idx = rowOffers.findIndex((o) => o.id === offerId);
      if (idx !== -1) setPreviewIndex(idx);
    }
    setActiveAnchorId(comment.id);
  };

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

  const handleStartEmailComment = () => {
    if (!floatingSelection) return;
    setPendingAnchor(floatingSelection.anchor);
    setFloatingSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleAssetClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!previewOffer) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    setPendingAnchor({ kind: 'asset', offerId: previewOffer.id, xPct, yPct });
  };

  const handleSendComment = (text: string, mentionedNames: string[]) => {
    addAlertComment(alert.id, activeTab, { text, mentionedNames, anchor: pendingAnchor });
    setPendingAnchor(undefined);
  };

  const handleApprove = () => (activeTab === 'email' ? setEmailReview(alert.id, 'approved') : setAssetsReview(alert.id, 'approved'));
  const handleReject = () => (activeTab === 'email' ? setEmailReview(alert.id, 'rejected') : setAssetsReview(alert.id, 'rejected'));

  return ReactDOM.createPortal(
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 100000, background: 'rgba(0,0,0,0.4)' }}
      />
      <div
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
            {headerStatusText}
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

            {/* Approvals sidebar */}
            <div style={{ width: 320, flexShrink: 0, borderRight: '1px solid rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', padding: 12, boxSizing: 'border-box', overflowY: 'auto' }}>
              <span style={{ margin: '0 0 8px', padding: '0 8px', fontSize: 16, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.15px' }}>Approvals</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <ApprovalListItem
                  label="Email Content"
                  status={alert.emailStatus}
                  actorName={emailActivity?.actorName}
                  timestamp={emailActivity?.timestamp}
                  active={activeTab === 'email'}
                  onClick={() => setActiveTab('email')}
                />
                <ApprovalListItem
                  label="Assets"
                  status={alert.assetsStatus}
                  actorName={assetsActivity?.actorName}
                  timestamp={assetsActivity?.timestamp}
                  active={activeTab === 'assets'}
                  onClick={() => setActiveTab('assets')}
                />
              </div>

              <div style={{ marginTop: 16 }}>
                <span style={{ display: 'block', margin: '0 0 8px', padding: '0 8px', fontSize: 10, fontWeight: 700, color: '#9c99a9', letterSpacing: '0.6px', fontFamily: 'Roboto, sans-serif' }}>
                  ALERT ELEMENTS
                </span>
                <AlertElementsSection
                  rowOffers={rowOffers}
                  templates={currentProject.templates}
                  styleBackgrounds={styleBackgrounds}
                  onClose={onClose}
                />
              </div>
            </div>

            {/* Main content */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', flexShrink: 0, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 16, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.15px' }}>
                  {activeTab === 'email' ? 'Email Content' : 'Assets'}
                </span>
              </div>

              {activeTab === 'email' ? (
                <div style={{ flex: 1, overflowY: 'auto', background: '#F4F5F6', padding: 16, justifyContent: 'center', display: 'flex' }}>
                  <div
                    ref={emailBodyRef}
                    onMouseUp={handleEmailMouseUp}
                    style={{ background: '#ffffff', borderRadius: 8, padding: '20px 20px 32px', width: 440, maxWidth: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', height: 'fit-content' }}
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
                        <EmailAssetPreview offer={featuredOffer} template={template} backgroundUrl={bgFor(featuredOffer)!.url} />
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 20 }}>
                          {otherOffers.map((o) => <EmailAssetPreview key={o.id} offer={o} template={template} backgroundUrl={bgFor(o)!.url} />)}
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
                </div>
              ) : (
                <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 12, background: '#f0f2f4', padding: 16 }}>
                  <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {showPreviewNav && (
                      <IconButton
                        onClick={goToPrevPreview}
                        sx={{
                          position: 'absolute', left: 4, zIndex: 2, background: '#ffffff', padding: '8px',
                          boxShadow: '0px 1px 5px 0px rgba(0,0,0,0.12), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 3px 1px -2px rgba(0,0,0,0.2)',
                          '&:hover': { background: '#ffffff' },
                        }}
                      >
                        <ChevronLeft style={{ fontSize: 24, color: '#1f1d25' }} />
                      </IconButton>
                    )}

                    {previewOffer && template && hasBackgrounds ? (
                      <div
                        onClick={handleAssetClick}
                        style={{
                          width: '100%', height: '100%', maxWidth: 575, maxHeight: 575, cursor: 'crosshair',
                          position: 'relative', borderRadius: 8, overflow: 'hidden', background: '#f0f2f4',
                        }}
                      >
                        <FilledTemplatePreview template={template} offer={previewOffer} backgroundUrl={bgFor(previewOffer)!.url} />
                        <AssetPinOverlay
                          pins={assetAnchors}
                          pendingPin={pendingAssetPin}
                          activeAnchorId={activeAnchorId}
                          onPinClick={handleAnchorClick}
                          registerAnchorRef={registerAnchorRef}
                        />
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576' }}>No assets to preview.</span>
                    )}

                    {showPreviewNav && (
                      <IconButton
                        onClick={goToNextPreview}
                        sx={{
                          position: 'absolute', right: 4, zIndex: 2, background: '#ffffff', padding: '8px',
                          boxShadow: '0px 1px 5px 0px rgba(0,0,0,0.12), 0px 2px 2px 0px rgba(0,0,0,0.14), 0px 3px 1px -2px rgba(0,0,0,0.2)',
                          '&:hover': { background: '#ffffff' },
                        }}
                      >
                        <ChevronRight style={{ fontSize: 24, color: '#1f1d25' }} />
                      </IconButton>
                    )}
                  </div>

                  <AssetToolbarRow />
                </div>
              )}

              {reviewMode === 'footer' && (
                <FooterReviewControls
                  key={activeTab}
                  trackLabel={activeTab === 'email' ? 'Email' : 'Assets'}
                  status={activeStatus}
                  comment={activeComment}
                  actorName={activeActivity?.actorName}
                  timestamp={activeActivity?.timestamp}
                  locked={isSent}
                  disabled={isArchived}
                  onApprove={(input) => reviewAlertTrack(alert.id, activeTab, 'approved', input)}
                  onReject={(input) => reviewAlertTrack(alert.id, activeTab, 'rejected', input)}
                  onUndo={() => (activeTab === 'email' ? setEmailReview(alert.id, 'pending') : setAssetsReview(alert.id, 'pending'))}
                  onRebuild={handleRebuild}
                />
              )}
            </div>

            {/* Right panel — the active track's Review panel (panel mode only), or Activity History, mutually exclusive */}
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
            ) : reviewMode === 'panel' ? (
              <ReviewPanel
                key={activeTab}
                trackLabel={activeTab === 'email' ? 'Email' : 'Assets'}
                status={activeStatus}
                comments={activeComments}
                actorName={activeActivity?.actorName}
                timestamp={activeActivity?.timestamp}
                locked={isSent}
                disabled={isArchived}
                activeAnchorId={activeAnchorId}
                pendingAnchor={pendingAnchor}
                onCancelAnchor={() => setPendingAnchor(undefined)}
                registerCommentRef={registerCommentRef}
                onJumpToAnchor={jumpToAnchorFromComment}
                onToggleCommentResolved={(commentId) => toggleAlertCommentResolved(alert.id, commentId)}
                onSendComment={handleSendComment}
                onApprove={handleApprove}
                onReject={handleReject}
                onUndo={() => (activeTab === 'email' ? setEmailReview(alert.id, 'pending') : setAssetsReview(alert.id, 'pending'))}
                onRebuild={handleRebuild}
              />
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

      {floatingSelection && (
        <FloatingCommentButton top={floatingSelection.top} left={floatingSelection.left} onClick={handleStartEmailComment} />
      )}

      <ReviewModeToggle mode={reviewMode} onChange={setReviewMode} />
    </>,
    document.body,
  );
};
