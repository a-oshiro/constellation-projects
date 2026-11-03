import { Button } from '@mui/material';
import { Breadcrumbs } from '../layout/Breadcrumbs';
import type { EnrollmentSettings } from '../../data/enrollmentSettings';
import { VehiclesTab } from '../ui/enrollment/VehiclesTab';
import { VinPrioritiesTab } from '../ui/enrollment/VinPrioritiesTab';
import { AgedDiscountsTab } from '../ui/enrollment/AgedDiscountsTab';
import { CreativeDistributionTab } from '../ui/enrollment/CreativeDistributionTab';
import { DisclosuresTab } from '../ui/enrollment/DisclosuresTab';

/** The Account Settings page's own left-nav already lists these one-per-row (unlike
 * `EnrollmentSettingsPanel`, which has its own internal sub-nav) — so this just wraps the bare tab
 * content + a Save/Discard footer, same session-only store as every other Enrollment Settings consumer.
 * Disclosures has no footer: its changes are saved automatically (see AccountSettingsPage). */
export const ENROLLMENT_LEAF_TAB_IDS = [
  'enrollment-vehicles', 'enrollment-vin-priorities', 'enrollment-aged-discounts',
  'enrollment-creative-distribution', 'enrollment-fees-disclosures',
] as const;

export type EnrollmentLeafTabId = (typeof ENROLLMENT_LEAF_TAB_IDS)[number];

export function isEnrollmentLeafTabId(id: string): id is EnrollmentLeafTabId {
  return (ENROLLMENT_LEAF_TAB_IDS as readonly string[]).includes(id);
}

interface EnrollmentSettingsTabContentProps {
  tabId: EnrollmentLeafTabId;
  tabLabel: string;
  accountName: string;
  accountBrand: string;
  settings: EnrollmentSettings;
  onChange: (patch: Partial<EnrollmentSettings>) => void;
  isDirty: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

export const EnrollmentSettingsTabContent = ({
  tabId, tabLabel, accountName, accountBrand, settings, onChange, isDirty, onSave, onDiscard,
}: EnrollmentSettingsTabContentProps) => (
  <div style={{
    flex: 1, minWidth: 0, background: '#ffffff', borderRadius: 16, overflow: 'hidden',
    display: 'flex', flexDirection: 'column', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  }}>
    <div style={{ padding: '10px 16px 0', flexShrink: 0 }}>
      <Breadcrumbs items={['Settings', 'Accounts', accountName, tabLabel]} />
    </div>
    <div style={{ padding: '10px 16px 12px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 16 }}>
      <h1 style={{ fontSize: 16, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px', margin: 0 }}>
        {tabLabel}
      </h1>
    </div>
    {/* Disclosures follows the Figma layout: content aligned with the page title, no extra top inset. */}
    <div style={{
      flex: 1, minHeight: 0, overflowY: 'auto',
      // No bottom padding: Disclosures pins its own snippet-actions footer to the bottom edge.
      padding: tabId === 'enrollment-fees-disclosures' ? '0 16px' : '24px 32px',
    }}>
      {tabId === 'enrollment-vehicles' && <VehiclesTab settings={settings} onChange={onChange} />}
      {tabId === 'enrollment-vin-priorities' && <VinPrioritiesTab settings={settings} onChange={onChange} />}
      {tabId === 'enrollment-aged-discounts' && <AgedDiscountsTab settings={settings} onChange={onChange} />}
      {tabId === 'enrollment-creative-distribution' && <CreativeDistributionTab settings={settings} onChange={onChange} />}
      {tabId === 'enrollment-fees-disclosures' && (
        <DisclosuresTab settings={settings} onChange={onChange} accountName={accountName} accountBrand={accountBrand} />
      )}
    </div>
    {tabId !== 'enrollment-fees-disclosures' && <div style={{
      display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 20px',
      borderTop: '1px solid rgba(0,0,0,0.12)', flexShrink: 0,
    }}>
      <Button
        onClick={onDiscard}
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
        onClick={onSave}
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
    </div>}
  </div>
);
