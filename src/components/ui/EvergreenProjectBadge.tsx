import { Lock, LockOpen, AllInclusive } from '@mui/icons-material';

interface EvergreenProjectBadgeProps {
  locked: boolean;
  /** Clicking the "Locked" indicator — should surface the unlock-risk confirmation popup. */
  onLockedClick: () => void;
  /** Clicking the "Unlocked" indicator — locks the project again immediately, no confirmation needed. */
  onUnlockedClick: () => void;
}

const indicatorButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
};

const indicatorTextStyle: React.CSSProperties = {
  fontSize: 11,
  fontFamily: 'Roboto, sans-serif',
  fontWeight: 400,
  color: '#686576',
  letterSpacing: '0.4px',
  lineHeight: 1.66,
  whiteSpace: 'nowrap',
};

interface EvergreenIndicatorIconProps {
  locked: boolean;
}

/** Icon-only chip variant of the Evergreen indicator — shown on Evergreen project cards in the Projects list. */
export const EvergreenIndicatorIcon = ({ locked }: EvergreenIndicatorIconProps) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: locked ? '#473bab' : 'rgba(99, 86, 225, 0.12)',
      borderRadius: 8,
      padding: 3,
      flexShrink: 0,
    }}
  >
    <AllInclusive style={{ fontSize: 14, color: locked ? '#ffffff' : '#6356e1' }} />
  </div>
);

/** Shown on the top-right of the main panel for Evergreen projects (Overview + every task page). */
export const EvergreenProjectBadge = ({ locked, onLockedClick, onUnlockedClick }: EvergreenProjectBadgeProps) => {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      {locked ? (
        <button type="button" style={indicatorButtonStyle} onClick={onLockedClick}>
          <Lock style={{ fontSize: 14, color: '#686576' }} />
          <span style={indicatorTextStyle}>Locked</span>
        </button>
      ) : (
        <button type="button" style={indicatorButtonStyle} onClick={onUnlockedClick}>
          <LockOpen style={{ fontSize: 14, color: '#686576' }} />
          <span style={indicatorTextStyle}>Unlocked</span>
        </button>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: locked ? '#473bab' : 'rgba(99, 86, 225, 0.12)',
          borderRadius: 8,
          padding: '3px 8px 3px 6px',
          flexShrink: 0,
        }}
      >
        <AllInclusive style={{ fontSize: 13, color: locked ? '#ffffff' : '#6356e1' }} />
        <span
          style={{
            fontSize: 11,
            fontFamily: 'Roboto, sans-serif',
            fontWeight: 400,
            color: locked ? '#ffffff' : '#6356e1',
            letterSpacing: '0.16px',
            lineHeight: '18px',
            whiteSpace: 'nowrap',
          }}
        >
          Evergreen Project
        </span>
      </div>
    </div>
  );
};
