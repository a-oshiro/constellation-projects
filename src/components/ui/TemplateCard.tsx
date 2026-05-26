import { useState } from 'react';
import { Checkbox, IconButton, Menu, MenuItem, ListItemIcon } from '@mui/material';
import { MoreVert, Edit, VisibilityOutlined, GridViewOutlined, DeleteOutlined } from '@mui/icons-material';
import type { Template } from '../../data/types';

interface TemplateCardProps {
  template: Template;
  selected?: boolean;
  backgroundUrl?: string;
  onSelect?: (id: string, checked: boolean) => void;
  onClick?: () => void;
  onRemove?: (id: string) => void;
}

// ── Template Preview ───────────────────────────────────────────────────────────

function TemplatePreview({
  template,
  hovered,
}: {
  template: Template;
  hovered: boolean;
}) {
  const isWide = template.width > template.height;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>

      {/* Background placeholder */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `repeating-linear-gradient(-45deg, #e8eaed 0px, #e8eaed 6px, #f0f2f4 6px, #f0f2f4 14px)`,
      }} />

      {/* "Background Image" label */}
      <div style={{
        position: 'absolute', bottom: isWide ? 6 : 8, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(255,255,255,0.75)', border: '1px dashed #9c99a9',
        borderRadius: 4, padding: '2px 8px', whiteSpace: 'nowrap',
      }}>
        <span style={{ fontSize: isWide ? 9 : 11, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.3px' }}>
          Background Image
        </span>
      </div>

      {/* Left: text placeholders */}
      <div style={{
        position: 'absolute', left: '4%', top: isWide ? '8%' : '10%',
        width: isWide ? '44%' : '40%', display: 'flex', flexDirection: 'column', gap: isWide ? 6 : 8,
      }}>
        <div style={{ fontSize: isWide ? 11 : 13, fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: '#473bab', lineHeight: 1.25, padding: '2px 5px', background: 'rgba(71,59,171,0.08)', borderRadius: 4 }}>
          {'{vehicleCondition}'}<br />{'{year} {make} {model}'}<br />{'{trim}'}
        </div>
        <div style={{ fontSize: isWide ? 9 : 11, fontFamily: 'Roboto, sans-serif', color: '#473bab', lineHeight: 1.4, padding: '2px 5px', background: 'rgba(71,59,171,0.08)', borderRadius: 4 }}>
          {'{Offer type} for'}<br />{'${monthlyPayment} / month'}<br />{'for {n} months'}
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#473bab', borderRadius: 100, padding: isWide ? '3px 10px' : '4px 12px', width: 'fit-content' }}>
          <span style={{ fontSize: isWide ? 9 : 11, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: 'white', whiteSpace: 'nowrap' }}>More Info</span>
        </div>
        <div style={{ height: isWide ? 5 : 6, width: '88%', background: 'rgba(0,0,0,0.12)', borderRadius: 3 }} />
      </div>

      {/* Right: product image placeholder */}
      <div style={{
        position: 'absolute', left: isWide ? '51%' : '46%', top: isWide ? '8%' : '10%',
        width: isWide ? '44%' : '50%', height: isWide ? '68%' : '60%',
        border: '2px solid #473bab', borderRadius: 6, background: 'rgba(255,255,255,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4,
      }}>
        <svg width={isWide ? 32 : 40} height={isWide ? 20 : 26} viewBox="0 0 40 26" fill="none">
          <rect x="2" y="10" width="36" height="13" rx="3" stroke="#473bab" strokeWidth="1.5"/>
          <path d="M6 10 L10 3 H30 L34 10" stroke="#473bab" strokeWidth="1.5" strokeLinejoin="round"/>
          <circle cx="10" cy="23" r="3" stroke="#473bab" strokeWidth="1.5"/>
          <circle cx="30" cy="23" r="3" stroke="#473bab" strokeWidth="1.5"/>
        </svg>
        <span style={{ fontSize: isWide ? 9 : 11, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#473bab', textAlign: 'center' }}>
          Product Image
        </span>
      </div>

      {/* Top-right: logo placeholder */}
      <div style={{
        position: 'absolute', top: isWide ? '6%' : '5%', right: '3%',
        width: isWide ? '11%' : '10%', height: isWide ? '18%' : '13%',
        border: '1.5px dashed #ec4899', borderRadius: 4, background: 'rgba(255,255,255,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: isWide ? 6 : 7, color: '#ec4899', fontFamily: 'Roboto, sans-serif', textAlign: 'center', lineHeight: 1.2 }}>Logo</span>
      </div>

      {/* Hover: Edit Template button */}
      <div style={{
        position: 'absolute', bottom: 7, right: 7,
        opacity: hovered ? 1 : 0, transition: 'opacity 0.15s',
        pointerEvents: hovered ? 'auto' : 'none',
      }}>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#473bab', color: 'white', border: 'none',
          borderRadius: 100, padding: '4px 10px', fontSize: 12,
          fontFamily: 'Roboto, sans-serif', fontWeight: 500,
          letterSpacing: '0.46px', lineHeight: '22px',
          cursor: 'pointer', whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        }}>
          <Edit style={{ fontSize: 14 }} />
          Edit Template
        </button>
      </div>
    </div>
  );
}

// ── TemplateCard ───────────────────────────────────────────────────────────────

export const TemplateCard = ({ template, selected, onSelect, onClick, onRemove }: TemplateCardProps) => {
  const [hovered, setHovered] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const isWide = template.width >= template.height;
  // Size the template preview to fit inside the square, letterboxing the shorter axis
  const previewWidth = isWide ? '100%' : `${(template.width / template.height) * 100}%`;
  const previewHeight = isWide ? `${(template.height / template.width) * 100}%` : '100%';

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
          <TemplatePreview template={template} hovered={hovered} />
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
