import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Button, IconButton, MenuItem, Select, TextField } from '@mui/material';
import { ContentCopyOutlined, DeleteOutlined } from '@mui/icons-material';
import type { Account } from '../../data/accounts';
import { ACCOUNTS } from '../../data/accounts';
import { Breadcrumbs } from '../layout/Breadcrumbs';
import { FIELD_LABEL_STYLE, TEXT_FIELD_SX } from '../ui/enrollment/shared';

/**
 * Account Settings-only tab — the dealership this enrollment belongs to and the main contact who
 * submitted it. Unlike the other Enrollment Settings sub-tabs (Vehicles/VIN Priorities/etc.), this one
 * has no project-scoped equivalent — it's never shown from `EnrollmentSettingsPanel`.
 */

const BRAND_OPTIONS = [...new Set(ACCOUNTS.map((a) => a.brand))].sort();

interface DealershipForm {
  website: string;
  name: string;
  brand: string;
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  phone: string;
  distributionList: string[];
}

const buildInitialForm = (account: Account): DealershipForm => ({
  website: account.disclosureUrl.replace(/^www\./, '').replace(/\/$/, ''),
  name: account.name,
  brand: account.brand,
  firstName: '',
  lastName: '',
  role: '',
  email: '',
  phone: '',
  distributionList: [],
});

const cardStyle: CSSProperties = {
  flex: 1, minWidth: 260, background: '#f9fafa', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: 20,
  display: 'flex', flexDirection: 'column', gap: 16,
};

const fieldWrapStyle: CSSProperties = { display: 'flex', flexDirection: 'column' };
const cardTitleStyle: CSSProperties = { fontSize: 16, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' };

interface DealershipTabProps {
  account: Account;
}

export const DealershipTab = ({ account }: DealershipTabProps) => {
  const [saved, setSaved] = useState<DealershipForm>(() => buildInitialForm(account));
  const [draft, setDraft] = useState<DealershipForm>(saved);
  const [distributionInput, setDistributionInput] = useState('');
  const isDirty = draft !== saved;

  const set = (patch: Partial<DealershipForm>) => setDraft((prev) => ({ ...prev, ...patch }));

  const addToDistributionList = () => {
    const value = distributionInput.trim();
    if (!value || !value.includes('@') || draft.distributionList.includes(value)) return;
    set({ distributionList: [...draft.distributionList, value] });
    setDistributionInput('');
  };
  const removeFromDistributionList = (email: string) =>
    set({ distributionList: draft.distributionList.filter((e) => e !== email) });

  return (
    <div style={{
      flex: 1, minWidth: 0, background: '#ffffff', borderRadius: 16, overflow: 'hidden',
      display: 'flex', flexDirection: 'column', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    }}>
      <div style={{ padding: '10px 16px 0', flexShrink: 0 }}>
        <Breadcrumbs items={['Settings', 'Accounts', account.name, 'Dealership']} />
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px' }}>
              Dealership
            </h2>
            <p style={{ margin: 0, fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px' }}>
              The dealership this enrollment belongs to and the main contact who submitted it.
            </p>
          </div>
          <IconButton size="small" title="Copy dealership info" sx={{ padding: '4px', flexShrink: 0 }}>
            <ContentCopyOutlined style={{ fontSize: 18, color: '#686576' }} />
          </IconButton>
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={cardStyle}>
            <span style={cardTitleStyle}>Dealer info</span>
            <div style={fieldWrapStyle}>
              <span style={FIELD_LABEL_STYLE}>Dealership website *</span>
              <TextField size="small" value={draft.website} onChange={(e) => set({ website: e.target.value })} sx={TEXT_FIELD_SX} />
            </div>
            <div style={fieldWrapStyle}>
              <span style={FIELD_LABEL_STYLE}>Dealership name</span>
              <TextField size="small" value={draft.name} onChange={(e) => set({ name: e.target.value })} sx={TEXT_FIELD_SX} />
            </div>
            <div style={fieldWrapStyle}>
              <span style={FIELD_LABEL_STYLE}>Brand</span>
              <Select size="small" value={draft.brand} onChange={(e) => set({ brand: e.target.value })} sx={TEXT_FIELD_SX}>
                {BRAND_OPTIONS.map((b) => <MenuItem key={b} value={b}>{b}</MenuItem>)}
              </Select>
            </div>
          </div>

          <div style={cardStyle}>
            <span style={cardTitleStyle}>My Contact Info</span>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ ...fieldWrapStyle, flex: 1 }}>
                <span style={FIELD_LABEL_STYLE}>First Name *</span>
                <TextField size="small" value={draft.firstName} onChange={(e) => set({ firstName: e.target.value })} sx={TEXT_FIELD_SX} />
              </div>
              <div style={{ ...fieldWrapStyle, flex: 1 }}>
                <span style={FIELD_LABEL_STYLE}>Last Name *</span>
                <TextField size="small" value={draft.lastName} onChange={(e) => set({ lastName: e.target.value })} sx={TEXT_FIELD_SX} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ ...fieldWrapStyle, flex: 1 }}>
                <span style={FIELD_LABEL_STYLE}>Role / Title</span>
                <TextField size="small" value={draft.role} onChange={(e) => set({ role: e.target.value })} sx={TEXT_FIELD_SX} />
              </div>
              <div style={{ ...fieldWrapStyle, flex: 1 }}>
                <span style={FIELD_LABEL_STYLE}>Email *</span>
                <TextField size="small" value={draft.email} onChange={(e) => set({ email: e.target.value })} sx={TEXT_FIELD_SX} />
              </div>
            </div>
            <div style={fieldWrapStyle}>
              <span style={FIELD_LABEL_STYLE}>Phone *</span>
              <TextField size="small" value={draft.phone} onChange={(e) => set({ phone: e.target.value })} sx={TEXT_FIELD_SX} />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>Notification distribution list</span>
          <p style={{ margin: '2px 0 12px', fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px' }}>
            Everyone on this list receives the alert notification emails generated for this account.
          </p>
          <div style={{ display: 'flex', gap: 8, maxWidth: 420 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="colleague@dealership.com"
              value={distributionInput}
              onChange={(e) => setDistributionInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addToDistributionList(); }}
              sx={TEXT_FIELD_SX}
            />
            <Button
              onClick={addToDistributionList}
              variant="outlined"
              sx={{
                textTransform: 'none', fontSize: 14, fontWeight: 500, letterSpacing: '0.4px',
                color: '#473bab', borderColor: '#473bab', borderRadius: '100px', padding: '6px 20px', flexShrink: 0,
                '&:hover': { borderColor: '#473bab', background: 'rgba(71,59,171,0.04)' },
              }}
            >
              Add
            </Button>
          </div>
          {draft.distributionList.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 420, marginTop: 12 }}>
              {draft.distributionList.map((email) => (
                <div key={email} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                  background: 'rgba(17,16,20,0.04)', borderRadius: 8, padding: '6px 6px 6px 12px',
                }}>
                  <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>{email}</span>
                  <IconButton size="small" onClick={() => removeFromDistributionList(email)} sx={{ padding: '4px', flexShrink: 0 }}>
                    <DeleteOutlined style={{ fontSize: 16, color: '#686576' }} />
                  </IconButton>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{
        display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 20px',
        borderTop: '1px solid rgba(0,0,0,0.12)', flexShrink: 0,
      }}>
        <Button
          onClick={() => setDraft(saved)}
          disabled={!isDirty}
          sx={{
            textTransform: 'none', fontSize: 14, fontWeight: 500, letterSpacing: '0.4px',
            color: '#473bab', padding: '6px 16px', borderRadius: '100px',
            '&.Mui-disabled': { color: '#9c99a9' },
          }}
        >
          Discard
        </Button>
        <Button
          onClick={() => setSaved(draft)}
          disabled={!isDirty}
          variant="contained"
          disableElevation
          sx={{
            textTransform: 'none', fontSize: 14, fontWeight: 500, letterSpacing: '0.4px',
            background: '#473bab', padding: '6px 20px', borderRadius: '100px',
            '&:hover': { background: '#3d3396' },
            '&.Mui-disabled': { background: 'rgba(0,0,0,0.12)', color: 'rgba(0,0,0,0.26)' },
          }}
        >
          Save
        </Button>
      </div>
    </div>
  );
};
