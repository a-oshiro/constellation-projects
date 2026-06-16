import { useState } from 'react';
import { Checkbox, Divider, IconButton, Menu, MenuItem } from '@mui/material';
import {
  MoreVert, FolderOutlined, CheckCircle, HourglassEmpty, DoNotDisturb, WarningAmber, PendingOutlined,
  EditOutlined, AssignmentReturnOutlined, ContentCopyOutlined, DriveFileRenameOutline,
  InsertLinkOutlined, FolderOpenOutlined, RefreshOutlined, DeleteOutlined,
} from '@mui/icons-material';
import { NeedsEditsIcon } from './NeedsEditsIcon';
import type { Asset, AssetStatus } from '../../data/types';
import { FilledTemplatePreview } from './FilledTemplatePreview';
import { TEMPLATES } from '../../data/mockData';
import { AssetDetailsDialog } from './AssetDetailsDialog';
import { LargePreviewModal } from './LargePreviewModal';
import { useProject } from '../../context/ProjectContext';
import { getTemplateCtas } from '../../data/destinationUrlOptions';
import pageTextLinkSvg from '../../assets/icons/page-text-link.svg';

export type DraftVariant = 'default' | 'labeled' | 'badge';

interface AssetCardProps {
  asset: Asset;
  selected?: boolean;
  disabled?: boolean;
  draftVariant?: DraftVariant;
  onSelect?: (id: string, checked: boolean) => void;
  onStatusChange?: (id: string, status: AssetStatus) => void;
  onSendBackToReview?: (id: string) => void;
  onOpenUrlsDialog?: () => void;
}

const STATUS_CONFIG: Record<AssetStatus, {
  label: string;
  bg: string;
  textColor: string;
  Icon: React.ElementType;
  iconColor: string;
}> = {
  draft: {
    label: 'Draft',
    bg: '#EBF5FB',
    textColor: '#01579b',
    Icon: PendingOutlined,
    iconColor: '#01579b',
  },
  generated: {
    label: 'Generated',
    bg: '#e8f5e9',
    textColor: '#2e7d32',
    Icon: CheckCircle,
    iconColor: '#2e7d32',
  },
  approved: {
    label: 'Approved',
    bg: '#e8f5e9',
    textColor: '#1b5e20',
    Icon: CheckCircle,
    iconColor: '#1b5e20',
  },
  awaiting_approval: {
    label: 'Awaiting Approval',
    bg: '#FDF4EC',
    textColor: '#c45500',
    Icon: HourglassEmpty,
    iconColor: '#c45500',
  },
  needs_edits: {
    label: 'Needs Edits',
    bg: '#FDF4EC',
    textColor: '#c45500',
    Icon: NeedsEditsIcon,
    iconColor: '#c45500',
  },
  denied: {
    label: 'Denied',
    bg: '#FBEFF0',
    textColor: '#be0e1c',
    Icon: DoNotDisturb,
    iconColor: '#be0e1c',
  },
  updated: {
    label: 'Updated',
    bg: '#FDF4EC',
    textColor: '#c45500',
    Icon: WarningAmber,
    iconColor: '#c45500',
  },
  removed: {
    label: 'Removed',
    bg: '#FBEFF0',
    textColor: '#be0e1c',
    Icon: DoNotDisturb,
    iconColor: '#be0e1c',
  },
};

const MAX_VISIBLE_TAGS = 2;

const LARGE_PREVIEW_STATUSES: AssetStatus[] = ['updated', 'draft'];

export const AssetCard = ({ asset, selected, disabled, draftVariant = 'default', onSelect, onSendBackToReview, onOpenUrlsDialog }: AssetCardProps) => {
  const [hover, setHover] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showLargePreview, setShowLargePreview] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const { destinationUrls } = useProject();

  const visibleTags = asset.tags.slice(0, MAX_VISIBLE_TAGS);
  const overflowCount = asset.tags.length - MAX_VISIBLE_TAGS;
  const status = STATUS_CONFIG[asset.status];
  const template = TEMPLATES.find((t) => t.id === asset.templateId);
  const { Icon: StatusIcon } = status;

  const isDraft = asset.status === 'draft';
  const isUpdated = asset.status === 'updated';

  // Missing Destination URL badge — only for HTML template assets
  const isHtml = asset.imageType === 'HTML';
  const htmlCtas = isHtml ? getTemplateCtas(asset.templateId) : [];
  const assetUrls = destinationUrls[asset.id] ?? {};
  const hasMissingUrls = isHtml && !isDraft && htmlCtas.some((cta) => !assetUrls[cta.key]);

  // Determine how to size the template preview within the square thumbnail.
  // Wide templates (e.g. 600×250) are letterboxed; square fills the card fully.
  const isWide = asset.width > asset.height;
  const innerWidthPct = isWide ? 100 : (asset.width / asset.height) * 100;
  const innerHeightPct = !isWide ? 100 : (asset.height / asset.width) * 100;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'default',
      }}
      onMouseEnter={() => !disabled && setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* ── Thumbnail — always 1:1 square ──────────────── */}
      <div
        style={{
          position: 'relative',
          aspectRatio: '1 / 1',
          background: '#f0f2f4',
          border: isDraft && draftVariant === 'labeled'
            ? '3px dashed #80C3E8'
            : `${(selected || hover) ? 2 : 1}px solid ${(selected || hover) ? '#473bab' : '#e7e7e9'}`,
          borderRadius: (isDraft && draftVariant === 'badge') || isUpdated ? '8px 8px 0 0' : 8,
          overflow: 'hidden',
          transition: 'border-color 0.15s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Template content — centered sub-container at correct aspect ratio */}
        <div style={{ opacity: asset.status === 'removed' ? 0.25 : 1, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {template && asset.offer ? (
            <div
              style={{
                width: `${innerWidthPct}%`,
                height: `${innerHeightPct}%`,
                position: 'relative',
                flexShrink: 0,
              }}
            >
              <FilledTemplatePreview
                template={template}
                offer={asset.offer}
                backgroundUrl={asset.backgroundUrl}
              />
            </div>
          ) : (
            <img
              src={asset.thumbnailUrl}
              alt={asset.name}
              style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'absolute', inset: 0 }}
            />
          )}
        </div>

        {/* Selection tint overlay */}
        {selected && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(71, 59, 171, 0.06)',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* "Asset Details" hover button — bottom-right */}
        <div
          style={{
            position: 'absolute',
            bottom: 9,
            right: 9,
            opacity: hover ? 1 : 0,
            transition: 'opacity 0.15s',
            pointerEvents: hover ? 'auto' : 'none',
            zIndex: 3,
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (LARGE_PREVIEW_STATUSES.includes(asset.status)) {
                setShowLargePreview(true);
              } else {
                setShowDialog(true);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#473bab',
              color: '#ffffff',
              border: 'none',
              borderRadius: 100,
              padding: '4px 10px',
              fontSize: 13,
              fontWeight: 500,
              fontFamily: 'Roboto, sans-serif',
              letterSpacing: '0.46px',
              lineHeight: '22px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            }}
          >
            Asset Details
          </button>
        </div>
      </div>

      {/* ── Checkbox — absolute top-left of thumbnail ──── */}
      <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 2 }}>
        <div style={{
          position: 'absolute', top: 11, left: 11,
          width: 16, height: 16,
          background: 'white', borderRadius: 1, zIndex: 0,
        }} />
        <Checkbox
          checked={!!selected}
          onChange={(e) => onSelect?.(asset.id, e.target.checked)}
          size="medium"
          disabled={disabled}
          sx={{
            padding: '9px',
            zIndex: 1,
            position: 'relative',
            '&.Mui-checked': { color: '#473bab' },
            '& .MuiSvgIcon-root': {
              fontSize: 22,
              color: selected ? '#473bab' : 'rgba(0,0,0,0.54)',
              background: 'white',
              borderRadius: '3px',
            },
          }}
        />
      </div>

      {/* ── Status chip + Missing URL badge stack — top-right ── */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 4,
        }}
      >
        {/* Status badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px 3px 6px',
            borderRadius: 8,
            background: status.bg,
            backdropFilter: 'blur(2px)',
          }}
        >
          <StatusIcon style={{ fontSize: 14, color: status.iconColor }} />
          <span
            style={{
              fontSize: 11,
              fontFamily: 'Roboto, sans-serif',
              fontWeight: 500,
              color: status.textColor,
              letterSpacing: '0.4px',
              lineHeight: 1.66,
              whiteSpace: 'nowrap',
            }}
          >
            {status.label}
          </span>
        </div>
        
        {/* Missing Destination URL badge */}
        {hasMissingUrls && (
          <div
            onClick={(e) => { e.stopPropagation(); if (onOpenUrlsDialog) { onOpenUrlsDialog(); } else { setShowDialog(true); } }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px 3px 6px',
              borderRadius: 8,
              background: '#FDF4EC',
              cursor: 'pointer',
            }}
          >
            <img src={pageTextLinkSvg} alt="" style={{ width: 14, height: 14, flexShrink: 0 }} />
            <span
              style={{
                fontSize: 11,
                fontFamily: 'Roboto, sans-serif',
                fontWeight: 500,
                color: '#c45500',
                letterSpacing: '0.4px',
                lineHeight: 1.66,
                whiteSpace: 'nowrap',
              }}
            >
              Missing Destination URLs
            </span>
          </div>
        )}
      </div>

      {/* ── Updated variant: Badge bar ────────────────── */}
      {isUpdated && (
        <div style={{
          background: '#FDF4EC',
          borderRadius: '0 0 8px 8px',
          padding: '4px 12px',
          width: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <span style={{
            fontSize: 11,
            fontFamily: 'Roboto, sans-serif',
            fontWeight: 400,
            color: '#c45500',
            letterSpacing: '0.4px',
            lineHeight: 1.66,
          }}>
            Preview only
          </span>
          <span style={{
            fontSize: 11,
            fontFamily: 'Roboto, sans-serif',
            fontWeight: 400,
            color: '#c45500',
            letterSpacing: '0.4px',
            lineHeight: 1.66,
          }}>
            {asset.width} x {asset.height}
          </span>
        </div>
      )}

      {/* ── Draft variant: Badge ───────────────────────── */}
      {isDraft && draftVariant === 'badge' && (
        <div style={{
          background: '#EBF5FB',
          borderRadius: '0 0 8px 8px',
          padding: '4px 12px',
          width: '100%',
          boxSizing: 'border-box',
          textAlign: 'center',
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <span style={{
            fontSize: 11,
            fontFamily: 'Roboto, sans-serif',
            fontWeight: 400,
            color: '#01579B',
            letterSpacing: '0.4px',
            lineHeight: 1.66,
          }}>
            Preview only
          </span>
          <span style={{
            fontSize: 11,
            fontFamily: 'Roboto, sans-serif',
            fontWeight: 400,
            color: '#01579B',
            letterSpacing: '0.4px',
            lineHeight: 1.66,
          }}>
            {asset.width} x {asset.height}
          </span>
        </div>
      )}

      {/* ── Draft variant: Labeled ─────────────────────── */}
      {isDraft && draftVariant === 'labeled' && (
        <div style={{ paddingTop: 8, width: '100%' }}>
          <p style={{
            margin: 0,
            fontSize: 12,
            fontFamily: 'Roboto, sans-serif',
            fontWeight: 400,
            color: '#01579B',
            lineHeight: 1.43,
            letterSpacing: '0.17px',
          }}>
            Preview Only
          </p>
          <div style={{
            display: 'flex',
            gap: 4,
            fontSize: 11,
            fontFamily: 'Roboto, sans-serif',
            color: '#686576',
            lineHeight: 1.66,
            letterSpacing: '0.4px',
            marginTop: 1,
          }}>
            <span>{asset.imageType}</span>
            <span>|</span>
            <span>{asset.width} x {asset.height}</span>
          </div>
        </div>
      )}

      {/* ── Content below thumbnail (non-draft, non-updated) ── */}
      {!isDraft && !isUpdated && (
      <div style={{ paddingTop: 8, paddingBottom: 4, width: '100%' }}>

        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, width: '100%' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 400,
                fontFamily: 'Roboto, sans-serif',
                color: '#1f1d25',
                lineHeight: 1.43,
                letterSpacing: '0.17px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {asset.name}
            </p>
            <div
              style={{
                display: 'flex',
                gap: 4,
                fontSize: 11,
                fontFamily: 'Roboto, sans-serif',
                color: '#686576',
                lineHeight: 1.66,
                letterSpacing: '0.4px',
                marginTop: 1,
              }}
            >
              <span>{asset.imageType}</span>
              <span>|</span>
              <span>{asset.width} x {asset.height}</span>
            </div>
          </div>

          <IconButton
            size="small"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              if (asset.status === 'approved') setMenuAnchor(e.currentTarget);
            }}
            sx={{ padding: '4px', flexShrink: 0, mt: '-2px' }}
          >
            <MoreVert style={{ fontSize: 18, color: '#1f1d25' }} />
          </IconButton>
        </div>

        {/* ── Approved asset context menu ─────────────────── */}
        {asset.status === 'approved' && (
          <Menu
            anchorEl={menuAnchor}
            open={!!menuAnchor}
            onClose={() => setMenuAnchor(null)}
            slotProps={{ paper: { sx: { minWidth: 220, borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.14)' } } }}
          >
            <MenuItem onClick={() => setMenuAnchor(null)} sx={{ gap: 1.5, py: 1 }}>
              <EditOutlined sx={{ fontSize: 18, color: '#686576' }} />
              <span style={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>Edit Variables</span>
            </MenuItem>
            <MenuItem
              onClick={() => { onSendBackToReview?.(asset.id); setMenuAnchor(null); }}
              sx={{ gap: 1.5, py: 1 }}
            >
              <AssignmentReturnOutlined sx={{ fontSize: 18, color: '#686576' }} />
              <span style={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>Send back to Review</span>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => setMenuAnchor(null)} sx={{ gap: 1.5, py: 1 }}>
              <ContentCopyOutlined sx={{ fontSize: 18, color: '#686576' }} />
              <span style={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>Duplicate</span>
            </MenuItem>
            <MenuItem onClick={() => { setMenuAnchor(null); setShowDialog(true); }} sx={{ gap: 1.5, py: 1 }}>
              <DriveFileRenameOutline sx={{ fontSize: 18, color: '#686576' }} />
              <span style={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>Edit Metadata</span>
            </MenuItem>
            <MenuItem onClick={() => setMenuAnchor(null)} sx={{ gap: 1.5, py: 1 }}>
              <InsertLinkOutlined sx={{ fontSize: 18, color: '#686576' }} />
              <span style={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>Copy Link To Asset</span>
            </MenuItem>
            <MenuItem onClick={() => setMenuAnchor(null)} sx={{ gap: 1.5, py: 1 }}>
              <InsertLinkOutlined sx={{ fontSize: 18, color: '#686576' }} />
              <span style={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>Copy Link To Latest</span>
            </MenuItem>
            <MenuItem onClick={() => setMenuAnchor(null)} sx={{ gap: 1.5, py: 1 }}>
              <FolderOpenOutlined sx={{ fontSize: 18, color: '#686576' }} />
              <span style={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>View in Folder</span>
            </MenuItem>
            <MenuItem onClick={() => setMenuAnchor(null)} sx={{ gap: 1.5, py: 1 }}>
              <RefreshOutlined sx={{ fontSize: 18, color: '#686576' }} />
              <span style={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', color: '#1f1d25' }}>Refresh Asset</span>
            </MenuItem>
            <MenuItem onClick={() => setMenuAnchor(null)} sx={{ gap: 1.5, py: 1 }}>
              <DeleteOutlined sx={{ fontSize: 18, color: '#be0e1c' }} />
              <span style={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', color: '#be0e1c' }}>Delete</span>
            </MenuItem>
          </Menu>
        )}

        {/* Tags */}
        {asset.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, paddingTop: 6 }}>
            {visibleTags.map((tag) => (
              <div
                key={tag}
                style={{
                  background: '#f0f2f4',
                  borderRadius: 8,
                  padding: '1px 6px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: 'Roboto, sans-serif',
                    color: '#1f1d25',
                    letterSpacing: '0.16px',
                    lineHeight: '18px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tag}
                </span>
              </div>
            ))}
            {overflowCount > 0 && (
              <div style={{ background: '#f0f2f4', borderRadius: 8, padding: '1px 6px', display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', lineHeight: '18px' }}>
                  +{overflowCount}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Folder */}
        {asset.folder && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 4 }}>
            <FolderOutlined style={{ fontSize: 14, color: '#686576', flexShrink: 0 }} />
            <span
              style={{
                fontSize: 11,
                fontFamily: 'Roboto, sans-serif',
                color: '#686576',
                letterSpacing: '0.17px',
                lineHeight: 1.43,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                minWidth: 0,
              }}
            >
              {asset.folder}
            </span>
          </div>
        )}
      </div>
      )}

      {showDialog && (
        <AssetDetailsDialog asset={asset} onClose={() => setShowDialog(false)} />
      )}
      {showLargePreview && (
        <LargePreviewModal asset={asset} onClose={() => setShowLargePreview(false)} />
      )}
    </div>
  );
};

