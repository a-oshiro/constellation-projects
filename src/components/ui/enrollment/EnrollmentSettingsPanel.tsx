import { useState } from 'react';
import { OpenInNew } from '@mui/icons-material';
import type { EnrollmentSettings } from '../../../data/enrollmentSettings';
import { AppSelect } from '../AppSelect';
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

/** Which enrollment section to view is now picked from a selector above the content (defaulting to the
 * first option, "New vehicles and offers") instead of a left-hand tab rail. */
export const EnrollmentSettingsPanel = ({ settings, onChange }: EnrollmentSettingsPanelProps) => {
  const [activeTab, setActiveTab] = useState<EnrollmentTabId>('vehicles');

  return (
    <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 32px 0' }}>
        <div style={{ width: 260, flexShrink: 0 }}>
          <AppSelect
            value={activeTab}
            onChange={(v) => setActiveTab(v as EnrollmentTabId)}
            options={ENROLLMENT_TABS.map((t) => ({ value: t.id, label: t.label }))}
          />
        </div>
        {/* Not yet wired up — placeholder CTA per design, no navigation/functionality yet. */}
        <button
          style={{
            display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
            border: 'none', background: 'none', cursor: 'pointer', padding: '8px',
            fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400,
            color: 'rgba(17,16,20,0.56)', letterSpacing: '0.17px', lineHeight: 1.43,
          }}
        >
          <OpenInNew style={{ fontSize: 16 }} />
          Edit in Account Settings
        </button>
      </div>

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
