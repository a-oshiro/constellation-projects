import { useEffect } from 'react';
import { IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';

interface UnlockProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function UnlockProjectDialog({ open, onClose, onConfirm }: UnlockProjectDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

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
        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '16px 16px 8px' }}>
          <span style={{ flex: 1, minWidth: 0, fontSize: 20, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.15px' }}>
            Unlock Evergreen Project
          </span>
          <IconButton size="small" onClick={onClose} sx={{ padding: '5px', color: '#686576' }}>
            <Close sx={{ fontSize: 20 }} />
          </IconButton>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '8px 16px 24px' }}>
          <p style={{ margin: 0, fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#1f1d25', letterSpacing: '0.15px', lineHeight: 1.5 }}>
            Unlocking this project will enable you and other users with Admin access to make changes. You may lock the project again if needed.
          </p>
        </div>

        {/* ── Footer ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '0 16px 16px' }}>
          <button
            onClick={onClose}
            style={{ padding: '6px 8px', background: 'transparent', border: 'none', borderRadius: 100, cursor: 'pointer', fontSize: 14, fontFamily: 'Roboto, sans-serif', color: '#473bab', fontWeight: 500, letterSpacing: '0.4px', textTransform: 'capitalize' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{ padding: '6px 16px', background: '#d2323f', border: 'none', borderRadius: 100, cursor: 'pointer', fontSize: 14, fontFamily: 'Roboto, sans-serif', color: '#fff', fontWeight: 500, letterSpacing: '0.4px', textTransform: 'capitalize' }}
          >
            Unlock
          </button>
        </div>
      </div>
    </div>
  );
}
