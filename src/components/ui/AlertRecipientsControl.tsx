import { useEffect, useRef, useState } from 'react';
import { Autocomplete, Chip, IconButton, TextField } from '@mui/material';
import { Close, MailOutlined } from '@mui/icons-material';

/**
 * Top-left "Recipients" pill — click to reveal a card listing the alert's recipient emails. The card's
 * "Change addresses" link swaps the read-only chip list for an editable MUI Autocomplete (freeSolo,
 * multiple) so the user can remove existing addresses (via the chip's delete icon) or type to filter
 * suggestions and add new ones. Per Figma node 15062:176779 (view mode) — the editable Autocomplete state
 * isn't in that file and is built to match the project's existing multi-select pattern (AlertsFilterPanel).
 */

const CHIP_SX = {
  background: 'rgba(17,16,20,0.04)',
  borderRadius: '8px',
  height: 24,
  maxHeight: 24,
  '& .MuiChip-label': {
    fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.16px', padding: '0 6px',
  },
  '& .MuiChip-deleteIcon': { fontSize: 16, opacity: 0.5, color: '#1f1d25', margin: '0 4px 0 -2px' },
};

interface AlertRecipientsControlProps {
  recipients: string[];
  suggestions: string[];
  onChange: (recipients: string[]) => void;
  /** Absolute top offset (px) — shifts down when a banner is also pinned to the top of the same pane. */
  top: number;
}

export const AlertRecipientsControl = ({ recipients, suggestions, onChange, top }: AlertRecipientsControlProps) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) { setOpen(false); setEditing(false); }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  const close = () => { setOpen(false); setEditing(false); };

  return (
    <div ref={rootRef} style={{ position: 'absolute', top, left: 16, zIndex: 6, display: 'flex', flexDirection: 'column', gap: 4, width: open ? 360 : undefined, maxWidth: 600 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer',
          borderRadius: 100, padding: '4px 5px', background: '#ffffff', boxShadow: '0px 1px 4px rgba(0,0,0,0.12)',
          fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, letterSpacing: '0.46px', lineHeight: '22px',
          color: 'rgba(17,16,20,0.56)',
        }}
      >
        <MailOutlined style={{ fontSize: 18 }} />
        Recipients
      </button>

      {open && (
        <div
          style={{
            background: '#ffffff', borderRadius: 12, padding: 12, boxSizing: 'border-box',
            boxShadow: '0px 1px 9px rgba(0,0,0,0.12), 0px 6px 5px rgba(0,0,0,0.14), 0px 3px 2.5px rgba(0,0,0,0.2)',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            {editing ? <span /> : (
              <button
                onClick={() => setEditing(true)}
                style={{
                  border: 'none', background: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline',
                  fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#473bab', letterSpacing: '0.17px',
                }}
              >
                Change addresses
              </button>
            )}
            <IconButton size="small" onClick={close} sx={{ padding: '2px' }}>
              <Close style={{ fontSize: 16, color: '#686576' }} />
            </IconButton>
          </div>

          {editing ? (
            <Autocomplete
              multiple
              freeSolo
              autoFocus
              options={suggestions.filter((s) => !recipients.includes(s))}
              value={recipients}
              onChange={(_, next) => onChange(next as string[])}
              renderTags={(tagValue, getTagProps) =>
                tagValue.map((option, index) => {
                  const { key, ...tagProps } = getTagProps({ index });
                  return <Chip key={key} label={option} sx={CHIP_SX} {...tagProps} />;
                })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={recipients.length === 0 ? 'Add an email address' : undefined}
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      background: '#f9fafa', borderRadius: '4px', padding: '4px 8px !important', flexWrap: 'wrap', gap: '4px',
                      '& fieldset': { borderColor: '#cac9cf' },
                      '&:hover fieldset': { borderColor: '#9b96b0' },
                      '&.Mui-focused fieldset': { borderColor: '#473bab' },
                    },
                    '& .MuiOutlinedInput-input': { padding: '0 !important', fontSize: 13, fontFamily: 'Roboto, sans-serif' },
                  }}
                />
              )}
            />
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {recipients.map((email) => (
                <Chip key={email} label={email} sx={CHIP_SX} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
