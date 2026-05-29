import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton, Select, MenuItem, FormControl, TextField } from '@mui/material';
import { Search, MoreVert, ViewModule, FilterList, WarningAmber } from '@mui/icons-material';
import { GenerateSplitButton } from '../components/ui/GenerateSplitButton';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Tooltip } from '../components/ui/Tooltip';
import { useSnackbar } from '../context/SnackbarContext';
import { useProgressIndicator } from '../context/ProgressIndicatorContext';
import { AssetCardSkeleton } from '../components/ui/AssetCardSkeleton';
import type { AssetStatus } from '../data/types';

const STATUS_OPTIONS: AssetStatus[] = [
  'approved',
  'awaiting_approval',
  'needs_edits',
  'denied',
];

const TAB_ORDER: AssetStatus[] = ['draft', 'updated', 'awaiting_approval', 'needs_edits', 'denied', 'removed'];
const STATUS_TAB_LABELS: Record<string, string> = {
  draft: 'Draft',
  updated: 'Updated',
  awaiting_approval: 'Awaiting Approval',
  needs_edits: 'Needs Edits',
  denied: 'Denied',
  removed: 'Removed',
};
import { PageHeader } from '../components/ui/PageHeader';
import { TaskFooter } from '../components/ui/TaskFooter';
import { AssetCard } from '../components/ui/AssetCard';
import type { DraftVariant } from '../components/ui/AssetCard';
import { EmptyStateMessage } from '../components/ui/EmptyStateMessage';
import { useProject } from '../context/ProjectContext';
import { useLayout } from '../context/LayoutContext';
import { ApplyChangesDialog, RevertChangesDialog } from '../components/ui/ProjectChangesDialogs';

export const ReviewPage = () => {
  const { assets, offers, bulkSetAssetStatus, pendingChanges, pendingRemovals, applyChanges, revertChanges, revertRemovals, everApprovedIds, campaignLoaded } = useProject();
  const { showSnackbar } = useSnackbar();
  const { startProgress } = useProgressIndicator();
  const { openAdvancedGeneration, closeAdvancedGeneration, submittingIds, addSubmittingIds, clearSubmittingIds } = useLayout();
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [revertDialogOpen, setRevertDialogOpen] = useState(false);
  const [draftVariant] = useState<DraftVariant>('badge');
  const [activeTab, setActiveTab] = useState<AssetStatus | 'all'>(() => {
    const nonApproved = assets.filter((a) => a.status !== 'approved');
    return TAB_ORDER.find((s) => nonApproved.some((a) => a.status === s)) ?? 'all';
  });

  const hasDraftAssets = assets.some((a) => a.status === 'draft');
  const nonApprovedAssets = assets.filter((a) => a.status !== 'approved');
  const hasNonDraftAssets = nonApprovedAssets.some((a) => a.status !== 'draft' && a.status !== 'removed');
  const updatedAssets = nonApprovedAssets.filter((a) => a.status === 'updated');
  const removedAssets = nonApprovedAssets.filter((a) => a.status === 'removed');
  const hasUpdatedAssets = updatedAssets.length > 0;
  const hasRemovedAssets = removedAssets.length > 0;
  const hasPendingChanges = hasUpdatedAssets || hasRemovedAssets;
  // Assets that were previously 'approved' but changed due to project changes (matches TasksPanel logic)
  const approvedRemovedCount = (() => {
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
  })();

  const adsUpdatedShellCount = useMemo(() => {
    const eligible = assets.filter((a) =>
      a.status === 'approved' ||
      (a.status === 'updated' && everApprovedIds.has(a.id)) ||
      (a.status === 'awaiting_approval' && everApprovedIds.has(a.id)) ||
      (a.status === 'removed' && everApprovedIds.has(a.id))
    );
    const shellMap = new Map<string, boolean>();
    eligible.forEach((a) => {
      const key = `${a.templateId}__${a.backgroundId}`;
      if (!shellMap.has(key)) shellMap.set(key, false);
      if (a.status === 'updated' || a.status === 'removed') shellMap.set(key, true);
    });
    let count = 0;
    shellMap.forEach((hasUpdated) => { if (hasUpdated) count++; });
    return count;
  }, [assets, everApprovedIds]);

  const selectedAssets = nonApprovedAssets.filter((a) => selectedIds.has(a.id));
  const selectedHasDraft = selectedAssets.some((a) => a.status === 'draft');
  const selectedHasUpdated = selectedAssets.some((a) => a.status === 'updated');
  const selectedHasNonDraft = selectedAssets.some((a) => a.status !== 'draft' && a.status !== 'removed');
  const hasSelection = selectedIds.size > 0;

  // Submit for Approval: disabled when no draft assets exist, or when selection includes non-draft assets
  const submitDisabled = !hasDraftAssets || (hasSelection && selectedHasNonDraft);
  const showSubmitTooltip = hasSelection && selectedHasNonDraft;

  // Change Status: disabled when any selected asset is draft, updated, or removed
  const selectedHasRemoved = selectedAssets.some((a) => a.status === 'removed');
  const changeStatusDisabled = selectedHasDraft || selectedHasUpdated || selectedHasRemoved;
  const changeStatusTooltip = selectedHasUpdated
    ? 'Please apply asset changes below before updating the statuses of these assets.'
    : selectedHasRemoved
      ? "Unable to change status of 'Removed' assets."
      : selectedHasDraft
        ? "Unable to change status of 'Draft' assets."
        : '';

  // Derive the value to display in the Change Status selector
  const selectedNonDraftAssets = selectedAssets.filter((a) => a.status !== 'draft' && a.status !== 'removed');
  const selectorDisplayStatus: AssetStatus | 'mixed' | null = (() => {
    if (!hasSelection || selectedNonDraftAssets.length === 0) return null;
    const statuses = new Set(selectedNonDraftAssets.map((a) => a.status));
    return statuses.size === 1 ? ([...statuses][0] as AssetStatus) : 'mixed';
  })();

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const dynamicTabs = TAB_ORDER
    .filter((status) => nonApprovedAssets.some((a) => a.status === status))
    .map((status) => ({
      status,
      label: STATUS_TAB_LABELS[status],
      count: nonApprovedAssets.filter((a) => a.status === status).length,
    }));

  useEffect(() => {
    if (activeTab !== 'all' && !nonApprovedAssets.some((a) => a.status === activeTab)) {
      const fallback = TAB_ORDER.find((s) => nonApprovedAssets.some((a) => a.status === s)) ?? 'all';
      setActiveTab(fallback);
    }
  }, [activeTab, assets]);

  const filteredAssets = nonApprovedAssets
    .filter((a) => activeTab === 'all' || a.status === activeTab)
    .filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));

  const handleChangeStatus = (status: AssetStatus) => {
    let targetIds: Set<string>;
    if (hasSelection) {
      targetIds = new Set(selectedNonDraftAssets.map((a) => a.id));
    } else {
      targetIds = new Set(filteredAssets.filter((a) => a.status !== 'draft' && a.status !== 'updated' && a.status !== 'removed').map((a) => a.id));
    }
    if (targetIds.size > 0) {
      bulkSetAssetStatus(targetIds, status);
      if (status === 'approved') {
        showSnackbar({
          message: 'Approved assets moved to Approved task.',
          action: { label: 'See Approved', onClick: () => navigate('/approved') },
        });
      }
    }
    setSelectedIds(new Set());
  };

  const handleSubmitForApproval = () => {
    let targetAssets = hasSelection
      ? nonApprovedAssets.filter((a) => selectedIds.has(a.id) && a.status === 'draft')
      : assets.filter((a) => a.status === 'draft');

    if (targetAssets.length === 0) return;

    const targetIds = new Set(targetAssets.map((a) => a.id));
    closeAdvancedGeneration();
    addSubmittingIds(targetIds);
    setSelectedIds(new Set());

    startProgress(targetAssets.map((a) => ({
      id: a.id,
      name: a.name,
      thumbnailUrl: a.backgroundUrl || a.thumbnailUrl,
    })));

    setTimeout(() => {
      bulkSetAssetStatus(targetIds, 'awaiting_approval');
      clearSubmittingIds();
    }, 3000);
  };

  return (
    <>
    <div className="flex flex-col h-full" style={{ background: '#f0f2f4' }}>
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden" style={{ background: '#ffffff', margin: 8, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>

      <PageHeader
        breadcrumbs={['Projects', 'May Offers - Specials', 'Review']}
        title="Review"
        rightExtras={
          <>
            {filteredAssets.length > 0 && (
              <button
                onClick={() => setSelectedIds(new Set(filteredAssets.map((a) => a.id)))}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '1px 5px',
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: 'Roboto, sans-serif',
                  color: '#473bab',
                  letterSpacing: '0.46px',
                  lineHeight: '22px',
                  textTransform: 'capitalize',
                  borderRadius: 100,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                Select All
              </button>
            )}
            <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px', lineHeight: 1.66, whiteSpace: 'nowrap' }}>
              {filteredAssets.length} Items
            </span>
            <IconButton size="small" sx={{ padding: '5px' }}>
              <ViewModule style={{ fontSize: 20, color: '#686576' }} />
            </IconButton>
          </>
        }
      >
        {/* Filter icon */}
        <IconButton size="small" sx={{ padding: '5px', flexShrink: 0 }}>
          <FilterList style={{ fontSize: 20, color: '#1f1d25' }} />
        </IconButton>

        {/* Submit for Approval button */}
        <Tooltip
          title={showSubmitTooltip ? 'One or more selected assets have already been submitted for Approval' : ''}
          placement="bottom"
        >
          <span style={{ flexShrink: 0, display: 'inline-flex' }}>
            <GenerateSplitButton
              disabled={submitDisabled}
              onClick={handleSubmitForApproval}
              onAdvancedGeneration={() => {
                const sel = selectedIds.size > 0
                  ? nonApprovedAssets.filter((a) => selectedIds.has(a.id))
                  : [];
                openAdvancedGeneration(sel);
              }}
            />
          </span>
        </Tooltip>

        {/* Change Status select — visible when any non-approved asset has a non-draft status */}
        {hasNonDraftAssets && (
          <Tooltip
            title={changeStatusDisabled ? changeStatusTooltip : ''}
            placement="bottom"
          >
            <span style={{ flexShrink: 0, width: 210, display: 'inline-flex' }}>
              <FormControl size="small" sx={{ width: 210 }} disabled={changeStatusDisabled}>
                <Select
                  value=""
                  displayEmpty
                  renderValue={() => {
                    if (selectorDisplayStatus === 'mixed') {
                      return (
                        <span style={{ fontSize: 12, color: '#686576', fontFamily: 'Roboto, sans-serif', letterSpacing: '0.17px', fontStyle: 'italic' }}>
                          Mixed
                        </span>
                      );
                    }
                    if (selectorDisplayStatus) {
                      return <StatusBadge status={selectorDisplayStatus} />;
                    }
                    return (
                      <span style={{ fontSize: 12, color: '#9c99a9', fontFamily: 'Roboto, sans-serif', letterSpacing: '0.17px' }}>
                        Change Status
                      </span>
                    );
                  }}
                  onChange={(e) => {
                    const v = e.target.value as AssetStatus;
                    if (v) handleChangeStatus(v);
                  }}
                  sx={{
                    background: '#f9fafa',
                    borderRadius: '4px',
                    height: 36,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cac9cf' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#9c99a9' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(99,86,225,0.7)',
                      borderWidth: 2,
                    },
                    '& .MuiSelect-select': { py: '6px', px: '8px', display: 'flex', alignItems: 'center' },
                  }}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <MenuItem key={status} value={status} sx={{ px: 2, py: '4px' }}>
                      <StatusBadge status={status} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </span>
          </Tooltip>
        )}

        {/* Three-dots */}
        <IconButton size="small" sx={{ padding: '5px', flexShrink: 0 }}>
          <MoreVert style={{ fontSize: 20, color: '#1f1d25' }} />
        </IconButton>

        {/* Search */}
        <TextField
          size="small"
          placeholder="Find below"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: { startAdornment: <Search style={{ fontSize: 20, color: '#9c99a9', marginRight: 6, flexShrink: 0 }} /> },
          }}
          sx={{
            minWidth: 160,
            maxWidth: 211,
            flex: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: '20px',
              background: '#f9fafa',
              height: 34,
              '& fieldset': { borderColor: '#cac9cf' },
              '&:hover fieldset': { borderColor: '#9c99a9' },
            },
            '& .MuiOutlinedInput-input': {
              fontSize: 14, color: '#9c99a9', letterSpacing: '0.15px',
              padding: '6px 8px 6px 0',
              '&::placeholder': { color: '#9c99a9', opacity: 1 },
            },
          }}
        />
      </PageHeader>

      {/* ── Pending Changes Banner ────────────────────────────── */}
      {hasPendingChanges && (
        <div style={{
          background: '#fff4e5',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          margin: '0px 16px'
        }}>
          <WarningAmber style={{ fontSize: 18, color: '#c45500', flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#663c00', letterSpacing: '0.17px', lineHeight: 1.5 }}>
            Project changes affected the assets below. Apply and approve changes to update Ad Shells and Campaigns.
          </span>
          <button
            onClick={() => setApplyDialogOpen(true)}
            style={{
              background: '#473bab', color: 'white', border: 'none',
              borderRadius: 100, padding: '4px 10px', fontSize: 13,
              fontFamily: 'Roboto, sans-serif', fontWeight: 500, letterSpacing: '0.46px',
              lineHeight: '22px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            }}>
            Apply Changes
          </button>
          <button
            onClick={() => setRevertDialogOpen(true)}
            style={{
              background: 'transparent', color: '#d2323f',
              border: '1px solid rgba(210,50,63,0.5)',
              borderRadius: 100, padding: '4px 10px', fontSize: 13,
              fontFamily: 'Roboto, sans-serif', fontWeight: 500, letterSpacing: '0.46px',
              lineHeight: '22px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            }}>
            Revert Changes
          </button>
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <div style={{ margin: '0px 16px',flexShrink: 0, background: '#ffffff', borderBottom: '1px solid #e0e0e0', display: 'flex' }}>
        {([...dynamicTabs, { status: 'all' as const, label: 'All', count: nonApprovedAssets.length }]).map(({ status, label, count }) => {
          const isActive = activeTab === status;
          return (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              style={{
                padding: '16px 16px',
                border: 'none',
                borderBottom: isActive ? '2px solid #473bab' : '2px solid transparent',
                marginBottom: '-1px',
                background: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontFamily: 'Roboto, sans-serif',
                fontWeight: 500,
                color: isActive ? '#473bab' : '#686576',
                letterSpacing: '0.4px',
                lineHeight: '24px',
                whiteSpace: 'nowrap',
              }}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* ── Asset Grid / Empty State ───────────────────────────── */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {filteredAssets.length === 0 ? (
          <EmptyStateMessage
            message={[
              'All assets have been approved and moved to Approved task.',
              'No new assets pending generation or approval.',
            ]}
          />
        ) : (
          <div className="p-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {filteredAssets.map((asset) =>
              submittingIds.has(asset.id) ? (
                <AssetCardSkeleton key={asset.id} />
              ) : (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  selected={selectedIds.has(asset.id)}
                  draftVariant={draftVariant}
                  onSelect={handleSelect}
                />
              )
            )}
          </div>
        )}
      </div>

      <TaskFooter currentTask="review" />
    </div>
    </div>

    {applyDialogOpen && (
      <ApplyChangesDialog
        updatedCount={updatedAssets.length}
        removedCount={removedAssets.length}
        approvedRemovedCount={approvedRemovedCount}
        adsUpdatedShellCount={adsUpdatedShellCount}
        campaignLoaded={campaignLoaded}
        onClose={() => setApplyDialogOpen(false)}
        onApply={() => { applyChanges(); setApplyDialogOpen(false); showSnackbar({ message: 'Changes applied.' }); }}
      />
    )}
    {revertDialogOpen && (
      <RevertChangesDialog
        pendingChanges={pendingChanges}
        pendingRemovals={pendingRemovals}
        offers={offers}
        onClose={() => setRevertDialogOpen(false)}
        onRevert={(offerIds) => { revertChanges(offerIds); showSnackbar({ message: 'Changes reverted.' }); }}
        onRevertRemovals={(itemIds) => { revertRemovals(itemIds); showSnackbar({ message: 'Changes reverted.' }); }}
      />
    )}
    </>
  );
};
