import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton, TextField } from '@mui/material';
import { Search, MoreVert, ViewModule, FilterList, WarningAmber } from '@mui/icons-material';
import { PageHeader } from '../components/ui/PageHeader';
import { TaskFooter } from '../components/ui/TaskFooter';
import { AssetCard } from '../components/ui/AssetCard';
import { EmptyStateMessage } from '../components/ui/EmptyStateMessage';
import { useProject } from '../context/ProjectContext';

export const ApprovedPage = () => {
  const { assets } = useProject();
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const approvedAssets = assets.filter((a) => a.status === 'approved');
  const updatedAssets = assets.filter((a) => a.status === 'updated');
  const filteredAssets = approvedAssets.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full" style={{ background: '#f0f2f4' }}>
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden" style={{ background: '#ffffff', margin: 8, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>

      <PageHeader
        breadcrumbs={['Projects', 'May Offers - Specials', 'Approved']}
        title="Approved"
        rightExtras={
          <>
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
      {updatedAssets.length > 0 && (
        <div style={{
          background: '#fff4e5',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
          borderBottom: '1px solid rgba(0,0,0,0.06)',
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
          <EmptyStateMessage
            message="No asset approved yet. Go to Review to approve assets."
            actionLabel="Go to Review"
            onAction={() => navigate('/review')}
          />
        ) : (
          <div className="p-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {filteredAssets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                selected={selectedIds.has(asset.id)}
                onSelect={handleSelect}
              />
            ))}
          </div>
        )}
      </div>

      <TaskFooter currentTask="approved" />
    </div>
    </div>
  );
};
