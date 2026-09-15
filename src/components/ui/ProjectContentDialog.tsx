import { useState } from 'react';
import { Button, Tab, Tabs } from '@mui/material';
import { Close } from '@mui/icons-material';
import type { Project } from '../../data/projects';
import type { EnrollmentSettings } from '../../data/enrollmentSettings';
import { getSavedEnrollmentSettings, saveEnrollmentSettings } from '../../data/enrollmentSettingsStore';
import { EnrollmentSettingsPanel } from './enrollment/EnrollmentSettingsPanel';
import { ProjectContentsPanel } from './ProjectContentsPanel';

type DialogTab = 'enrollment' | 'contents';

const tabSx = {
  textTransform: 'none' as const,
  fontSize: 14,
  fontWeight: 500,
  fontFamily: 'Roboto, sans-serif',
  letterSpacing: '0.4px',
  minHeight: 36,
  padding: '8px 16px',
  color: '#686576',
  '&.Mui-selected': { color: '#473bab' },
};

interface ProjectContentDialogProps {
  project: Project;
  onClose: () => void;
  /** Navigates to a project task page and closes the dialog — used by "Edit in Project" links. */
  onNavigate: (path: string) => void;
}

export const ProjectContentDialog = ({ project, onClose, onNavigate }: ProjectContentDialogProps) => {
  const [tab, setTab] = useState<DialogTab>('enrollment');
  const [saved, setSaved] = useState<EnrollmentSettings>(() => getSavedEnrollmentSettings(project.id));
  const [draft, setDraft] = useState<EnrollmentSettings>(saved);
  const isDirty = draft !== saved;

  const handleChange = (patch: Partial<EnrollmentSettings>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const handleSave = () => {
    saveEnrollmentSettings(project.id, draft);
    setSaved(draft);
  };

  const handleDiscard = () => {
    setDraft(saved);
  };

  const handleEditInProject = (path: string) => {
    onNavigate(path);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'calc(100vw - 32px)', height: 'calc(100vh - 32px)',
          background: '#ffffff', borderRadius: 16, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0px 11px 15px -7px rgba(0,0,0,0.2), 0px 24px 38px 3px rgba(0,0,0,0.14), 0px 9px 46px 8px rgba(0,0,0,0.12)',
        }}
      >
        {/* ── Header: title + tabs + close ─────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 12px 0 20px', flexShrink: 0 }}>
          <h2
            style={{
              margin: 0, fontSize: 16, fontWeight: 500, fontFamily: 'Roboto, sans-serif',
              color: '#1f1d25', letterSpacing: '0.15px', flexShrink: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320,
            }}
          >
            {project.projectName}
          </h2>
          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
            slotProps={{ indicator: { style: { background: '#473bab', height: 2 } } }}
            sx={{ minHeight: 36, flex: 1 }}
          >
            <Tab value="enrollment" label="Enrollment Settings" disableRipple sx={tabSx} />
            <Tab value="contents" label="Project Contents" disableRipple sx={tabSx} />
          </Tabs>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 100, flexShrink: 0, display: 'flex' }}
          >
            <Close style={{ fontSize: 20, color: '#1f1d25' }} />
          </button>
        </div>
        <div style={{ borderBottom: '1px solid rgba(0,0,0,0.12)', flexShrink: 0 }} />

        {/* ── Body ──────────────────────────────────────────────────── */}
        {tab === 'enrollment' ? (
          <EnrollmentSettingsPanel settings={draft} onChange={handleChange} />
        ) : (
          <div style={{ flex: 1, minHeight: 0, padding: '0 12px', overflow: 'hidden', display: 'flex' }}>
            <ProjectContentsPanel project={project} onEditInProject={handleEditInProject} />
          </div>
        )}

        {/* ── Footer: Discard/Save — Enrollment Settings only ─────────── */}
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
