import { Cancel, Check, Delete } from '@mui/icons-material';
import type { ReviewStatus } from '../../data/types';
import { ReviewMenuButton } from './AlertApprovalWidgets';
import { Tooltip } from './Tooltip';

/**
 * The dialog footer's two review widgets (assets + email), always visible so review progress and the
 * final Send action all live in one place instead of scattered floating overlays. Each widget has three
 * looks: still-in-progress (a live control), all-done-successfully (a green pill), or all-rejected (a red
 * pill) — see AssetsFooterWidget/EmailFooterWidget below.
 */

const tooltipPopperProps = { popper: { style: { zIndex: 100050 } } };

const pillBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 100, padding: '6px 8px 6px 12px', flexShrink: 0,
};

const actionButtonBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', cursor: 'pointer',
  borderRadius: 100, padding: '6px 14px', fontSize: 13, fontFamily: 'Roboto, sans-serif',
  fontWeight: 500, letterSpacing: '0.46px', lineHeight: '20px', flexShrink: 0, whiteSpace: 'nowrap',
};

const labelStyle: React.CSSProperties = {
  fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, whiteSpace: 'nowrap',
};

/** Small donut showing approved (green) / rejected (red) / still-pending (gray track) share of the
 * assets reviewed so far — fills in live as the user works through the carousel. */
const AssetsProgressRing = ({ approvedFraction, rejectedFraction, size = 28 }: { approvedFraction: number; rejectedFraction: number; size?: number }) => {
  const approvedDeg = approvedFraction * 360;
  const rejectedDeg = rejectedFraction * 360;
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: `conic-gradient(#4caf50 0deg ${approvedDeg}deg, #be0e1c ${approvedDeg}deg ${approvedDeg + rejectedDeg}deg, rgba(17,16,20,0.12) ${approvedDeg + rejectedDeg}deg 360deg)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{ width: size - 9, height: size - 9, borderRadius: '50%', background: '#ffffff' }} />
    </div>
  );
};

/** Plain gray ring used for the email widget's pending state — a single all-or-nothing decision, so it
 * never partially fills the way the assets ring does. */
const PendingRing = ({ size = 28 }: { size?: number }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, border: '3px solid rgba(17,16,20,0.12)', boxSizing: 'border-box' }} />
);

interface AssetsFooterWidgetProps {
  approvedCount: number;
  rejectedCount: number;
  totalCount: number;
  status: ReviewStatus;
  disabled?: boolean;
  disabledReason?: string;
  onApproveAll: () => void;
  onUndoAll: () => void;
}

export const AssetsFooterWidget = ({ approvedCount, rejectedCount, totalCount, status, disabled, disabledReason, onApproveAll, onUndoAll }: AssetsFooterWidgetProps) => {
  if (status === 'approved') {
    return (
      <div style={{ ...pillBase, background: '#edf7ed' }}>
        <Check style={{ fontSize: 18, color: '#4caf50', flexShrink: 0 }} />
        <span style={{ ...labelStyle, color: '#1b5e20' }}>All assets reviewed</span>
        <ReviewMenuButton onUndo={onUndoAll} disabled={disabled} undoLabel="Undo reviews" />
      </div>
    );
  }
  if (status === 'rejected') {
    return (
      <div style={{ ...pillBase, background: '#FBEFF0' }}>
        <Delete style={{ fontSize: 18, color: '#be0e1c', flexShrink: 0 }} />
        <span style={{ ...labelStyle, color: '#be0e1c' }}>All assets rejected</span>
        <ReviewMenuButton onUndo={onUndoAll} disabled={disabled} undoLabel="Undo reviews" />
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <AssetsProgressRing approvedFraction={totalCount > 0 ? approvedCount / totalCount : 0} rejectedFraction={totalCount > 0 ? rejectedCount / totalCount : 0} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25' }}>Assets</span>
        <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576' }}>{approvedCount} of {totalCount} approved</span>
      </div>
      <Tooltip title={disabledReason ?? ''} disableHoverListener={!disabledReason} slotProps={tooltipPopperProps}>
        <span>
          <button
            disabled={disabled}
            onClick={onApproveAll}
            style={{ ...actionButtonBase, background: '#4caf50', color: '#ffffff', opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
          >
            <Check style={{ fontSize: 16 }} />
            Approve all
          </button>
        </span>
      </Tooltip>
    </div>
  );
};

interface EmailFooterWidgetProps {
  status: ReviewStatus;
  disabled?: boolean;
  disabledReason?: string;
  onApprove: () => void;
  onReject: () => void;
  onUndo: () => void;
}

export const EmailFooterWidget = ({ status, disabled, disabledReason, onApprove, onReject, onUndo }: EmailFooterWidgetProps) => {
  if (status === 'approved') {
    return (
      <div style={{ ...pillBase, background: '#edf7ed' }}>
        <Check style={{ fontSize: 18, color: '#4caf50', flexShrink: 0 }} />
        <span style={{ ...labelStyle, color: '#1b5e20' }}>Email approved</span>
        <ReviewMenuButton onUndo={onUndo} disabled={disabled} undoLabel="Undo reviews" />
      </div>
    );
  }
  if (status === 'rejected') {
    return (
      <div style={{ ...pillBase, background: '#FBEFF0' }}>
        <Delete style={{ fontSize: 18, color: '#be0e1c', flexShrink: 0 }} />
        <span style={{ ...labelStyle, color: '#be0e1c' }}>Email rejected</span>
        <ReviewMenuButton onUndo={onUndo} disabled={disabled} undoLabel="Undo reviews" />
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <PendingRing />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25' }}>Email</span>
        <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576' }}>Pending review</span>
      </div>
      <Tooltip title={disabledReason ?? ''} disableHoverListener={!disabledReason} slotProps={tooltipPopperProps}>
        <span>
          <button
            disabled={disabled}
            onClick={onReject}
            style={{ ...actionButtonBase, background: '#ffffff', color: '#be0e1c', border: '1px solid #be0e1c', opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
          >
            <Cancel style={{ fontSize: 16 }} />
            Reject
          </button>
        </span>
      </Tooltip>
      <Tooltip title={disabledReason ?? ''} disableHoverListener={!disabledReason} slotProps={tooltipPopperProps}>
        <span>
          <button
            disabled={disabled}
            onClick={onApprove}
            style={{ ...actionButtonBase, background: '#4caf50', color: '#ffffff', opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
          >
            <Check style={{ fontSize: 16 }} />
            Approve email
          </button>
        </span>
      </Tooltip>
    </div>
  );
};
