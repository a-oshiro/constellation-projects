import type { CSSProperties, ReactNode } from 'react';
import { Button, IconButton } from '@mui/material';
import { Cancel, Close, Info, InfoOutlined, Warning, WarningAmber } from '@mui/icons-material';
import type { DisclosureIssue } from '../../../data/enrollmentSettings';
import { useSnackbar } from '../../../context/SnackbarContext';

/**
 * Lists the problems found while templatizing one disclosure, grouped by severity (Figma: "Disclosure
 * Warnings"). "Copy Messages" puts them on the clipboard as plain text, so they can be pasted into a
 * note to the client. Same hand-rolled overlay as `UpdateSnippetDialog`.
 */

interface DisclosureWarningsDialogProps {
  open: boolean;
  disclosureLabel: string;
  issues: DisclosureIssue[];
  onClose: () => void;
}

const FONT = 'Roboto, sans-serif';

const SEVERITIES: Array<{
  severity: DisclosureIssue['severity'];
  label: string;
  color: string;
  textColor: string;
  background: string;
  tagIcon: ReactNode;
  itemIcon: ReactNode;
}> = [
  {
    severity: 'failure', label: 'Failure', color: '#d2323f', textColor: '#b71c1c', background: 'rgba(210,50,63,0.08)',
    tagIcon: <Close style={{ fontSize: 14 }} />, itemIcon: <Cancel style={{ fontSize: 20, color: '#d2323f' }} />,
  },
  {
    severity: 'warning', label: 'Warning', color: '#ef6c00', textColor: '#9a4400', background: 'rgba(239,108,0,0.1)',
    tagIcon: <WarningAmber style={{ fontSize: 14 }} />, itemIcon: <Warning style={{ fontSize: 20, color: '#ef6c00' }} />,
  },
  {
    severity: 'change', label: 'Change', color: '#0288d1', textColor: '#01579b', background: '#EBF5FB',
    tagIcon: <InfoOutlined style={{ fontSize: 14 }} />, itemIcon: <Info style={{ fontSize: 20, color: '#0288d1' }} />,
  },
];

const ITEM_TEXT_STYLE: CSSProperties = {
  margin: 0, fontSize: 12, fontFamily: FONT, color: '#1f1d25', letterSpacing: '0.17px', lineHeight: 1.43,
};

const BUTTON_SX = {
  textTransform: 'none', fontSize: 14, fontWeight: 500, fontFamily: FONT, letterSpacing: '0.4px', lineHeight: '24px',
  borderRadius: 100, minWidth: 0,
} as const;

/** "Failure (2)\n- Title: message\n…" — what "Copy Messages" puts on the clipboard. */
function formatIssues(disclosureLabel: string, issues: DisclosureIssue[]): string {
  const sections = SEVERITIES
    .map(({ severity, label }) => {
      const group = issues.filter((i) => i.severity === severity);
      if (group.length === 0) return null;
      return [`${label} (${group.length})`, ...group.map((i) => `- ${i.title}: ${i.message}`)].join('\n');
    })
    .filter(Boolean);
  return [`${disclosureLabel} disclosure warnings`, ...sections].join('\n\n');
}

export function DisclosureWarningsDialog({ open, disclosureLabel, issues, onClose }: DisclosureWarningsDialogProps) {
  const { showSnackbar } = useSnackbar();
  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatIssues(disclosureLabel, issues));
      showSnackbar({ message: 'Messages copied.' });
    } catch {
      showSnackbar({ message: "Couldn't copy the messages." });
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100001,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        background: 'rgba(0,0,0,0.5)',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="disclosure-warnings-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 24, width: 600, maxWidth: '100%', maxHeight: '100%',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0px 6px 30px 5px rgba(0,0,0,0.12), 0px 16px 24px 2px rgba(0,0,0,0.14), 0px 8px 10px -5px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '16px 16px 8px' }}>
          <h2 id="disclosure-warnings-title" style={{ flex: 1, margin: 0, fontSize: 20, fontWeight: 500, fontFamily: FONT, color: '#1f1d25', letterSpacing: '0.15px', lineHeight: 1.6 }}>
            Disclosure Warnings ({issues.length})
          </h2>
          <IconButton aria-label="Close" onClick={onClose} sx={{ padding: '5px' }}>
            <Close style={{ fontSize: 20, color: 'rgba(17,16,20,0.56)' }} />
          </IconButton>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {SEVERITIES.map(({ severity, label, textColor, background, tagIcon, itemIcon }) => {
            const group = issues.filter((i) => i.severity === severity);
            if (group.length === 0) return null;
            return (
              <section key={severity} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{
                  alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 4, height: 24, padding: '0 8px',
                  borderRadius: 8, background, color: textColor, fontSize: 11, fontFamily: FONT, letterSpacing: '0.16px',
                }}>
                  {tagIcon}
                  {label} ({group.length})
                </span>
                {group.map((issue, i) => (
                  <div
                    key={i}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: 12, border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8 }}
                  >
                    <span style={{ display: 'flex', flexShrink: 0 }}>{itemIcon}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <p style={{ ...ITEM_TEXT_STYLE, fontWeight: 500 }}>{issue.title}</p>
                      <p style={ITEM_TEXT_STYLE}>{issue.message}</p>
                    </div>
                  </div>
                ))}
              </section>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '16px' }}>
          <Button variant="text" onClick={handleCopy} sx={{ ...BUTTON_SX, color: '#473bab', padding: '6px 8px' }}>
            Copy Messages
          </Button>
          <Button
            variant="contained"
            disableElevation
            onClick={onClose}
            sx={{ ...BUTTON_SX, background: '#473bab', color: '#ffffff', padding: '6px 16px', '&:hover': { background: '#3d3396' } }}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
