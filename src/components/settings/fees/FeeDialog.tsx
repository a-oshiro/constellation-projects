import type { ReactNode } from 'react';
import { Dialog, IconButton } from '@mui/material';
import crossSmallIcon from '../../../assets/icons/fees/cross-small.svg';

// Figma <Dialog> (Av3): 360px wide, 24px radius, elevation 16, h6 title with a close affordance,
// body2 content, actions right-aligned. Sizes live here.
const WIDTH = 360;
const RADIUS = 24;
const TITLE_FONT_SIZE = 20;
const CLOSE_ICON_SIZE = 20;
const TITLE_PADDING = '16px 16px 8px';
const CONTENT_PADDING = '8px 16px 24px';
const ACTIONS_PADDING = '0 16px 16px';
const ACTIONS_GAP = 8;

interface FeeDialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  actions: ReactNode;
  /** Wraps content + actions in a form so Enter submits. */
  onSubmit?: () => void;
}

export const FeeDialog = ({ open, title, onClose, children, actions, onSubmit }: FeeDialogProps) => {
  const titleId = `fee-dialog-title-${title.replace(/\s+/g, '-').toLowerCase()}`;
  const body = (
    <>
      <div style={{ padding: CONTENT_PADDING }}>{children}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: ACTIONS_GAP, padding: ACTIONS_PADDING }}>
        {actions}
      </div>
    </>
  );
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby={titleId}
      slotProps={{
        paper: {
          sx: {
            width: WIDTH, maxWidth: 'calc(100% - 32px)', margin: '16px', borderRadius: `${RADIUS}px`,
            boxShadow: '0px 6px 30px 5px rgba(0,0,0,0.12), 0px 16px 24px 2px rgba(0,0,0,0.14), 0px 8px 10px -5px rgba(0,0,0,0.2)',
          },
        },
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: TITLE_PADDING }}>
        <h2 id={titleId} style={{
          flex: 1, margin: 0, fontSize: TITLE_FONT_SIZE, fontWeight: 500, lineHeight: 1.6, letterSpacing: '0.15px',
          color: '#1f1d25', fontFamily: 'Roboto, sans-serif',
        }}>
          {title}
        </h2>
        <IconButton aria-label="Close" onClick={onClose} sx={{ padding: '5px' }}>
          <img src={crossSmallIcon} alt="" width={CLOSE_ICON_SIZE} height={CLOSE_ICON_SIZE} />
        </IconButton>
      </div>
      {onSubmit ? (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>{body}</form>
      ) : body}
    </Dialog>
  );
};

/** Dialog body copy (Figma body2). */
export const FeeDialogText = ({ children }: { children: ReactNode }) => (
  <p style={{ margin: 0, fontSize: 12, lineHeight: 1.43, letterSpacing: '0.17px', color: '#1f1d25', fontFamily: 'Roboto, sans-serif' }}>
    {children}
  </p>
);
