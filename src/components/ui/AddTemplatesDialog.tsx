import { useState } from 'react';
import { Checkbox } from '@mui/material';
import {
  Search,
  Close,
  Add,
  FolderOutlined,
  Refresh,
  GridViewOutlined,
  InfoOutlined,
  ShoppingCartOutlined,
} from '@mui/icons-material';
import { useTestWidget } from '../../context/TestWidgetContext';
import { TEMPLATE_REGISTRY } from '../../templates';
import type { Template } from '../../data/types';

// ── Badge pill helper ─────────────────────────────────────────────────────────

function BadgePill({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{
      fontSize: 10, fontFamily: 'Roboto, sans-serif', fontWeight: 500,
      color, background: bg,
      borderRadius: 100, padding: '1px 6px', whiteSpace: 'nowrap', lineHeight: '15px',
    }}>
      {label}
    </span>
  );
}

// ── Dialog template card ──────────────────────────────────────────────────────

function DialogTemplateCard({
  template,
  selected,
  alreadyAdded,
  onSelect,
}: {
  template: Template;
  selected: boolean;
  alreadyAdded: boolean;
  onSelect: (id: string, checked: boolean) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [checkboxHovered, setCheckboxHovered] = useState(false);

  const isWide = template.width >= template.height;
  const previewWidth = isWide ? '100%' : `${(template.width / template.height) * 100}%`;
  const previewHeight = isWide ? `${(template.height / template.width) * 100}%` : '100%';

  const PreviewComponent = TEMPLATE_REGISTRY[template.id]?.Preview;

  const handleClick = () => {
    if (!alreadyAdded) onSelect(template.id, !selected);
  };

  const cardBorder = selected
    ? '2px solid #473bab'
    : hovered && !alreadyAdded
      ? '1.5px solid #473bab'
      : '1px solid #e0e0e0';

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: 'flex', flexDirection: 'column', cursor: alreadyAdded ? 'default' : 'pointer' }}
    >
      {/* Preview area */}
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1 / 1',
        background: '#f6f7f8',
        border: cardBorder,
        borderRadius: 8,
        overflow: 'hidden',
        transition: 'border 0.12s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Template preview — centered, letterboxed */}
        <div style={{ width: previewWidth, height: previewHeight, position: 'relative', flexShrink: 0 }}>
          {PreviewComponent
            ? <PreviewComponent hovered={false} />
            : <div style={{ width: '100%', height: '100%', background: '#e8eaed' }} />
          }
        </div>

        {/* Overlaid top-left badge row */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          padding: '5px 6px 0 30px',
          display: 'flex', flexWrap: 'wrap', gap: 3, zIndex: 1, pointerEvents: 'none',
        }}>
          <BadgePill label="2 Components" bg="rgba(245,245,245,0.92)" color="#616161" />
          <BadgePill label="Lease" bg="rgba(232,244,253,0.92)" color="#1565c0" />
          <BadgePill label="APR" bg="rgba(232,244,253,0.92)" color="#1565c0" />
        </div>

        {/* Second badge row */}
        <div style={{
          position: 'absolute', top: 21, left: 30, right: 0,
          padding: '0 6px', zIndex: 1, pointerEvents: 'none',
        }}>
          <BadgePill label="3 Compatible Entries" bg="rgba(245,245,245,0.92)" color="#9e9e9e" />
        </div>

        {/* Checkbox — top-left */}
        <div
          style={{ position: 'absolute', top: 2, left: 2, zIndex: 3 }}
          onClick={(e) => e.stopPropagation()}
        >
          {alreadyAdded ? (
            <div style={{ position: 'relative' }}>
              {/* Custom "Already added" tooltip */}
              {checkboxHovered && (
                <div style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 6px)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(50, 50, 50, 0.92)',
                  color: 'white',
                  borderRadius: 4,
                  padding: '4px 8px',
                  fontSize: 11,
                  fontFamily: 'Roboto, sans-serif',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  zIndex: 10,
                }}>
                  Already added
                  {/* Arrow */}
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0, height: 0,
                    borderLeft: '5px solid transparent',
                    borderRight: '5px solid transparent',
                    borderTop: '5px solid rgba(50, 50, 50, 0.92)',
                  }} />
                </div>
              )}
              <span
                style={{ display: 'inline-flex' }}
                onMouseEnter={() => setCheckboxHovered(true)}
                onMouseLeave={() => setCheckboxHovered(false)}
              >
                <Checkbox
                  checked={false}
                  disabled
                  size="small"
                  sx={{ padding: '5px', '& .MuiSvgIcon-root': { fontSize: 18 } }}
                />
              </span>
            </div>
          ) : (
            <>
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 13, height: 13, background: 'white', borderRadius: 1, zIndex: 0,
              }} />
              <Checkbox
                checked={selected}
                onChange={(e) => { e.stopPropagation(); onSelect(template.id, e.target.checked); }}
                size="small"
                sx={{
                  padding: '5px', position: 'relative', zIndex: 1,
                  '& .MuiSvgIcon-root': { fontSize: 18, color: selected ? '#473bab' : 'rgba(0,0,0,0.54)' },
                }}
              />
            </>
          )}
        </div>
      </div>

      {/* Info below */}
      <div style={{ paddingTop: 6, paddingBottom: 2 }}>
        <p style={{
          margin: 0, fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 500,
          color: '#1f1d25', lineHeight: 1.43, letterSpacing: '0.17px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {template.name}
        </p>
        <p style={{
          margin: 0, fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 400,
          color: '#686576', lineHeight: 1.5, letterSpacing: '0.4px', marginTop: 1,
        }}>
          {template.type} | {template.width} x {template.height}
        </p>

        {/* Tag chips */}
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 5 }}>
          {[template.brand, 'lease', 'apr'].map((tag) => (
            <span key={tag} style={{
              fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576',
              background: '#f0f2f4', borderRadius: 4, padding: '1px 5px',
            }}>
              {tag}
            </span>
          ))}
        </div>

        {/* Folder */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5 }}>
          <FolderOutlined style={{ fontSize: 13, color: '#686576' }} />
          <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px' }}>
            {template.brand} Global Templates
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Icon button helper ────────────────────────────────────────────────────────

function ToolbarIconBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 32, height: 32,
        background: 'none', border: 'none', cursor: 'pointer',
        borderRadius: '50%', color: '#686576',
        transition: 'background 0.12s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.06)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
    >
      {children}
    </button>
  );
}

// ── Main AddTemplatesDialog ───────────────────────────────────────────────────

interface AddTemplatesDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd?: (ids: string[]) => void;
  projectTemplateIds: Set<string>;
  availableTemplates: Template[];
}

export function AddTemplatesDialog({
  open,
  onClose,
  onAdd,
  projectTemplateIds,
  availableTemplates,
}: AddTemplatesDialogProps) {
  const { widgetWidth } = useTestWidget();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  if (!open) return null;

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  };

  const handleClose = () => {
    setSelectedIds(new Set());
    setSearch('');
    onClose();
  };

  const handleAdd = () => {
    onAdd?.(Array.from(selectedIds));
    handleClose();
  };

  const filtered = availableTemplates.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedCount = selectedIds.size;
  const totalCount = availableTemplates.length;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, right: 0, bottom: 0, left: widgetWidth,
        zIndex: 100000,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'left 0.2s ease',
      }}
      onClick={handleClose}
    >
      {/* Dialog container */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: 8,
          width: 'calc(100% - 80px)',
          maxWidth: 1400,
          height: 'calc(100% - 80px)',
          maxHeight: 860,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0px 11px 15px -7px rgba(0,0,0,0.2), 0px 24px 38px 3px rgba(0,0,0,0.14), 0px 9px 46px 8px rgba(0,0,0,0.12)',
        }}
      >

        {/* ── Header ── */}
        <div style={{
          padding: '16px 24px 0',
          borderBottom: '1px solid #e0e0e0',
          flexShrink: 0,
        }}>
          {/* Title */}
          <h2 style={{
            margin: '0 0 10px',
            fontSize: 20, fontFamily: 'Roboto, sans-serif', fontWeight: 500,
            color: '#1f1d25', letterSpacing: '0.15px', lineHeight: 1.6,
          }}>
            Add Templates
          </h2>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#473bab', cursor: 'pointer', letterSpacing: '0.17px' }}>
              Portal
            </span>
            <span style={{ fontSize: 13, color: '#9c99a9' }}>›</span>
            <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.17px' }}>
              Recents
            </span>
          </div>

          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <ToolbarIconBtn><FolderOutlined style={{ fontSize: 20 }} /></ToolbarIconBtn>

            {/* Cart with badge */}
            <div style={{ position: 'relative' }}>
              <ToolbarIconBtn><ShoppingCartOutlined style={{ fontSize: 20 }} /></ToolbarIconBtn>
              <span style={{
                position: 'absolute', top: -2, right: -2,
                background: '#473bab', color: 'white',
                borderRadius: '50%', width: 16, height: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, fontFamily: 'Roboto, sans-serif',
                pointerEvents: 'none',
              }}>
                2
              </span>
            </div>

            {/* + New */}
            <button style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: '#473bab', color: 'white', border: 'none',
              borderRadius: 100, padding: '5px 14px',
              fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500,
              cursor: 'pointer', letterSpacing: '0.46px', lineHeight: '22px',
            }}>
              <Add style={{ fontSize: 18 }} />
              New
            </button>

            {/* Search */}
            <div style={{ position: 'relative', minWidth: 200, maxWidth: 320, flex: 1 }}>
              <Search style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                fontSize: 18, color: '#9c99a9', pointerEvents: 'none',
              }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="search"
                style={{
                  width: '100%', height: 34,
                  paddingLeft: 34, paddingRight: search ? 30 : 12,
                  border: '1px solid #cac9cf', borderRadius: 100,
                  fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#1f1d25',
                  outline: 'none', boxSizing: 'border-box', background: '#f9fafa',
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: 2, display: 'flex', alignItems: 'center',
                  }}
                >
                  <Close style={{ fontSize: 15, color: '#9c99a9' }} />
                </button>
              )}
            </div>

            <div style={{ flex: 1 }} />

            {/* Right side */}
            <span style={{
              fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500,
              color: '#473bab', cursor: 'pointer', letterSpacing: '0.46px',
            }}>
              Select Visible
            </span>
            <span style={{
              fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576',
              whiteSpace: 'nowrap', letterSpacing: '0.4px',
            }}>
              {filtered.length} / {totalCount} Items
            </span>
            <ToolbarIconBtn><GridViewOutlined style={{ fontSize: 20 }} /></ToolbarIconBtn>
            <ToolbarIconBtn><Refresh style={{ fontSize: 20 }} /></ToolbarIconBtn>
          </div>

          {/* Filter chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576' }}>
              Filtering by
            </span>
            {['apr', 'lease', 'Design Templates'].map((f) => (
              <span key={f} style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                background: '#e8eaed', borderRadius: 100,
                padding: '2px 6px 2px 8px',
                fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#1f1d25',
              }}>
                {f}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 16, height: 16, borderRadius: '50%', cursor: 'pointer',
                }}>
                  <Close style={{ fontSize: 12, color: '#686576' }} />
                </span>
              </span>
            ))}
            <button style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 500,
              color: '#473bab', letterSpacing: '0.46px', padding: 0,
            }}>
              Clear Filters
            </button>
          </div>

          {/* Info banner */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#e8f4fd', borderRadius: 4,
            padding: '8px 12px', marginBottom: 12,
          }}>
            <InfoOutlined style={{ fontSize: 18, color: '#0277bd', flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', color: '#01579b', letterSpacing: '0.17px' }}>
              You are viewing recent assets across all folders.
            </span>
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
          {filtered.length === 0 ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '100%', color: '#686576', fontFamily: 'Roboto, sans-serif', fontSize: 14,
            }}>
              No templates found.
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 16,
            }}>
              {filtered.map((tmpl) => (
                <DialogTemplateCard
                  key={tmpl.id}
                  template={tmpl}
                  selected={selectedIds.has(tmpl.id)}
                  alreadyAdded={projectTemplateIds.has(tmpl.id)}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid #e0e0e0',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8,
          flexShrink: 0,
        }}>
          <button
            onClick={handleClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '6px 8px', fontSize: 14, fontFamily: 'Roboto, sans-serif',
              fontWeight: 500, color: '#473bab', letterSpacing: '0.4px', lineHeight: '24px',
              borderRadius: 100,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={selectedCount === 0}
            style={{
              background: selectedCount > 0 ? '#473bab' : 'rgba(0,0,0,0.12)',
              border: 'none',
              cursor: selectedCount > 0 ? 'pointer' : 'default',
              padding: '6px 16px', fontSize: 14, fontFamily: 'Roboto, sans-serif',
              fontWeight: 500,
              color: selectedCount > 0 ? '#ffffff' : 'rgba(0,0,0,0.26)',
              letterSpacing: '0.4px', lineHeight: '24px', borderRadius: 100,
            }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
