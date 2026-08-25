import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Avatar, IconButton, Menu } from '@mui/material';
import { AddReactionOutlined, ArrowUpward, CheckCircle, CheckCircleOutlineOutlined, MoreVert } from '@mui/icons-material';
import type { AlertComment, AlertCommentAnchor } from '../../data/types';
import { CURRENT_USER } from '../../data/mockData';
import { formatRelativeTime } from '../../utils/relativeTime';
import { MentionCommentComposer, MentionText } from './AlertCommentComposer';
import { PENDING_ANCHOR_ID } from './AlertHighlightableText';

/**
 * Google-Docs-style margin comments: every comment lives in a floating card positioned next to whatever
 * it's anchored to (a highlighted range of email/asset text, or a pinned point on an asset), inside a
 * `position: relative` scrollable ancestor so the column scrolls together with the content — no fixed
 * positioning or scroll-sync needed. Comments whose natural (anchor-aligned) position would overlap an
 * earlier card get cascaded downward just far enough to clear it.
 */

const GAP = 12;
const COLUMN_WIDTH = 280;
const EMOJI_PALETTE = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

interface ReactionsRowProps {
  reactions?: Record<string, string[]>;
  onToggle: (emoji: string) => void;
}

/** Reaction pills (emoji + count, highlighted when the current user is among the reactors) plus a small "add reaction" picker. */
const ReactionsRow = ({ reactions, onToggle }: ReactionsRowProps) => {
  const [pickerAnchor, setPickerAnchor] = useState<HTMLElement | null>(null);
  const entries = Object.entries(reactions ?? {}).filter(([, names]) => names.length > 0);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
      {entries.map(([emoji, names]) => {
        const mine = names.includes(CURRENT_USER.name);
        return (
          <button
            key={emoji}
            onClick={(e) => { e.stopPropagation(); onToggle(emoji); }}
            title={names.join(', ')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', borderRadius: 100, padding: '2px 7px',
              border: mine ? '1px solid #473bab' : '1px solid rgba(0,0,0,0.08)', background: mine ? 'rgba(99,86,225,0.12)' : '#f4f5f6',
              fontSize: 12, fontFamily: 'Roboto, sans-serif',
            }}
          >
            <span>{emoji}</span>
            <span style={{ fontSize: 11, color: '#686576' }}>{names.length}</span>
          </button>
        );
      })}
      <IconButton size="small" onClick={(e) => { e.stopPropagation(); setPickerAnchor(e.currentTarget); }} sx={{ padding: '3px' }}>
        <AddReactionOutlined style={{ fontSize: 16, color: '#9c99a9' }} />
      </IconButton>
      <Menu anchorEl={pickerAnchor} open={!!pickerAnchor} onClose={() => setPickerAnchor(null)} onClick={(e) => e.stopPropagation()} sx={{ zIndex: 100050 }}>
        <div style={{ display: 'flex', gap: 4, padding: '4px 8px' }}>
          {EMOJI_PALETTE.map((emoji) => (
            <button
              key={emoji}
              onClick={() => { onToggle(emoji); setPickerAnchor(null); }}
              style={{ fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 4 }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </Menu>
    </div>
  );
};

interface InlineReplyComposerProps {
  onCancel: () => void;
  onSend: (text: string, mentionedNames: string[]) => void;
}

const InlineReplyComposer = ({ onCancel, onSend }: InlineReplyComposerProps) => {
  const draftRef = useRef<{ text: string; mentionedNames: string[] }>({ text: '', mentionedNames: [] });
  const handleSend = () => {
    const text = draftRef.current.text.trim();
    if (!text) return;
    onSend(text, draftRef.current.mentionedNames);
  };
  return (
    <div style={{ position: 'relative', marginTop: 6 }} onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); handleSend(); } }}>
      <div style={{ paddingRight: 32 }}>
        <MentionCommentComposer autoFocus minHeight={36} onClose={onCancel} onChange={(text, mentionedNames) => { draftRef.current = { text, mentionedNames }; }} />
      </div>
      <button
        onClick={handleSend}
        style={{
          position: 'absolute', right: 0, bottom: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%',
          border: 'none', background: '#473bab', color: '#ffffff', cursor: 'pointer', flexShrink: 0,
        }}
      >
        <ArrowUpward style={{ fontSize: 14 }} />
      </button>
    </div>
  );
};

interface CommentMenuButtonProps {
  onDelete: () => void;
  size?: 'small' | 'medium';
}

/** The 3-dot "Delete comment" menu — shared by the top-level comment and every reply so they behave identically. */
const CommentMenuButton = ({ onDelete, size = 'medium' }: CommentMenuButtonProps) => {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <IconButton size="small" onClick={(e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); }} sx={{ padding: '4px' }}>
        <MoreVert style={{ fontSize: size === 'small' ? 16 : 18, color: '#686576' }} />
      </IconButton>
      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)} onClick={(e) => e.stopPropagation()} sx={{ zIndex: 100050 }}>
        <button
          onClick={() => { setMenuAnchor(null); onDelete(); }}
          style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', background: 'none', padding: '6px 16px', fontSize: 14, fontFamily: 'Roboto, sans-serif', cursor: 'pointer' }}
        >
          Delete comment
        </button>
      </Menu>
    </>
  );
};

interface CommentCardProps {
  comment: AlertComment;
  replies: AlertComment[];
  isActive: boolean;
  onJumpToAnchor: () => void;
  onToggleResolved: () => void;
  onDelete: (commentId: string) => void;
  onReply: (text: string, mentionedNames: string[]) => void;
  onToggleReaction: (commentId: string, emoji: string) => void;
}

const CommentCard = ({ comment, replies, isActive, onJumpToAnchor, onToggleResolved, onDelete, onReply, onToggleReaction }: CommentCardProps) => {
  const resolved = !!comment.resolved;
  const [replyOpen, setReplyOpen] = useState(false);

  const renderBody = (c: AlertComment, opts?: { compact?: boolean }) => (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar src={c.authorAvatar} sx={{ width: opts?.compact ? 20 : 24, height: opts?.compact ? 20 : 24 }} />
        <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25' }}>{c.authorName}</span>
        <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#9c99a9' }}>{formatRelativeTime(c.timestamp)}</span>
      </div>
      <p style={{
        margin: '2px 0 0', paddingLeft: opts?.compact ? 28 : 32, fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25',
        letterSpacing: '0.17px', lineHeight: 1.43, whiteSpace: 'pre-wrap',
        opacity: c.resolved ? 0.5 : 1, textDecoration: c.resolved ? 'line-through' : 'none',
      }}>
        <MentionText text={c.text} mentionedNames={c.mentionedNames} />
      </p>
      <div style={{ paddingLeft: opts?.compact ? 28 : 32 }}>
        <ReactionsRow reactions={c.reactions} onToggle={(emoji) => onToggleReaction(c.id, emoji)} />
      </div>
    </>
  );

  return (
    <div
      onClick={onJumpToAnchor}
      style={{
        position: 'relative', width: COLUMN_WIDTH, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 4,
        padding: '8px 60px 8px 8px', borderRadius: 8, cursor: 'pointer', background: '#ffffff',
        boxShadow: isActive ? '0 0 0 2px #473bab, 0px 2px 8px rgba(0,0,0,0.12)' : '0px 1px 4px rgba(0,0,0,0.12)',
        transition: 'box-shadow 0.3s',
      }}
    >
      <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', alignItems: 'center' }}>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleResolved(); }}
          title={resolved ? 'Mark as unresolved' : 'Mark as resolved'}
          style={{
            display: 'flex', border: 'none', background: 'none',
            padding: 4, cursor: 'pointer', color: resolved ? '#4caf50' : '#9c99a9',
          }}
        >
          {resolved ? <CheckCircle style={{ fontSize: 18 }} /> : <CheckCircleOutlineOutlined style={{ fontSize: 18 }} />}
        </button>
        <CommentMenuButton onDelete={() => onDelete(comment.id)} />
      </div>

      {renderBody(comment)}

      {replies.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4, paddingLeft: 16, borderLeft: '2px solid #f0f2f4' }}>
          {replies.map((r) => (
            <div key={r.id} style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: -4, right: -4 }}>
                <CommentMenuButton onDelete={() => onDelete(r.id)} size="small" />
              </div>
              {renderBody(r, { compact: true })}
            </div>
          ))}
        </div>
      )}

      {replyOpen ? (
        <div onClick={(e) => e.stopPropagation()}>
          <InlineReplyComposer
            onCancel={() => setReplyOpen(false)}
            onSend={(text, mentionedNames) => { onReply(text, mentionedNames); setReplyOpen(false); }}
          />
        </div>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); setReplyOpen(true); }}
          style={{ alignSelf: 'flex-start', marginTop: 2, background: 'none', border: 'none', padding: 0, fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#9c99a9', cursor: 'pointer' }}
        >
          Reply...
        </button>
      )}
    </div>
  );
};

interface PendingCommentCardProps {
  anchor: AlertCommentAnchor;
  onCancel: () => void;
  onSend: (text: string, mentionedNames: string[]) => void;
}

const PendingCommentCard = ({ anchor, onCancel, onSend }: PendingCommentCardProps) => {
  const draftRef = useRef<{ text: string; mentionedNames: string[] }>({ text: '', mentionedNames: [] });
  const handleSend = () => {
    const text = draftRef.current.text.trim();
    if (!text) return;
    onSend(text, draftRef.current.mentionedNames);
  };
  return (
    <div style={{ width: COLUMN_WIDTH, boxSizing: 'border-box', background: '#ffffff', borderRadius: 8, padding: 8, boxShadow: '0 0 0 2px #473bab, 0px 2px 8px rgba(0,0,0,0.12)' }}>
      <p style={{ margin: '0 0 6px', fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#473bab', letterSpacing: '0.4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {anchor.kind === 'email' || anchor.quotedText ? `Commenting on "${anchor.quotedText}"` : 'Commenting on pinned location'}
      </p>
      <div style={{ position: 'relative' }} onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); handleSend(); } }}>
        <div style={{ paddingRight: 36 }}>
          <MentionCommentComposer
            autoFocus
            minHeight={60}
            onClose={onCancel}
            onChange={(text, mentionedNames) => { draftRef.current = { text, mentionedNames }; }}
          />
        </div>
        <button
          onClick={handleSend}
          style={{
            position: 'absolute', right: 0, bottom: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%',
            border: 'none', background: '#473bab', color: '#ffffff', cursor: 'pointer', flexShrink: 0,
          }}
        >
          <ArrowUpward style={{ fontSize: 16 }} />
        </button>
      </div>
    </div>
  );
};

export interface ColumnEntry {
  id: string;
  comment: AlertComment;
  replies: AlertComment[];
}

export interface FloatingCommentColumnProps {
  entries: ColumnEntry[];
  /** Shared with the caller: the highlight span / pin element registered for each comment id (plus the pending one, keyed `PENDING_ANCHOR_ID`). */
  anchorRefs: React.RefObject<Map<string, HTMLElement>>;
  /** The position:relative scrollable ancestor this column is absolutely positioned inside. */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Left offset (px) within the container where the column starts. */
  left: number;
  activeAnchorId: string | null;
  showResolved: boolean;
  pendingAnchor?: AlertCommentAnchor;
  onCancelPending: () => void;
  onSendPending: (text: string, mentionedNames: string[]) => void;
  onToggleResolved: (commentId: string) => void;
  onDeleteComment: (commentId: string) => void;
  onReply: (parentCommentId: string, text: string, mentionedNames: string[]) => void;
  onToggleReaction: (commentId: string, emoji: string) => void;
  onJumpToAnchor: (comment: AlertComment) => void;
  registerCommentRef: (id: string, el: HTMLDivElement | null) => void;
}

export const FloatingCommentColumn = ({
  entries, anchorRefs, containerRef, left, activeAnchorId, showResolved,
  pendingAnchor, onCancelPending, onSendPending, onToggleResolved, onDeleteComment, onReply, onToggleReaction,
  onJumpToAnchor, registerCommentRef,
}: FloatingCommentColumnProps) => {
  const visibleEntries = useMemo(
    () => entries.filter((e) => showResolved || !e.comment.resolved),
    [entries, showResolved],
  );
  const [positions, setPositions] = useState<Record<string, number>>({});
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const computeLayout = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();

    const targets: { id: string; targetTop: number }[] = [];
    for (const entry of visibleEntries) {
      const anchorEl = anchorRefs.current.get(entry.id);
      if (!anchorEl) continue;
      const rect = anchorEl.getBoundingClientRect();
      targets.push({ id: entry.id, targetTop: rect.top - containerRect.top + container.scrollTop });
    }
    if (pendingAnchor) {
      const anchorEl = anchorRefs.current.get(PENDING_ANCHOR_ID);
      if (anchorEl) {
        const rect = anchorEl.getBoundingClientRect();
        targets.push({ id: PENDING_ANCHOR_ID, targetTop: rect.top - containerRect.top + container.scrollTop });
      }
    }
    targets.sort((a, b) => a.targetTop - b.targetTop);

    let cursor = -Infinity;
    const next: Record<string, number> = {};
    for (const t of targets) {
      const height = cardRefs.current.get(t.id)?.offsetHeight ?? 0;
      const top = Math.max(t.targetTop, cursor);
      next[t.id] = top;
      cursor = top + height + GAP;
    }
    setPositions(next);
  }, [visibleEntries, pendingAnchor, anchorRefs, containerRef]);

  useLayoutEffect(() => { computeLayout(); }, [computeLayout]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => computeLayout());
    ro.observe(container);
    return () => ro.disconnect();
  }, [computeLayout, containerRef]);

  return (
    <div style={{ position: 'absolute', top: 0, left, width: COLUMN_WIDTH }}>
      {visibleEntries.map((entry) => (
        <div
          key={entry.id}
          ref={(el) => {
            cardRefs.current.set(entry.id, el as HTMLDivElement);
            registerCommentRef(entry.id, el);
          }}
          style={{ position: 'absolute', top: positions[entry.id] ?? 0, left: 0 }}
        >
          <CommentCard
            comment={entry.comment}
            replies={entry.replies}
            isActive={activeAnchorId === entry.id}
            onJumpToAnchor={() => onJumpToAnchor(entry.comment)}
            onToggleResolved={() => onToggleResolved(entry.id)}
            onDelete={onDeleteComment}
            onReply={(text, mentionedNames) => onReply(entry.id, text, mentionedNames)}
            onToggleReaction={onToggleReaction}
          />
        </div>
      ))}
      {pendingAnchor && (
        <div
          ref={(el) => { cardRefs.current.set(PENDING_ANCHOR_ID, el as HTMLDivElement); }}
          style={{ position: 'absolute', top: positions[PENDING_ANCHOR_ID] ?? 0, left: 0 }}
        >
          <PendingCommentCard anchor={pendingAnchor} onCancel={onCancelPending} onSend={onSendPending} />
        </div>
      )}
    </div>
  );
};
