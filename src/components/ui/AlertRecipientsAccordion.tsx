import { useState } from 'react';
import { IconButton, TextField } from '@mui/material';
import { ArrowUpward, Add, DeleteOutlined, ExpandMore, ExpandLess } from '@mui/icons-material';

/**
 * Collapsible "Recipients" section embedded at the top of AlertEmailPreviewPanel — same add/remove
 * behavior as the old standalone AlertRecipientsPanel, just folded into an accordion instead of its own
 * right panel, since the email preview and its recipient list now share one panel.
 */

interface AlertRecipientsAccordionProps {
  recipients: string[];
  onChange: (recipients: string[]) => void;
}

const rowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
  background: 'rgba(17,16,20,0.04)', borderRadius: 8, padding: '6px 6px 6px 12px',
};

export const AlertRecipientsAccordion = ({ recipients, onChange }: AlertRecipientsAccordionProps) => {
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const removeAt = (index: number) => onChange(recipients.filter((_, i) => i !== index));

  const submitDraft = () => {
    const value = draft.trim();
    if (!value || !value.includes('@') || recipients.includes(value)) return;
    onChange([...recipients, value]);
    setDraft('');
    setAdding(false);
  };

  return (
    <div style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, marginBottom: 16, overflow: 'hidden' }}>
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          border: 'none', background: 'transparent', cursor: 'pointer', padding: '10px 12px',
        }}
      >
        <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25' }}>
          Recipients ({recipients.length})
        </span>
        {expanded ? <ExpandLess style={{ fontSize: 20, color: '#686576' }} /> : <ExpandMore style={{ fontSize: 20, color: '#686576' }} />}
      </button>

      {expanded && (
        <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
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
      )}
    </div>
  );
};
