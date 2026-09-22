import { useState } from 'react';
import { IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Switch } from '@mui/material';
import { Check, CheckCircle, DeleteOutlined, MoreVert, Replay } from '@mui/icons-material';
import type { ReviewStatus } from '../../data/types';
import { formatRelativeTime } from '../../utils/relativeTime';
import { formatReviewerName } from '../../utils/alertReview';
import { Tooltip } from './Tooltip';

const tooltipPopperProps = { popper: { style: { zIndex: 100050 } } };

const footerLabelStyle: React.CSSProperties = {
  fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px',
};

const actionButtonBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', cursor: 'pointer',
  borderRadius: 8, padding: '6px 16px', fontSize: 13, fontFamily: 'Roboto, sans-serif',
  fontWeight: 500, letterSpacing: '0.46px', lineHeight: '20px', flexShrink: 0, whiteSpace: 'nowrap',
};

const KIND_NOUN: Record<'offers' | 'assets', string> = { offers: 'offers', assets: 'assets' };

interface ReviewFooterProps {
  kind: 'offers' | 'assets';
  /** One entry per item in this review track — only its count of decided-vs-pending matters here. */
  items: { id: string; status: ReviewStatus }[];
  disabled?: boolean;
  /** When set (alongside disabled), the Approve All action shows this text in a tooltip on hover instead of just being inert. */
  disabledReason?: string;
  onApproveAll: () => void;
}

/**
 * The Review Offers/Review Assets panel footer — a plain bottom bar, not a floating widget. Left side:
 * how many of the total have been decided so far. Right side: an "Approve All" action for whatever's
 * still pending, replaced by a plain "All ... reviewed" message once nothing is left pending — a
 * rejection is never called out here, only the reviewed/total count and the completion state.
 */
export const ReviewFooter = ({ kind, items, disabled, disabledReason, onApproveAll }: ReviewFooterProps) => {
  const total = items.length;
  const reviewedCount = items.filter((i) => i.status !== 'pending').length;
  const allReviewed = total > 0 && reviewedCount === total;
  const noun = KIND_NOUN[kind];

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <span style={footerLabelStyle}>{reviewedCount} of {total} {noun} reviewed</span>
      {allReviewed ? (
        <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1b5e20' }}>
          All {noun} reviewed
        </span>
      ) : (
        <Tooltip title={disabledReason ?? ''} disableHoverListener={!disabledReason} slotProps={tooltipPopperProps}>
          <span>
            <button
              disabled={disabled}
              onClick={onApproveAll}
              style={{
                ...actionButtonBase, background: '#4caf50', color: '#ffffff',
                opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              <Check style={{ fontSize: 16 }} />
              Approve All
            </button>
          </span>
        </Tooltip>
      )}
    </div>
  );
};

interface ReviewStatusChipProps {
  status: 'approved' | 'rejected';
  disabled?: boolean;
  /** Omitted for a decision that can't be undone from here (e.g. an asset auto-rejected because its
   * offer was removed — that has to be reversed in Review Offers instead). */
  onUndo?: () => void;
  /** 'overlay' (default) pins the chip to the bottom-right corner of a position:relative wrapper.
   * 'static' renders it in normal flow instead, for placement outside that box. */
  layout?: 'overlay' | 'static';
}

/** Compact approve/reject readout — an icon (check for approved, trash for rejected), a 12px label, a
 * filled tint background, and a three-dot menu at the right end (rather than a direct Undo button) —
 * the menu's only item, "Undo Review", is the one way to reverse the decision, so it takes one extra
 * click on purpose. 8px corner radius, not a full pill. Shared by offer cards and asset tiles so both
 * tracks look identical. */
export const ReviewStatusChip = ({ status, disabled, onUndo, layout = 'overlay' }: ReviewStatusChipProps) => {
  const isApproved = status === 'approved';
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        ...(layout === 'overlay' ? { position: 'absolute' as const, bottom: 8, right: 8, zIndex: 8 } : {}),
        background: isApproved ? '#edf7ed' : '#FDEDED', borderRadius: 8, padding: '4px 6px 4px 8px',
        boxShadow: '0px 1px 5px rgba(0,0,0,0.12), 0px 2px 2px rgba(0,0,0,0.14)',
      }}
    >
      {isApproved
        ? <CheckCircle style={{ fontSize: 14, color: '#4caf50', flexShrink: 0 }} />
        : <DeleteOutlined style={{ fontSize: 14, color: '#d2323f', flexShrink: 0 }} />}
      <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 500, whiteSpace: 'nowrap', color: isApproved ? '#1b5e20' : '#5f2120' }}>
        {isApproved ? 'Approved' : 'Rejected'}
      </span>
      {onUndo && (
        <>
          <IconButton
            disabled={disabled}
            onClick={(e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); }}
            sx={{ padding: '2px', width: 24, height: 24 }}
          >
            <MoreVert style={{ fontSize: 16, color: '#686576' }} />
          </IconButton>
          <Menu
            anchorEl={menuAnchor}
            open={!!menuAnchor}
            onClose={() => setMenuAnchor(null)}
            onClick={(e) => e.stopPropagation()}
            sx={{ zIndex: 100050 }}
          >
            <MenuItem onClick={() => { setMenuAnchor(null); onUndo(); }}>
              <ListItemIcon><Replay style={{ fontSize: 18, color: '#686576' }} /></ListItemIcon>
              <ListItemText primaryTypographyProps={{ style: { fontSize: 13, fontFamily: 'Roboto, sans-serif' } }}>
                Undo Review
              </ListItemText>
            </MenuItem>
          </Menu>
        </>
      )}
    </div>
  );
};

/** The "Show Approved"/"Show Rejected" overflow menu shared by the Review Offers and Review Assets tabs —
 * both default to visible, so this is how the user hides already-decided items instead of the other way
 * around. */
export const ReviewVisibilityMenu = ({
  anchorEl, onClose, showApproved, showRejected, onToggleShowApproved, onToggleShowRejected,
}: {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  showApproved: boolean;
  showRejected: boolean;
  onToggleShowApproved: () => void;
  onToggleShowRejected: () => void;
}) => (
  <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={onClose} sx={{ zIndex: 100050 }}>
    <div onClick={onToggleShowApproved} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', cursor: 'pointer' }}>
      <Switch
        size="small"
        checked={showApproved}
        onClick={(e) => e.stopPropagation()}
        onChange={onToggleShowApproved}
        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#473bab' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { background: '#473bab' } }}
      />
      <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>Show Approved</span>
    </div>
    <div onClick={onToggleShowRejected} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', cursor: 'pointer' }}>
      <Switch
        size="small"
        checked={showRejected}
        onClick={(e) => e.stopPropagation()}
        onChange={onToggleShowRejected}
        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#473bab' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { background: '#473bab' } }}
      />
      <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>Show Rejected</span>
    </div>
  </Menu>
);
