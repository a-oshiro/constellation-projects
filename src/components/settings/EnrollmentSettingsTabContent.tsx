import { Button } from '@mui/material';
import { Add } from '@mui/icons-material';
import { Breadcrumbs } from '../layout/Breadcrumbs';
import type { EnrollmentSettings } from '../../data/enrollmentSettings';
import { VehiclesTab } from '../ui/enrollment/VehiclesTab';
import { VinPrioritiesTab } from '../ui/enrollment/VinPrioritiesTab';
import { AgedDiscountsTab } from '../ui/enrollment/AgedDiscountsTab';
import { CreativeDistributionTab } from '../ui/enrollment/CreativeDistributionTab';
import { FeesDisclosuresTab } from '../ui/enrollment/FeesDisclosuresTab';

/** Figma-provided icon for the "Bulk Disclosure Upload" header action — no equivalent shape in the MUI icon set. */
const BulkDisclosureUploadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.2915 12.5V16.0417C2.2915 16.5019 2.6646 16.875 3.12484 16.875H10.2082C10.6684 16.875 11.0415 16.5019 11.0415 16.0417V12.5" stroke="#473BAB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8.12513 8.95866L8.52543 11.3604C8.6551 12.1384 9.32823 12.7087 10.117 12.7087C11.2584 12.7087 12.039 11.5558 11.615 10.4959L11.043 9.06583C10.9165 8.74945 10.61 8.54199 10.2693 8.54199H3.06433C2.72357 8.54199 2.41715 8.74945 2.2906 9.06583L1.71856 10.4959C1.29462 11.5558 2.07516 12.7087 3.21664 12.7087C4.00537 12.7087 4.6785 12.1384 4.80817 11.3604L5.20847 8.95866" stroke="#473BAB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8.12499 8.95801L8.40749 10.653C8.58678 11.7288 7.75722 12.708 6.66665 12.708C5.57608 12.708 4.74653 11.7288 4.92582 10.653L5.20832 8.95801" stroke="#473BAB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15.0743 5.23633C15.2536 6.31206 14.4241 7.29132 13.3335 7.29132" stroke="#473BAB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14.7915 11.8753H16.8748C17.3351 11.8753 17.7082 11.5022 17.7082 11.042V7.29199" stroke="#473BAB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14.7913 3.54167L15.1916 5.94344C15.3213 6.72144 15.9944 7.29167 16.7832 7.29167C17.9247 7.29167 18.7052 6.13879 18.2813 5.07895L17.7092 3.64884C17.5827 3.33246 17.2762 3.125 16.9355 3.125H9.73054C9.38978 3.125 9.08336 3.33246 8.95681 3.64884L8.38477 5.07895M11.5969 5.20833L11.8747 3.54167" stroke="#473BAB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** The Account Settings page's own left-nav already lists these one-per-row (unlike
 * `EnrollmentSettingsPanel`, which has its own internal sub-nav) — so this just wraps the bare tab
 * content + a Save/Discard footer, same session-only store as every other Enrollment Settings consumer. */
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
      {tabId === 'enrollment-fees-disclosures' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <Button
            disableElevation
            variant="contained"
            size='small'
            startIcon={<Add style={{ fontSize: 18 }} />}
            sx={{
              borderRadius: 100, textTransform: 'capitalize', fontSize: 13, fontWeight: 500,
              letterSpacing: '0.4px', background: '#473bab', padding: '6px 16px',
              '&:hover': { background: '#3d3396' },
            }}
          >
            Add Disclosure
          </Button>
          <Button
            disableElevation
            variant="outlined"
            size="small"
            startIcon={<BulkDisclosureUploadIcon />}
            sx={{
              borderRadius: 100, textTransform: 'capitalize', fontSize: 13, fontWeight: 500,
              letterSpacing: '0.4px', color: '#473bab', borderColor: '#cdccff', padding: '6px 16px',
              '&:hover': { borderColor: '#473bab', background: 'rgba(99,86,225,0.04)' },
            }}
          >
            Bulk Disclosure Upload
          </Button>
        </div>
      )}
    </div>
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px 32px' }}>
      {tabId === 'enrollment-vehicles' && <VehiclesTab settings={settings} onChange={onChange} />}
      {tabId === 'enrollment-vin-priorities' && <VinPrioritiesTab settings={settings} onChange={onChange} />}
      {tabId === 'enrollment-aged-discounts' && <AgedDiscountsTab settings={settings} onChange={onChange} />}
      {tabId === 'enrollment-creative-distribution' && <CreativeDistributionTab settings={settings} onChange={onChange} />}
      {tabId === 'enrollment-fees-disclosures' && (
        <FeesDisclosuresTab settings={settings} onChange={onChange} accountName={accountName} accountBrand={accountBrand} />
      )}
    </div>
    <div style={{
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
    </div>
  </div>
);
