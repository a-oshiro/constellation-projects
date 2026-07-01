import { useNavigate, useParams } from 'react-router-dom';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { OfferReplacementWorkflowTab } from '../components/settings/OfferReplacementWorkflowTab';

const CLIENT_SETTINGS_TABS = [
  { id: 'accounts', label: 'Accounts' },
  { id: 'ad-shell-configurations', label: 'Ad Shell Configurations' },
  { id: 'brand-kits', label: 'Brand Kits' },
  { id: 'billing', label: 'Billing' },
  { id: 'dashboards', label: 'Dashboards' },
  { id: 'features', label: 'Features' },
  { id: 'fields', label: 'Fields' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'offer-replacement-workflow', label: 'Offer Replacement Workflow' },
  { id: 'prompts', label: 'Prompts' },
  { id: 'tags', label: 'Tags' },
  { id: 'users', label: 'Users' },
] as const;

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M15 5L5 15M5 5l10 10" stroke="#111014" strokeOpacity="0.56" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const ClientSettingsPage = () => {
  const { tabId } = useParams<{ tabId: string }>();
  const navigate = useNavigate();

  const activeTab = CLIENT_SETTINGS_TABS.find((t) => t.id === tabId) ?? CLIENT_SETTINGS_TABS[0];

  return (
    <div className="flex h-full" style={{ background: '#f0f2f4', gap: 16, padding: 8 }}>
      {/* ── Left panel — Client Settings tab navigation ─────────── */}
      <div
        style={{
          width: 280,
          flexShrink: 0,
          background: '#ffffff',
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 8px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px', margin: 0 }}>
            Client Settings
          </h2>
          <button
            title="Close"
            onClick={() => navigate('/projects')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 30, height: 30, border: 'none', borderRadius: '100px',
              background: 'transparent', cursor: 'pointer', padding: 5, flexShrink: 0,
            }}
          >
            <CloseIcon />
          </button>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', padding: '0 16px 24px', display: 'flex', flexDirection: 'column' }}>
          {CLIENT_SETTINGS_TABS.map((tab) => {
            const isActive = tab.id === activeTab.id;
            return (
              <button
                key={tab.id}
                onClick={() => navigate(`/settings/${tab.id}`)}
                className={isActive ? '' : 'hover:bg-[rgba(17,16,20,0.04)]'}
                style={{
                  display: 'flex', alignItems: 'center', width: '100%', padding: 8,
                  border: 'none', borderRadius: 12, textAlign: 'left', cursor: 'pointer',
                  background: isActive ? 'rgba(99,86,225,0.08)' : 'transparent',
                  fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400,
                  color: '#1f1d25', letterSpacing: '0.17px',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Main panel — active tab content ─────────────────────── */}
      {activeTab.id === 'offer-replacement-workflow' ? (
        <OfferReplacementWorkflowTab />
      ) : (
        <div
          style={{
            flex: 1,
            minWidth: 0,
            background: '#ffffff',
            borderRadius: 16,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}
        >
          <div style={{ padding: '10px 16px 12px', flexShrink: 0 }}>
            <div style={{ marginBottom: 6 }}>
              <Breadcrumbs items={['Settings', activeTab.label]} />
            </div>
            <h1 style={{ fontSize: 16, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px', margin: 0 }}>
              {activeTab.label}
            </h1>
          </div>
          <div style={{ flex: 1 }} />
        </div>
      )}
    </div>
  );
};
