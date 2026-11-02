import { CircularProgress } from '@mui/material';

/**
 * Confirmation dialog shown when a user unchecks a disclosure type (Lease, APR, etc.) that already has
 * disclosure text. Same shell/copy pattern as `RemoveSnippetDialog`, centered over a dark overlay.
 */

/** What confirming does to the account snippet: rebuild it without this disclosure, detach it (it was the
 * snippet's only disclosure), or nothing (the disclosure was never built into the snippet). */
export type RemoveDisclosureSnippetEffect = 'regenerate' | 'detach' | 'none';

interface RemoveDisclosureDialogProps {
  open: boolean;
  disclosureLabel: string;
  snippetEffect: RemoveDisclosureSnippetEffect;
  /** The snippet is being regenerated — locks the dialog until it finishes. */
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

const BODY_COPY: Record<RemoveDisclosureSnippetEffect, string> = {
  regenerate: 'Unchecking clears the disclosure text you added and regenerates the account snippet from the remaining disclosures.',
  detach: 'Unchecking clears the disclosure text you added. It’s the only disclosure in the account snippet, so the snippet will be detached from this account.',
  none: 'Unchecking clears the disclosure text you added.',
};

const CONFIRM_LABEL: Record<RemoveDisclosureSnippetEffect, string> = {
  regenerate: 'Remove Disclosure & Regenerate Snippet',
  detach: 'Remove Disclosure & Snippet',
  none: 'Remove Disclosure',
};

/** "Cash Disclosure" → "cash disclosure", keeping acronyms such as APR in caps. */
function toSentenceLabel(label: string): string {
  return label.split(' ').map((word) => (word.length > 1 && word === word.toUpperCase() ? word : word.toLowerCase())).join(' ');
}

export function RemoveDisclosureDialog({
  open, disclosureLabel, snippetEffect, busy, error, onCancel, onConfirm,
}: RemoveDisclosureDialogProps) {
  if (!open) return null;

  return (
    <div
      onClick={busy ? undefined : onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 200001,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="remove-disclosure-title"
        aria-busy={busy}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 24,
          // Small dialog size.
          width: 600,
          maxWidth: 'calc(100vw - 32px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0px 6px 30px 5px rgba(0,0,0,0.12), 0px 16px 24px 2px rgba(0,0,0,0.14), 0px 8px 10px -5px rgba(0,0,0,0.2)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 16px 8px' }}>
          <span id="remove-disclosure-title" style={{ fontSize: 20, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.15px' }}>
            Remove {toSentenceLabel(disclosureLabel)}
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: '8px 16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#1f1d25', letterSpacing: '0.15px', lineHeight: 1.5 }}>
            {BODY_COPY[snippetEffect]}
          </p>
          {error && (
            <p role="alert" style={{ margin: 0, fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#d2323f', letterSpacing: '0.17px', lineHeight: 1.5 }}>
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '0 16px 16px' }}>
          <button
            onClick={onCancel}
            disabled={busy}
            style={{
              padding: '6px 8px', background: 'transparent', border: 'none', borderRadius: 100, cursor: busy ? 'default' : 'pointer',
              fontSize: 14, fontFamily: 'Roboto, sans-serif', color: busy ? 'rgba(17,16,20,0.38)' : '#473bab', fontWeight: 500, letterSpacing: '0.4px',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 16px', background: busy ? 'rgba(17,16,20,0.12)' : '#d2323f', border: 'none', borderRadius: 100,
              cursor: busy ? 'default' : 'pointer', fontSize: 14, fontFamily: 'Roboto, sans-serif',
              color: busy ? 'rgba(17,16,20,0.38)' : '#fff', fontWeight: 500, letterSpacing: '0.4px', whiteSpace: 'nowrap',
            }}
          >
            {busy && <CircularProgress size={14} sx={{ color: 'rgba(17,16,20,0.38)' }} />}
            {busy ? 'Regenerating Snippet...' : CONFIRM_LABEL[snippetEffect]}
          </button>
        </div>
      </div>
    </div>
  );
}
