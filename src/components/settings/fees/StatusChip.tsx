import circleCheckIcon from '../../../assets/icons/fees/circle-check.svg';
import warningIcon from '../../../assets/icons/fees/warning-triangle-small.svg';

// Figma "Status Indicator" (Active / Warning / New): 8px-radius tinted pill, 14px icon, caption text.
const FONT_SIZE = 11;
const ICON_SIZE = 14;
const PADDING = '3px 8px 3px 6px';
const GAP = 4;
const RADIUS = 8;

export type StatusChipTone = 'success' | 'warning' | 'info';

const TONES: Record<StatusChipTone, { background: string; color: string; textOpacity?: number; icon?: string }> = {
  success: { background: '#e8f5e9', color: '#1b5e20', icon: circleCheckIcon },
  warning: { background: 'rgba(225,118,19,0.08)', color: '#c45500', textOpacity: 0.75, icon: warningIcon },
  info: { background: 'rgba(2,136,209,0.08)', color: '#01579b' },
};

export const StatusChip = ({ tone, label }: { tone: StatusChipTone; label: string }) => {
  const t = TONES[tone];
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: GAP, padding: PADDING, borderRadius: RADIUS,
        background: `linear-gradient(${t.background}, ${t.background}), #ffffff`, flexShrink: 0,
      }}
    >
      {t.icon && <img src={t.icon} alt="" width={ICON_SIZE} height={ICON_SIZE} />}
      <span style={{
        fontSize: FONT_SIZE, lineHeight: 1.66, letterSpacing: '0.4px', color: t.color, opacity: t.textOpacity,
        fontFamily: 'Roboto, sans-serif', whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
    </span>
  );
};
