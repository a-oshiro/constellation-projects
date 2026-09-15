import { useState } from 'react';
import { Button, Checkbox, TextField } from '@mui/material';
import { Close } from '@mui/icons-material';
import type { EnrollmentSettings } from '../../../data/enrollmentSettings';
import { BODY_TEXT_STYLE, FIELD_LABEL_STYLE, HELPER_TEXT_STYLE, TEXT_FIELD_SX } from './shared';

interface CreativeDistributionTabProps {
  settings: EnrollmentSettings;
  onChange: (patch: Partial<EnrollmentSettings>) => void;
}

export const CreativeDistributionTab = ({ settings, onChange }: CreativeDistributionTabProps) => {
  const [newChannel, setNewChannel] = useState('');

  const toggleChannel = (id: string, selected: boolean) => {
    onChange({ channels: settings.channels.map((c) => (c.id === id ? { ...c, selected } : c)) });
  };

  const addOtherChannel = () => {
    const value = newChannel.trim();
    if (!value) return;
    onChange({ otherChannels: [...settings.otherChannels, value] });
    setNewChannel('');
  };

  const removeOtherChannel = (index: number) => {
    onChange({ otherChannels: settings.otherChannels.filter((_, i) => i !== index) });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <p style={BODY_TEXT_STYLE}>The channels this account advertises on and the creative sizes requested for each one.</p>

      <div style={{ background: '#f9fafa', border: '1px solid #e7e7e9', borderRadius: 12, padding: 16 }}>
        <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px' }}>
          Agency
        </p>
        <div style={FIELD_LABEL_STYLE}>Agency name — optional</div>
        <TextField
          size="small"
          fullWidth
          placeholder="No agency of record"
          value={settings.agencyName}
          onChange={(e) => onChange({ agencyName: e.target.value })}
          sx={TEXT_FIELD_SX}
        />
        <p style={{ ...HELPER_TEXT_STYLE, marginTop: 6 }}>
          If an agency places this dealer's advertising, name it here so Client Services knows who to coordinate platform
          access and approvals with.
        </p>
      </div>

      <div>
        <p style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px' }}>
          Channels and Sizes
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {settings.channels.map((c) => (
            <label
              key={c.id}
              style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #e0e0e0', borderRadius: 8, padding: '10px 14px', cursor: 'pointer' }}
            >
              <Checkbox
                size="small"
                checked={c.selected}
                onChange={(e) => toggleChannel(c.id, e.target.checked)}
                sx={{ padding: 0, '&.Mui-checked': { color: '#473bab' } }}
              />
              <span style={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px' }}>{c.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <div style={FIELD_LABEL_STYLE}>Other channels</div>
        <p style={{ ...HELPER_TEXT_STYLE, marginBottom: 8 }}>
          {settings.otherChannels.length === 0 ? "Nothing added yet. Use this for channels the list above does not cover." : ''}
        </p>
        {settings.otherChannels.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            {settings.otherChannels.map((channel, i) => (
              <span key={`${channel}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f0f2f4', borderRadius: 8, padding: '4px 8px 4px 10px', fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>
                {channel}
                <button onClick={() => removeOtherChannel(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                  <Close style={{ fontSize: 14, color: '#686576' }} />
                </button>
              </span>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Another channel we haven't listed"
            value={newChannel}
            onChange={(e) => setNewChannel(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addOtherChannel(); }}
            sx={TEXT_FIELD_SX}
          />
          <Button
            variant="outlined"
            onClick={addOtherChannel}
            disabled={!newChannel.trim()}
            sx={{ textTransform: 'none', fontSize: 14, fontWeight: 500, borderRadius: '100px', color: '#473bab', borderColor: '#473bab', padding: '6px 20px', flexShrink: 0 }}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
};
