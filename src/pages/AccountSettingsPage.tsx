import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IconButton, Popover, TextField, InputAdornment, List, ListItemButton } from '@mui/material';
import { ArrowBackRounded, CheckCircle, ExpandLess, ExpandMore, Search } from '@mui/icons-material';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { AccountLogo } from '../components/ui/AccountLogo';
import { ACCOUNTS, getAccountById } from '../data/accounts';
import { DestinationURLs } from '../components/settings/DestinationURLs';
import { DealershipTab } from '../components/settings/DealershipTab';
import { AccountVariablesTab } from '../components/settings/AccountVariablesTab';
import { EnrollmentSettingsTabContent, isEnrollmentLeafTabId } from '../components/settings/EnrollmentSettingsTabContent';
import type { EnrollmentSettings } from '../data/enrollmentSettings';
import { getSavedEnrollmentSettings, saveEnrollmentSettings } from '../data/enrollmentSettingsStore';

const ACCOUNT_TABS = [
  { id: 'general', label: 'General' },
  { id: 'ai-agent-permissions', label: 'AI Agent Permissions' },
  { id: 'data-connections', label: 'Data Connections' },
  { id: 'destination-urls', label: 'Destination URLs' },
  { id: 'disclosure-template', label: 'Disclosure Template' },
  { id: 'history-log', label: 'History Log' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'offer-settings', label: 'Offer Settings' },
  { id: 'users', label: 'Users' },
  { id: 'website-placements', label: 'Website Placements' },
] as const;

/** Sub-items of the left-nav's collapsible "Enrollment Settings" section. "Dealership" is unique to
 * Account Settings (no project-scoped equivalent); the rest reuse the same tab content components (and
 * session-only settings store) as the project-scoped `EnrollmentSettingsPanel`/`AlertProjectSettingsPanel`. */
const ENROLLMENT_SETTINGS_TABS = [
  { id: 'dealership', label: 'Dealership' },
  { id: 'enrollment-vehicles', label: 'New vehicles and offers' },
  { id: 'enrollment-vin-priorities', label: 'VIN Priorities' },
  { id: 'enrollment-aged-discounts', label: 'Aged discount preferences' },
  { id: 'enrollment-creative-distribution', label: 'Creative and Distribution' },
  { id: 'enrollment-fees-disclosures', label: 'Fees and Disclosures' },
] as const;

const ALL_ACCOUNT_TABS = [...ACCOUNT_TABS, ...ENROLLMENT_SETTINGS_TABS];

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M15 5L5 15M5 5l10 10" stroke="#111014" strokeOpacity="0.56" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const AccountSettingsPage = () => {
  const { accountId, tabId } = useParams<{ accountId: string; tabId?: string }>();
  const navigate = useNavigate();
  const [switcherAnchor, setSwitcherAnchor] = useState<HTMLElement | null>(null);
  const [switcherSearch, setSwitcherSearch] = useState('');
  const [enrollmentExpanded, setEnrollmentExpanded] = useState(true);

  const account = (accountId && getAccountById(accountId)) ?? ACCOUNTS[0];
  const activeTab = ALL_ACCOUNT_TABS.find((t) => t.id === tabId) ?? ACCOUNT_TABS.find((t) => t.id === 'destination-urls')!;

  // Enrollment Settings sub-tabs (Vehicles/VIN Priorities/etc.) share one draft/saved settings object —
  // same session-only store as the project-scoped consumers, keyed per-account here. Resynced whenever
  // the switcher navigates to a different account, since this page doesn't remount on a route param change.
  const [savedEnrollment, setSavedEnrollment] = useState<EnrollmentSettings>(() => getSavedEnrollmentSettings(`account:${account.id}`));
  const [draftEnrollment, setDraftEnrollment] = useState<EnrollmentSettings>(savedEnrollment);
  useEffect(() => {
    const s = getSavedEnrollmentSettings(`account:${account.id}`);
    setSavedEnrollment(s);
    setDraftEnrollment(s);
  }, [account.id]);
  const isEnrollmentDirty = draftEnrollment !== savedEnrollment;
  const handleEnrollmentChange = (patch: Partial<EnrollmentSettings>) => setDraftEnrollment((prev) => ({ ...prev, ...patch }));
  const handleEnrollmentSave = () => { saveEnrollmentSettings(`account:${account.id}`, draftEnrollment); setSavedEnrollment(draftEnrollment); };
  const handleEnrollmentDiscard = () => setDraftEnrollment(savedEnrollment);

  const filteredSwitcherAccounts = useMemo(
    () => ACCOUNTS.filter((a) => a.name.toLowerCase().includes(switcherSearch.toLowerCase())),
    [switcherSearch],
  );

  const closeSwitcher = () => {
    setSwitcherAnchor(null);
    setSwitcherSearch('');
  };

  const selectAccount = (id: string) => {
    closeSwitcher();
    navigate(`/settings/accounts/${id}/${activeTab.id}`);
  };

  return (
    <div className="flex h-full" style={{ background: '#f0f2f4', gap: 16, padding: 8 }}>
      {/* ── Left panel — back / account switcher / tab navigation ────── */}
      <div
        style={{
          width: 280, flexShrink: 0, background: '#ffffff', borderRadius: 16,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px 8px', gap: 4 }}>
          <IconButton size="small" onClick={() => navigate('/settings/accounts')} sx={{ padding: '5px', flexShrink: 0 }}>
            <ArrowBackRounded style={{ fontSize: 20, color: '#1f1d25' }} />
          </IconButton>
          <h2 style={{ fontSize: 16, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px', margin: 0, flex: 1 }}>
            Accounts
          </h2>
          <IconButton title="Close" onClick={() => navigate('/projects')} sx={{ padding: '5px', flexShrink: 0 }}>
            <CloseIcon />
          </IconButton>
        </div>

        {/* Account switcher */}
        <div style={{ padding: '0 16px 16px' }}>
          <button
            onClick={(e) => setSwitcherAnchor(e.currentTarget)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              background: '#f9fafa', border: '1px solid #dddce0', borderRadius: 8,
              padding: '6px 8px', cursor: 'pointer',
            }}
          >
            <AccountLogo name={account.name} size={24} />
            <span style={{
              flex: 1, textAlign: 'left', fontSize: 14, fontFamily: 'Roboto, sans-serif',
              color: '#1f1d25', letterSpacing: '0.17px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {account.name}
            </span>
            <ExpandMore style={{ fontSize: 20, color: '#686576', flexShrink: 0 }} />
          </button>

          <Popover
            open={Boolean(switcherAnchor)}
            anchorEl={switcherAnchor}
            onClose={closeSwitcher}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            slotProps={{ paper: { style: { width: 248, marginTop: 4, borderRadius: 8 } } }}
          >
            <div style={{ padding: 8 }}>
              <TextField
                autoFocus
                size="small"
                fullWidth
                placeholder="Search accounts"
                value={switcherSearch}
                onChange={(e) => setSwitcherSearch(e.target.value)}
                slotProps={{
                  input: { startAdornment: <InputAdornment position="start"><Search style={{ fontSize: 18, color: '#9c99a9' }} /></InputAdornment> },
                }}
              />
            </div>
            <List sx={{ maxHeight: 320, overflowY: 'auto', paddingTop: 0 }}>
              {filteredSwitcherAccounts.map((a) => (
                <ListItemButton
                  key={a.id}
                  selected={a.id === account.id}
                  onClick={() => selectAccount(a.id)}
                  sx={{ gap: 1, '&.Mui-selected': { background: 'rgba(99,86,225,0.08)' } }}
                >
                  <AccountLogo name={a.name} size={24} />
                  <span style={{ marginLeft: 8, fontSize: 14, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>{a.name}</span>
                </ListItemButton>
              ))}
              {filteredSwitcherAccounts.length === 0 && (
                <div style={{ padding: '12px 16px', fontSize: 13, color: '#9c99a9', fontFamily: 'Roboto, sans-serif' }}>
                  No accounts found
                </div>
              )}
            </List>
          </Popover>
        </div>

        {/* Tab navigation */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '0 16px 24px', display: 'flex', flexDirection: 'column' }}>
          {ACCOUNT_TABS.map((tab) => {
            const isActive = tab.id === activeTab.id;
            return (
              <button
                key={tab.id}
                onClick={() => navigate(`/settings/accounts/${account.id}/${tab.id}`)}
                className={isActive ? '' : 'hover:bg-[rgba(17,16,20,0.04)]'}
                style={{
                  display: 'flex', alignItems: 'center', width: '100%', padding: 8,
                  border: 'none', borderRadius: 8, textAlign: 'left', cursor: 'pointer',
                  background: isActive ? 'rgba(99,86,225,0.08)' : 'transparent',
                  fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 400,
                  color: '#1f1d25', letterSpacing: '0.17px', lineHeight: '24px',
                }}
              >
                {tab.label}
              </button>
            );
          })}

          {/* Collapsible "Enrollment Settings" section — its sub-tabs live directly in this same nav
              (unlike `EnrollmentSettingsPanel`'s own internal sub-nav, which would duplicate this list). */}
          <button
            onClick={() => setEnrollmentExpanded((v) => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: 8, marginTop: 4,
              border: 'none', borderRadius: 8, textAlign: 'left', cursor: 'pointer', background: 'transparent',
              fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 400,
              color: '#1f1d25', letterSpacing: '0.17px', lineHeight: '24px',
            }}
          >
            <CheckCircle style={{ fontSize: 16, color: '#2e7d32', flexShrink: 0 }} />
            <span style={{ flex: 1 }}>Enrollment Settings</span>
            {enrollmentExpanded
              ? <ExpandLess style={{ fontSize: 20, color: '#686576', flexShrink: 0 }} />
              : <ExpandMore style={{ fontSize: 20, color: '#686576', flexShrink: 0 }} />}
          </button>
          {enrollmentExpanded && ENROLLMENT_SETTINGS_TABS.map((tab) => {
            const isActive = tab.id === activeTab.id;
            return (
              <button
                key={tab.id}
                onClick={() => navigate(`/settings/accounts/${account.id}/${tab.id}`)}
                className={isActive ? '' : 'hover:bg-[rgba(17,16,20,0.04)]'}
                style={{
                  display: 'flex', alignItems: 'center', width: '100%', padding: '8px 8px 8px 32px',
                  border: 'none', borderRadius: 8, textAlign: 'left', cursor: 'pointer',
                  background: isActive ? 'rgba(99,86,225,0.08)' : 'transparent',
                  fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 400,
                  color: '#1f1d25', letterSpacing: '0.17px', lineHeight: '24px',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Main panel — active tab content ─────────────────────────── */}
      {activeTab.id === 'destination-urls' ? (
        <DestinationURLs accountName={account.name} />
      ) : activeTab.id === 'dealership' ? (
        <DealershipTab account={account} />
      ) : activeTab.id === 'enrollment-account-variables' ? (
        <AccountVariablesTab accountName={account.name} />
      ) : isEnrollmentLeafTabId(activeTab.id) ? (
        <EnrollmentSettingsTabContent
          tabId={activeTab.id}
          tabLabel={activeTab.label}
          accountName={account.name}
          accountBrand={account.brand}
          settings={draftEnrollment}
          onChange={handleEnrollmentChange}
          isDirty={isEnrollmentDirty}
          onSave={handleEnrollmentSave}
          onDiscard={handleEnrollmentDiscard}
        />
      ) : (
        <div
          style={{
            flex: 1, minWidth: 0, background: '#ffffff', borderRadius: 16,
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}
        >
          <div style={{ padding: '10px 16px 0', flexShrink: 0 }}>
            <Breadcrumbs items={['Settings', 'Accounts', account.name, activeTab.label]} />
          </div>
          <div style={{ flex: 1 }} />
        </div>
      )}
    </div>
  );
};
