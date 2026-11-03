import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Button, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { DisclosureSnippetEditor } from './DisclosureSnippetEditor';
import refreshIcon from '../../../assets/icons/disclosures/refresh.svg';

/**
 * Confirms an update to the account's disclosure snippet: the current snippet (read-only, left) next to
 * the snippet rebuilt from the edited disclosures (editable, right). Nothing changes until "Update
 * Snippet" is clicked. Same hand-rolled overlay as `RemoveSnippetDialog`; sits at the snippet builder's
 * z-index (100001) so the editor's variable picker popover (100002) still opens above it.
 */

interface UpdateSnippetDialogProps {
  open: boolean;
  currentText: string;
  newText: string;
  onCancel: () => void;
  onConfirm: (text: string) => void;
}

const FONT = 'Roboto, sans-serif';

const COLUMN_TITLE_STYLE: CSSProperties = {
  margin: 0, fontSize: 14, fontWeight: 500, fontFamily: FONT, color: '#1f1d25', letterSpacing: '0.1px', lineHeight: 1.57,
};

const SNIPPET_TEXT_STYLE: CSSProperties = {
  fontFamily: FONT, fontSize: 14, lineHeight: 1.7, color: '#1f1d25', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
};

const VARIABLE_SPLIT_RE = /(\{[a-zA-Z0-9_]+\})/;

/** Read-only snippet text with each {variable} drawn as the editor's default gray chip (minus its remove icon). */
const ReadOnlySnippet = ({ text }: { text: string }) => (
  <div style={SNIPPET_TEXT_STYLE}>
    {text.split(VARIABLE_SPLIT_RE).map((part, i) => (
      i % 2 === 1 ? (
        <span
          key={i}
          style={{
            display: 'inline-flex', alignItems: 'center', boxSizing: 'border-box', height: 24, borderRadius: 4, padding: '0 8px',
            margin: '0 1px', fontSize: 11, lineHeight: '18px', letterSpacing: '0.16px', background: '#f0f2f4',
            verticalAlign: 'middle', whiteSpace: 'nowrap',
          }}
        >
          {part}
        </span>
      ) : <span key={i}>{part}</span>
    ))}
  </div>
);

export function UpdateSnippetDialog({ open, currentText, newText, onCancel, onConfirm }: UpdateSnippetDialogProps) {
  if (!open) return null;
  // Keyed on `newText` so reopening after further disclosure edits starts from the fresh rebuild.
  return <UpdateSnippetDialogContent key={newText} currentText={currentText} newText={newText} onCancel={onCancel} onConfirm={onConfirm} />;
}

const UpdateSnippetDialogContent = ({ currentText, newText, onCancel, onConfirm }: Omit<UpdateSnippetDialogProps, 'open'>) => {
  const [text, setText] = useState(newText);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100001,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        background: 'rgba(0,0,0,0.5)',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-snippet-title"
        style={{
          background: '#fff', borderRadius: 24, width: 1200, maxWidth: '100%', height: 720, maxHeight: '100%',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0px 6px 30px 5px rgba(0,0,0,0.12), 0px 16px 24px 2px rgba(0,0,0,0.14), 0px 8px 10px -5px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '16px 16px 8px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 id="update-snippet-title" style={{ margin: 0, fontSize: 20, fontWeight: 500, fontFamily: FONT, color: '#1f1d25', letterSpacing: '0.15px', lineHeight: 1.6 }}>
              Update Snippet
            </h2>
            <p style={{ margin: 0, fontSize: 12, fontFamily: FONT, color: '#686576', letterSpacing: '0.17px', lineHeight: 1.43 }}>
              Review the snippet changes and confirm the update below.
            </p>
          </div>
          <IconButton aria-label="Close" onClick={onCancel} sx={{ padding: '5px' }}>
            <Close style={{ fontSize: 20, color: 'rgba(17,16,20,0.56)' }} />
          </IconButton>
        </div>

        <div style={{ flex: 1, minHeight: 0, padding: '8px 16px' }}>
          <div style={{ display: 'flex', height: '100%', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(0,0,0,0.12)' }}>
              <div style={{ padding: '12px 16px 8px', minHeight: 60, boxSizing: 'border-box' }}>
                <p style={COLUMN_TITLE_STYLE}>Current Snippet Content</p>
              </div>
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '8px 16px 16px' }}>
                <ReadOnlySnippet text={currentText} />
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '12px 16px 8px', minHeight: 60, boxSizing: 'border-box' }}>
                <p style={COLUMN_TITLE_STYLE}>New Content</p>
                <p style={{ margin: 0, fontSize: 11, fontFamily: FONT, color: '#686576', letterSpacing: '0.4px', lineHeight: 1.66 }}>
                  You may make changes to the template before saving as a new snippet version.
                </p>
              </div>
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '8px 16px 16px' }}>
                <DisclosureSnippetEditor initialValue={newText} onChange={setText} contentStyle={{ minHeight: 0 }} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '8px 16px 16px' }}>
          <Button
            variant="text"
            onClick={onCancel}
            sx={{
              textTransform: 'none', fontSize: 14, fontWeight: 500, fontFamily: FONT, letterSpacing: '0.4px', lineHeight: '24px',
              color: '#473bab', padding: '6px 8px', borderRadius: 100, minWidth: 0,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disableElevation
            disabled={text.trim() === ''}
            onClick={() => onConfirm(text)}
            startIcon={(
              <span
                aria-hidden
                style={{
                  display: 'inline-block', width: 20, height: 20, backgroundColor: 'currentColor',
                  WebkitMaskImage: `url(${JSON.stringify(refreshIcon)})`, maskImage: `url(${JSON.stringify(refreshIcon)})`,
                  WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
                }}
              />
            )}
            sx={{
              textTransform: 'none', fontSize: 14, fontWeight: 500, fontFamily: FONT, letterSpacing: '0.4px', lineHeight: '24px',
              background: '#473bab', color: '#ffffff', padding: '6px 16px', borderRadius: 100,
              '& .MuiButton-startIcon': { marginLeft: 0, marginRight: '8px' },
              '&:hover': { background: '#3d3396' },
              '&.Mui-disabled': { background: 'rgba(17,16,20,0.08)', color: 'rgba(17,16,20,0.38)' },
            }}
          >
            Update Snippet
          </Button>
        </div>
      </div>
    </div>
  );
};
