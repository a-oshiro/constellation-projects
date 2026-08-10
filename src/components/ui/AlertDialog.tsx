import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { IconButton } from '@mui/material';
import {
  Close, HistoryOutlined, PictureAsPdfOutlined, Check, Replay, Send, ChevronLeft, ChevronRight,
  Lock, Remove, Add, CheckCircle, Cancel, AutoAwesome,
} from '@mui/icons-material';
import type { Alert, AlertActivityEntry, Offer, Template, ReviewStatus } from '../../data/types';
import { useProject } from '../../context/ProjectContext';
import { FilledTemplatePreview } from './FilledTemplatePreview';
import { formatRelativeTime } from '../../utils/relativeTime';
import { CATEGORY_STYLE, formatReviewerName } from '../../utils/alertReview';

const ACTION_LABEL: Record<AlertActivityEntry['action'], string> = {
  generated: 'Generated',
  email_approved: 'Email Approved',
  email_rejected: 'Email Rejected',
  assets_approved: 'Assets Approved',
  assets_rejected: 'Assets Rejected',
  rebuilt: 'Rebuilt',
  sent: 'Sent',
};

/** Most recent activity entry for a given review track — powers both the footer banner and the Undo action. */
function lastActivityFor(alert: Alert, track: 'email' | 'assets'): AlertActivityEntry | undefined {
  const actions = track === 'email' ? ['email_approved', 'email_rejected'] : ['assets_approved', 'assets_rejected'];
  return [...alert.activity].reverse().find((e) => actions.includes(e.action));
}

const footerButtonBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer',
  borderRadius: 100, padding: '6px 16px', fontSize: 14, fontFamily: 'Roboto, sans-serif',
  fontWeight: 500, letterSpacing: '0.4px', lineHeight: '24px', flexShrink: 0,
};

const PaneTitle = ({ title, right }: { title: string; right?: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 16px', borderBottom: '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }}>
    <span style={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.1px' }}>
      {title}
    </span>
    {right}
  </div>
);

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

interface ReviewFooterProps {
  status: ReviewStatus;
  nounLabel: string;
  shortLabel: string;
  actorName?: string;
  timestamp?: number;
  /** Once the alert has been sent, the decision is final — hide Undo/Rebuild. */
  locked?: boolean;
  onApprove: () => void;
  onReject: () => void;
  onUndo: () => void;
  onRebuild: () => void;
}

/** Per-half approve/reject controls, or the approved/rejected banner once a decision has been made. */
const ReviewFooter = ({ status, nounLabel, shortLabel, actorName, timestamp, locked, onApprove, onReject, onUndo, onRebuild }: ReviewFooterProps) => {
  if (status === 'pending') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, height: 60, boxSizing: 'border-box', padding: '0 16px', borderTop: '1px solid rgba(0,0,0,0.08)', flexShrink: 0 }}>
        <button onClick={onReject} style={{ ...footerButtonBase, background: '#ffffff', border: '1px solid rgba(210,50,63,0.5)', color: '#d2323f' }}>
          <Close style={{ fontSize: 16 }} />
          Reject
        </button>
        <button onClick={onApprove} style={{ ...footerButtonBase, background: '#4caf50', color: '#ffffff' }}>
          <Check style={{ fontSize: 16 }} />
          Approve {shortLabel}
        </button>
      </div>
    );
  }

  const isApproved = status === 'approved';
  const accentColor = isApproved ? '#1b5e20' : '#d2323f';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
      height: 60, boxSizing: 'border-box', padding: '0 16px', flexShrink: 0, background: isApproved ? '#e8f5e9' : '#fce8ea',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flexWrap: 'wrap' }}>
        {isApproved
          ? <CheckCircle style={{ fontSize: 18, color: '#4caf50', flexShrink: 0 }} />
          : <Cancel style={{ fontSize: 18, color: '#d2323f', flexShrink: 0 }} />}
        <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: accentColor, whiteSpace: 'nowrap' }}>
          {nounLabel} {isApproved ? 'approved' : 'rejected'}
        </span>
        <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', whiteSpace: 'nowrap' }}>
          by {formatReviewerName(actorName ?? '')} • {timestamp ? formatRelativeTime(timestamp) : ''}
        </span>
      </div>
      {!locked && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <button
            onClick={onUndo}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: accentColor, textDecoration: 'underline' }}
          >
            Undo {isApproved ? 'Approval' : 'Rejection'}
          </button>
          {!isApproved && (
            <button onClick={onRebuild} style={{ ...footerButtonBase, background: '#473bab', color: '#ffffff', padding: '6px 14px' }}>
              <Replay style={{ fontSize: 16 }} />
              Rebuild
            </button>
          )}
        </div>
      )}
    </div>
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

interface AlertDialogProps {
  alert: Alert;
  onClose: () => void;
}

export const AlertDialog = ({ alert, onClose }: AlertDialogProps) => {
  const { offers, currentProject, setEmailReview, setAssetsReview, rebuildAlert, sendAlert } = useProject();
  const [showHistory, setShowHistory] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const findOffer = (id: string) => offers.find((o) => o.id === id);
  const featuredOffer = findOffer(alert.featuredOfferId);
  const otherOffers = alert.otherOfferIds.map(findOffer).filter((o): o is Offer => Boolean(o));
  const rowOffers = featuredOffer ? [featuredOffer, ...otherOffers] : otherOffers;

  const template = currentProject.templates[0];
  const background = currentProject.backgrounds[0];

  const previewCount = rowOffers.length;
  const previewOffer = rowOffers[Math.min(previewIndex, Math.max(previewCount - 1, 0))];
  const showPreviewNav = previewCount > 1;
  const goToPrevPreview = () => setPreviewIndex((i) => (i - 1 + previewCount) % previewCount);
  const goToNextPreview = () => setPreviewIndex((i) => (i + 1) % previewCount);

  const historyEntries = [...alert.activity].reverse();
  const categoryStyle = CATEGORY_STYLE[alert.category];

  const emailActivity = lastActivityFor(alert, 'email');
  const assetsActivity = lastActivityFor(alert, 'assets');
  const isSent = alert.status === 'sent';

  const handleRebuild = () => { rebuildAlert(alert.id); onClose(); };
  const handleSend = () => { sendAlert(alert.id); onClose(); };

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
            Generated {formatRelativeTime(alert.createdAt)} by AI AutoAgent
          </span>
          <IconButton size="small" onClick={() => setShowHistory((v) => !v)} sx={{ padding: '5px', background: showHistory ? 'rgba(71,59,171,0.1)' : 'transparent' }}>
            <HistoryOutlined style={{ fontSize: 20, color: showHistory ? '#473bab' : '#1f1d25' }} />
          </IconButton>
          <IconButton size="small" onClick={onClose} sx={{ padding: '5px', background: 'rgba(17,16,20,0.08)', borderRadius: '100px' }}>
            <Close style={{ fontSize: 18, color: '#1f1d25' }} />
          </IconButton>
        </div>

        {/* Body — split evenly between Email and Assets, each with its own independent review footer */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

            {/* Email half */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid rgba(0,0,0,0.08)' }}>
              <PaneTitle
                title="Email"
                right={(
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', background: categoryStyle.background, color: categoryStyle.color,
                      borderRadius: 8, padding: '2px 8px', fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 400, letterSpacing: '0.4px', whiteSpace: 'nowrap',
                    }}>
                      {alert.category}
                    </span>
                    <AutoAwesome style={{ fontSize: 16, color: '#473bab' }} />
                  </div>
                )}
              />
              <div style={{ flex: 1, overflowY: 'auto', background: '#F4F5F6', padding: 16, justifyContent: 'center', display: 'flex' }}>
                <div style={{ background: '#ffffff', borderRadius: 8, padding: '20px 20px 32px', width: 440, maxWidth: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', height: 'fit-content' }}>
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
                    <p key={i} style={{ margin: '0 0 12px', fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px', lineHeight: 1.5 }}>
                      {p}
                    </p>
                  ))}
                  <p style={{ margin: '0 0 20px', fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: '#1f1d25', letterSpacing: '0.17px' }}>
                    {alert.vin}
                  </p>

                  {featuredOffer && template && background && (
                    <div style={{ marginBottom: 16 }}>
                      <p style={{ margin: '0 0 8px', fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px' }}>
                        The recommended monthly payment for this YMMT to dominate this market is:
                      </p>
                      <EmailAssetPreview offer={featuredOffer} template={template} backgroundUrl={background.url} />
                    </div>
                  )}

                  <button style={{ width: '100%', border: 'none', borderRadius: 8, background: '#473bab', color: '#ffffff', padding: '10px 12px', fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 600, letterSpacing: '0.46px', cursor: 'pointer', marginBottom: 20 }}>
                    SEND TO MY PAID MEDIA TEAM
                  </button>

                  {otherOffers.length > 0 && template && background && (
                    <>
                      <p style={{ margin: '0 0 8px', fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px' }}>
                        These are the other YMMTs that you selected on your enrollment form that you are currently running on paid media:
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 20 }}>
                        {otherOffers.map((o) => <EmailAssetPreview key={o.id} offer={o} template={template} backgroundUrl={background.url} />)}
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

              <ReviewFooter
                status={alert.emailStatus}
                nounLabel="Email content"
                shortLabel="Email"
                actorName={emailActivity?.actorName}
                timestamp={emailActivity?.timestamp}
                locked={isSent}
                onApprove={() => setEmailReview(alert.id, 'approved')}
                onReject={() => setEmailReview(alert.id, 'rejected')}
                onUndo={() => setEmailReview(alert.id, 'pending')}
                onRebuild={handleRebuild}
              />
            </div>

            {/* Assets half */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <PaneTitle title="Assets" />
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

                  {previewOffer && template && background ? (
                    <div style={{
                      width: '100%', height: '100%', maxWidth: 575, maxHeight: 575,
                      position: 'relative', borderRadius: 8, overflow: 'hidden', background: '#f0f2f4',
                    }}>
                      <FilledTemplatePreview template={template} offer={previewOffer} backgroundUrl={background.url} />
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

              <ReviewFooter
                status={alert.assetsStatus}
                nounLabel="Assets"
                shortLabel="Assets"
                actorName={assetsActivity?.actorName}
                timestamp={assetsActivity?.timestamp}
                locked={isSent}
                onApprove={() => setAssetsReview(alert.id, 'approved')}
                onReject={() => setAssetsReview(alert.id, 'rejected')}
                onUndo={() => setAssetsReview(alert.id, 'pending')}
                onRebuild={handleRebuild}
              />
            </div>

            {/* Activity history */}
            {showHistory && (
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
            )}
          </div>

          {/* Combined footer — appears once both halves are approved, offering the final Send action */}
          {alert.status === 'approved' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16, padding: '10px 16px', borderTop: '1px solid rgba(0,0,0,0.08)', flexShrink: 0, background: '#ffffff' }}>
              <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#686576' }}>Email and Assets approved • Ready to Send</span>
              <button onClick={handleSend} style={{ ...footerButtonBase, background: '#473bab', color: '#ffffff' }}>
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
    </>,
    document.body,
  );
};
