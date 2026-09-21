import { useState } from 'react';
import { Button, IconButton } from '@mui/material';
import { Close, DescriptionOutlined, GridViewOutlined } from '@mui/icons-material';
import type { Project } from '../../data/projects';
import type { EnrollmentSettings } from '../../data/enrollmentSettings';
import { getSavedEnrollmentSettings, saveEnrollmentSettings } from '../../data/enrollmentSettingsStore';
import { EnrollmentSettingsPanel } from './enrollment/EnrollmentSettingsPanel';
import { ProjectContentsPanel } from './ProjectContentsPanel';

/**
 * Right-panel "Project Settings" for the alert dialog, opened from the canvas toolbar's Project Settings
 * icon. Reuses the exact same Enrollment/Contents content as the standalone `ProjectContentDialog` shown
 * from a project card's own Project Settings action — just switched between via a vertical icon rail
 * (instead of that dialog's horizontal tabs) and sized to half the alert dialog's width. Enrollment stays
 * editable (Save/Discard, same session-only store); Contents stays the read-only summary it already is.
 */

type PanelTab = 'enrollment' | 'contents';

const NAV_ITEMS: { id: PanelTab; label: string; icon: React.ElementType }[] = [
  { id: 'enrollment', label: 'Enrollment', icon: DescriptionOutlined },
  { id: 'contents', label: 'Contents', icon: GridViewOutlined },
];

interface AlertProjectSettingsPanelProps {
  project: Project;
  onClose: () => void;
}

export const AlertProjectSettingsPanel = ({ project, onClose }: AlertProjectSettingsPanelProps) => {
  const [tab, setTab] = useState<PanelTab>('enrollment');
  const [saved, setSaved] = useState<EnrollmentSettings>(() => getSavedEnrollmentSettings(project.id));
  const [draft, setDraft] = useState<EnrollmentSettings>(saved);
  const isDirty = draft !== saved;

  const handleChange = (patch: Partial<EnrollmentSettings>) => setDraft((prev) => ({ ...prev, ...patch }));
  const handleSave = () => { saveEnrollmentSettings(project.id, draft); setSaved(draft); };
  const handleDiscard = () => setDraft(saved);
  // "Edit in Project" link-outs open the project's task page in a new tab — matches the same pattern used
  // by the canvas's own floating Offer Info card (AlertOfferCard) for its Templates/Styles link-outs,
  // rather than navigating the alert dialog itself away.
  const handleEditInProject = (path: string) => window.open(path, '_blank', 'noopener,noreferrer');

  return (
    <div style={{ width: '50%', flexShrink: 0, borderLeft: '1px solid rgba(0,0,0,0.08)', display: 'flex', overflow: 'hidden' }}>
      {/* ── Vertical tab rail ────────────────────────────────────────── */}
      <nav style={{ width: 88, flexShrink: 0, borderRight: '1px solid rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', gap: 4, padding: '16px 8px' }}>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                border: 'none', borderRadius: 8, padding: '10px 4px', cursor: 'pointer',
                background: active ? 'rgba(99,86,225,0.08)' : 'transparent',
              }}
            >
              <Icon style={{ fontSize: 20, color: active ? '#473bab' : '#686576' }} />
              <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: active ? 500 : 400, color: active ? '#473bab' : '#686576', letterSpacing: '0.17px' }}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ── Active tab ───────────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 600, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>
            {tab === 'enrollment' ? 'Enrollment Settings' : 'Project Contents'}
          </span>
          <IconButton size="small" onClick={onClose} sx={{ padding: '4px' }}>
            <Close style={{ fontSize: 18, color: '#686576' }} />
          </IconButton>
        </div>

        <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
          {tab === 'enrollment' ? (
            <EnrollmentSettingsPanel settings={draft} onChange={handleChange} accountName={project.accountName} accountBrand={project.brandTag} />
          ) : (
            <div style={{ flex: 1, minHeight: 0, padding: '0 12px', overflow: 'hidden', display: 'flex' }}>
              <ProjectContentsPanel project={project} onEditInProject={handleEditInProject} />
            </div>
          )}
        </div>

        {tab === 'enrollment' && (
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 20px',
            borderTop: '1px solid rgba(0,0,0,0.12)', flexShrink: 0,
          }}>
            <Button
              onClick={handleDiscard}
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
              onClick={handleSave}
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
        )}
      </div>
    </div>
  );
};
