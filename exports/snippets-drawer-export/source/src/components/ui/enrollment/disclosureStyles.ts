// Styles shared by the Disclosures page's internal (template builder) and client (submission) views.
import type { CSSProperties } from 'react';

// Medium buttons, matching the page footer's other actions (Discard/Save on the other settings pages).
export const MEDIUM_BUTTON_BASE_SX = {
  borderRadius: 100, textTransform: 'none', fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif',
  letterSpacing: '0.4px', lineHeight: '24px', minWidth: 0, whiteSpace: 'nowrap',
  '& .MuiButton-startIcon': { marginLeft: 0, marginRight: '8px' },
};

export const OUTLINED_MEDIUM_BUTTON_SX = {
  ...MEDIUM_BUTTON_BASE_SX,
  padding: '5px 15px', color: '#473bab', borderColor: 'rgba(99,86,225,0.5)',
  '&:hover': { borderColor: '#473bab', background: 'rgba(99,86,225,0.04)' },
};

export const CONTAINED_MEDIUM_BUTTON_SX = {
  ...MEDIUM_BUTTON_BASE_SX,
  padding: '6px 16px', background: '#473bab', color: '#ffffff',
  '&:hover': { background: '#3d3396' },
  '&.Mui-disabled': { background: 'rgba(17,16,20,0.08)', color: 'rgba(17,16,20,0.38)' },
};

export const TEXT_MEDIUM_BUTTON_SX = { ...MEDIUM_BUTTON_BASE_SX, padding: '6px 8px', color: '#473bab' };

export const SECTION_CARD_STYLE: CSSProperties = {
  border: '1px solid rgba(0,0,0,0.12)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 4,
};

export const SUBTITLE2_STYLE: CSSProperties = {
  margin: 0, fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.1px', lineHeight: 1.57,
};

export const BODY2_SECONDARY_STYLE: CSSProperties = {
  margin: 0, fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px', lineHeight: 1.43,
};

export const TAG_TONES = {
  purple: { background: 'rgba(99,86,225,0.08)', color: '#473bab' },
  blue: { background: '#EBF5FB', color: '#01579b' },
  green: { background: 'rgba(46,125,50,0.08)', color: '#1b5e20' },
  orange: { background: 'rgba(239,108,0,0.1)', color: '#9a4400' },
  gray: { background: 'rgba(17,16,20,0.08)', color: '#1f1d25' },
} as const;

export type TagTone = keyof typeof TAG_TONES;
