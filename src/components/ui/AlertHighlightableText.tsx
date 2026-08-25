import { AddComment } from '@mui/icons-material';
import type { EmailCommentAnchor } from '../../data/types';

/**
 * Text-anchoring primitives shared by the email body and (via `CommentableAssetPreview`) asset creatives:
 * render a highlighted span for each comment anchored to a block of text, and the small floating button
 * that appears after a text selection to start a new one. Where the resulting comment renders is up to the
 * caller (see `FloatingCommentColumn`) — this file only owns the highlight/selection mechanics.
 */

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
        ref={(el) => registerAnchorRef(commentId, el)}
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

/** Small floating button that appears near the end of a text selection (in the email body or an asset creative), offering to start a new anchored comment. */
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
