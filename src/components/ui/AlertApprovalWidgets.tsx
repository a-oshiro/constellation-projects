import { Check, CheckCircle, Cancel, Close } from '@mui/icons-material';
import type { ReviewStatus } from '../../data/types';
import { formatRelativeTime } from '../../utils/relativeTime';
import { formatReviewerName } from '../../utils/alertReview';

/**
 * The two floating, bottom-right-pinned approval widgets — one for the email track (still a single
 * alert-wide decision), one for the assets track (individually decided per offer, so it shows a progress
 * bar instead of Approve/Request Changes buttons while pending, and never carries a whole-widget
 * "changes requested" state since a rejection is just an asset that hasn't reached "approved" yet). Both
 * always show a small label identifying which track they're for, in every state.
 */

const widgetBase: React.CSSProperties = {
  width: 400, boxSizing: 'border-box', borderRadius: 12, padding: '12px 16px',
  boxShadow: '0px 4px 16px rgba(0,0,0,0.16)',
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: '#686576', fontFamily: 'Roboto, sans-serif', letterSpacing: '0.4px',
};

const actionPillBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', cursor: 'pointer',
  borderRadius: 100, padding: '6px 14px', fontSize: 13, fontFamily: 'Roboto, sans-serif',
  fontWeight: 500, letterSpacing: '0.46px', lineHeight: '20px', flexShrink: 0, whiteSpace: 'nowrap',
};

const containedPurpleButton: React.CSSProperties = {
  ...actionPillBase, alignSelf: 'flex-start', background: '#473bab', border: 'none', color: '#ffffff',
};

const undoLinkStyle: React.CSSProperties = {
  background: 'none', border: 'none', padding: 0, fontSize: 12, fontFamily: 'Roboto, sans-serif',
  fontWeight: 500, color: '#473bab', textDecoration: 'underline', cursor: 'pointer', flexShrink: 0,
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
  const background = isPending ? '#ffffff' : isApproved ? '#e8f5e9' : '#fce8ea';

  return (
    <div style={{ ...widgetBase, background }}>
      {isPending && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={eyebrowStyle}>Email Approval</span>
          <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#9c99a9', fontWeight: 500 }}>Pending</span>
        </div>
      )}
      {isPending ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <button
            disabled={disabled}
            onClick={onRequestChanges}
            style={{ ...actionPillBase, background: '#ffffff', border: '1px solid rgba(210,50,63,0.5)', color: '#d2323f', opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
          >
            <Close style={{ fontSize: 16 }} />
            Request Changes to Email
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
      ) : (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isApproved
              ? <CheckCircle style={{ fontSize: 18, color: '#4caf50', flexShrink: 0 }} />
              : <Cancel style={{ fontSize: 18, color: '#d2323f', flexShrink: 0 }} />}
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
              <span style={{ fontSize: 13, fontWeight: 500, color: isApproved ? '#1b5e20' : '#d2323f', fontFamily: 'Roboto, sans-serif' }}>
                {isApproved ? 'Email content approved' : 'Changes requested for the email content'}
              </span>
              <button
                disabled={disabled}
                onClick={onUndo}
                style={{ ...undoLinkStyle, opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer', color: isApproved ? '#1b5e20' : '#d2323f' }}
              >
                Undo
              </button>
            </div>
          </div>
          <span style={{ fontSize: 11, color: '#686576', fontFamily: 'Roboto, sans-serif', paddingLeft: 26 }}>
            by {formatReviewerName(actorName ?? '')} • {timestamp ? formatRelativeTime(timestamp) : ''}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, paddingLeft: 26 }}>
            {!isApproved && (
              <button
                disabled={disabled}
                onClick={onApproveChanges}
                style={{ ...containedPurpleButton, opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
              >
                Approve Changes
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface AssetApprovalWidgetProps {
  approvedCount: number;
  totalCount: number;
  /** True once every offer is approved — the only state that turns the whole widget green. A rejected
   * offer just keeps this false (the progress bar doesn't count it), it never turns the widget red. */
  isComplete: boolean;
  approverNames: string[];
  lastApprovedTimestamp?: number;
  rejectedCount: number;
  onScrollToFirstRejected: () => void;
}

export const AssetApprovalWidget = ({
  approvedCount, totalCount, isComplete, approverNames, lastApprovedTimestamp, rejectedCount, onScrollToFirstRejected,
}: AssetApprovalWidgetProps) => {
  const pct = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

  return (
    <div style={{ ...widgetBase, background: isComplete ? '#e8f5e9' : '#ffffff' }}>
      {isComplete ? null : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={eyebrowStyle}>Asset Approval</span>
          <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#9c99a9', fontWeight: 500 }}>Pending</span>
        </div>
      )}

      {isComplete ? (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle style={{ fontSize: 18, color: '#4caf50', flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 500, color: '#1b5e20', fontFamily: 'Roboto, sans-serif' }}>
              All assets approved
            </span>
          </div>
          <span style={{ fontSize: 11, color: '#686576', fontFamily: 'Roboto, sans-serif', paddingLeft: 26 }}>
            by {approverNames.map((n) => formatReviewerName(n)).join(', ')} • {lastApprovedTimestamp ? formatRelativeTime(lastApprovedTimestamp) : ''}
          </span>
        </div>
      ) : (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 6, borderRadius: 100, background: '#e5e5ea', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: '#473bab', borderRadius: 100, transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontSize: 11, color: '#686576', fontFamily: 'Roboto, sans-serif', whiteSpace: 'nowrap' }}>
              {approvedCount} of {totalCount} approved
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
            {rejectedCount > 0 && (
              <button
                onClick={onScrollToFirstRejected}
                style={{
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'right',
                  fontSize: 11, fontWeight: 500, color: '#d2323f', fontFamily: 'Roboto, sans-serif', textDecoration: 'underline', flexShrink: 0,
                }}
              >
                Changes requested for {rejectedCount} asset{rejectedCount > 1 ? 's' : ''}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface AssetStatusBadgeProps {
  label: 'Asset Approved' | 'Changes Requested';
  actorName: string;
  timestamp: number;
  onUndo: () => void;
  onApproveChanges?: () => void;
}

/** Per-asset approve/reject readout — a small footer badge pinned to the bottom-right corner of the asset
 * it belongs to (rather than living in the floating comment column), so the decision reads right where it
 * was made. */
export const AssetStatusBadge = ({ label, actorName, timestamp, onUndo, onApproveChanges }: AssetStatusBadgeProps) => {
  const isApproved = label === 'Asset Approved';
  return (
    <div
      style={{
        position: 'absolute', bottom: 8, right: 8, zIndex: 8, maxWidth: 'calc(100% - 16px)',
        boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 4,
        padding: '8px 10px', borderRadius: 8, background: isApproved ? '#e8f5e9' : '#fce8ea',
        boxShadow: '0px 1px 5px rgba(0,0,0,0.12), 0px 2px 2px rgba(0,0,0,0.14)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {isApproved
          ? <CheckCircle style={{ fontSize: 16, color: '#4caf50', flexShrink: 0 }} />
          : <Cancel style={{ fontSize: 16, color: '#d2323f', flexShrink: 0 }} />}
        <span style={{ fontSize: 12, fontWeight: 500, color: isApproved ? '#1b5e20' : '#d2323f', fontFamily: 'Roboto, sans-serif', whiteSpace: 'nowrap' }}>
          {label}
        </span>
      </div>
      <span style={{ fontSize: 10, color: '#686576', fontFamily: 'Roboto, sans-serif', paddingLeft: 22, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        by {actorName} • {formatRelativeTime(timestamp)}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 22 }}>
        <button onClick={onUndo} style={undoLinkStyle}>Undo</button>
        {onApproveChanges && (
          <button onClick={onApproveChanges} style={{ ...containedPurpleButton, padding: '2px 8px', fontSize: 11 }}>
            Approve Changes
          </button>
        )}
      </div>
    </div>
  );
};
