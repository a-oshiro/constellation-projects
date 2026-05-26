import type { ReactNode } from 'react';
import { IconButton } from '@mui/material';
import { ProjectStatusBadge } from './ProjectStatusBadge';
import type { ProjectWorkflowStatus } from './ProjectStatusBadge';
import { Breadcrumbs } from '../layout/Breadcrumbs';
import { PROJECT_INFO } from '../../data/mockData';
import { useLayout } from '../../context/LayoutContext';
import { useProject } from '../../context/ProjectContext';

interface PageHeaderProps {
  breadcrumbs: string[];
  title: string;
  /** Page-specific controls that sit between the title and the project info (e.g. search, selects, action buttons). */
  children?: ReactNode;
  /** Page-specific controls on the far right, after the project info block (e.g. item count + view toggle). */
  rightExtras?: ReactNode;
}

export const PageHeader = ({
  breadcrumbs,
  title,
  children,
  rightExtras,
}: PageHeaderProps) => {
  const { tasksPanelOpen, openTasksPanel } = useLayout();
  const { assets } = useProject();

  const hasDraftAssets = assets.some((a) => a.status === 'draft');
  const hasAwaitingApproval = assets.some((a) => a.status === 'awaiting_approval');
  const hasNeedsEdits = assets.some((a) => a.status === 'needs_edits');
  const hasPendingChanges = assets.some((a) => a.status === 'updated' || a.status === 'removed');
  const approvedCount = assets.filter((a) => a.status === 'approved').length;

  const projectWorkflowStatus: ProjectWorkflowStatus = hasPendingChanges
    ? 'pending_changes'
    : hasDraftAssets
      ? 'in_progress'
      : hasAwaitingApproval
        ? 'awaiting_approval'
        : hasNeedsEdits
          ? 'needs_edits'
          : approvedCount > 0
            ? 'assets_generated'
            : 'in_progress';

  return (
    <div
      style={{
        padding: '10px 16px 12px',
        background: '#ffffff',
        flexShrink: 0,
      }}
    >
      {/* Breadcrumbs */}
      <div style={{ marginBottom: 6 }}>
        <Breadcrumbs items={breadcrumbs} />
      </div>

      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap', paddingTop: 6 }}>

        {/* Panel toggle — only when panel is closed */}
        {!tasksPanelOpen && (
          <IconButton size="small" onClick={openTasksPanel} sx={{ flexShrink: 0, padding: '4px' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1.75" y="1.75" width="16.5" height="16.5" rx="1.25" stroke="#1f1d25" strokeWidth="1.5"/>
              <line x1="7.25" y1="1.75" x2="7.25" y2="18.25" stroke="#1f1d25" strokeWidth="1.5"/>
            </svg>
          </IconButton>
        )}

        {/* Page title */}
        <h1 style={{
          fontSize: 16, fontWeight: 500, fontFamily: 'Roboto, sans-serif',
          color: '#1f1d25', letterSpacing: '0.15px', margin: 0, flexShrink: 0,
          whiteSpace: 'nowrap',
        }}>
          {title}
        </h1>

        {/* Page-specific action controls — flex:1 so search fields can expand */}
        {children && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            flex: 1, minWidth: 0, flexWrap: 'nowrap',
          }}>
            {children}
          </div>
        )}

        {/* Spacer — pushes project info to the right when no children */}
        {!children && <div style={{ flex: 1 }} />}

        {/* ── Project info — always the same across all pages ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <span style={{
            fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 400,
            color: '#1f1d25', letterSpacing: '0.4px', lineHeight: 1.66, whiteSpace: 'nowrap',
          }}>
            {PROJECT_INFO.startDate} - {PROJECT_INFO.endDate}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <img
              src={PROJECT_INFO.creatorAvatar}
              alt=""
              style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0 }}
            />
            <span style={{
              fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 400,
              color: '#686576', letterSpacing: '0.4px', lineHeight: 1.66, whiteSpace: 'nowrap',
            }}>
              {PROJECT_INFO.creator}
            </span>
          </div>

          <ProjectStatusBadge status={projectWorkflowStatus} />
        </div>

        {/* Page-specific right extras (item count, view toggle, etc.) */}
        {rightExtras && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {rightExtras}
          </div>
        )}
      </div>
    </div>
  );
};
