import type { CSSProperties } from 'react';

export const SECTION_TITLE_STYLE: CSSProperties = {
  margin: '0 0 4px', fontSize: 20, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px',
};

export const BODY_TEXT_STYLE: CSSProperties = {
  margin: 0, fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px', lineHeight: 1.6,
};

export const HELPER_TEXT_STYLE: CSSProperties = {
  margin: 0, fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px', lineHeight: 1.5,
};

export const FIELD_LABEL_STYLE: CSSProperties = {
  fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.15px', marginBottom: 4,
};

/** Purple-focus text field styling, matching the app's #473bab convention (not AppTextField's #6d28d9). */
export const TEXT_FIELD_SX = {
  '& .MuiOutlinedInput-root': {
    background: '#ffffff', fontSize: 14, fontFamily: 'Roboto, sans-serif',
    '& fieldset': { borderColor: '#cac9cf' },
    '&:hover fieldset': { borderColor: '#9b96b0' },
    '&.Mui-focused fieldset': { borderColor: '#473bab' },
  },
};

export const CHECKBOX_SX = {
  padding: '4px',
  '&.Mui-checked': { color: '#473bab' },
  '&.Mui-disabled': { color: '#cac9cf' },
};

export const LINK_BUTTON_STYLE: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer',
  color: '#473bab', fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, letterSpacing: '0.17px', padding: 0,
};

export const InfoCallout = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', gap: 10, background: '#e5f4fb', borderRadius: 8, padding: '12px 16px' }}>
    <div style={{ paddingTop: 2 }}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7.25" stroke="#01579b" strokeWidth="1.5" />
        <path d="M10 9.5V14M10 6.5V6.6" stroke="#01579b" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
    <div>
      <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#01579b', letterSpacing: '0.17px' }}>
        {title}
      </p>
      <p style={{ margin: 0, fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#01579b', letterSpacing: '0.17px', lineHeight: 1.5 }}>
        {children}
      </p>
    </div>
  </div>
);
