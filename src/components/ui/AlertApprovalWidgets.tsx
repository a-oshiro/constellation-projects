import { useState } from 'react';
import { IconButton, Menu, MenuItem } from '@mui/material';
import { Cancel, CheckCircle, MoreVert } from '@mui/icons-material';
import { Tooltip } from './Tooltip';

const tooltipPopperProps = { popper: { style: { zIndex: 100050 } } };

const cardBase: React.CSSProperties = {
  width: 240, boxSizing: 'border-box', borderRadius: 12, padding: 12,
  boxShadow: '0px 3px 5px -1px rgba(0,0,0,0.2), 0px 6px 10px rgba(0,0,0,0.14), 0px 1px 18px rgba(0,0,0,0.12)',
};

const titleStyle: React.CSSProperties = {
  fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', letterSpacing: '0.1px',
};

const smallIconButtonSx = { padding: '1px', width: 24, height: 24, flexShrink: 0 };

/** Three-dot menu button shared by the asset status badge, the Email Preview panel's approval banner, and
 * the dialog footer's review widgets — opens a small menu whose only action (for now) is undoing the
 * review decision. `undoLabel` differs by caller: a single asset says "Undo review", the footer's
 * all-assets/email widgets (which undo every offer at once) say "Undo reviews". */
export const ReviewMenuButton = ({ onUndo, disabled, undoLabel = 'Undo review' }: { onUndo: () => void; disabled?: boolean; undoLabel?: string }) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <>
      <Tooltip title="More actions" slotProps={tooltipPopperProps}>
        <span>
          <IconButton
            disabled={disabled}
            onClick={(e) => { e.stopPropagation(); setAnchor(e.currentTarget); }}
            sx={smallIconButtonSx}
          >
            <MoreVert style={{ fontSize: 18, color: '#686576' }} />
          </IconButton>
        </span>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        onClick={(e) => e.stopPropagation()}
        sx={{ zIndex: 100050 }}
      >
        <MenuItem onClick={() => { setAnchor(null); onUndo(); }}>{undoLabel}</MenuItem>
      </Menu>
    </>
  );
};

interface AssetStatusBadgeProps {
  label: 'Approved' | 'Rejected';
  disabled?: boolean;
  onUndo: () => void;
  /** 'overlay' (default) pins the badge to the bottom-right corner of a position:relative asset wrapper.
   * 'static' renders it in normal flow instead, for placement outside the asset box (e.g. below the
   * enlarged preview, right-aligned by the parent). */
  layout?: 'overlay' | 'static';
}

/** Per-asset approve/reject readout — a small badge pinned to the bottom-right corner of the asset it
 * belongs to (rather than living in the floating comment column), so the decision reads right where it was
 * made. Just the label + Undo — who/when lives in the Activity History panel and the asset's Metadata tab,
 * not repeated here. */
export const AssetStatusBadge = ({ label, disabled, onUndo, layout = 'overlay' }: AssetStatusBadgeProps) => {
  const isApproved = label === 'Approved';
  return (
    <div
      style={{
        ...cardBase,
        width: 'auto',
        ...(layout === 'overlay' ? { position: 'absolute' as const, bottom: 8, right: 8, zIndex: 8, maxWidth: 'calc(100% - 16px)' } : {}),
        background: isApproved ? '#edf7ed' : '#FBEFF0',
      }}
    >
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', width: '100%' }}>
        {isApproved
          ? <CheckCircle style={{ fontSize: 18, color: '#4caf50', flexShrink: 0 }} />
          : <Cancel style={{ fontSize: 18, color: '#be0e1c', flexShrink: 0 }} />}
        <span style={{ ...titleStyle, color: isApproved ? '#1b5e20' : '#be0e1c', whiteSpace: 'nowrap' }}>
          {label}
        </span>
        <ReviewMenuButton onUndo={onUndo} disabled={disabled} />
      </div>
    </div>
  );
};
