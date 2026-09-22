import { useState } from 'react';
import { IconButton } from '@mui/material';
import { Check, CheckCircle, DeleteOutlined, ExpandLess, ExpandMore, PendingOutlined, Undo } from '@mui/icons-material';
import type { ReviewStatus } from '../../data/types';
import { formatRelativeTime } from '../../utils/relativeTime';
import { formatReviewerName } from '../../utils/alertReview';
import { Tooltip } from './Tooltip';

const tooltipPopperProps = { popper: { style: { zIndex: 100050 } } };

/**
 * The floating, bottom-right-pinned approval widget — shared by the Offer Review and Asset Review tabs.
 * Items (offers or assets) are decided individually, so it shows one small progress bar per item instead
 * of a single bar, and a title/icon that only shifts to "removed" once a rejection exists. Always shows a
 * title identifying it, in every state, and is collapsible via the caret in its top-right corner (per
 * CP-13922) — collapsed shows a single summary row, expanded reveals the reviewer subtitle, per-item
 * progress, and action buttons.
 */

const widgetBase: React.CSSProperties = {
  width: 360, boxSizing: 'border-box', borderRadius: 12, padding: 12,
  boxShadow: '0px 3px 5px -1px rgba(0,0,0,0.2), 0px 6px 10px rgba(0,0,0,0.14), 0px 1px 18px rgba(0,0,0,0.12)',
};

const cardBase: React.CSSProperties = {
  width: 240, boxSizing: 'border-box', borderRadius: 12, padding: 12,
  boxShadow: '0px 3px 5px -1px rgba(0,0,0,0.2), 0px 6px 10px rgba(0,0,0,0.14), 0px 1px 18px rgba(0,0,0,0.12)',
};

const actionPillBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', cursor: 'pointer',
  borderRadius: 100, padding: '6px 14px', fontSize: 13, fontFamily: 'Roboto, sans-serif',
  fontWeight: 500, letterSpacing: '0.46px', lineHeight: '20px', flexShrink: 0, whiteSpace: 'nowrap',
};

const containedGreenButton: React.CSSProperties = {
  ...actionPillBase, alignSelf: 'flex-start', background: '#4caf50', border: 'none', color: '#ffffff',
};

const titleStyle: React.CSSProperties = {
  fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', letterSpacing: '0.1px',
};

const captionStyle: React.CSSProperties = {
  fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px', flexShrink: 0, whiteSpace: 'nowrap',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px',
};

const smallIconButtonSx = { padding: '1px', width: 24, height: 24, flexShrink: 0 };

/** Replaces the old 3-dot "Undo" menu — a single icon button whose hover message is passed in by the
 * caller, since it reads differently for the Email widget, the Assets widget, and a single asset's badge. */
const UndoButton = ({ tooltip, onClick, disabled }: { tooltip: string; onClick: () => void; disabled?: boolean }) => (
  <Tooltip title={tooltip} slotProps={tooltipPopperProps}>
    <span>
      <IconButton
        disabled={disabled}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        sx={smallIconButtonSx}
      >
        <Undo style={{ fontSize: 18, color: '#686576' }} />
      </IconButton>
    </span>
  </Tooltip>
);

/** The collapse/expand caret shared by both bottom-right widgets. */
const CollapseToggle = ({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) => (
  <IconButton onClick={(e) => { e.stopPropagation(); onToggle(); }} sx={smallIconButtonSx}>
    {collapsed
      ? <ExpandMore style={{ fontSize: 20, color: '#686576' }} />
      : <ExpandLess style={{ fontSize: 20, color: '#686576' }} />}
  </IconButton>
);

/** Item-label copy, keyed by which review track the widget represents — everything else about the widget is generic. */
const KIND_COPY: Record<'offers' | 'assets', { noun: string; approvedTitle: string; removedTitle: string; pendingTitle: string; jumpTooltip: string }> = {
  offers: { noun: 'Offers', approvedTitle: 'All Offers Approved', removedTitle: 'Offers Removed', pendingTitle: 'Offers Approvals', jumpTooltip: 'Jump to this offer' },
  assets: { noun: 'Assets', approvedTitle: 'All Assets Approved', removedTitle: 'Assets Removed', pendingTitle: 'Assets Approvals', jumpTooltip: 'Jump to this asset' },
};

interface ApprovalWidgetProps {
  /** Which review track this widget represents — drives its copy only; all behavior below is identical for both. */
  kind: 'offers' | 'assets';
  /** One entry per offer in the alert, in the same order they appear in the email — drives both the
   * per-item progress bars and every derived count below. Each bar is clickable (via onSelectItem) so the
   * user can jump straight to the item it represents. */
  items: { id: string; status: ReviewStatus }[];
  approverNames: string[];
  lastApprovedTimestamp?: number;
  lastRejectedActorName?: string;
  lastRejectedTimestamp?: number;
  disabled?: boolean;
  /** When set (alongside disabled), the Approve action shows this text in a tooltip on hover instead of just being inert. */
  disabledReason?: string;
  /** Approves only the items that haven't been reviewed at all yet — never touches ones already
   * removed, which the user has to resolve individually. */
  onApproveRemaining: () => void;
  onUndoAllReviews: () => void;
  onSelectItem: (id: string) => void;
}

export const ApprovalWidget = ({
  kind, items, approverNames, lastApprovedTimestamp, lastRejectedActorName, lastRejectedTimestamp, disabled, disabledReason,
  onApproveRemaining, onUndoAllReviews, onSelectItem,
}: ApprovalWidgetProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const copy = KIND_COPY[kind];
  const totalCount = items.length;
  const approvedCount = items.filter((a) => a.status === 'approved').length;
  const rejectedCount = items.filter((a) => a.status === 'rejected').length;
  const pendingCount = items.filter((a) => a.status === 'pending').length;
  const reviewedCount = approvedCount + rejectedCount;
  const isComplete = totalCount > 0 && approvedCount === totalCount;
  const hasRejected = rejectedCount > 0;
  const title = isComplete ? copy.approvedTitle : hasRejected ? copy.removedTitle : copy.pendingTitle;

  return (
    <div style={{ ...widgetBase, background: isComplete ? '#edf7ed' : '#ffffff', display: 'flex', flexDirection: 'column', gap: collapsed ? 0 : isComplete ? 4 : 12 }}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', width: '100%' }}>
        {isComplete
          ? <CheckCircle style={{ fontSize: 18, color: '#4caf50', flexShrink: 0 }} />
          : hasRejected
            ? <DeleteOutlined style={{ fontSize: 18, color: '#E17613', flexShrink: 0 }} />
            : <PendingOutlined style={{ fontSize: 18, color: '#9c99a9', flexShrink: 0 }} />}
        <span style={{ ...titleStyle, flex: 1, minWidth: 0, color: isComplete ? '#1b5e20' : '#1f1d25' }}>
          {title}
        </span>
        {collapsed && <span style={captionStyle}>{reviewedCount} of {totalCount} reviewed</span>}
        {!collapsed && reviewedCount > 0 && <UndoButton tooltip="Undo all reviews" onClick={onUndoAllReviews} disabled={disabled} />}
        <CollapseToggle collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      </div>

      {!collapsed && isComplete && (
        <span style={{ ...subtitleStyle, paddingLeft: 22 }}>
          By {approverNames.map((n) => formatReviewerName(n)).join(', ')} • {lastApprovedTimestamp ? formatRelativeTime(lastApprovedTimestamp) : ''}
        </span>
      )}
      {!collapsed && !isComplete && hasRejected && (
        <span style={{ ...subtitleStyle, paddingLeft: 22, marginTop: -12 }}>
          By {formatReviewerName(lastRejectedActorName ?? '')} • {lastRejectedTimestamp ? formatRelativeTime(lastRejectedTimestamp) : ''}
        </span>
      )}

      {!collapsed && !isComplete && (
        <>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', width: '100%', paddingLeft: 22 }}>
            {items.map((a) => (
              <button
                key={a.id}
                onClick={() => onSelectItem(a.id)}
                title={copy.jumpTooltip}
                style={{
                  flex: 1, height: 4, borderRadius: 100, border: 'none', padding: 0, cursor: 'pointer',
                  background: a.status === 'approved' ? '#4caf50' : a.status === 'rejected' ? '#E17613' : 'rgba(17,16,20,0.12)',
                }}
              />
            ))}
          </div>
          {pendingCount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end'}}>
              {reviewedCount === 0 ? (
              <span style={{ ...subtitleStyle, paddingLeft: 22 }}>
                {copy.noun} can be approved individually
              </span>
              ) : (
              <div/>
              )}
              <Tooltip title={disabledReason ?? ''} disableHoverListener={!disabledReason} slotProps={tooltipPopperProps}>
                <span>
                  <button
                    disabled={disabled}
                    onClick={onApproveRemaining}
                    style={{ ...containedGreenButton, opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
                  >
                    <Check style={{ fontSize: 16 }} />
                    {reviewedCount === 0 ? 'Approve All' : `Approve ${pendingCount} remaining`}
                  </button>
                </span>
              </Tooltip>
            </div>
          )}
        </>
      )}
    </div>
  );
};

interface AssetStatusBadgeProps {
  label: 'Approved' | 'Removed';
  actorName: string;
  timestamp: number;
  disabled?: boolean;
  onUndo: () => void;
  /** 'overlay' (default) pins the badge to the bottom-right corner of a position:relative asset wrapper.
   * 'static' renders it in normal flow instead, for placement outside the asset box (e.g. below the
   * enlarged preview, right-aligned by the parent). */
  layout?: 'overlay' | 'static';
}

/** Per-asset approve/reject readout — a small footer card pinned to the bottom-right corner of the asset
 * it belongs to (rather than living in the floating comment column), so the decision reads right where it
 * was made. Its only action is the Undo icon — reverting this one asset back to pending. */
export const AssetStatusBadge = ({ label, actorName, timestamp, disabled, onUndo, layout = 'overlay' }: AssetStatusBadgeProps) => {
  const isApproved = label === 'Approved';
  return (
    <div
      style={{
        ...cardBase,
        ...(layout === 'overlay' ? { position: 'absolute' as const, bottom: 8, right: 8, zIndex: 8, maxWidth: 'calc(100% - 16px)' } : {}),
        background: isApproved ? '#edf7ed' : '#FFF4E5',
      }}
    >
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', width: '100%' }}>
        {isApproved
          ? <CheckCircle style={{ fontSize: 18, color: '#4caf50', flexShrink: 0 }} />
          : <DeleteOutlined style={{ fontSize: 18, color: '#E17613', flexShrink: 0 }} />}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ ...titleStyle, color: isApproved ? '#1b5e20' : '#663C00', whiteSpace: 'nowrap' }}>
            {label}
          </span>
          <span style={{ ...subtitleStyle, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            By {actorName} • {formatRelativeTime(timestamp)}
          </span>
        </div>
        <UndoButton tooltip="Undo review" onClick={onUndo} disabled={disabled} />
      </div>
    </div>
  );
};
