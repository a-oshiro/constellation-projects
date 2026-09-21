import { AddComment } from '@mui/icons-material';

/**
 * Comment-anchoring primitives shared by asset creatives (`CommentableAssetPreview`): the small floating
 * button that appears after a text selection to start a new anchored comment, and the sentinel id for a
 * not-yet-sent pending anchor. Where the resulting comment renders is up to the caller (see
 * `FloatingCommentColumn`) — this file only owns the selection-affordance mechanics.
 */

/** Sentinel commentId for a highlight/pin the user just made but hasn't sent a comment for yet — rendered highlighted but non-interactive, and removed the moment the pending anchor is cancelled or sent. */
export const PENDING_ANCHOR_ID = '__pending__';

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
