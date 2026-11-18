import type { ReactNode } from 'react';
import circleXIcon from '../../../assets/icons/fees/circle-x.svg';
import warningIcon from '../../../assets/icons/fees/warning-triangle.svg';
import circleInfoIcon from '../../../assets/icons/fees/circle-info.svg';

// Figma <Alert> "Notice": error (connection failed) and warning (connection lost) are filled banners;
// info (some fees may not be available) is an inline line with no background. Sizes live here.
const FONT_SIZE = 12;
const BANNER_ICON_SIZE = 22;
const INLINE_ICON_SIZE = 20;
const BANNER_PADDING = '6px 16px';
const BANNER_ICON_PADDING = '7px 12px 7px 0';
const BANNER_TEXT_PADDING_Y = 8;
const INLINE_PADDING_Y = 4;
const INLINE_GAP = 8;

export type FeeNoticeTone = 'error' | 'warning' | 'info';

const TONES: Record<FeeNoticeTone, { background?: string; color: string; icon: string }> = {
  error: { background: '#fdeded', color: '#5f2120', icon: circleXIcon },
  warning: { background: '#fff4e5', color: '#663c00', icon: warningIcon },
  info: { color: '#01579b', icon: circleInfoIcon },
};

const TEXT_STYLE = { margin: 0, fontSize: FONT_SIZE, lineHeight: 1.43, letterSpacing: '0.17px', fontFamily: 'Roboto, sans-serif' } as const;

export const FeeNotice = ({ tone, children }: { tone: FeeNoticeTone; children: ReactNode }) => {
  const t = TONES[tone];
  if (tone === 'info') {
    return (
      <div role="note" style={{ display: 'flex', alignItems: 'center', gap: INLINE_GAP, padding: `${INLINE_PADDING_Y}px 0`, width: '100%' }}>
        <img src={t.icon} alt="" width={INLINE_ICON_SIZE} height={INLINE_ICON_SIZE} style={{ flexShrink: 0 }} />
        <p style={{ ...TEXT_STYLE, color: t.color }}>{children}</p>
      </div>
    );
  }
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      style={{ display: 'flex', alignItems: 'flex-start', background: t.background, borderRadius: 4, padding: BANNER_PADDING, width: '100%', boxSizing: 'border-box' }}
    >
      <span style={{ display: 'flex', padding: BANNER_ICON_PADDING, flexShrink: 0 }}>
        <img src={t.icon} alt="" width={BANNER_ICON_SIZE} height={BANNER_ICON_SIZE} />
      </span>
      <p style={{ ...TEXT_STYLE, color: t.color, padding: `${BANNER_TEXT_PADDING_Y}px 0`, flex: 1, minWidth: 0 }}>{children}</p>
    </div>
  );
};

/** Bold underlined "See details" link used inside notices. No destination yet in the prototype. */
export const NoticeLink = ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', fontWeight: 700,
      color: 'inherit', textDecoration: 'underline',
    }}
  >
    {children}
  </button>
);
