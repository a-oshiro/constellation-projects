import { useState } from 'react';
import { Checkbox, IconButton } from '@mui/material';
import { MoreVert, FolderOutlined, Language, AutoAwesome, Edit } from '@mui/icons-material';
import { FilledTemplatePreview } from './FilledTemplatePreview';
import { StatusBadge } from './StatusBadge';
import type { Asset, AssetStatus, Template } from '../../data/types';
import { useProject } from '../../context/ProjectContext';
import { getTemplateCtas } from '../../data/destinationUrlOptions';
import pageTextLinkSvg from '../../assets/icons/page-text-link.svg';

export interface AdShell {
  id: string;
  assets: Asset[];
  template: Template;
  bgNum: number;
  name: string;
  platform: string;
  adType: string;
  folder: string;
  // Editable via AdShellPanel
  displayOrder?: string;
  autoTransition?: boolean;
  displayTime?: string;
  transitionTime?: string;
}

interface AdShellCardProps {
  shell: AdShell;
  selected?: boolean;
  isEditing?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
  onEdit?: (shell: AdShell) => void;
  onOpenUrlsDialog?: () => void;
}

// Renders a single asset preview letterboxed within its container
const AssetLayerContent = ({ asset, template }: { asset: Asset; template: Template }) => {
  const isWide = template.width > template.height;
  const innerWidthPct = isWide ? 100 : (template.width / template.height) * 100;
  const innerHeightPct = !isWide ? 100 : (template.height / template.width) * 100;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: `${innerWidthPct}%`, height: `${innerHeightPct}%`, position: 'relative', flexShrink: 0 }}>
        <FilledTemplatePreview template={template} offer={asset.offer} backgroundUrl={asset.backgroundUrl} />
      </div>
    </div>
  );
};

export const AdShellCard = ({ shell, selected, isEditing, onSelect, onEdit, onOpenUrlsDialog }: AdShellCardProps) => {
  const [hover, setHover] = useState(false);
  const active = hover || isEditing;
  const { assets, template, name, platform, adType, folder } = shell;

  const { destinationUrls } = useProject();
  const hasMissingUrls = assets.some((asset) => {
    if (asset.status === 'draft' || asset.status === 'removed') return false;
    const ctas = getTemplateCtas(asset.templateId);
    if (!ctas.length) return false;
    const assetUrls = destinationUrls[asset.id] ?? {};
    return ctas.some((cta) => !assetUrls[cta.key]);
  });

  // Derive shell status: awaiting_approval > updated (also shown when assets are removed)
  const shellStatus: AssetStatus | null = (() => {
    const statuses = assets.map((a) => a.status);
    if (statuses.some((s) => s === 'awaiting_approval')) return 'awaiting_approval';
    if (statuses.some((s) => s === 'updated' || s === 'removed')) return 'updated';
    return null;
  })();

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', position: 'relative', cursor: 'default' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* ── Thumbnail ────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          aspectRatio: '1 / 1',
          background: '#f0f2f4',
          border: `${active ? 2 : 1}px solid ${active ? '#473bab' : '#e7e7e9'}`,
          borderRadius: 8,
          overflow: 'hidden',
          transition: 'border-color 0.15s',
        }}
      >
        {/* Default state: stacked cards */}
        {!hover && (
          <>
            {/* Layer 3 — back, rotated -5° (left) */}
            {assets[2] && (
              <div style={{ position: 'absolute', inset: 24, opacity: 0.4, transform: 'rotate(-5deg)' }}>
                <AssetLayerContent asset={assets[2]} template={template} />
              </div>
            )}
            {/* Layer 2 — middle, rotated +5° (right) */}
            {assets[1] && (
              <div style={{ position: 'absolute', inset: 24, opacity: 0.4, transform: 'rotate(5deg)' }}>
                <AssetLayerContent asset={assets[1]} template={template} />
              </div>
            )}
            {/* Layer 1 — front, no rotation */}
            {assets[0] && (
              <div style={{ position: 'absolute', inset: 24 }}>
                <AssetLayerContent asset={assets[0]} template={template} />
              </div>
            )}
          </>
        )}

        {/* Hover / editing state: 2×2 padded grid */}
        {hover && (() => {
          // Each cell is square; hPct scales the template preview to maintain aspect ratio.
          const hPct = (template.height / template.width) * 100;
          // How many assets are hidden (shown in the +N badge on the 4th cell)
          const hiddenCount = Math.max(0, assets.length - 4);

          return (
            <div style={{ position: 'absolute', inset: 0, padding: 16 }}>
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 4 }}>

                {/* Row 1 — assets[0] and assets[1] */}
                <div style={{ flex: 1, display: 'flex', gap: 4, minHeight: 0 }}>
                  {[0, 1].map((i) => (
                    <div
                      key={i}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 4, minWidth: 0 }}
                    >
                      {assets[i] && (
                        <div style={{ width: '100%', height: `${hPct}%`, position: 'relative', flexShrink: 0 }}>
                          <FilledTemplatePreview template={template} offer={assets[i]!.offer} backgroundUrl={assets[i]!.backgroundUrl} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Row 2 — assets[2] and assets[3]; 4th cell gets +N overlay when hidden > 0 */}
                <div style={{ flex: 1, display: 'flex', gap: 4, minHeight: 0 }}>
                  {/* Cell 3 */}
                  <div
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 4, minWidth: 0 }}
                  >
                    {assets[2] && (
                      <div style={{ width: '100%', height: `${hPct}%`, position: 'relative', flexShrink: 0 }}>
                        <FilledTemplatePreview template={template} offer={assets[2].offer} backgroundUrl={assets[2].backgroundUrl} />
                      </div>
                    )}
                  </div>

                  {/* Cell 4 — with optional dark overlay + counter */}
                  <div
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 4, minWidth: 0, position: 'relative' }}
                  >
                    {assets[3] && (
                      <div style={{ width: '100%', height: `${hPct}%`, position: 'relative', flexShrink: 0 }}>
                        <FilledTemplatePreview template={template} offer={assets[3].offer} backgroundUrl={assets[3].backgroundUrl} />
                      </div>
                    )}
                    {hiddenCount > 0 && (
                      <>
                        {/* Dark overlay */}
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1 }} />
                        {/* +N counter */}
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                          <span
                            style={{
                              fontSize: 34,
                              fontFamily: 'Roboto, sans-serif',
                              fontWeight: 400,
                              color: '#ffffff',
                              letterSpacing: '0.25px',
                              lineHeight: 1.235,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            +{hiddenCount}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

              </div>
            </div>
          );
        })()}

        {/* Auto Generated badge — top right */}
        {/* Top-right badge stack: Auto Generated + optional status badge + optional missing URLs chip */}
        <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px 3px 6px',
              borderRadius: 100,
              background: '#EBF5FB',
              backdropFilter: 'blur(2px)',
            }}
          >
            <AutoAwesome style={{ fontSize: 12, color: '#0277BD' }} />
            <span
              style={{
                fontSize: 11,
                fontFamily: 'Roboto, sans-serif',
                fontWeight: 500,
                color: '#0277BD',
                letterSpacing: '0.4px',
                lineHeight: 1.66,
                whiteSpace: 'nowrap',
              }}
            >
              Auto Generated
            </span>
          </div>
          {shellStatus && <StatusBadge status={shellStatus} />}
          {hasMissingUrls && (
            <span
              onClick={(e) => { e.stopPropagation(); onOpenUrlsDialog?.(); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: '#FDF4EC',
                borderRadius: 8,
                paddingLeft: 6, paddingRight: 8, paddingTop: 3, paddingBottom: 3,
                flexShrink: 0, cursor: 'pointer',
                backdropFilter: 'blur(2px)',
              }}
            >
              <img src={pageTextLinkSvg} alt="" style={{ width: 14, height: 14, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#c45500', letterSpacing: '0.4px', lineHeight: 1.66, whiteSpace: 'nowrap' }}>
                Missing Destination URLs
              </span>
            </span>
          )}
        </div>

        {/* Platform icon — bottom left */}
        <div style={{ position: 'absolute', bottom: 8, left: 8, zIndex: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: '#ffffff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Language style={{ fontSize: 16, color: '#424242' }} />
          </div>
        </div>

        {/* Edit Ad Shell button — bottom right on hover */}
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
            onClick={(e) => { e.stopPropagation(); onEdit?.(shell); }}
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
            <Edit style={{ fontSize: 14 }} />
            Edit Ad Shell
          </button>
        </div>
      </div>

      {/* ── Checkbox — absolute top-left of thumbnail ──── */}
      <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 2 }}>
        <div
          style={{
            position: 'absolute',
            top: 11,
            left: 11,
            width: 16,
            height: 16,
            background: 'white',
            borderRadius: 1,
            zIndex: 0,
          }}
        />
        <Checkbox
          checked={!!selected || !!isEditing}
          onChange={(e) => onSelect?.(shell.id, e.target.checked)}
          size="medium"
          sx={{
            padding: '9px',
            zIndex: 1,
            position: 'relative',
            '&.Mui-checked': { color: '#473bab' },
            '& .MuiSvgIcon-root': {
              fontSize: 22,
              color: (selected || isEditing) ? '#473bab' : 'rgba(0,0,0,0.54)',
              background: 'white',
              borderRadius: '3px',
            },
          }}
        />
      </div>

      {/* ── Content below thumbnail ───────────────────── */}
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
              {name}
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
              <span>Ad Shell</span>
              <span>|</span>
              <span>{platform}</span>
              <span>|</span>
              <span>{adType}</span>
            </div>
          </div>

          <IconButton size="small" sx={{ padding: '4px', flexShrink: 0, mt: '-2px' }}>
            <MoreVert style={{ fontSize: 18, color: '#1f1d25' }} />
          </IconButton>
        </div>

        {/* Folder */}
        {folder && (
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
              {folder}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
