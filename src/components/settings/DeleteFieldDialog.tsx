/**
 * Confirmation dialog shown before deleting a Client field from Client Settings › Fields.
 * Modeled on `RemoveSnippetDialog`'s shell/copy pattern.
 */
import { useEffect } from 'react';

interface DeleteFieldDialogProps {
  open: boolean;
  fieldName: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteFieldDialog({ open, fieldName, onCancel, onConfirm }: DeleteFieldDialogProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 1400,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-field-dialog-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 24,
          width: 360,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0px 6px 30px 5px rgba(0,0,0,0.12), 0px 16px 24px 2px rgba(0,0,0,0.14), 0px 8px 10px -5px rgba(0,0,0,0.2)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 16px 8px' }}>
          <span id="delete-field-dialog-title" style={{ fontSize: 20, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.15px' }}>
            Delete this field
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: '8px 16px 24px' }}>
          <p style={{ margin: 0, fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#1f1d25', letterSpacing: '0.15px', lineHeight: 1.5 }}>
            Deleting “{fieldName}” removes the field and all of its values from this client. This can’t be undone.
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
            autoFocus
            style={{ padding: '6px 16px', background: '#d2323f', border: 'none', borderRadius: 100, cursor: 'pointer', fontSize: 14, fontFamily: 'Roboto, sans-serif', color: '#fff', fontWeight: 500, letterSpacing: '0.4px' }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
