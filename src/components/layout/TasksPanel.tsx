import { useMemo, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import bmwLogoSrc from '../../assets/bmw-logo.png';
import { IconButton, Menu, MenuItem, Checkbox, Popover } from '@mui/material';
import { ArrowBack, Close, CheckCircle, PendingOutlined, HourglassEmpty, WarningAmber, MoreVert } from '@mui/icons-material';
import { NeedsEditsIcon } from '../ui/NeedsEditsIcon';
import { TASKS, PROJECT_INFO, BACKGROUNDS } from '../../data/mockData';
import { ProjectStatusBadge } from '../ui/ProjectStatusBadge';
import type { ProjectWorkflowStatus } from '../ui/ProjectStatusBadge';

import { useProject } from '../../context/ProjectContext';
import type { TaskItem } from '../../data/types';

// Task icons from zip
import squareLinesIcon from '../../assets/icons/square-lines.svg';
import images2Icon from '../../assets/icons/images-2.svg';
import colorPaletteIcon from '../../assets/icons/color-palette.svg';
import multiMediaIcon from '../../assets/icons/multi-media.svg';
import circleCheckIcon from '../../assets/icons/circle-check.svg';
import imageAltTextIcon from '../../assets/icons/image-alt-text.svg';
import megaphoneIcon from '../../assets/icons/megaphone.svg';

const TASK_ICONS: Record<string, string> = {
  offers: squareLinesIcon,
  templates: images2Icon,
  theme_and_logos: colorPaletteIcon,
  review: multiMediaIcon,
  approved: circleCheckIcon,
  ads: imageAltTextIcon,
  campaigns: megaphoneIcon,
};

// Two avatar pools to give rows visual variety
const AVATARS = [
  'https://i.pravatar.cc/18?img=47',
  'https://i.pravatar.cc/18?img=12',
  'https://i.pravatar.cc/18?img=47',
  'https://i.pravatar.cc/18?img=32',
  'https://i.pravatar.cc/18?img=32',
  'https://i.pravatar.cc/18?img=32',
  'https://i.pravatar.cc/18?img=32',
];

interface TasksPanelProps {
  onClose?: () => void;
  width?: number;
}

export const TasksPanel = ({ onClose, width = 280 }: TasksPanelProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    offers, assets, templates, removedTemplateIds, removedBgIds,
    pendingChanges, pendingRemovals, everApprovedIds, campaignLoaded,
    approvalEnabled, setApprovalEnabled,
  } = useProject();

  // Three-dots menu anchor
  const dotsButtonRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [configPanelOpen, setConfigPanelOpen] = useState(false);

  const hasDraftAssets = assets.some((a) => a.status === 'draft');
  const hasAnyGeneratedAsset = assets.some((a) => a.status !== 'draft');
  const hasAwaitingApproval = assets.some((a) => a.status === 'awaiting_approval');
  const hasNeedsEdits = assets.some((a) => a.status === 'needs_edits');
  const hasUpdatedAssets = assets.some((a) => a.status === 'updated');
  const hasRemovedAssets = assets.some((a) => a.status === 'removed');
  const hasGeneratedAssets = assets.some((a) => a.status === 'generated');
  const hasPendingChanges = hasUpdatedAssets || hasRemovedAssets;
  // All review assets concluded when every non-approved asset is denied (no more actions needed)
  const reviewAssets = assets.filter((a) => a.status !== 'approved');
  const allReviewConcluded = assets.length > 0 && (reviewAssets.length === 0 || reviewAssets.every((a) => a.status === 'denied'));
  const allAssetsGeneratedNoApproval = !hasDraftAssets && !hasPendingChanges && hasGeneratedAssets;
  const updatedCount = assets.filter((a) => a.status === 'updated').length;
  const removedCount = assets.filter((a) => a.status === 'removed').length;
  const awaitingApprovalCount = assets.filter((a) => a.status === 'awaiting_approval').length;

  // Pending-change counts per task type
  const updatedOffersCount = pendingChanges.length;
  const removedOffersCount = pendingRemovals.filter((r) => r.type === 'offer').length;
  const removedTemplatesCount = pendingRemovals.filter((r) => r.type === 'template').length;
  const removedBackgroundsCount = pendingRemovals.filter((r) => r.type === 'background').length;

  // "All assets generated" = assets exist and none are still draft
  const allAssetsGenerated = assets.length > 0 && !hasDraftAssets;
  // Assets that were previously approved and are now awaiting re-approval after changes were applied
  const approvedNowAwaitingCount = assets.filter((a) => a.status === 'awaiting_approval' && everApprovedIds.has(a.id)).length;

  // Count assets that were previously 'approved' but changed status due to project changes
  const approvedChangedCount = useMemo(() => {
    const ids = new Set<string>();
    pendingChanges.forEach((c) => {
      Object.entries(c.previousAssetStatuses).forEach(([id, status]) => {
        if (status === 'approved') ids.add(id);
      });
    });
    pendingRemovals.forEach((r) => {
      Object.entries(r.previousAssetStatuses).forEach(([id, status]) => {
        if (status === 'approved') ids.add(id);
      });
    });
    return ids.size;
  }, [pendingChanges, pendingRemovals]);

  // Number of Ad Shells (grouped by template+background) that contain at least one 'updated' asset
  const adsUpdatedShellCount = useMemo(() => {
    const eligibleAssets = approvalEnabled
      ? assets.filter((a) =>
          a.status === 'approved' ||
          a.status === 'updated' ||
          (a.status === 'awaiting_approval' && everApprovedIds.has(a.id)) ||
          (a.status === 'removed' && everApprovedIds.has(a.id))
        )
      : assets.filter((a) =>
          a.status === 'generated' ||
          a.status === 'updated' ||
          a.status === 'removed'
        );
    const shellMap = new Map<string, boolean>();
    eligibleAssets.forEach((a) => {
      const key = `${a.templateId}__${a.backgroundId}`;
      if (!shellMap.has(key)) shellMap.set(key, false);
      if (a.status === 'updated' || a.status === 'removed') shellMap.set(key, true);
    });
    let count = 0;
    shellMap.forEach((hasUpdated) => { if (hasUpdated) count++; });
    return count;
  }, [assets, everApprovedIds, approvalEnabled]);

  // Number of Ad Shells that contain at least one asset awaiting re-approval (previously approved)
  const adsAwaitingShellCount = useMemo(() => {
    const eligibleAssets = assets.filter((a) =>
      a.status === 'approved' ||
      a.status === 'updated' ||
      (a.status === 'awaiting_approval' && everApprovedIds.has(a.id)) ||
      (a.status === 'removed' && everApprovedIds.has(a.id))
    );
    const shellMap = new Map<string, boolean>();
    eligibleAssets.forEach((a) => {
      const key = `${a.templateId}__${a.backgroundId}`;
      if (!shellMap.has(key)) shellMap.set(key, false);
      if (a.status === 'awaiting_approval') shellMap.set(key, true);
    });
    let count = 0;
    shellMap.forEach((hasAwaiting) => { if (hasAwaiting) count++; });
    return count;
  }, [assets, everApprovedIds]);

  const liveCounts = useMemo<Record<string, number>>(() => {
    return {
      offers: offers.length,
      templates: templates.filter((t) => !removedTemplateIds.has(t.id)).length,
      theme_and_logos: BACKGROUNDS.filter((b) => !removedBgIds.has(b.id)).length,
      review: assets.filter((a) => a.status !== 'approved').length,
      approved: assets.filter((a) => a.status === 'approved').length,
    };
  }, [offers, assets, templates, removedTemplateIds, removedBgIds]);

  const projectWorkflowStatus: ProjectWorkflowStatus = approvalEnabled
    ? (hasDraftAssets
        ? 'in_progress'
        : hasPendingChanges
          ? 'pending_changes'
          : hasAwaitingApproval
            ? 'awaiting_approval'
            : hasNeedsEdits
              ? 'needs_edits'
              : campaignLoaded
                ? 'campaign_loaded'
                : liveCounts['approved'] > 0
                  ? 'assets_generated'
                  : 'in_progress')
    : (hasDraftAssets
        ? 'in_progress'
        : hasPendingChanges
          ? 'pending_changes'
          : campaignLoaded
            ? 'campaign_loaded'
            : allAssetsGeneratedNoApproval
              ? 'assets_generated_no_approval'
              : 'in_progress');

  // Filter tasks based on workflow config
  const visibleTasks = TASKS.filter((t) => approvalEnabled || t.key !== 'approved');

  const isActive = (task: TaskItem) => location.pathname === task.route;

  const handleConfigureWorkflow = () => {
    setMenuOpen(false);
    setConfigPanelOpen(true);
  };

  return (
    <div
      className="flex flex-col shrink-0 overflow-hidden"
      style={{
        width,
        background: '#ffffff',
        borderRadius: 8,
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        margin: '8px 0 8px 8px',
      }}
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          minHeight: 40,
          padding: '12px 16px 8px',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <IconButton size="small" onClick={onClose} sx={{ padding: '5px', flexShrink: 0 }}>
          <ArrowBack style={{ fontSize: 20, color: '#1f1d25' }} />
        </IconButton>

        <span
          style={{
            fontSize: 16,
            fontWeight: 500,
            fontFamily: 'Roboto, sans-serif',
            color: '#1f1d25',
            letterSpacing: '0.15px',
            lineHeight: 1.5,
            marginLeft: 4,
          }}
        >
          Tasks
        </span>

        <IconButton
          size="small"
          onClick={onClose}
          sx={{ position: 'absolute', right: 10, top: 8, padding: '5px', width: 30, height: 30 }}
        >
          <Close style={{ fontSize: 20, color: '#1f1d25' }} />
        </IconButton>
      </div>

      {/* ── Scrollable content ────────────────────────────── */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '0 16px 16px' }}>

        {/* Project info */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'flex-start',
            padding: '8px 0 4px',
          }}
        >
          {/* BMW logo — 56 × 56, rounded 4px */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 4,
              overflow: 'hidden',
              flexShrink: 0,
              background: '#ffffff',
              border: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img src={bmwLogoSrc} alt="BMW" style={{ width: 48, height: 48, objectFit: 'contain' }} />
          </div>

          {/* Account + project + status */}
          <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                fontFamily: 'Roboto, sans-serif',
                fontWeight: 400,
                color: '#686576',
                letterSpacing: '0.4px',
                lineHeight: 1.66,
              }}
            >
              {PROJECT_INFO.accountName} · {PROJECT_INFO.accountCode}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                fontFamily: 'Roboto, sans-serif',
                fontWeight: 400,
                color: '#1f1d25',
                letterSpacing: '0.17px',
                lineHeight: 1.43,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {PROJECT_INFO.projectName}
            </p>

            {/* Project workflow status badge */}
            <div style={{ paddingTop: 4 }}>
              <ProjectStatusBadge status={projectWorkflowStatus} />
            </div>
          </div>

          {/* Three-dots menu button */}
          <IconButton
            ref={dotsButtonRef}
            size="small"
            onClick={() => setMenuOpen(true)}
            sx={{ padding: '4px', flexShrink: 0, alignSelf: 'flex-start', marginTop: '2px' }}
          >
            <MoreVert style={{ fontSize: 18, color: '#686576' }} />
          </IconButton>
        </div>

        {/* Three-dots dropdown menu */}
        <Menu
          anchorEl={dotsButtonRef.current}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{
            paper: {
              style: {
                minWidth: 180,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                borderRadius: 8,
              },
            },
          }}
        >
          <MenuItem
            onClick={handleConfigureWorkflow}
            sx={{
              fontSize: 13,
              fontFamily: 'Roboto, sans-serif',
              color: '#1f1d25',
              letterSpacing: '0.17px',
              py: '8px',
              px: '16px',
            }}
          >
            Configure Workflow
          </MenuItem>
        </Menu>

        {/* ── Configure Workflow Popover ───────────────────── */}
        <Popover
          open={configPanelOpen}
          anchorEl={dotsButtonRef.current}
          onClose={() => setConfigPanelOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          slotProps={{
            paper: {
              style: {
                minWidth: 220,
                borderRadius: 8,
                boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
                padding: '12px 14px',
                background: '#ffffff',
              },
            },
          }}
        >
          {/* Popover header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                fontFamily: 'Roboto, sans-serif',
                color: '#1f1d25',
                letterSpacing: '0.17px',
              }}
            >
              Configure Workflow
            </span>
            <IconButton
              size="small"
              onClick={() => setConfigPanelOpen(false)}
              sx={{ padding: '2px' }}
            >
              <Close style={{ fontSize: 15, color: '#686576' }} />
            </IconButton>
          </div>

          {/* Task checkboxes */}
          {TASKS.map((task) => {
            const isToggleable = task.key === 'approved' && !hasAnyGeneratedAsset;
            const isDisabled = task.key !== 'approved' || hasAnyGeneratedAsset;
            const isChecked = task.key === 'approved' ? approvalEnabled : true;
            return (
              <div
                key={task.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '2px 0',
                }}
              >
                <Checkbox
                  size="small"
                  checked={isChecked}
                  disabled={isDisabled}
                  onChange={(e) => {
                    if (isToggleable) setApprovalEnabled(e.target.checked);
                  }}
                  sx={{
                    padding: '2px',
                    '&.Mui-checked': { color: '#473bab' },
                    '&.Mui-disabled': { color: '#cac9cf' },
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    fontFamily: 'Roboto, sans-serif',
                    color: isDisabled ? '#9c99a9' : '#1f1d25',
                    letterSpacing: '0.17px',
                    lineHeight: 1.5,
                  }}
                >
                  {task.label}
                </span>
              </div>
            );
          })}
          {hasAnyGeneratedAsset && (
            <p style={{
              margin: '6px 0 0',
              fontSize: 11,
              fontFamily: 'Roboto, sans-serif',
              color: '#9c99a9',
              letterSpacing: '0.4px',
              lineHeight: 1.5,
            }}>
              Workflow cannot be changed after assets are generated.
            </p>
          )}
        </Popover>

        {/* ── Task list ────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
          {visibleTasks.map((task, idx) => {
            const active = isActive(task);
            // Rename 'review' to 'Assets' when approval is disabled
            const taskLabel = (!approvalEnabled && task.key === 'review') ? 'Assets' : task.label;
            return (
              <button
                key={task.key}
                onClick={() => navigate(task.route)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  width: '100%',
                  padding: '4px 8px',
                  borderRadius: 12,
                  border: 'none',
                  background: active ? 'rgba(99,86,225,0.08)' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  outline: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.04)';
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }}
              >
                {/* Task icon */}
                <div
                  style={{
                    width: 20,
                    height: 20,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img src={TASK_ICONS[task.key]} alt="" style={{ width: 20, height: 20 }} />
                </div>

                {/* Label + count */}
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '4px 0',
                    minWidth: 0,
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontFamily: 'Roboto, sans-serif',
                        fontWeight: 400,
                        color: '#1f1d25',
                        letterSpacing: '0.17px',
                        lineHeight: 1.43,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {taskLabel}
                    </span>
                    {(liveCounts[task.key] ?? task.count) > 0 && (
                      <span
                        style={{
                          fontSize: 11,
                          fontFamily: 'Roboto, sans-serif',
                          fontWeight: 400,
                          color: '#9c99a9',
                          letterSpacing: '0.4px',
                          lineHeight: 1.66,
                          flexShrink: 0,
                        }}
                      >
                        ({liveCounts[task.key] ?? task.count})
                      </span>
                    )}
                  </div>
                  {task.key === 'offers' && hasPendingChanges && updatedOffersCount > 0 && (
                    <span style={{ fontSize: 10, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#686576', letterSpacing: '0.4px', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {updatedOffersCount} offer{updatedOffersCount !== 1 ? 's' : ''} updated
                    </span>
                  )}
                  {task.key === 'offers' && hasPendingChanges && removedOffersCount > 0 && (
                    <span style={{ fontSize: 10, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#686576', letterSpacing: '0.4px', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {removedOffersCount} offer{removedOffersCount !== 1 ? 's' : ''} removed
                    </span>
                  )}
                  {task.key === 'templates' && hasPendingChanges && removedTemplatesCount > 0 && (
                    <span style={{ fontSize: 10, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#686576', letterSpacing: '0.4px', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {removedTemplatesCount} template{removedTemplatesCount !== 1 ? 's' : ''} removed
                    </span>
                  )}
                  {task.key === 'theme_and_logos' && hasPendingChanges && removedBackgroundsCount > 0 && (
                    <span style={{ fontSize: 10, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#686576', letterSpacing: '0.4px', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {removedBackgroundsCount} background{removedBackgroundsCount !== 1 ? 's' : ''} removed
                    </span>
                  )}
                  {task.key === 'review' && hasUpdatedAssets && (
                    <span style={{ fontSize: 10, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#686576', letterSpacing: '0.4px', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {updatedCount} updated
                    </span>
                  )}
                  {task.key === 'review' && hasRemovedAssets && (
                    <span style={{ fontSize: 10, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#686576', letterSpacing: '0.4px', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {removedCount} removed
                    </span>
                  )}
                  {task.key === 'review' && approvalEnabled && hasAwaitingApproval && (
                    <span style={{ fontSize: 10, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#686576', letterSpacing: '0.4px', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {awaitingApprovalCount} Awaiting Approval
                    </span>
                  )}
                  {task.key === 'approved' && approvedChangedCount > 0 && (
                    <span style={{ fontSize: 10, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#686576', letterSpacing: '0.4px', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {approvedChangedCount} asset{approvedChangedCount !== 1 ? 's' : ''} removed
                    </span>
                  )}
                  {task.key === 'approved' && approvedNowAwaitingCount > 0 && (
                    <span style={{ fontSize: 10, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#686576', letterSpacing: '0.4px', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {approvedNowAwaitingCount} removed due changes
                    </span>
                  )}
                  {task.key === 'ads' && (liveCounts['approved'] > 0 || !hasAwaitingApproval) && hasPendingChanges && adsUpdatedShellCount > 0 && (
                    <span style={{ fontSize: 10, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#686576', letterSpacing: '0.4px', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {adsUpdatedShellCount} updated
                    </span>
                  )}
                  {task.key === 'ads' && (liveCounts['approved'] > 0 || !hasAwaitingApproval) && adsAwaitingShellCount > 0 && (
                    <span style={{ fontSize: 10, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#686576', letterSpacing: '0.4px', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {adsAwaitingShellCount} awaiting approval
                    </span>
                  )}
                  {task.key === 'campaigns' && campaignLoaded && adsUpdatedShellCount > 0 && (
                    <span style={{ fontSize: 10, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#686576', letterSpacing: '0.4px', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      1 updated
                    </span>
                  )}
                  {task.key === 'campaigns' && campaignLoaded && adsUpdatedShellCount === 0 && adsAwaitingShellCount > 0 && (
                    <span style={{ fontSize: 10, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#686576', letterSpacing: '0.4px', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      1 awaiting approval
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <img
                  src={AVATARS[idx] ?? AVATARS[0]}
                  alt=""
                  style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0 }}
                />

                {/* Completion indicator */}
                {task.key === 'review' ? (
                  hasPendingChanges
                    ? <WarningAmber style={{ fontSize: 18, color: '#c45500', flexShrink: 0 }} />
                    : hasDraftAssets
                      ? <PendingOutlined style={{ fontSize: 18, color: '#01579b', flexShrink: 0 }} />
                      : !approvalEnabled
                        ? (allAssetsGeneratedNoApproval
                            ? <CheckCircle style={{ fontSize: 18, color: '#2e7d32', flexShrink: 0 }} />
                            : <PendingOutlined style={{ fontSize: 18, color: '#01579b', flexShrink: 0 }} />)
                        : hasAwaitingApproval
                          ? <HourglassEmpty style={{ fontSize: 18, color: '#c45500', flexShrink: 0 }} />
                          : hasNeedsEdits
                            ? <NeedsEditsIcon style={{ fontSize: 18, color: '#c45500', flexShrink: 0 }} />
                            : allReviewConcluded
                              ? <CheckCircle style={{ fontSize: 18, color: '#2e7d32', flexShrink: 0 }} />
                              : <HourglassEmpty style={{ fontSize: 18, color: '#c45500', flexShrink: 0 }} />
                ) : task.key === 'approved' ? (
                  approvedChangedCount > 0
                    ? <WarningAmber style={{ fontSize: 18, color: '#c45500', flexShrink: 0 }} />
                    : approvedNowAwaitingCount > 0
                      ? <HourglassEmpty style={{ fontSize: 18, color: '#c45500', flexShrink: 0 }} />
                      : allReviewConcluded
                        ? <CheckCircle style={{ fontSize: 18, color: '#2e7d32', flexShrink: 0 }} />
                        : <PendingOutlined style={{ fontSize: 18, color: '#01579b', flexShrink: 0 }} />
                ) : task.key === 'ads' ? (
                  !approvalEnabled
                    ? (hasDraftAssets
                        ? <PendingOutlined style={{ fontSize: 18, color: '#01579b', flexShrink: 0 }} />
                        : hasPendingChanges && adsUpdatedShellCount > 0
                          ? <WarningAmber style={{ fontSize: 18, color: '#c45500', flexShrink: 0 }} />
                          : <CheckCircle style={{ fontSize: 18, color: '#2e7d32', flexShrink: 0 }} />)
                    : liveCounts['approved'] === 0 && hasAwaitingApproval
                      ? <PendingOutlined style={{ fontSize: 18, color: '#01579b', flexShrink: 0 }} />
                      : hasPendingChanges && adsUpdatedShellCount > 0
                        ? <WarningAmber style={{ fontSize: 18, color: '#c45500', flexShrink: 0 }} />
                        : adsAwaitingShellCount > 0
                          ? <HourglassEmpty style={{ fontSize: 18, color: '#c45500', flexShrink: 0 }} />
                          : allReviewConcluded && liveCounts['approved'] > 0
                            ? hasPendingChanges
                              ? <WarningAmber style={{ fontSize: 18, color: '#c45500', flexShrink: 0 }} />
                              : <CheckCircle style={{ fontSize: 18, color: '#2e7d32', flexShrink: 0 }} />
                            : <PendingOutlined style={{ fontSize: 18, color: '#01579b', flexShrink: 0 }} />
                ) : task.key === 'campaigns' ? (
                  !campaignLoaded
                    ? <PendingOutlined style={{ fontSize: 18, color: '#01579b', flexShrink: 0 }} />
                    : adsUpdatedShellCount > 0
                      ? <WarningAmber style={{ fontSize: 18, color: '#c45500', flexShrink: 0 }} />
                      : adsAwaitingShellCount > 0
                        ? <HourglassEmpty style={{ fontSize: 18, color: '#c45500', flexShrink: 0 }} />
                        : <CheckCircle style={{ fontSize: 18, color: '#2e7d32', flexShrink: 0 }} />
                ) : (task.key === 'offers' || task.key === 'templates' || task.key === 'theme_and_logos') ? (
                  hasPendingChanges
                    ? <WarningAmber style={{ fontSize: 18, color: '#c45500', flexShrink: 0 }} />
                    : allAssetsGenerated
                      ? <CheckCircle style={{ fontSize: 18, color: '#2e7d32', flexShrink: 0 }} />
                      : <PendingOutlined style={{ fontSize: 18, color: '#01579b', flexShrink: 0 }} />
                ) : task.completed ? (
                  <CheckCircle style={{ fontSize: 18, color: '#2e7d32', flexShrink: 0 }} />
                ) : (
                  <PendingOutlined style={{ fontSize: 18, color: '#01579b', flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
