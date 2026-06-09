import { useState } from 'react';
import { Checkbox, IconButton, Menu, MenuItem, ListItemIcon } from '@mui/material';
import { MoreVert, VisibilityOutlined, GridViewOutlined, DeleteOutlined } from '@mui/icons-material';
import type { Template } from '../../data/types';
import { TEMPLATE_REGISTRY } from '../../templates';

interface TemplateCardProps {
  template: Template;
  selected?: boolean;
  backgroundUrl?: string;
  onSelect?: (id: string, checked: boolean) => void;
  onClick?: () => void;
  onRemove?: (id: string) => void;
}

export const TemplateCard = ({ template, selected, onSelect, onClick, onRemove }: TemplateCardProps) => {
  const [hovered, setHovered] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const isWide = template.width >= template.height;
  const previewWidth = isWide ? '100%' : `${(template.width / template.height) * 100}%`;
  const previewHeight = isWide ? `${(template.height / template.width) * 100}%` : '100%';

  const templateDef = TEMPLATE_REGISTRY[template.id];
  const PreviewComponent = templateDef?.Preview;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: 'flex', flexDirection: 'column', position: 'relative', cursor: 'pointer' }}
    >
      {/* ── Square thumbnail ──────────────────────────── */}
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1 / 1',
        background: '#f0f2f4',
        border: selected ? '3px solid #473bab' : hovered ? '2px solid #473bab' : '1px solid #e7e7e9',
        borderRadius: 12,
        overflow: 'hidden',
        transition: 'border 0.15s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Template preview — centered, scaled to maintain its aspect ratio */}
        <div style={{ width: previewWidth, height: previewHeight, position: 'relative', flexShrink: 0 }}>
          {PreviewComponent
            ? <PreviewComponent hovered={hovered} />
            : <div style={{ width: '100%', height: '100%', background: '#e8eaed' }} />
          }
        </div>

        {/* Checkbox — top-left */}
        <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 2 }}>
          <div style={{ position: 'absolute', top: 11, left: 11, width: 16, height: 16, background: 'white', borderRadius: 1, zIndex: 0 }} />
          <Checkbox
            checked={!!selected}
            onChange={(e) => { e.stopPropagation(); onSelect?.(template.id, e.target.checked); }}
            onClick={(e) => e.stopPropagation()}
            sx={{
              padding: '9px', zIndex: 1, position: 'relative',
              '& .MuiSvgIcon-root': { fontSize: 24, color: selected ? '#473bab' : 'rgba(0,0,0,0.54)' },
            }}
          />
        </div>
      </div>

      {/* ── Info below ──────────────────────────────── */}
      <div style={{ paddingTop: 8, paddingBottom: 12, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              margin: 0, fontSize: 14, fontFamily: 'Roboto, sans-serif', fontWeight: 400,
              color: '#1f1d25', lineHeight: 1.43, letterSpacing: '0.17px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {template.name}
            </p>
            <div style={{ display: 'flex', gap: 4, marginTop: 1, alignItems: 'baseline' }}>
              <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', lineHeight: 1.66, letterSpacing: '0.4px' }}>{template.type}</span>
              <span style={{ fontSize: 11, color: '#686576' }}>|</span>
              <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.4px' }}>{template.width} x {template.height}</span>
            </div>
          </div>
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); setAnchorEl(e.currentTarget); }}
            sx={{ padding: '5px', flexShrink: 0, borderRadius: '100px' }}
          >
            <MoreVert style={{ fontSize: 20, color: '#1f1d25' }} />
          </IconButton>
        </div>

        {/* Brand chip */}
        <div style={{ display: 'inline-flex', alignItems: 'center', background: '#f0f2f4', borderRadius: 8, padding: '2px 6px', width: 'fit-content' }}>
          <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#1f1d25', letterSpacing: '0.16px', lineHeight: '18px', whiteSpace: 'nowrap' }}>
            {template.brand}
          </span>
        </div>
      </div>

      {/* ── Context Menu ─────────────────────────────── */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        onClick={(e) => e.stopPropagation()}
        slotProps={{
          paper: {
            sx: {
              width: 220,
              borderRadius: '4px',
              boxShadow: '0px 5px 5px -3px rgba(0,0,0,0.2), 0px 8px 10px 1px rgba(0,0,0,0.14), 0px 3px 14px 2px rgba(0,0,0,0.12)',
            },
          },
        }}
      >
        <MenuItem
          onClick={() => setAnchorEl(null)}
          sx={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', letterSpacing: '0.17px', lineHeight: '24px', px: 2, py: '4px' }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <VisibilityOutlined fontSize="small" />
          </ListItemIcon>
          Preview
        </MenuItem>
        <MenuItem
          onClick={() => setAnchorEl(null)}
          sx={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', letterSpacing: '0.17px', lineHeight: '24px', px: 2, py: '4px' }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <GridViewOutlined fontSize="small" />
          </ListItemIcon>
          Show Variants
        </MenuItem>
        <MenuItem
          onClick={() => { setAnchorEl(null); onRemove?.(template.id); }}
          sx={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', letterSpacing: '0.17px', lineHeight: '24px', px: 2, py: '4px' }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <DeleteOutlined fontSize="small" />
          </ListItemIcon>
          Remove
        </MenuItem>
      </Menu>
    </div>
  );
};
