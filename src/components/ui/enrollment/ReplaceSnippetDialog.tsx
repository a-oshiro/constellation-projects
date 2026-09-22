/**
 * Confirmation dialog shown when a user replaces a generated disclosure snippet from a Fees and
 * Disclosures block. Modeled on `RemoveSnippetDialog`'s shell/copy pattern. Rendered above the
 * full-screen `DisclosureSnippetDialog` portal (z-index 100001), so its own overlay needs to sit
 * higher than that.
 */

interface ReplaceSnippetDialogProps {
  open: boolean;
  snippetName: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ReplaceSnippetDialog({ open, snippetName, onCancel, onConfirm }: ReplaceSnippetDialogProps) {
  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200001,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 24,
        width: 360,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0px 6px 30px 5px rgba(0,0,0,0.12), 0px 16px 24px 2px rgba(0,0,0,0.14), 0px 8px 10px -5px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 16px 8px' }}>
          <span style={{ fontSize: 20, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.15px' }}>
            Replace this snippet
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: '8px 16px 24px' }}>
          <p style={{ margin: 0, fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#1f1d25', letterSpacing: '0.15px', lineHeight: 1.5 }}>
            By proceeding, the connection with “{snippetName}” will be lost. You can still reconnect with it later — it remains stored in Portal.
          </p>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '0 16px 16px' }}>
          <button
            onClick={onCancel}
            style={{ padding: '6px 8px', background: 'transparent', border: 'none', borderRadius: 100, cursor: 'pointer', fontSize: 14, fontFamily: 'Roboto, sans-serif', color: '#473bab', fontWeight: 500, letterSpacing: '0.4px' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{ padding: '6px 16px', background: '#473bab', border: 'none', borderRadius: 100, cursor: 'pointer', fontSize: 14, fontFamily: 'Roboto, sans-serif', color: '#fff', fontWeight: 500, letterSpacing: '0.4px' }}
          >
            Replace
          </button>
        </div>
      </div>
    </div>
  );
}
