import { useState } from 'react';
import { IconButton, Menu } from '@mui/material';
import { Check, CheckCircle, CheckCircleOutlined, MoreVert, Sync } from '@mui/icons-material';
import type { ReviewStatus } from '../../data/types';
import { formatRelativeTime } from '../../utils/relativeTime';
import { formatReviewerName } from '../../utils/alertReview';

/**
 * The two floating, bottom-right-pinned approval widgets — one for the email track (still a single
 * alert-wide decision), one for the assets track (individually decided per offer, so it shows one small
 * progress bar per asset instead of a single bar, and a title/icon that only shifts to "changes requested"
 * once a rejection exists). Both always show a title identifying which track they're for, in every state.
 */

const widgetBase: React.CSSProperties = {
  width: 360, boxSizing: 'border-box', borderRadius: 12, padding: 16,
  boxShadow: '0px 3px 5px -1px rgba(0,0,0,0.2), 0px 6px 10px rgba(0,0,0,0.14), 0px 1px 18px rgba(0,0,0,0.12)',
};

const cardBase: React.CSSProperties = {
  width: 240, boxSizing: 'border-box', borderRadius: 12, padding: 16,
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

interface WidgetMenuItem {
  label: string;
  onClick: () => void;
}

/** The 3-dot menu shared by all three widgets/cards below — only rendered when there's at least one action to offer. */
const WidgetMenuButton = ({ items, disabled }: { items: WidgetMenuItem[]; disabled?: boolean }) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  if (items.length === 0) return null;
  return (
    <>
      <IconButton
        disabled={disabled}
        onClick={(e) => { e.stopPropagation(); setAnchor(e.currentTarget); }}
        sx={{ padding: '1px', width: 24, height: 24, flexShrink: 0 }}
      >
        <MoreVert style={{ fontSize: 20, color: '#686576' }} />
      </IconButton>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)} onClick={(e) => e.stopPropagation()} sx={{ zIndex: 100050 }}>
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => { setAnchor(null); item.onClick(); }}
            style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', background: 'none', padding: '6px 16px', fontSize: 14, fontFamily: 'Roboto, sans-serif', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            {item.label}
          </button>
        ))}
      </Menu>
    </>
  );
};

interface EmailApprovalWidgetProps {
  status: ReviewStatus;
  actorName?: string;
  timestamp?: number;
  disabled?: boolean;
  onApprove: () => void;
  onRequestChanges: () => void;
  onApproveChanges: () => void;
  onUndo: () => void;
}

export const EmailApprovalWidget = ({
  status, actorName, timestamp, disabled, onApprove, onRequestChanges, onApproveChanges, onUndo,
}: EmailApprovalWidgetProps) => {
  const isPending = status === 'pending';
  const isApproved = status === 'approved';
  const background = isApproved ? '#edf7ed' : '#ffffff';
  const menuItems: WidgetMenuItem[] = isApproved
    ? [{ label: 'Undo Approval', onClick: onUndo }]
    : !isPending
      ? [{ label: 'Undo Changes Request', onClick: onUndo }]
      : [];

  return (
    <div style={{ ...widgetBase, background, display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', width: '100%' }}>
        {isApproved
          ? <CheckCircle style={{ fontSize: 18, color: '#4caf50', flexShrink: 0 }} />
          : isPending
            ? <CheckCircleOutlined style={{ fontSize: 18, color: '#9c99a9', flexShrink: 0 }} />
            : <Sync style={{ fontSize: 18, color: '#E17613', flexShrink: 0 }} />}
        <span style={{ ...titleStyle, flex: 1, minWidth: 0, color: isApproved ? '#1b5e20' : '#1f1d25' }}>
          {isApproved ? 'Email Approved' : isPending ? 'Email Approval' : 'Email Changes Requested'}
        </span>
        {isPending && <span style={captionStyle}>Pending review</span>}
        <WidgetMenuButton items={menuItems} disabled={disabled} />
      </div>

      {!isPending && (
        <span style={{ ...subtitleStyle, paddingLeft: 22 }}>
          By {formatReviewerName(actorName ?? '')} • {timestamp ? formatRelativeTime(timestamp) : ''}
        </span>
      )}

      {isPending ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 22, width: '100%', justifyContent: 'flex-end', marginTop: 8 }}>
          <button
            disabled={disabled}
            onClick={onRequestChanges}
            style={{ ...actionPillBase, background: '#ffffff', color: 'rgb(71, 59, 171)', opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
          >
            <Sync style={{ fontSize: 16 }} />
            Request Changes
          </button>
          <button
            disabled={disabled}
            onClick={onApprove}
            style={{ ...actionPillBase, background: '#4caf50', color: '#ffffff', opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
          >
            <Check style={{ fontSize: 16 }} />
            Approve Email
          </button>
        </div>
      ) : !isApproved && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 22, width: '100%', justifyContent: 'flex-end' }}>
          <button
            disabled={disabled}
            onClick={onApproveChanges}
            style={{ ...containedGreenButton, opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
          >
            <Check style={{ fontSize: 16 }} />
            Approve
          </button>
        </div>
      )}
    </div>
  );
};

interface AssetApprovalWidgetProps {
  /** One entry per offer in the alert, in the same order the assets appear in the email — drives both the
   * per-asset progress bars and every derived count below. Each bar is clickable (via onSelectAsset) so the
   * user can jump straight to the asset it represents. */
  assets: { offerId: string; status: ReviewStatus }[];
  approverNames: string[];
  lastApprovedTimestamp?: number;
  lastRejectedActorName?: string;
  lastRejectedTimestamp?: number;
  disabled?: boolean;
  /** Approves only the assets that haven't been reviewed at all yet — never touches ones already in
   * Changes Requested, which the user has to resolve individually. */
  onApproveRemaining: () => void;
  onUndoAllReviews: () => void;
  onSelectAsset: (offerId: string) => void;
}

export const AssetApprovalWidget = ({
  assets, approverNames, lastApprovedTimestamp, lastRejectedActorName, lastRejectedTimestamp, disabled,
  onApproveRemaining, onUndoAllReviews, onSelectAsset,
}: AssetApprovalWidgetProps) => {
  const totalCount = assets.length;
  const approvedCount = assets.filter((a) => a.status === 'approved').length;
  const rejectedCount = assets.filter((a) => a.status === 'rejected').length;
  const pendingCount = assets.filter((a) => a.status === 'pending').length;
  const reviewedCount = approvedCount + rejectedCount;
  const isComplete = totalCount > 0 && approvedCount === totalCount;
  const hasRejected = rejectedCount > 0;
  const menuItems: WidgetMenuItem[] = reviewedCount > 0 ? [{ label: 'Undo All Reviews', onClick: onUndoAllReviews }] : [];

  return (
    <div style={{ ...widgetBase, background: isComplete ? '#edf7ed' : '#ffffff', display: 'flex', flexDirection: 'column', gap: isComplete ? 4 : 12 }}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', width: '100%' }}>
        {isComplete
          ? <CheckCircle style={{ fontSize: 18, color: '#4caf50', flexShrink: 0 }} />
          : hasRejected
            ? <Sync style={{ fontSize: 18, color: '#E17613', flexShrink: 0 }} />
            : <CheckCircleOutlined style={{ fontSize: 18, color: '#9c99a9', flexShrink: 0 }} />}
        <span style={{ ...titleStyle, flex: 1, minWidth: 0, color: isComplete ? '#1b5e20' : '#1f1d25' }}>
          {isComplete ? 'All Assets Approved' : hasRejected ? 'Assets Changes Requested' : 'Assets'}
        </span>
        {!isComplete && <span style={captionStyle}>{reviewedCount} of {totalCount} reviewed</span>}
        <WidgetMenuButton items={menuItems} disabled={disabled} />
      </div>

      {isComplete && (
        <span style={{ ...subtitleStyle, paddingLeft: 22 }}>
          By {approverNames.map((n) => formatReviewerName(n)).join(', ')} • {lastApprovedTimestamp ? formatRelativeTime(lastApprovedTimestamp) : ''}
        </span>
      )}
      {!isComplete && hasRejected && (
        <span style={{ ...subtitleStyle, paddingLeft: 22, marginTop: -12 }}>
          By {formatReviewerName(lastRejectedActorName ?? '')} • {lastRejectedTimestamp ? formatRelativeTime(lastRejectedTimestamp) : ''}
        </span>
      )}

      {!isComplete && (
        <>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', width: '100%', paddingLeft: 22 }}>
            {assets.map((a) => (
              <button
                key={a.offerId}
                onClick={() => onSelectAsset(a.offerId)}
                title="Jump to this asset"
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
                Assets can be approved individually
              </span>
              ) : (
              <div/>
              )}
              <button
                disabled={disabled}
                onClick={onApproveRemaining}
                style={{ ...containedGreenButton, opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
              >
                <Check style={{ fontSize: 16 }} />
                {reviewedCount === 0 ? 'Approve All' : `Approve ${pendingCount} remaining`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

interface AssetStatusBadgeProps {
  label: 'Approved' | 'Changes Requested';
  actorName: string;
  timestamp: number;
  disabled?: boolean;
  onUndo: () => void;
  onApproveChanges?: () => void;
  /** 'overlay' (default) pins the badge to the bottom-right corner of a position:relative asset wrapper.
   * 'static' renders it in normal flow instead, for placement outside the asset box (e.g. below the
   * enlarged preview, right-aligned by the parent). */
  layout?: 'overlay' | 'static';
}

/** Per-asset approve/reject readout — a small footer card pinned to the bottom-right corner of the asset
 * it belongs to (rather than living in the floating comment column), so the decision reads right where it
 * was made. No buttons live on the card itself — every action is tucked behind its 3-dot menu. */
export const AssetStatusBadge = ({ label, actorName, timestamp, disabled, onUndo, onApproveChanges, layout = 'overlay' }: AssetStatusBadgeProps) => {
  const isApproved = label === 'Approved';
  const menuItems: WidgetMenuItem[] = isApproved
    ? [{ label: 'Undo Approval', onClick: onUndo }]
    : [
        { label: 'Undo Changes Request', onClick: onUndo },
        ...(onApproveChanges ? [{ label: 'Approve Changes', onClick: onApproveChanges }] : []),
      ];
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
          : <Sync style={{ fontSize: 18, color: '#E17613', flexShrink: 0 }} />}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ ...titleStyle, color: isApproved ? '#1b5e20' : '#663C00', whiteSpace: 'nowrap' }}>
            {label}
          </span>
          <span style={{ ...subtitleStyle, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            By {actorName} • {formatRelativeTime(timestamp)}
          </span>
        </div>
        <WidgetMenuButton items={menuItems} disabled={disabled} />
      </div>
    </div>
  );
};
