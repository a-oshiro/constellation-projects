import type { AlertComment, AssetCommentAnchor } from '../../data/types';
import { CommentCard, COLUMN_WIDTH, PendingCommentCard, type ColumnEntry } from './FloatingCommentColumn';

/**
 * Comment boxes drawn over the focused asset itself, each next to the pin/highlight it belongs to, so a box
 * can never be cut off by the edges of the preview area. Placement, all within the asset's own box:
 * - Vertically: above the anchor (growing upward from it). Only when there's clearly more room below than
 *   above — an anchor near the asset's top edge — does it open below the anchor instead. Either way it's
 *   capped to the space available and scrolls internally past that.
 * - Horizontally: an anchor on the asset's right half gets a box whose right edge lines up with the
 *   anchor's right edge (so it grows leftward, into the asset); an anchor on the left half gets a box
 *   whose left edge lines up with the anchor's left edge (growing rightward). Clamped to the asset's
 *   edges when the asset is too narrow for that alone.
 * A saved comment's box only shows while it's open (`openIds`) — opened by clicking its pin/highlight,
 * closed by its X. The draft box for a pending pin/highlight always shows.
 */

const EDGE = 8;
/** Breathing room inside each scrollable box so the card's own outline/shadow isn't clipped by it. */
const SHADOW_PAD = 3;
const ANCHOR_GAP = 8;
/** Pins are drawn as an 18px circle centred on the point — treated as that box for alignment. */
const PIN_RADIUS = 9;
/** Below this much room above the anchor, the box opens below it instead (if there's more room there). */
const MIN_SPACE_ABOVE = 160;

interface Rect { left: number; top: number; right: number; bottom: number }

const anchorRect = (anchor: AssetCommentAnchor, width: number, height: number): Rect => {
  const x = (anchor.xPct / 100) * width;
  const y = (anchor.yPct / 100) * height;
  if (anchor.widthPct !== undefined && anchor.heightPct !== undefined) {
    return { left: x, top: y, right: x + (anchor.widthPct / 100) * width, bottom: y + (anchor.heightPct / 100) * height };
  }
  return { left: x - PIN_RADIUS, top: y - PIN_RADIUS, right: x + PIN_RADIUS, bottom: y + PIN_RADIUS };
};

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), Math.max(min, max));

/** Absolute-position style for a box of `boxWidth` anchored to `anchor` within a `width` x `height` asset. */
const placement = (anchor: AssetCommentAnchor, width: number, height: number, boxWidth: number): React.CSSProperties => {
  const r = anchorRect(anchor, width, height);
  const onRightHalf = (r.left + r.right) / 2 >= width / 2;
  const left = clamp(onRightHalf ? r.right - boxWidth : r.left, EDGE, width - boxWidth - EDGE);
  const spaceAbove = r.top - ANCHOR_GAP - EDGE;
  const spaceBelow = height - r.bottom - ANCHOR_GAP - EDGE;
  const above = spaceAbove >= MIN_SPACE_ABOVE || spaceAbove >= spaceBelow;
  return above
    ? { left, bottom: height - r.top + ANCHOR_GAP, maxHeight: Math.max(spaceAbove, 0) }
    : { left, top: r.bottom + ANCHOR_GAP, maxHeight: Math.max(spaceBelow, 0) };
};

interface AssetCommentPopoversProps {
  /** The asset's rendered size (px) — the box everything is positioned and clamped within. */
  width: number;
  height: number;
  entries: ColumnEntry[];
  showResolved: boolean;
  /** Comment ids whose boxes are open, in the order they were opened (last on top). */
  openIds: string[];
  onCloseComment: (commentId: string) => void;
  activeAnchorId: string | null;
  pendingAnchor?: AssetCommentAnchor;
  onCancelPending: () => void;
  onSendPending: (text: string, mentionedNames: string[]) => void;
  onToggleResolved: (commentId: string) => void;
  onDeleteComment: (commentId: string) => void;
  onReply: (parentCommentId: string, text: string, mentionedNames: string[]) => void;
  onToggleReaction: (commentId: string, emoji: string) => void;
  onJumpToAnchor: (comment: AlertComment) => void;
  registerCommentRef: (id: string, el: HTMLDivElement | null) => void;
}

export const AssetCommentPopovers = ({
  width, height, entries, showResolved, openIds, onCloseComment, activeAnchorId, pendingAnchor, onCancelPending,
  onSendPending, onToggleResolved, onDeleteComment, onReply, onToggleReaction, onJumpToAnchor, registerCommentRef,
}: AssetCommentPopoversProps) => {
  const boxWidth = Math.max(0, Math.min(COLUMN_WIDTH, width - 2 * EDGE));
  const entryById = new Map(entries.map((e) => [e.id, e]));
  const openEntries = openIds
    .map((id) => entryById.get(id))
    .filter((e): e is ColumnEntry => !!e && e.comment.anchor?.kind === 'asset' && (showResolved || !e.comment.resolved));

  const boxStyle = (anchor: AssetCommentAnchor, z: number): React.CSSProperties => ({
    position: 'absolute', zIndex: 8 + z, width: boxWidth, boxSizing: 'border-box', padding: SHADOW_PAD,
    overflowY: 'auto', borderRadius: 8,
    ...placement(anchor, width, height, boxWidth),
  });

  return (
    <>
      {openEntries.map((entry, i) => (
        <div
          key={entry.id}
          ref={(el) => registerCommentRef(entry.id, el)}
          onClick={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          style={boxStyle(entry.comment.anchor as AssetCommentAnchor, i)}
        >
          <CommentCard
            width={boxWidth - 2 * SHADOW_PAD}
            onClose={() => onCloseComment(entry.id)}
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
        <div onMouseUp={(e) => e.stopPropagation()} style={boxStyle(pendingAnchor, openEntries.length + 1)}>
          <PendingCommentCard width={boxWidth - 2 * SHADOW_PAD} anchor={pendingAnchor} onCancel={onCancelPending} onSend={onSendPending} />
        </div>
      )}
    </>
  );
};
