import { useRef, useState } from 'react';
import { Avatar } from '@mui/material';
import { Close, Check, Replay, Cancel, CheckCircle, CheckCircleOutlineOutlined, AddComment, ArrowUpward, Visibility, VisibilityOff } from '@mui/icons-material';
import type { AlertComment, AlertCommentAnchor, EmailCommentAnchor, AssetCommentAnchor, ReviewStatus } from '../../data/types';
import { formatRelativeTime } from '../../utils/relativeTime';
import { formatReviewerName } from '../../utils/alertReview';
import { MentionCommentComposer, MentionText } from './AlertReviewFooterFlow';

/**
 * Side Panel review UI: a per-track list of freeform and anchored (highlighted-text / pinned-asset)
 * comments, a standalone always-usable composer, and decoupled Approve/Request Changes actions.
 * Kept in its own file since it roughly doubles what used to live inline in AlertDialog.tsx.
 */

const actionPillBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', cursor: 'pointer',
  borderRadius: 100, padding: '4px 10px', fontSize: 13, fontFamily: 'Roboto, sans-serif',
  fontWeight: 500, letterSpacing: '0.46px', lineHeight: '22px', flexShrink: 0, whiteSpace: 'nowrap',
};

const inputHelperStyle: React.CSSProperties = { margin: '4px 0 0', fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px', lineHeight: 1.5 };

interface CommentListItemProps {
  comment: AlertComment;
  isActive: boolean;
  onJumpToAnchor?: () => void;
  onToggleResolved: () => void;
  registerRef: (el: HTMLDivElement | null) => void;
}

/** One posted comment: avatar, author, relative time, @mention-highlighted body, and a resolve toggle in the top-right corner. Clickable (and briefly emphasized) when it's anchored to a highlight or pin. */
const CommentListItem = ({ comment, isActive, onJumpToAnchor, onToggleResolved, registerRef }: CommentListItemProps) => {
  const clickable = !!onJumpToAnchor;
  const resolved = !!comment.resolved;
  return (
    <div
      ref={registerRef}
      onClick={onJumpToAnchor}
      style={{
        position: 'relative', display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 32px 8px 8px', borderRadius: 8,
        cursor: clickable ? 'pointer' : 'default',
        background: isActive ? 'rgba(99,86,225,0.08)' : 'transparent',
        transition: 'background 0.3s',
      }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onToggleResolved(); }}
        title={resolved ? 'Mark as unresolved' : 'Mark as resolved'}
        style={{
          position: 'absolute', top: 6, right: 6, display: 'flex', border: 'none', background: 'none',
          padding: 2, cursor: 'pointer', color: resolved ? '#4caf50' : '#9c99a9',
        }}
      >
        {resolved ? <CheckCircle style={{ fontSize: 18 }} /> : <CheckCircleOutlineOutlined style={{ fontSize: 18 }} />}
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar src={comment.authorAvatar} sx={{ width: 24, height: 24 }} />
        <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25' }}>{comment.authorName}</span>
        <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#9c99a9' }}>{formatRelativeTime(comment.timestamp)}</span>
      </div>
      <p style={{
        margin: 0, paddingLeft: 32, fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25',
        letterSpacing: '0.17px', lineHeight: 1.43, whiteSpace: 'pre-wrap',
        opacity: resolved ? 0.5 : 1, textDecoration: resolved ? 'line-through' : 'none',
      }}>
        <MentionText text={comment.text} mentionedNames={comment.mentionedNames} />
      </p>
    </div>
  );
};

interface CommentComposerBoxProps {
  onSend: (text: string, mentionedNames: string[]) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

/** Wraps the shared @mention composer with a send button, since posting is now per-comment instead of bundled with a decision. Clears itself (by remounting the composer) after each send. */
const CommentComposerBox = ({ onSend, disabled, autoFocus }: CommentComposerBoxProps) => {
  const draftRef = useRef<{ text: string; mentionedNames: string[] }>({ text: '', mentionedNames: [] });
  const [sendCounter, setSendCounter] = useState(0);

  const handleSend = () => {
    const text = draftRef.current.text.trim();
    if (!text || disabled) return;
    onSend(text, draftRef.current.mentionedNames);
    draftRef.current = { text: '', mentionedNames: [] };
    setSendCounter((c) => c + 1);
  };

  return (
    <div
      style={{ position: 'relative' }}
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); handleSend(); }
      }}
    >
      <div style={{ paddingRight: 36 }}>
        <MentionCommentComposer
          key={sendCounter}
          disabled={disabled}
          autoFocus={autoFocus}
          minHeight={90}
          onChange={(text, mentionedNames) => { draftRef.current = { text, mentionedNames }; }}
        />
      </div>
      <button
        disabled={disabled}
        onClick={handleSend}
        style={{
          position: 'absolute', right: 0, bottom: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%',
          border: 'none', background: '#473bab', color: '#ffffff', flexShrink: 0,
          opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <ArrowUpward style={{ fontSize: 16 }} />
      </button>
    </div>
  );
};

interface ChangesRequestedBannerProps {
  locked?: boolean;
  disabled?: boolean;
  onUndo: () => void;
}

/** Redesigned rejected-state banner: title + Undo share the top row, body copy points at manual edits or the AI rebuild below. */
const ChangesRequestedBanner = ({ locked, disabled, onUndo }: ChangesRequestedBannerProps) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 12, borderRadius: 8, background: '#fce8ea' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <Cancel style={{ fontSize: 18, color: '#d2323f', flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#d2323f' }}>Changes Requested</span>
      </div>
      {!locked && (
        <button
          disabled={disabled}
          onClick={onUndo}
          style={{
            background: 'none', border: 'none', padding: 0, fontSize: 13, fontFamily: 'Roboto, sans-serif',
            fontWeight: 500, color: '#d2323f', textDecoration: 'underline', flexShrink: 0,
            opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          Undo
        </button>
      )}
    </div>
    <p style={{ margin: 0, fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', lineHeight: 1.4 }}>
      Add comments and perform changes manually or Rebuild it using our AI Auto Agent.
    </p>
  </div>
);

interface ApprovedBannerProps {
  actorName?: string;
  timestamp?: number;
  locked?: boolean;
  disabled?: boolean;
  onUndo: () => void;
}

/** Approved-state banner — Undo shares the top row with the title, mirroring the Changes Requested banner's layout. */
const ApprovedBanner = ({ actorName, timestamp, locked, disabled, onUndo }: ApprovedBannerProps) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 12, borderRadius: 8, background: '#e8f5e9' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <CheckCircle style={{ fontSize: 18, color: '#4caf50', flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1b5e20' }}>Approved</span>
      </div>
      {!locked && (
        <button
          disabled={disabled}
          onClick={onUndo}
          style={{
            background: 'none', border: 'none', padding: 0, fontSize: 13, fontFamily: 'Roboto, sans-serif',
            fontWeight: 500, color: '#1b5e20', textDecoration: 'underline', flexShrink: 0,
            opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          Undo Approval
        </button>
      )}
    </div>
    <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', paddingLeft: 26 }}>
      by {formatReviewerName(actorName ?? '')} • {timestamp ? formatRelativeTime(timestamp) : ''}
    </span>
  </div>
);

export interface ReviewPanelProps {
  trackLabel: 'Email' | 'Assets';
  status: ReviewStatus;
  comments: AlertComment[];
  actorName?: string;
  timestamp?: number;
  locked?: boolean;
  disabled?: boolean;
  /** The comment id whose highlight/pin was just clicked (or vice versa) — briefly emphasized, then cleared. */
  activeAnchorId: string | null;
  /** A highlight/pin the user just created but hasn't sent a comment for yet. */
  pendingAnchor?: AlertCommentAnchor;
  onCancelAnchor: () => void;
  registerCommentRef: (id: string, el: HTMLDivElement | null) => void;
  onJumpToAnchor: (comment: AlertComment) => void;
  onToggleCommentResolved: (commentId: string) => void;
  onSendComment: (text: string, mentionedNames: string[]) => void;
  onApprove: () => void;
  onReject: () => void;
  onUndo: () => void;
  onRebuild: () => void;
}

/** Combined right-side review panel for one track: comment thread (freeform + anchored), a standalone composer, and decoupled Approve/Request Changes/Rebuild actions. */
export const ReviewPanel = ({
  trackLabel, status, comments, actorName, timestamp, locked, disabled,
  activeAnchorId, pendingAnchor, onCancelAnchor, registerCommentRef, onJumpToAnchor, onToggleCommentResolved,
  onSendComment, onApprove, onReject, onUndo, onRebuild,
}: ReviewPanelProps) => {
  const isPending = status === 'pending';
  const isRejected = status === 'rejected';

  const [showResolved, setShowResolved] = useState(false);
  // If the comment being jumped to (from its highlight/pin) is resolved and currently hidden, reveal it —
  // otherwise the jump would land on nothing. Adjusted during render rather than an effect since it only
  // ever needs one extra render to converge.
  const activeComment = comments.find((c) => c.id === activeAnchorId);
  if (activeComment?.resolved && !showResolved) setShowResolved(true);
  const visibleComments = showResolved ? comments : comments.filter((c) => !c.resolved);

  return (
    <div style={{ width: 320, flexShrink: 0, borderLeft: '1px solid rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <div style={{ padding: '12px 16px', flexShrink: 0 }}>
        <span style={{ fontSize: 16, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.15px' }}>{trackLabel} Review</span>
      </div>
      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {!isPending && (
          isRejected
            ? <ChangesRequestedBanner locked={locked} disabled={disabled} onUndo={onUndo} />
            : <ApprovedBanner actorName={actorName} timestamp={timestamp} locked={locked} disabled={disabled} onUndo={onUndo} />
        )}

        {comments.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button
              onClick={() => setShowResolved((v) => !v)}
              title={showResolved ? 'Hide resolved comments' : 'Show resolved comments'}
              style={{
                display: 'flex', alignItems: 'center', gap: 4, alignSelf: 'flex-end', border: 'none',
                background: showResolved ? 'rgba(99,86,225,0.12)' : 'transparent', borderRadius: 100,
                padding: '4px 8px', cursor: 'pointer', color: showResolved ? '#473bab' : '#686576',
                fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 500,
              }}
            >
              {showResolved ? <Visibility style={{ fontSize: 16 }} /> : <VisibilityOff style={{ fontSize: 16 }} />}
              Show Resolved
            </button>
            {visibleComments.map((c) => (
              <CommentListItem
                key={c.id}
                comment={c}
                isActive={activeAnchorId === c.id}
                onJumpToAnchor={c.anchor ? () => onJumpToAnchor(c) : undefined}
                onToggleResolved={() => onToggleCommentResolved(c.id)}
                registerRef={(el) => registerCommentRef(c.id, el)}
              />
            ))}
          </div>
        )}

        <div>
          {pendingAnchor && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#473bab', letterSpacing: '0.4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {pendingAnchor.kind === 'email' ? `Commenting on "${pendingAnchor.quotedText}"` : 'Commenting on pinned location'}
              </span>
              <button
                onClick={onCancelAnchor}
                style={{ background: 'none', border: 'none', padding: 0, fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', textDecoration: 'underline', cursor: 'pointer', flexShrink: 0 }}
              >
                Cancel
              </button>
            </div>
          )}
          <CommentComposerBox
            key={pendingAnchor ? pendingAnchor.kind : 'plain'}
            onSend={onSendComment}
            disabled={disabled || locked}
            autoFocus={!!pendingAnchor}
          />
        </div>

        {isPending && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              disabled={disabled}
              onClick={onReject}
              style={{ ...actionPillBase, background: '#ffffff', border: '1px solid rgba(210,50,63,0.5)', color: '#d2323f', opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
            >
              <Close style={{ fontSize: 16 }} />
              Request Changes
            </button>
            <button
              disabled={disabled}
              onClick={onApprove}
              style={{ ...actionPillBase, background: '#4caf50', color: '#ffffff', opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
            >
              <Check style={{ fontSize: 16 }} />
              Approve
            </button>
          </div>
        )}

        {isRejected && (
          <div>
            <button
              disabled={disabled}
              onClick={onRebuild}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                borderRadius: 100, padding: '8px 16px', background: '#ffffff', border: '1px solid rgba(71,59,171,0.5)', color: '#473bab',
                fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 500, letterSpacing: '0.4px',
                opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              <Replay style={{ fontSize: 16 }} />
              {trackLabel === 'Email' ? 'Refresh Email' : 'Refresh Assets'}
            </button>
            <p style={inputHelperStyle}>
              If any change is not applied automatically, refresh above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

interface HighlightableParagraphProps {
  text: string;
  paragraphIndex: number;
  anchors: { anchor: EmailCommentAnchor; commentId: string }[];
  activeAnchorId: string | null;
  onHighlightClick: (commentId: string) => void;
  registerAnchorRef: (commentId: string, el: HTMLElement | null) => void;
  style?: React.CSSProperties;
}

/** Sentinel commentId for a highlight the user just made but hasn't sent a comment for yet — rendered highlighted but non-interactive, and removed the moment the pending anchor is cancelled or sent. */
export const PENDING_ANCHOR_ID = '__pending__';

/** Renders one email-body block (a paragraph or the VIN line) as plain text interleaved with clickable highlighted spans for each comment anchored to it. Tags the element with `data-paragraph-index` so mouseup selection handling can identify which block was selected. */
export const HighlightableParagraph = ({ text, paragraphIndex, anchors, activeAnchorId, onHighlightClick, registerAnchorRef, style }: HighlightableParagraphProps) => {
  const sorted = [...anchors].sort((a, b) => a.anchor.startOffset - b.anchor.startOffset);
  const nodes: React.ReactNode[] = [];
  let cursor = 0;

  sorted.forEach(({ anchor, commentId }) => {
    const { startOffset, endOffset, quotedText } = anchor;
    // Skip anchors that no longer line up with the current text (stale offsets) or overlap an already-rendered one.
    if (startOffset < cursor || endOffset > text.length || text.slice(startOffset, endOffset) !== quotedText) return;
    if (startOffset > cursor) nodes.push(text.slice(cursor, startOffset));
    const isPending = commentId === PENDING_ANCHOR_ID;
    const isActive = !isPending && activeAnchorId === commentId;
    nodes.push(
      <span
        key={commentId}
        ref={isPending ? undefined : (el) => registerAnchorRef(commentId, el)}
        onClick={isPending ? undefined : (e) => { e.stopPropagation(); onHighlightClick(commentId); }}
        style={{
          background: isActive ? 'rgba(99,86,225,0.32)' : 'rgba(99,86,225,0.16)',
          cursor: isPending ? 'default' : 'pointer', borderRadius: 2, transition: 'background 0.3s',
        }}
      >
        {text.slice(startOffset, endOffset)}
      </span>,
    );
    cursor = endOffset;
  });
  if (cursor < text.length) nodes.push(text.slice(cursor));

  return (
    <p data-paragraph-index={paragraphIndex} style={style}>
      {nodes}
    </p>
  );
};

interface FloatingCommentButtonProps {
  top: number;
  left: number;
  onClick: () => void;
}

/** Small floating button that appears near the end of a text selection in the email body, offering to start a new anchored comment. */
export const FloatingCommentButton = ({ top, left, onClick }: FloatingCommentButtonProps) => (
  <button
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    style={{
      position: 'fixed', top, left, zIndex: 100020,
      display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%',
      border: 'none', background: '#473bab', color: '#ffffff', cursor: 'pointer',
      boxShadow: '0px 2px 8px rgba(0,0,0,0.24)',
    }}
  >
    <AddComment style={{ fontSize: 16 }} />
  </button>
);

interface AssetPinOverlayProps {
  pins: { anchor: AssetCommentAnchor; commentId: string }[];
  pendingPin?: AssetCommentAnchor;
  activeAnchorId: string | null;
  onPinClick: (commentId: string) => void;
  registerAnchorRef: (commentId: string, el: HTMLElement | null) => void;
}

/** Pinned-comment markers over an asset creative, scoped by the caller to whichever offer is currently shown in the carousel. */
export const AssetPinOverlay = ({ pins, pendingPin, activeAnchorId, onPinClick, registerAnchorRef }: AssetPinOverlayProps) => (
  <>
    {pins.map(({ anchor, commentId }) => {
      const isActive = activeAnchorId === commentId;
      const size = isActive ? 22 : 18;
      return (
        <div
          key={commentId}
          ref={(el) => registerAnchorRef(commentId, el)}
          onClick={(e) => { e.stopPropagation(); onPinClick(commentId); }}
          style={{
            position: 'absolute', left: `${anchor.xPct}%`, top: `${anchor.yPct}%`, transform: 'translate(-50%, -50%)',
            width: size, height: size, borderRadius: '50%', background: '#473bab', border: '2px solid #ffffff',
            boxShadow: '0px 1px 4px rgba(0,0,0,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', transition: 'width 0.2s, height 0.2s', zIndex: 5,
          }}
        >
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#ffffff' }} />
        </div>
      );
    })}
    {pendingPin && (
      <div
        style={{
          position: 'absolute', left: `${pendingPin.xPct}%`, top: `${pendingPin.yPct}%`, transform: 'translate(-50%, -50%)',
          width: 18, height: 18, borderRadius: '50%', background: 'rgba(71,59,171,0.4)', border: '2px dashed #473bab',
          zIndex: 6, pointerEvents: 'none',
        }}
      />
    )}
  </>
);
