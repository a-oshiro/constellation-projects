import { useState } from 'react';
import { Lock } from '@mui/icons-material';

interface LockedOverlayProps {
  /** Background color the scrim fades from/into — should match the surface it sits on top of. */
  tint?: string;
}

/** Centered "Locked" message over a translucent scrim. Rendered by LockableContent on hover. */
export const LockedOverlay = ({ tint = '#ffffff' }: LockedOverlayProps) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      zIndex: 20,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `radial-gradient(ellipse at center, ${tint}f2 0%, ${tint}b3 100%)`,
      cursor: 'default',
    }}
  >
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Lock style={{ fontSize: 20, color: '#1f1d25' }} />
        <span style={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#1f1d25', letterSpacing: '0.15px' }}>
          Locked
        </span>
      </div>
      <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#686576', letterSpacing: '0.17px', lineHeight: 1.43 }}>
        If edits on this project are required, an Admin can unlock it.
      </span>
    </div>
  </div>
);

interface LockableContentProps {
  /** Whether the overlay should be armed — pass `currentProject.isEvergreen && locked`. */
  locked: boolean;
  /** Background color the overlay's scrim should match. */
  tint?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

/** Wraps content that should show the Locked overlay on hover, blocking clicks underneath, when `locked` is true. */
export const LockableContent = ({ locked, tint, className, style, children }: LockableContentProps) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={className}
      style={{ position: 'relative', ...style }}
      onMouseEnter={() => locked && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      {locked && hovered && <LockedOverlay tint={tint} />}
    </div>
  );
};
