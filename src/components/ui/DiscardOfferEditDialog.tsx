/**
 * Confirmation dialog shown when the user tries to leave the Offer Edit panel (via the header back
 * arrow, the footer "Back" button, or the header close X) while it has unsaved changes. Modeled on
 * `UnlockProjectDialog`'s shell/copy pattern. Rendered inside `AlertDialog`'s portal, so its overlay
 * needs a z-index above that dialog's own panel (100001) to render on top of it.
 */

interface DiscardOfferEditDialogProps {
  open: boolean;
  onContinueEditing: () => void;
  onGoBack: () => void;
}

export function DiscardOfferEditDialog({ open, onContinueEditing, onGoBack }: DiscardOfferEditDialogProps) {
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
            Go back and lose edit progress
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: '8px 16px 24px' }}>
          <p style={{ margin: 0, fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#1f1d25', letterSpacing: '0.15px', lineHeight: 1.5 }}>
            You have unsaved changes to this offer. Going back now will discard them, and this can’t be undone.
          </p>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '0 16px 16px' }}>
          <button
            onClick={onContinueEditing}
            style={{ padding: '6px 8px', background: 'transparent', border: 'none', borderRadius: 100, cursor: 'pointer', fontSize: 14, fontFamily: 'Roboto, sans-serif', color: '#473bab', fontWeight: 500, letterSpacing: '0.4px' }}
          >
            Continue Editing
          </button>
          <button
            onClick={onGoBack}
            style={{ padding: '6px 16px', background: '#d2323f', border: 'none', borderRadius: 100, cursor: 'pointer', fontSize: 14, fontFamily: 'Roboto, sans-serif', color: '#fff', fontWeight: 500, letterSpacing: '0.4px' }}
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
