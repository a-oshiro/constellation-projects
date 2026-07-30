import { Lock, AllInclusive } from '@mui/icons-material';

/** Shown on the top-right of the main panel for Evergreen projects (Overview + every task page). */
export const EvergreenProjectBadge = () => {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Lock style={{ fontSize: 14, color: '#686576' }} />
        <span
          style={{
            fontSize: 11,
            fontFamily: 'Roboto, sans-serif',
            fontWeight: 400,
            color: '#686576',
            letterSpacing: '0.4px',
            lineHeight: 1.66,
            whiteSpace: 'nowrap',
          }}
        >
          Locked
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: '#473bab',
          borderRadius: 8,
          padding: '3px 8px 3px 6px',
          flexShrink: 0,
        }}
      >
        <AllInclusive style={{ fontSize: 13, color: '#ffffff' }} />
        <span
          style={{
            fontSize: 11,
            fontFamily: 'Roboto, sans-serif',
            fontWeight: 400,
            color: '#ffffff',
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
