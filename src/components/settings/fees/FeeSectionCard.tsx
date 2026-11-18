import type { ReactNode } from 'react';

// Figma bordered section ("Dealer Fees", "Optional Fees", "We identified this FeeSync account", "FeeSync Fees"):
// 1px divider border, 4px radius, 16px padding, 16px gap, subtitle2 title over a description. Sizes live here.
const PADDING = 16;
const GAP = 16;
const RADIUS = 4;
const TITLE_FONT_SIZE = 14;
const DESCRIPTION_FONT_SIZE = 11;
const HEADER_GAP = 4;

interface FeeSectionCardProps {
  title: string;
  description: string;
  /** Description style: "caption" (11px, manual fee cards) or "body2" (12px, the FeeSync confirm card). */
  descriptionSize?: 'caption' | 'body2';
  children: ReactNode;
}

export const FeeSectionCard = ({ title, description, descriptionSize = 'caption', children }: FeeSectionCardProps) => (
  <section style={{
    display: 'flex', flexDirection: 'column', gap: GAP, padding: PADDING, borderRadius: RADIUS,
    border: '1px solid rgba(0,0,0,0.12)', width: '100%', boxSizing: 'border-box', fontFamily: 'Roboto, sans-serif',
  }}>
    <header style={{ display: 'flex', flexDirection: 'column', gap: descriptionSize === 'caption' ? HEADER_GAP : 0 }}>
      <h2 style={{ margin: 0, fontSize: TITLE_FONT_SIZE, fontWeight: 500, lineHeight: 1.57, letterSpacing: '0.1px', color: '#1f1d25' }}>{title}</h2>
      <p style={{
        margin: 0, color: '#686576',
        ...(descriptionSize === 'caption'
          ? { fontSize: DESCRIPTION_FONT_SIZE, lineHeight: 1.66, letterSpacing: '0.4px' }
          : { fontSize: 12, lineHeight: 1.43, letterSpacing: '0.17px' }),
      }}>
        {description}
      </p>
    </header>
    {children}
  </section>
);
