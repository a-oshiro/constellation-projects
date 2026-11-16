import { Chip } from '@mui/material';
import type { KeyboardEvent, MouseEvent } from 'react';
import { TAG_TONES } from './disclosureStyles';
import type { TagTone } from './disclosureStyles';

/**
 * Renders a Figma icon asset as a mask, tinted to `color` — matches Figma's "Masked Icon" color overrides.
 * Button icons pass `currentColor` so they follow the button's text color, including its disabled state.
 */
export const MaskedIcon = ({ src, size, color = '#473bab' }: { src: string; size: number; color?: string }) => (
  <span
    aria-hidden
    style={{
      display: 'inline-block', width: size, height: size, flexShrink: 0, backgroundColor: color,
      // Quoted — Vite inlines small SVGs as data URIs, which contain characters an unquoted url() can't hold.
      WebkitMaskImage: `url(${JSON.stringify(src)})`, maskImage: `url(${JSON.stringify(src)})`,
      WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
    }}
  />
);

/** Small tag in a disclosure card's header (MUI Chip size="small", Figma's 8px-radius tag look). */
export const HeaderTag = ({ label, tone, onClick }: { label: string; tone: TagTone; onClick?: () => void }) => (
  <Chip
    label={label}
    size="small"
    onClick={onClick && ((e: MouseEvent) => { e.stopPropagation(); onClick(); })}
    // Keeps Enter/Space on the tag from also toggling the card it sits in.
    onKeyDown={onClick && ((e: KeyboardEvent) => e.stopPropagation())}
    sx={{
      height: 24, borderRadius: '8px', ...TAG_TONES[tone],
      fontSize: 11, fontFamily: 'Roboto, sans-serif', letterSpacing: '0.16px', lineHeight: '18px',
      '& .MuiChip-label': { padding: '0 8px', textDecoration: onClick ? 'underline' : 'none' },
      '&.MuiChip-clickable:hover': { background: TAG_TONES[tone].background, filter: 'brightness(0.96)' },
    }}
  />
);
