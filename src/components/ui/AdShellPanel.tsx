import { useState } from 'react';
import ReactDOM from 'react-dom';
import {
  Close, Add, KeyboardArrowUp, KeyboardArrowDown,
  ArticleOutlined, DeleteOutlined,
} from '@mui/icons-material';
import { Checkbox, IconButton, MenuItem, Select, Tooltip } from '@mui/material';
import type { AdShell } from './AdShellCard';
import { AssetHorizontalCard } from './AssetHorizontalCard';
import { fieldInputStyle } from './AssetHorizontalCard';
import { useLayout } from '../../context/LayoutContext';
import type { Asset } from '../../data/types';

interface AdShellPanelProps {
  shell: AdShell;
  onClose: () => void;
  width?: number;
}

const DISPLAY_ORDER_OPTIONS = ['Display First', 'Display Last'];
const AD_TYPE_OPTIONS = ['Grid', 'Carousel'];

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 500,
  color: '#686576', letterSpacing: '0.4px', lineHeight: 1.66, marginBottom: 3,
};

const inputStyle: React.CSSProperties = {
  width: '100%', height: 36, padding: '6px 8px',
  fontSize: 12, fontFamily: 'Roboto, sans-serif',
  color: '#1f1d25', letterSpacing: '0.17px', lineHeight: 1.43,
  background: '#ffffff', border: '1px solid #cac9cf',
  borderRadius: 4, outline: 'none', boxSizing: 'border-box',
};

const readOnlyInputStyle: React.CSSProperties = {
  ...inputStyle, background: '#f0f2f4', color: '#9c99a9', cursor: 'default',
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0, fontSize: 13, fontFamily: 'Roboto, sans-serif',
  fontWeight: 500, color: '#1f1d25', letterSpacing: '0.17px', lineHeight: 1.43,
};

// ── Per-asset lead form state ──────────────────────────────────────────────────

interface LeadFormState { enabled: boolean; cta: string; }

// ── Enable Lead Form dialog ───────────────────────────────────────────────────

interface EnableLeadFormDialogProps {
  ctaValue: string;
  onCtaChange: (v: string) => void;
  onCancel: () => void;
  onEnable: () => void;
}

function EnableLeadFormDialog({ ctaValue, onCtaChange, onCancel, onEnable }: EnableLeadFormDialogProps) {
  return ReactDOM.createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: 'fixed', inset: 0, zIndex: 200000,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {/* Dialog */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#ffffff',
            borderRadius: 24,
            width: 432,
            boxShadow: '0px 8px 10px -5px rgba(0,0,0,0.2), 0px 16px 24px 2px rgba(0,0,0,0.14), 0px 6px 30px 5px rgba(0,0,0,0.12)',
            overflow: 'hidden',
          }}
        >
          {/* Title */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 8px' }}>
            <span style={{ fontSize: 20, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.15px', lineHeight: 1.6 }}>
              Enable Lead Form
            </span>
            <button
              onClick={onCancel}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, display: 'flex', borderRadius: '50%' }}
            >
              <Close style={{ fontSize: 20, color: '#686576' }} />
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: '8px 16px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Lead Form CTA field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2, paddingLeft: 4 }}>
                <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#d2323f', lineHeight: '12px' }}>*</span>
                <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#686576', letterSpacing: '0.15px', lineHeight: '12px' }}>
                  Lead Form CTA
                </span>
              </div>
              <input
                type="text"
                value={ctaValue}
                onChange={(e) => onCtaChange(e.target.value)}
                autoFocus
                style={fieldInputStyle}
              />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '0 16px 16px' }}>
            <button
              onClick={onCancel}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#473bab', letterSpacing: '0.4px', lineHeight: '24px', borderRadius: 100 }}
            >
              Cancel
            </button>
            <button
              onClick={onEnable}
              style={{ background: '#473bab', border: 'none', cursor: 'pointer', padding: '6px 16px', fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#ffffff', letterSpacing: '0.4px', lineHeight: '24px', borderRadius: 100 }}
            >
              Enable
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export const AdShellPanel = ({ shell, onClose, width = 320 }: AdShellPanelProps) => {
  const { updateAdShell } = useLayout();

  // Shell settings
  const [name,           setName]           = useState(shell.name);
  const [folder,         setFolder]         = useState(shell.folder ?? '');
  const [displayOrder,   setDisplayOrder]   = useState(shell.displayOrder ?? DISPLAY_ORDER_OPTIONS[0]);
  const [adType,         setAdType]         = useState(shell.adType === 'Carousel' ? 'Carousel' : 'Grid');
  const [autoTransition, setAutoTransition] = useState(shell.autoTransition ?? false);
  const [displayTime,    setDisplayTime]    = useState(shell.displayTime ?? '5');
  const [transitionTime, setTransitionTime] = useState(shell.transitionTime ?? '1');

  // Asset list (local copy so we can reorder/remove without mutating shell)
  const [assetList, setAssetList] = useState<Asset[]>([...shell.assets]);

  // Multi-select
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Per-asset lead form settings (lifted from cards)
  const [leadFormMap, setLeadFormMap] = useState<Record<string, LeadFormState>>(
    () => Object.fromEntries(shell.assets.map((a) => [a.id, { enabled: false, cta: 'Claim Offer' }]))
  );

  // Enable Lead Form dialog
  const [leadFormDialogOpen, setLeadFormDialogOpen] = useState(false);
  const [dialogCta, setDialogCta] = useState('Claim Offer');

  const isCarousel   = adType === 'Carousel';
  const hasSelection = selectedIds.size > 0;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const moveItems = (direction: 'up' | 'down') => {
    setAssetList((prev) => {
      const next = [...prev];
      const indices = next
        .map((a, i) => (selectedIds.has(a.id) ? i : -1))
        .filter((i) => i >= 0);

      if (direction === 'up') {
        for (const i of indices) {
          if (i > 0 && !selectedIds.has(next[i - 1].id)) {
            [next[i - 1], next[i]] = [next[i], next[i - 1]];
          }
        }
      } else {
        for (const i of [...indices].reverse()) {
          if (i < next.length - 1 && !selectedIds.has(next[i + 1].id)) {
            [next[i], next[i + 1]] = [next[i + 1], next[i]];
          }
        }
      }
      return next;
    });
  };

  const handleOpenLeadFormDialog = () => {
    // Pre-fill dialog CTA from first selected asset that has a CTA set, or default
    const firstSelected = Array.from(selectedIds)[0];
    const existing = firstSelected ? leadFormMap[firstSelected]?.cta : undefined;
    setDialogCta(existing ?? 'Claim Offer');
    setLeadFormDialogOpen(true);
  };

  const handleEnableLeadForm = () => {
    setLeadFormMap((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => {
        next[id] = { enabled: true, cta: dialogCta };
      });
      return next;
    });
    setLeadFormDialogOpen(false);
  };

  const handleRemoveSelected = () => {
    setAssetList((prev) => prev.filter((a) => !selectedIds.has(a.id)));
    setSelectedIds(new Set());
  };

  const handleSave = () => {
    updateAdShell(shell.id, {
      name, folder, adType, displayOrder,
      autoTransition, displayTime, transitionTime,
    });
    onClose();
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div
        className="flex flex-col shrink-0 overflow-hidden"
        style={{
          width, background: '#ffffff', borderRadius: 8,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          margin: '8px 8px 8px 0', flexShrink: 0,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.12)', flexShrink: 0 }}>
          <p style={{ margin: 0, fontSize: 16, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.15px', lineHeight: '24px' }}>
            Edit Ad Shell
          </p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <Close style={{ fontSize: 20, color: '#686576' }} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Ad Shell Name */}
          <div>
            <p style={labelStyle}>Ad Shell Name</p>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          </div>

          {/* Destination Folder */}
          <div>
            <p style={labelStyle}>Destination Folder</p>
            <input type="text" value={folder} onChange={(e) => setFolder(e.target.value)} style={inputStyle} />
          </div>

          {/* Platform Settings */}
          <div>
            <p style={sectionTitleStyle}>Platform Settings</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>

              <div>
                <p style={labelStyle}>Platform</p>
                <input type="text" value="Website" readOnly style={readOnlyInputStyle} />
              </div>

              <div>
                <p style={labelStyle}>Display Order</p>
                <Select
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                  size="small" variant="outlined" fullWidth
                  sx={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', letterSpacing: '0.17px', color: '#1f1d25', height: 36, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cac9cf' }, '& .MuiSelect-select': { padding: '6px 8px', fontSize: 12 } }}
                >
                  {DISPLAY_ORDER_OPTIONS.map((opt) => (
                    <MenuItem key={opt} value={opt} sx={{ fontSize: 12 }}>{opt}</MenuItem>
                  ))}
                </Select>
              </div>

              <div>
                <p style={labelStyle}>Type</p>
                <Select
                  value={adType}
                  onChange={(e) => setAdType(e.target.value)}
                  size="small" variant="outlined" fullWidth
                  sx={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', letterSpacing: '0.17px', color: '#1f1d25', height: 36, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cac9cf' }, '& .MuiSelect-select': { padding: '6px 8px', fontSize: 12 } }}
                >
                  {AD_TYPE_OPTIONS.map((opt) => (
                    <MenuItem key={opt} value={opt} sx={{ fontSize: 12 }}>{opt}</MenuItem>
                  ))}
                </Select>
              </div>

              {isCarousel && (
                <>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => setAutoTransition((v) => !v)}
                  >
                    <Checkbox
                      checked={autoTransition}
                      size="small"
                      sx={{ padding: '2px', '&.Mui-checked': { color: '#473bab' }, '& .MuiSvgIcon-root': { fontSize: 18 } }}
                    />
                    <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#1f1d25', letterSpacing: '0.17px', lineHeight: 1.43 }}>
                      Auto transition
                    </span>
                  </div>

                  {autoTransition && (
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <p style={labelStyle}>Display Time (s)</p>
                        <input type="number" min={1} value={displayTime} onChange={(e) => setDisplayTime(e.target.value)} style={inputStyle} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={labelStyle}>Transition Time (s)</p>
                        <input type="number" min={1} value={transitionTime} onChange={(e) => setTransitionTime(e.target.value)} style={inputStyle} />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Assets section ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: hasSelection ? 6 : 12 }}>
              <p style={sectionTitleStyle}>Assets</p>
              <button
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', color: '#473bab', border: '1px solid rgba(99,86,225,0.5)', borderRadius: 100, padding: '3px 10px', fontSize: 13, fontWeight: 500, fontFamily: 'Roboto, sans-serif', letterSpacing: '0.46px', lineHeight: '22px', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                <Add style={{ fontSize: 16, color: '#473bab' }} />
                Add Asset
              </button>
            </div>

            {/* ── Multi-select toolbar ── */}
            {hasSelection && (
              <div
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 8px', marginBottom: 8,
                  background: '#F4F5F6',
                  borderRadius: 100,
                }}
              >
                {/* Left: X + count */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <IconButton size="small" onClick={clearSelection} sx={{ padding: '4px' }}>
                    <Close style={{ fontSize: 16, color: '#686576' }} />
                  </IconButton>
                  <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#1f1d25', letterSpacing: '0.17px', whiteSpace: 'nowrap' }}>
                    {selectedIds.size} selected
                  </span>
                </div>

                {/* Right: action icon buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                  <Tooltip title="Move up" placement="top" arrow>
                    <IconButton size="small" onClick={() => moveItems('up')} sx={{ padding: '4px' }}>
                      <KeyboardArrowUp style={{ fontSize: 18, color: '#686576' }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Move down" placement="top" arrow>
                    <IconButton size="small" onClick={() => moveItems('down')} sx={{ padding: '4px' }}>
                      <KeyboardArrowDown style={{ fontSize: 18, color: '#686576' }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Enable Lead Form" placement="top" arrow>
                    <IconButton size="small" onClick={handleOpenLeadFormDialog} sx={{ padding: '4px' }}>
                      <ArticleOutlined style={{ fontSize: 18, color: '#686576' }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Remove" placement="top" arrow>
                    <IconButton size="small" onClick={handleRemoveSelected} sx={{ padding: '4px' }}>
                      <DeleteOutlined style={{ fontSize: 18, color: '#686576' }} />
                    </IconButton>
                  </Tooltip>
                </div>
              </div>
            )}

            {/* Asset cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {assetList.map((asset) => (
                <AssetHorizontalCard
                  key={asset.id}
                  asset={asset}
                  selected={selectedIds.has(asset.id)}
                  onSelect={handleSelect}
                  leadFormEnabled={leadFormMap[asset.id]?.enabled ?? false}
                  leadFormCta={leadFormMap[asset.id]?.cta ?? 'Claim Offer'}
                  onLeadFormEnabledChange={(enabled) =>
                    setLeadFormMap((prev) => ({ ...prev, [asset.id]: { ...prev[asset.id], enabled } }))
                  }
                  onLeadFormCtaChange={(cta) =>
                    setLeadFormMap((prev) => ({ ...prev, [asset.id]: { ...prev[asset.id], cta } }))
                  }
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '12px 16px', borderTop: '1px solid rgba(0,0,0,0.12)', flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{ background: 'transparent', color: '#473bab', border: '1px solid rgba(99,86,225,0.5)', borderRadius: 100, padding: '5px 16px', fontSize: 13, fontWeight: 500, fontFamily: 'Roboto, sans-serif', letterSpacing: '0.46px', lineHeight: '22px', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Close
          </button>
          <button
            onClick={handleSave}
            style={{ background: '#473bab', color: '#ffffff', border: 'none', borderRadius: 100, padding: '5px 16px', fontSize: 13, fontWeight: 500, fontFamily: 'Roboto, sans-serif', letterSpacing: '0.46px', lineHeight: '22px', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Save
          </button>
        </div>
      </div>

      {/* Enable Lead Form dialog (portal) */}
      {leadFormDialogOpen && (
        <EnableLeadFormDialog
          ctaValue={dialogCta}
          onCtaChange={setDialogCta}
          onCancel={() => setLeadFormDialogOpen(false)}
          onEnable={handleEnableLeadForm}
        />
      )}
    </>
  );
};
