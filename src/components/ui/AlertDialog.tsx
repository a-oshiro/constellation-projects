import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { IconButton, Autocomplete, TextField, Chip, Avatar } from '@mui/material';
import {
  Close, HistoryOutlined, PictureAsPdfOutlined, Check, Replay, Send, ChevronLeft, ChevronRight,
  Lock, Remove, Add, CheckCircle, Cancel, RadioButtonUnchecked,
} from '@mui/icons-material';
import type { Alert, AlertActivityEntry, AlertComment, Offer, Template, ReviewStatus } from '../../data/types';
import { useProject } from '../../context/ProjectContext';
import { FilledTemplatePreview } from './FilledTemplatePreview';
import { formatRelativeTime } from '../../utils/relativeTime';
import { backgroundForOffer } from '../../utils/overviewAssets';
import { formatReviewerName } from '../../utils/alertReview';
import { MOCK_TEAMMATES } from '../../data/mockData';
import type { Teammate } from '../../data/mockData';

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

/** Small pill buttons used next to the pane title (Approve/Reject/Add Comment) and inline in the review banner (Rebuild). */
const actionPillBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', cursor: 'pointer',
  borderRadius: 100, padding: '4px 10px', fontSize: 13, fontFamily: 'Roboto, sans-serif',
  fontWeight: 500, letterSpacing: '0.46px', lineHeight: '22px', flexShrink: 0, whiteSpace: 'nowrap',
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

interface CompactReviewBannerProps {
  status: Exclude<ReviewStatus, 'pending'>;
  nounLabel: string;
  actorName?: string;
  timestamp?: number;
  /** Once the alert has been sent, the decision is final — hide Undo/Rebuild. */
  locked?: boolean;
  /** Archived alerts are read-only — every CTA stays visible but disabled. */
  disabled?: boolean;
  onUndo: () => void;
  onRebuild: () => void;
}

/** Compact vertical banner shown inside the review panel once a track has been approved or rejected. */
const CompactReviewBanner = ({ status, nounLabel, actorName, timestamp, locked, disabled, onUndo, onRebuild }: CompactReviewBannerProps) => {
  const isApproved = status === 'approved';
  const accentColor = isApproved ? '#1b5e20' : '#d2323f';

  return (
    <div style={{ display: 'flex', gap: 10, padding: 12, borderRadius: 8, background: isApproved ? '#e8f5e9' : '#fce8ea' }}>
      {isApproved
        ? <CheckCircle style={{ fontSize: 18, color: '#4caf50', flexShrink: 0 }} />
        : <Cancel style={{ fontSize: 18, color: '#d2323f', flexShrink: 0 }} />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: accentColor }}>
          {nounLabel} {isApproved ? 'approved' : 'rejected'}
        </span>
        <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576' }}>
          by {formatReviewerName(actorName ?? '')} • {timestamp ? formatRelativeTime(timestamp) : ''}
        </span>
        {!locked && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 2 }}>
            <button
              disabled={disabled}
              onClick={onUndo}
              style={{
                background: 'none', border: 'none', padding: 0, fontSize: 13, fontFamily: 'Roboto, sans-serif',
                fontWeight: 500, color: accentColor, textDecoration: 'underline',
                opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              Undo {isApproved ? 'Approval' : 'Rejection'}
            </button>
            {!isApproved && (
              <button disabled={disabled} onClick={onRebuild} style={{ ...actionPillBase, background: '#473bab', color: '#ffffff', padding: '4px 12px', opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}>
                <Replay style={{ fontSize: 14 }} />
                Rebuild
              </button>
            )}
          </div>
        )}
      </div>
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

const inputLabelStyle: React.CSSProperties = { margin: '0 0 4px', fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.15px' };
const inputHelperStyle: React.CSSProperties = { margin: '4px 0 0', fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px', lineHeight: 1.5 };

/** The dialog's own backdrop/panel sit at z-index 100000/100001, above MUI's default popper z-index — without this, an open Autocomplete's option list renders behind the dialog and is unclickable. */
const autocompletePopperProps = { slotProps: { popper: { style: { zIndex: 100002 } } } };

/** Reconstructs a Teammate for a stored comment field — falls back gracefully if the name no longer matches a roster entry. */
const teammateFor = (name: string, avatarUrl?: string): Teammate => MOCK_TEAMMATES.find((t) => t.name === name) ?? { name, avatarUrl: avatarUrl ?? '' };

interface ReviewPanelProps {
  trackLabel: string;
  status: ReviewStatus;
  /** The existing comment for this track, if any Assignee/Mentions/Comment were saved with a prior decision. */
  comment?: AlertComment;
  actorName?: string;
  timestamp?: number;
  locked?: boolean;
  disabled?: boolean;
  onApprove: (input: { text: string; assigneeName?: string; assigneeAvatar?: string; mentionedNames: string[] }) => void;
  onReject: (input: { text: string; assigneeName?: string; assigneeAvatar?: string; mentionedNames: string[] }) => void;
  onUndo: () => void;
  onRebuild: () => void;
}

/**
 * Combined right-side review panel for one track: optional Assignee/Mentioned Teammates/Comment
 * fields plus the Approve/Reject decision. Submitting a decision saves the fields alongside it and
 * disables them; undoing the decision (via the compact banner that replaces the buttons) re-enables
 * the fields without losing what was entered.
 */
const ReviewPanel = ({ trackLabel, status, comment, actorName, timestamp, locked, disabled, onApprove, onReject, onUndo, onRebuild }: ReviewPanelProps) => {
  const [assignee, setAssignee] = useState<Teammate | null>(comment?.assigneeName ? teammateFor(comment.assigneeName, comment.assigneeAvatar) : null);
  const [mentioned, setMentioned] = useState<Teammate[]>((comment?.mentionedNames ?? []).map((n) => teammateFor(n)));
  const [text, setText] = useState(comment?.text ?? '');
  const isPending = status === 'pending';
  const fieldsDisabled = !!disabled || !isPending;

  const buildInput = () => ({
    text: text.trim(),
    assigneeName: assignee?.name,
    assigneeAvatar: assignee?.avatarUrl,
    mentionedNames: mentioned.map((m) => m.name),
  });

  return (
    <div style={{ width: 320, flexShrink: 0, borderLeft: '1px solid rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <div style={{ padding: '12px 16px', flexShrink: 0 }}>
        <span style={{ fontSize: 16, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.15px' }}>{trackLabel} Review</span>
      </div>
      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <p style={inputLabelStyle}>Assignee</p>
          <Autocomplete
            {...autocompletePopperProps}
            size="small"
            options={MOCK_TEAMMATES}
            getOptionLabel={(o) => o.name}
            value={assignee}
            onChange={(_, v) => setAssignee(v)}
            disabled={fieldsDisabled}
            renderOption={(props, option) => (
              <li {...props} key={option.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar src={option.avatarUrl} sx={{ width: 20, height: 20 }} />
                {option.name}
              </li>
            )}
            renderInput={(params) => <TextField {...params} placeholder="Select a teammate" />}
          />
          <p style={inputHelperStyle}>One person is responsible for completing the task.</p>
        </div>

        <div>
          <p style={inputLabelStyle}>Mentioned Teammates</p>
          <Autocomplete
            {...autocompletePopperProps}
            multiple
            size="small"
            options={MOCK_TEAMMATES}
            getOptionLabel={(o) => o.name}
            value={mentioned}
            onChange={(_, v) => setMentioned(v)}
            disabled={fieldsDisabled}
            renderOption={(props, option) => (
              <li {...props} key={option.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar src={option.avatarUrl} sx={{ width: 20, height: 20 }} />
                {option.name}
              </li>
            )}
            renderTags={(value, getTagProps) => value.map((option, index) => (
              <Chip
                {...getTagProps({ index })}
                key={option.name}
                size="small"
                avatar={<Avatar src={option.avatarUrl} />}
                label={option.name}
              />
            ))}
            renderInput={(params) => <TextField {...params} placeholder="Mention teammates" />}
          />
          <p style={inputHelperStyle}>Mentioned teammates can follow the task, but they are not responsible for completing it.</p>
        </div>

        <div>
          <p style={inputLabelStyle}>Comment</p>
          <TextField
            multiline
            minRows={3}
            fullWidth
            size="small"
            placeholder="Write a comment…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={fieldsDisabled}
          />
          <p style={inputHelperStyle}>Your comment is included in the notification the assignee receives.</p>
        </div>

        {isPending ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              disabled={disabled}
              onClick={() => onReject(buildInput())}
              style={{ ...actionPillBase, background: '#ffffff', border: '1px solid rgba(210,50,63,0.5)', color: '#d2323f', opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
            >
              <Close style={{ fontSize: 16 }} />
              Reject
            </button>
            <button
              disabled={disabled}
              onClick={() => onApprove(buildInput())}
              style={{ ...actionPillBase, background: '#4caf50', color: '#ffffff', opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
            >
              <Check style={{ fontSize: 16 }} />
              Approve {trackLabel}
            </button>
          </div>
        ) : (
          <CompactReviewBanner
            status={status as Exclude<ReviewStatus, 'pending'>}
            nounLabel={trackLabel === 'Email' ? 'Email content' : 'Assets'}
            actorName={actorName}
            timestamp={timestamp}
            locked={locked}
            disabled={disabled}
            onUndo={onUndo}
            onRebuild={onRebuild}
          />
        )}
      </div>
    </div>
  );
};

interface AlertDialogProps {
  alert: Alert;
  onClose: () => void;
}

export const AlertDialog = ({ alert, onClose }: AlertDialogProps) => {
  const { offers, currentProject, setEmailReview, setAssetsReview, rebuildAlert, sendAlert, reviewAlertTrack } = useProject();
  const [activeTab, setActiveTab] = useState<'email' | 'assets'>('email');
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
  const hasBackgrounds = currentProject.backgrounds.length > 0;
  const bgFor = (o: Offer) => backgroundForOffer(o, offers, currentProject.backgrounds);

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
  const activeComment = (alert.comments ?? []).find((c) => c.track === activeTab);

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
            <div style={{ width: 280, flexShrink: 0, borderRight: '1px solid rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', padding: 12, boxSizing: 'border-box', overflowY: 'auto' }}>
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
                      <div style={{
                        width: '100%', height: '100%', maxWidth: 575, maxHeight: 575,
                        position: 'relative', borderRadius: 8, overflow: 'hidden', background: '#f0f2f4',
                      }}>
                        <FilledTemplatePreview template={template} offer={previewOffer} backgroundUrl={bgFor(previewOffer)!.url} />
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
            </div>

            {/* Right panel — the active track's Review panel, or Activity History, mutually exclusive */}
            {!showHistory ? (
              <ReviewPanel
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
            ) : (
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
    </>,
    document.body,
  );
};
