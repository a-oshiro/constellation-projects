import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IconButton, Avatar } from '@mui/material';
import { Close, Check, Replay, CommentOutlined, CheckCircle, Cancel } from '@mui/icons-material';
import type { AlertComment, ReviewStatus } from '../../data/types';
import { formatRelativeTime } from '../../utils/relativeTime';
import { formatReviewerName } from '../../utils/alertReview';
import { MOCK_TEAMMATES } from '../../data/mockData';
import type { Teammate } from '../../data/mockData';

/**
 * Alternative to the right-side review panel: Approve/Reject/Add Comment live in the main pane's own
 * footer, with an @mention-capable comment composer instead of separate Assignee/Mentioned Teammates
 * fields. Kept side by side with the panel-based flow so the two can be toggled and compared.
 */

const actionPillBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', cursor: 'pointer',
  borderRadius: 100, padding: '4px 10px', fontSize: 13, fontFamily: 'Roboto, sans-serif',
  fontWeight: 500, letterSpacing: '0.46px', lineHeight: '22px', flexShrink: 0, whiteSpace: 'nowrap',
};

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Splits comment text into plain/mention segments so both the read-only banner and the composer's initial HTML can highlight "@Name" tokens. */
function splitMentionText(text: string, mentionedNames: string[]): { text: string; isMention: boolean }[] {
  if (mentionedNames.length === 0 || !text) return [{ text, isMention: false }];
  const pattern = new RegExp(`(${mentionedNames.map((n) => '@' + escapeRegExp(n)).join('|')})`, 'g');
  return text.split(pattern).filter((p) => p.length > 0).map((p) => ({
    text: p,
    isMention: mentionedNames.some((n) => p === `@${n}`),
  }));
}

export const MentionText = ({ text, mentionedNames }: { text: string; mentionedNames: string[] }) => (
  <>
    {splitMentionText(text, mentionedNames).map((part, i) => (
      part.isMention
        ? <span key={i} style={{ color: '#473bab', fontWeight: 500 }}>{part.text}</span>
        : <span key={i}>{part.text}</span>
    ))}
  </>
);

export interface MentionCommentComposerProps {
  initialText?: string;
  initialMentionedNames?: string[];
  onChange: (text: string, mentionedNames: string[]) => void;
  /** Omit to render the field without a dismiss affordance — e.g. when it's a persistent part of a panel rather than a toggleable composer. */
  onClose?: () => void;
  disabled?: boolean;
  /** Focuses the field on mount — used when a highlight/pin interaction opens this composer for a new anchored comment. */
  autoFocus?: boolean;
}

/**
 * The contentEditable itself, isolated behind React.memo with stable (ref-forwarded) event handlers so
 * it never re-renders after mount. Re-rendering a `dangerouslySetInnerHTML` node resets its DOM content —
 * which would silently wipe out everything the browser's native contentEditable typing had inserted —
 * so the mention dropdown's open/close and highlight state (which changes on every keystroke) must never
 * cause this component to re-render.
 */
const EditableArea = memo(function EditableArea({
  editableRef, initialHtml, disabled, onInput, onKeyDown,
}: {
  editableRef: React.RefObject<HTMLDivElement | null>;
  initialHtml: string;
  disabled?: boolean;
  onInput: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}) {
  return (
    <div
      ref={editableRef}
      contentEditable={!disabled}
      suppressContentEditableWarning
      onInput={onInput}
      onKeyDown={onKeyDown}
      dangerouslySetInnerHTML={{ __html: initialHtml }}
      style={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px', lineHeight: 1.5, outline: 'none', minHeight: 21, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
    />
  );
});

/** Free-text comment box with Figma-style "@" tagging: typing @ opens a teammate picker; picking one inserts a non-editable purple mention chip. */
export const MentionCommentComposer = ({ initialText, initialMentionedNames, onChange, onClose, disabled, autoFocus }: MentionCommentComposerProps) => {
  const editableRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(!initialText);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const filteredTeammates = mentionQuery === null
    ? []
    : MOCK_TEAMMATES.filter((t) => t.name.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 6);

  const initialHtml = useMemo(() => {
    if (!initialText) return '';
    return splitMentionText(initialText, initialMentionedNames ?? [])
      .map((part) => part.isMention
        ? `<span data-mention-name="${escapeHtml(part.text.slice(1))}" contenteditable="false" style="color:#473bab;font-weight:500;">${escapeHtml(part.text)}</span>`
        : escapeHtml(part.text))
      .join('');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only ever seed the editor once, on mount
  }, []);

  const emitChange = () => {
    const el = editableRef.current;
    if (!el) return;
    const text = el.innerText;
    const names = Array.from(new Set(
      Array.from(el.querySelectorAll('[data-mention-name]')).map((n) => n.getAttribute('data-mention-name')!),
    ));
    setIsEmpty(text.trim().length === 0);
    onChange(text, names);
  };

  useEffect(() => { emitChange(); }, []); // eslint-disable-line react-hooks/exhaustive-deps -- report the seeded value once on mount

  useEffect(() => {
    if (autoFocus) editableRef.current?.focus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- focus once on mount only

  const getCaretTextBefore = (): string | null => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editableRef.current) return null;
    const caretRange = sel.getRangeAt(0);
    if (!editableRef.current.contains(caretRange.startContainer)) return null;
    const preRange = document.createRange();
    preRange.selectNodeContents(editableRef.current);
    preRange.setEnd(caretRange.endContainer, caretRange.endOffset);
    return preRange.toString();
  };

  const handleInput = () => {
    emitChange();
    const before = getCaretTextBefore();
    const match = before?.match(/@([^\s@]*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setActiveIndex(0);
    } else {
      setMentionQuery(null);
    }
  };

  const insertMention = (teammate: Teammate) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const caretRange = sel.getRangeAt(0);
    const node = caretRange.startContainer;
    const offset = caretRange.startOffset;
    if (node.nodeType !== Node.TEXT_NODE) { setMentionQuery(null); return; }
    const textBefore = (node.textContent ?? '').slice(0, offset);
    const atIndex = textBefore.lastIndexOf('@');
    if (atIndex === -1) { setMentionQuery(null); return; }

    const replaceRange = document.createRange();
    replaceRange.setStart(node, atIndex);
    replaceRange.setEnd(node, offset);
    replaceRange.deleteContents();

    const chip = document.createElement('span');
    chip.setAttribute('data-mention-name', teammate.name);
    chip.setAttribute('contenteditable', 'false');
    chip.style.color = '#473bab';
    chip.style.fontWeight = '500';
    chip.textContent = `@${teammate.name}`;
    const space = document.createTextNode(' ');
    replaceRange.insertNode(space);
    replaceRange.insertNode(chip);

    const newRange = document.createRange();
    newRange.setStartAfter(space);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);

    setMentionQuery(null);
    emitChange();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mentionQuery !== null && filteredTeammates.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => (i + 1) % filteredTeammates.length); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => (i - 1 + filteredTeammates.length) % filteredTeammates.length); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertMention(filteredTeammates[activeIndex]); return; }
      if (e.key === 'Escape') { e.preventDefault(); setMentionQuery(null); }
    }
  };

  // Stable wrappers so `EditableArea`'s props never change identity — see its comment for why that matters.
  const handleInputRef = useRef(handleInput);
  const handleKeyDownRef = useRef(handleKeyDown);
  useEffect(() => {
    handleInputRef.current = handleInput;
    handleKeyDownRef.current = handleKeyDown;
  });
  const stableOnInput = useCallback(() => handleInputRef.current(), []);
  const stableOnKeyDown = useCallback((e: React.KeyboardEvent) => handleKeyDownRef.current(e), []);

  return (
    <div style={{ width: '100%', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 16, padding: 12, background: '#ffffff', display: 'flex', alignItems: 'flex-start', gap: 8, boxSizing: 'border-box' }}>
      <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
        {isEmpty && (
          <span style={{ position: 'absolute', top: 0, left: 0, fontSize: 14, fontFamily: 'Roboto, sans-serif', color: '#9c99a9', pointerEvents: 'none' }}>
            Leave a comment...
          </span>
        )}
        <EditableArea
          editableRef={editableRef}
          initialHtml={initialHtml}
          disabled={disabled}
          onInput={stableOnInput}
          onKeyDown={stableOnKeyDown}
        />
        {mentionQuery !== null && filteredTeammates.length > 0 && (
          <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: 4, background: '#ffffff', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8, boxShadow: '0px 4px 16px rgba(0,0,0,0.16)', zIndex: 10, minWidth: 200, overflow: 'hidden' }}>
            {filteredTeammates.map((t, i) => (
              <div
                key={t.name}
                onMouseDown={(e) => { e.preventDefault(); insertMention(t); }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', cursor: 'pointer', background: i === activeIndex ? 'rgba(99,86,225,0.08)' : 'transparent' }}
              >
                <Avatar src={t.avatarUrl} sx={{ width: 22, height: 22 }} />
                <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>{t.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {onClose && (
        <IconButton size="small" onClick={onClose} disabled={disabled} sx={{ padding: '5px', flexShrink: 0 }}>
          <Close style={{ fontSize: 20, color: '#1f1d25' }} />
        </IconButton>
      )}
    </div>
  );
};

export interface FooterReviewControlsProps {
  trackLabel: string;
  status: ReviewStatus;
  comment?: AlertComment;
  actorName?: string;
  timestamp?: number;
  locked?: boolean;
  disabled?: boolean;
  onApprove: (input: { text: string; mentionedNames: string[] }) => void;
  onReject: (input: { text: string; mentionedNames: string[] }) => void;
  onUndo: () => void;
  onRebuild: () => void;
}

/** Per-track footer: pending shows Add Comment (with the @mention composer) + Reject/Approve; reviewed shows the horizontal banner with an expandable "Reviewer's comment" section. */
export const FooterReviewControls = ({ trackLabel, status, comment, actorName, timestamp, locked, disabled, onApprove, onReject, onUndo, onRebuild }: FooterReviewControlsProps) => {
  const [composerOpen, setComposerOpen] = useState(false);
  const [commentExpanded, setCommentExpanded] = useState(false);
  const draftRef = useRef<{ text: string; mentionedNames: string[] }>({
    text: comment?.text ?? '',
    mentionedNames: comment?.mentionedNames ?? [],
  });

  const buildInput = () => ({ text: draftRef.current.text.trim(), mentionedNames: draftRef.current.mentionedNames });

  /** Dismissing the composer discards any in-progress edits — reverts the draft to the last saved comment (blank if there wasn't one yet), so a later Approve/Reject doesn't silently attach an abandoned edit. */
  const handleComposerClose = () => {
    draftRef.current = { text: comment?.text ?? '', mentionedNames: comment?.mentionedNames ?? [] };
    setComposerOpen(false);
  };

  if (status === 'pending') {
    return (
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', background: '#ffffff', padding: 8, display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, boxSizing: 'border-box' }}>
        {composerOpen && (
          <MentionCommentComposer
            initialText={comment?.text}
            initialMentionedNames={comment?.mentionedNames}
            disabled={disabled}
            onClose={handleComposerClose}
            onChange={(text, mentionedNames) => { draftRef.current = { text, mentionedNames }; }}
          />
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          {composerOpen ? (
            <p style={{ margin: 0, fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px', flex: 1, minWidth: 220 }}>
              Use @ to tag teammates in comment. All tagged users will be notified once the review is complete.
            </p>
          ) : (
            <button
              disabled={disabled}
              onClick={() => setComposerOpen(true)}
              style={{ ...actionPillBase, background: '#ffffff', border: '1px solid rgba(99,86,225,0.5)', color: '#473bab', opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
            >
              <CommentOutlined style={{ fontSize: 16 }} />
              Add Comment
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
        </div>
      </div>
    );
  }

  const isApproved = status === 'approved';
  const accentColor = isApproved ? '#1b5e20' : '#d2323f';
  const hasComment = !!comment && comment.text.trim().length > 0;

  return (
    <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', background: isApproved ? '#e8f5e9' : '#fce8ea', padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {isApproved
          ? <CheckCircle style={{ fontSize: 18, color: '#4caf50', flexShrink: 0 }} />
          : <Cancel style={{ fontSize: 18, color: '#d2323f', flexShrink: 0 }} />}
        <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: accentColor, whiteSpace: 'nowrap' }}>
          {trackLabel === 'Email' ? 'Email content' : 'Assets'} {isApproved ? 'approved' : 'rejected'}
        </span>
        <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', whiteSpace: 'nowrap' }}>
          by {formatReviewerName(actorName ?? '')} • {timestamp ? formatRelativeTime(timestamp) : ''}
        </span>
        {hasComment && (
          <IconButton
            size="small"
            onClick={() => setCommentExpanded((v) => !v)}
            sx={{ padding: '4px', background: commentExpanded ? (isApproved ? 'rgba(76,175,80,0.16)' : 'rgba(210,50,63,0.16)') : 'transparent' }}
          >
            <CommentOutlined style={{ fontSize: 16, color: accentColor }} />
          </IconButton>
        )}
        <div style={{ flex: 1, minWidth: 8 }} />
        {!locked && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
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
              <button disabled={disabled} onClick={onRebuild} style={{ ...actionPillBase, background: '#473bab', color: '#ffffff', padding: '4px 14px', opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}>
                <Replay style={{ fontSize: 16 }} />
                Rebuild
              </button>
            )}
          </div>
        )}
      </div>

      {hasComment && commentExpanded && (
        <div style={{ position: 'relative', background: isApproved ? 'rgba(76,175,80,0.08)' : 'rgba(210,50,63,0.08)', borderRadius: 8, padding: 8 }}>
          <p style={{ margin: '0 0 4px', fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px' }}>Reviewer&apos;s comment:</p>
          <p style={{ margin: 0, paddingRight: 28, fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px', lineHeight: 1.43, whiteSpace: 'pre-wrap' }}>
            <MentionText text={comment!.text} mentionedNames={comment!.mentionedNames} />
          </p>
          <IconButton size="small" onClick={() => setCommentExpanded(false)} sx={{ position: 'absolute', top: 2, right: 4, padding: '5px' }}>
            <Close style={{ fontSize: 16, color: '#1f1d25' }} />
          </IconButton>
        </div>
      )}
    </div>
  );
};
