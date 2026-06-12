import { useState, useMemo } from 'react';
import noFilterResultsSrc from '../assets/no-filter-results.svg';
import { useNavigate } from 'react-router-dom';
import { IconButton, TextField } from '@mui/material';
import {
  Search, MoreVert, ViewModule, FilterList, WarningAmber,
  Close, IosShareOutlined, BuildOutlined, EditOutlined,
  CropFreeOutlined, AutoAwesomeOutlined, DeleteOutlined,
  AssignmentReturnOutlined,
} from '@mui/icons-material';
import { Tooltip } from '../components/ui/Tooltip';
import { PageHeader } from '../components/ui/PageHeader';
import { TaskFooter } from '../components/ui/TaskFooter';
import { AssetCard } from '../components/ui/AssetCard';
import { EmptyStateMessage } from '../components/ui/EmptyStateMessage';
import { useProject } from '../context/ProjectContext';
import { useLayout } from '../context/LayoutContext';
import { applyAssetFilters, hasActiveFilters } from '../utils/assetFilters';
import { AddDestinationUrlsDialog } from '../components/ui/AddDestinationUrlsDialog';

const EMPTY_ASSETS: never[] = [];

export const ApprovedPage = () => {
  const { assets, bulkSetAssetStatus } = useProject();
  const { filterPanelOpen, openFilterPanel, closeFilterPanel, filterState } = useLayout();
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [addUrlsDialogOpen, setAddUrlsDialogOpen] = useState(false);

  const approvedAssets = assets.filter((a) => a.status === 'approved');
  const updatedAssets = assets.filter((a) => a.status === 'updated');
  const filteredAssets = useMemo(() => {
    const searched = approvedAssets.filter((a) =>
      a.name.toLowerCase().includes(search.toLowerCase())
    );
    return applyAssetFilters(searched, filterState);
  }, [approvedAssets, search, filterState]);

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleSendBackToReview = (id: string) => {
    bulkSetAssetStatus(new Set([id]), 'awaiting_approval');
    navigate('/review');
  };

  const handleBulkSendBackToReview = () => {
    if (selectedIds.size === 0) return;
    bulkSetAssetStatus(selectedIds, 'awaiting_approval');
    setSelectedIds(new Set());
    navigate('/review');
  };

  const hasSelection = selectedIds.size > 0;

  const selectedHtmlAssets = useMemo(() =>
    hasSelection ? Array.from(selectedIds).map(id => assets.find(a => a.id === id)).filter((a): a is NonNullable<typeof a> => !!a && a.imageType === 'HTML') : EMPTY_ASSETS,
  [selectedIds, assets, hasSelection]);

  const selectedHasNonHtml = useMemo(() =>
    hasSelection && Array.from(selectedIds).some(id => {
      const asset = assets.find(a => a.id === id);
      return asset && asset.imageType !== 'HTML';
    }),
  [selectedIds, assets, hasSelection]);

  const selectedHtmlTemplateIds = useMemo(() =>
    [...new Set(selectedHtmlAssets.map(a => a.templateId))],
  [selectedHtmlAssets]);

  return (
    <>
    <div className="flex flex-col h-full" style={{ background: '#f0f2f4' }}>
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden" style={{ background: '#ffffff', margin: 8, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>

      <PageHeader
        breadcrumbs={['Projects', 'May Offers - Specials', 'Approved']}
        title="Approved"
        rightExtras={
          !hasSelection ? (
            <>
              {filteredAssets.length > 0 && (
                <button
                  onClick={() => setSelectedIds(new Set(filteredAssets.map((a) => a.id)))}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '1px 5px', fontSize: 13, fontWeight: 500,
                    fontFamily: 'Roboto, sans-serif', color: '#473bab',
                    letterSpacing: '0.46px', lineHeight: '22px',
                    textTransform: 'capitalize', borderRadius: 100,
                    whiteSpace: 'nowrap', flexShrink: 0,
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
          ) : undefined
        }
      >
        {hasSelection ? (
          /* ── Multi-select toolbar ─────────────────────────── */
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1}}>
            {/* Clear selection */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#F4F5F6', padding: '4px 12px', borderRadius: 100, width: 'fit-content' }}>
              <IconButton size="small" onClick={() => setSelectedIds(new Set())} sx={{ padding: '5px', flexShrink: 0 }}>
                <Close style={{ fontSize: 20, color: '#1f1d25' }} />
              </IconButton>

              <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', fontWeight: 500, letterSpacing: '0.17px', whiteSpace: 'nowrap', marginRight: 4 }}>
                {selectedIds.size} selected
              </span>

              {/* Add Destination URLs — always visible; disabled when non-HTML assets are selected */}
              <Tooltip
                title={selectedHasNonHtml ? 'Only HTML assets can have destination URLs added to them.' : ''}
                placement="bottom"
              >
                <span style={{ display: 'inline-flex', flexShrink: 0 }}>
                  <button
                    disabled={selectedHasNonHtml}
                    onClick={() => setAddUrlsDialogOpen(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'transparent', border: `1px solid ${selectedHasNonHtml ? '#cac9cf' : '#473bab'}`, borderRadius: 100, cursor: selectedHasNonHtml ? 'default' : 'pointer', flexShrink: 0, opacity: selectedHasNonHtml ? 0.5 : 1 }}
                  >
                    <svg width="16" height="16" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                      <path d="M7 13.0413C7.27614 13.0413 7.5 12.8175 7.5 12.5413C7.5 12.2652 7.27614 12.0413 7 12.0413V12.5413V13.0413ZM10.875 4.95801C10.875 5.23415 11.0989 5.45801 11.375 5.45801C11.6511 5.45801 11.875 5.23415 11.875 4.95801H11.375H10.875ZM11 9.00763C11 8.73149 10.7761 8.50763 10.5 8.50763C10.2239 8.50763 10 8.73149 10 9.00763H10.5H11ZM10 10.2416C10 10.5177 10.2239 10.7416 10.5 10.7416C10.7761 10.7416 11 10.5177 11 10.2416H10.5H10ZM7.95833 8.89551C7.95833 9.17165 8.18219 9.39551 8.45833 9.39551C8.73448 9.39551 8.95833 9.17165 8.95833 8.89551H8.45833H7.95833ZM12.0417 8.89551C12.0417 9.17165 12.2655 9.39551 12.5417 9.39551C12.8178 9.39551 13.0417 9.17165 13.0417 8.89551H12.5417H12.0417ZM8.95833 10.3538C8.95833 10.0777 8.73448 9.85384 8.45833 9.85384C8.18219 9.85384 7.95833 10.0777 7.95833 10.3538H8.45833H8.95833ZM13.0417 10.3538C13.0417 10.0777 12.8178 9.85384 12.5417 9.85384C12.2655 9.85384 12.0417 10.0777 12.0417 10.3538H12.5417H13.0417ZM4.95833 3.29134C4.68219 3.29134 4.45833 3.5152 4.45833 3.79134C4.45833 4.06748 4.68219 4.29134 4.95833 4.29134V3.79134V3.29134ZM9.04167 4.29134C9.31781 4.29134 9.54167 4.06748 9.54167 3.79134C9.54167 3.5152 9.31781 3.29134 9.04167 3.29134V3.79134V4.29134ZM4.95833 5.62467C4.68219 5.62467 4.45833 5.84853 4.45833 6.12467C4.45833 6.40082 4.68219 6.62467 4.95833 6.62467V6.12467V5.62467ZM6.70833 6.62467C6.98448 6.62467 7.20833 6.40082 7.20833 6.12467C7.20833 5.84853 6.98448 5.62467 6.70833 5.62467V6.12467V6.62467ZM2.625 11.958H3.125V2.04134H2.625H2.125V11.958H2.625ZM3.20833 1.45801V1.95801H10.7917V1.45801V0.958008H3.20833V1.45801ZM7 12.5413V12.0413H3.20833V12.5413V13.0413H7V12.5413ZM11.375 2.04134H10.875V4.95801H11.375H11.875V2.04134H11.375ZM10.7917 1.45801V1.95801C10.8377 1.95801 10.875 1.99532 10.875 2.04134H11.375H11.875C11.875 1.44303 11.39 0.958008 10.7917 0.958008V1.45801ZM2.625 2.04134H3.125C3.125 1.99532 3.16231 1.95801 3.20833 1.95801V1.45801V0.958008C2.61003 0.958008 2.125 1.44303 2.125 2.04134H2.625ZM2.625 11.958H2.125C2.125 12.5563 2.61002 13.0413 3.20833 13.0413V12.5413V12.0413C3.16231 12.0413 3.125 12.004 3.125 11.958H2.625ZM8.45833 8.68231H8.95833C8.95833 7.83087 9.64856 7.14065 10.5 7.14065V6.64065V6.14065C9.09628 6.14065 7.95833 7.27859 7.95833 8.68231H8.45833ZM10.5 6.64065V7.14065C11.3514 7.14065 12.0417 7.83087 12.0417 8.68231H12.5417H13.0417C13.0417 7.27859 11.9037 6.14065 10.5 6.14065V6.64065ZM8.45833 10.5669H7.95833C7.95833 11.9707 9.09628 13.1086 10.5 13.1086V12.6086V12.1086C9.64856 12.1086 8.95833 11.4184 8.95833 10.5669H8.45833ZM10.5 12.6086V13.1086C11.9037 13.1086 13.0417 11.9707 13.0417 10.5669H12.5417H12.0417C12.0417 11.4184 11.3514 12.1086 10.5 12.1086V12.6086ZM10.5 9.00763H10V10.2416H10.5H11V9.00763H10.5ZM8.45833 8.68231H7.95833V8.89551H8.45833H8.95833V8.68231H8.45833ZM12.5417 8.68231H12.0417V8.89551H12.5417H13.0417V8.68231H12.5417ZM8.45833 10.5669H8.95833V10.3538H8.45833H7.95833V10.5669H8.45833ZM12.5417 10.5669H13.0417V10.3538H12.5417H12.0417V10.5669H12.5417ZM4.95833 3.79134V4.29134H9.04167V3.79134V3.29134H4.95833V3.79134ZM4.95833 6.12467V6.62467H6.70833V6.12467V5.62467H4.95833V6.12467Z" fill={selectedHasNonHtml ? '#cac9cf' : '#473bab'}/>
                    </svg>
                    <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: selectedHasNonHtml ? '#cac9cf' : '#473bab', fontWeight: 500, letterSpacing: '0.46px' }}>Add Destination URLs</span>
                  </button>
                </span>
              </Tooltip>

              {/* Send back to Review */}
              <button
                onClick={handleBulkSendBackToReview}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'transparent', border: '1px solid #473bab', borderRadius: 100, cursor: 'pointer', flexShrink: 0 }}
              >
                <AssignmentReturnOutlined style={{ fontSize: 16, color: '#473bab' }} />
                <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#473bab', fontWeight: 500, letterSpacing: '0.46px' }}>Send back to Review</span>
              </button>

              {/* Export */}
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'transparent', border: '1px solid #473bab', borderRadius: 100, cursor: 'pointer', flexShrink: 0 }}>
                <IosShareOutlined style={{ fontSize: 16, color: '#473bab' }} />
                <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#473bab', fontWeight: 500, letterSpacing: '0.46px' }}>Export</span>
              </button>

              {/* Actions */}
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'transparent', border: '1px solid #473bab', borderRadius: 100, cursor: 'pointer', flexShrink: 0 }}>
                <BuildOutlined style={{ fontSize: 16, color: '#473bab' }} />
                <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#473bab', fontWeight: 500, letterSpacing: '0.46px' }}>Actions</span>
              </button>

              {/* Icon-only actions */}
              <IconButton size="small" sx={{ padding: '5px', flexShrink: 0 }}>
                <EditOutlined style={{ fontSize: 20, color: '#686576' }} />
              </IconButton>
              <IconButton size="small" sx={{ padding: '5px', flexShrink: 0 }}>
                <CropFreeOutlined style={{ fontSize: 20, color: '#686576' }} />
              </IconButton>
              <IconButton size="small" sx={{ padding: '5px', flexShrink: 0 }}>
                <AutoAwesomeOutlined style={{ fontSize: 20, color: '#686576' }} />
              </IconButton>
              <IconButton size="small" sx={{ padding: '5px', flexShrink: 0 }}>
                <DeleteOutlined style={{ fontSize: 20, color: '#686576' }} />
              </IconButton>
            </div>
          </div>
        ) : (
          <>
            {/* Filter icon */}
            <IconButton
              size="small"
              onClick={() => filterPanelOpen ? closeFilterPanel() : openFilterPanel()}
              sx={{
                padding: '5px',
                flexShrink: 0,
                background: filterPanelOpen || hasActiveFilters(filterState) ? '#f0eeff' : 'transparent',
                color: filterPanelOpen || hasActiveFilters(filterState) ? '#473bab' : '#1f1d25',
                '&:hover': { background: '#f0eeff', color: '#473bab' },
              }}
            >
              <FilterList style={{ fontSize: 20 }} />
            </IconButton>

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
          </>
        )}
      </PageHeader>

      {/* ── Pending Changes Banner ────────────────────────────── */}
      {updatedAssets.length > 0 && (
        <div style={{
          background: '#fff4e5',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          margin: '0 16px',
        }}>
          <WarningAmber style={{ fontSize: 18, color: '#c45500', flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#663c00', letterSpacing: '0.17px', lineHeight: 1.5 }}>
            Project changes affected Assets and they were removed from the Approved step. Apply and approve changes on Review step.
          </span>
          <button
            onClick={() => navigate('/review')}
            style={{
              background: 'transparent', color: '#663c00', border: 'none',
              padding: '4px 0', fontSize: 13,
              fontFamily: 'Roboto, sans-serif', fontWeight: 500, letterSpacing: '0.46px',
              lineHeight: '22px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            Go to Review step
          </button>
        </div>
      )}

      {/* ── Asset Grid / Empty State ───────────────────────────── */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {filteredAssets.length === 0 ? (
          (search.trim().length > 0 || hasActiveFilters(filterState)) ? (
            <EmptyStateMessage
              illustration={noFilterResultsSrc}
              message="No matches. Clear filters or search."
            />
          ) : (
            <EmptyStateMessage
              message="No asset approved yet. Go to Review to approve assets."
              actionLabel="Go to Review"
              onAction={() => navigate('/review')}
            />
          )
        ) : (
          <div className="p-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {filteredAssets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                selected={selectedIds.has(asset.id)}
                onSelect={handleSelect}
                onSendBackToReview={handleSendBackToReview}
              />
            ))}
          </div>
        )}
      </div>

      <TaskFooter currentTask="approved" />
    </div>
    </div>

    <AddDestinationUrlsDialog
      open={addUrlsDialogOpen}
      onClose={() => setAddUrlsDialogOpen(false)}
      allAssets={selectedHtmlAssets}
      selectedTemplateIds={selectedHtmlTemplateIds}
    />
    </>
  );
};
