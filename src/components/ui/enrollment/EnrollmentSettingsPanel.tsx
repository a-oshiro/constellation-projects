import { useState } from 'react';
import { OpenInNew } from '@mui/icons-material';
import type { EnrollmentSettings } from '../../../data/enrollmentSettings';
import { VehiclesTab } from './VehiclesTab';
import { VinPrioritiesTab } from './VinPrioritiesTab';
import { AgedDiscountsTab } from './AgedDiscountsTab';
import { CreativeDistributionTab } from './CreativeDistributionTab';
import { FeesDisclosuresTab } from './FeesDisclosuresTab';

const ENROLLMENT_TABS = [
  { id: 'vehicles', label: 'New vehicles and offers' },
  { id: 'vin-priorities', label: 'VIN Priorities' },
  { id: 'aged-discounts', label: 'Aged discount preferences' },
  { id: 'creative-distribution', label: 'Creative and Distribution' },
  { id: 'fees-disclosures', label: 'Fees and Disclosures' },
] as const;

type EnrollmentTabId = (typeof ENROLLMENT_TABS)[number]['id'];

interface EnrollmentSettingsPanelProps {
  settings: EnrollmentSettings;
  onChange: (patch: Partial<EnrollmentSettings>) => void;
}

export const EnrollmentSettingsPanel = ({ settings, onChange }: EnrollmentSettingsPanelProps) => {
  const [activeTab, setActiveTab] = useState<EnrollmentTabId>('vehicles');

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
      {/* ── Left sub-nav ─────────────────────────────────────────── */}
      <nav style={{ width: 220, flexShrink: 0, borderRight: '1px solid rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', padding: '16px 12px', minHeight: 0 }}>
        <div style={{ overflowY: 'auto' }}>
          {ENROLLMENT_TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', width: '100%', padding: 8, marginBottom: 2,
                  border: 'none', borderRadius: 8, textAlign: 'left', cursor: 'pointer',
                  background: isActive ? 'rgba(99,86,225,0.08)' : 'transparent',
                  fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: isActive ? 500 : 400,
                  color: isActive ? '#473bab' : '#1f1d25', letterSpacing: '0.17px', lineHeight: '20px',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div style={{ flex: 1 }} />

        {/* Not yet wired up — placeholder CTA per design, no navigation/functionality yet. */}
        <button
          style={{
            display: 'flex', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
            border: 'none', background: 'none', cursor: 'pointer', padding: '16px 8px',
            fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400,
            color: 'rgba(17,16,20,0.56)', letterSpacing: '0.17px', lineHeight: 1.43,
          }}
        >
          <OpenInNew style={{ fontSize: 16 }} />
          Edit in Account Settings
        </button>
      </nav>

      {/* ── Active tab content ──────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '24px 32px' }}>
        {activeTab === 'vehicles' && <VehiclesTab settings={settings} onChange={onChange} />}
        {activeTab === 'vin-priorities' && <VinPrioritiesTab settings={settings} onChange={onChange} />}
        {activeTab === 'aged-discounts' && <AgedDiscountsTab settings={settings} onChange={onChange} />}
        {activeTab === 'creative-distribution' && <CreativeDistributionTab settings={settings} onChange={onChange} />}
        {activeTab === 'fees-disclosures' && <FeesDisclosuresTab settings={settings} onChange={onChange} />}
      </div>
    </div>
  );
};
