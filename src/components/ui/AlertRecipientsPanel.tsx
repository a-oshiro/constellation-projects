import { useState } from 'react';
import { IconButton, TextField } from '@mui/material';
import { Close, ArrowUpward, Add, DeleteOutlined } from '@mui/icons-material';
import { useResponsivePanelWidth } from '../../hooks/useResponsivePanelWidth';

/**
 * Right-panel content listing an alert's recipient emails, opened from the dialog header's Recipients
 * icon button. Each row shows the email plus an X to remove it; "+ Add Recipient" swaps itself for a
 * text field + submit (arrow-up) button — Enter or the button adds the typed address to the list.
 */

interface AlertRecipientsPanelProps {
  recipients: string[];
  onChange: (recipients: string[]) => void;
  onClose: () => void;
}

const rowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
  background: 'rgba(17,16,20,0.04)', borderRadius: 8, padding: '6px 6px 6px 12px',
};

export const AlertRecipientsPanel = ({ recipients, onChange, onClose }: AlertRecipientsPanelProps) => {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const panelWidth = useResponsivePanelWidth();

  const removeAt = (index: number) => onChange(recipients.filter((_, i) => i !== index));

  const submitDraft = () => {
    const value = draft.trim();
    if (!value || !value.includes('@') || recipients.includes(value)) return;
    onChange([...recipients, value]);
    setDraft('');
    setAdding(false);
  };

  return (
    <div style={{ width: panelWidth, flexShrink: 0, borderLeft: '1px solid rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
        <span style={{ fontSize: 15, fontWeight: 600, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>Recipients</span>
        <IconButton size="small" onClick={onClose} sx={{ padding: '4px' }}>
          <Close style={{ fontSize: 18, color: '#686576' }} />
        </IconButton>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {recipients.map((email, index) => (
          <div key={email} style={rowStyle}>
            <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {email}
            </span>
            <IconButton size="small" onClick={() => removeAt(index)} sx={{ padding: '4px', flexShrink: 0 }}>
              <DeleteOutlined style={{ fontSize: 16, color: '#686576' }} />
            </IconButton>
          </div>
        ))}

        {adding ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TextField
              autoFocus
              size="small"
              placeholder="name@example.com"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitDraft(); }}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: '#f9fafa', borderRadius: '4px', fontSize: 13, fontFamily: 'Roboto, sans-serif',
                  '& fieldset': { borderColor: '#cac9cf' },
                  '&:hover fieldset': { borderColor: '#9b96b0' },
                  '&.Mui-focused fieldset': { borderColor: '#473bab' },
                },
              }}
            />
            <IconButton
              size="small"
              onClick={submitDraft}
              sx={{ padding: '6px', background: '#473bab', flexShrink: 0, '&:hover': { background: '#3d3396' } }}
            >
              <ArrowUpward style={{ fontSize: 18, color: '#ffffff' }} />
            </IconButton>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            style={{
              alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 4,
              border: 'none', background: 'none', padding: 0, cursor: 'pointer',
              fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#473bab',
            }}
          >
            <Add style={{ fontSize: 18 }} />
            Add Recipient
          </button>
        )}
      </div>
    </div>
  );
};
