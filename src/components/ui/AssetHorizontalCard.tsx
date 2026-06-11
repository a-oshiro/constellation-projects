import { useState } from 'react';
import { Checkbox, FormControlLabel } from '@mui/material';
import { ExpandMore, ExpandLess, WarningAmber, HourglassEmpty, HighlightOff } from '@mui/icons-material';
import { FilledTemplatePreview } from './FilledTemplatePreview';
import { TEMPLATES } from '../../data/mockData';
import type { Asset, AssetStatus } from '../../data/types';

// ── Status chip ───────────────────────────────────────────────────────────────

const STATUS_CHIP_CONFIG: Partial<Record<AssetStatus, {
  bg: string; color: string; opacity?: number; label: string; Icon: React.ElementType;
}>> = {
  updated:           { bg: 'rgba(225,118,19,0.08)', color: '#c45500', opacity: 0.75, label: 'Updated',           Icon: WarningAmber },
  removed:           { bg: 'rgba(210,50,63,0.08)',  color: '#be0e1c',               label: 'Removed',           Icon: HighlightOff },
  awaiting_approval: { bg: 'rgba(225,118,19,0.08)', color: '#c45500', opacity: 0.75, label: 'Awaiting Approval', Icon: HourglassEmpty },
};

function AssetStatusChip({ status }: { status: AssetStatus }) {
  const cfg = STATUS_CHIP_CONFIG[status];
  if (!cfg) return null;
  const { bg, color, opacity = 1, label, Icon } = cfg;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: bg, borderRadius: 8, padding: '3px 8px 3px 6px', flexShrink: 0, alignSelf: 'flex-start' }}>
      <Icon style={{ fontSize: 14, color, flexShrink: 0 }} />
      <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color, opacity, letterSpacing: '0.4px', lineHeight: 1.66, whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildDestinationUrl(asset: Asset): string {
  return `/${asset.offer.model.toLowerCase().replace(/\s+/g, '-')}/new`;
}
function buildDisclaimer(asset: Asset): string {
  return `${asset.offer.year} ${asset.offer.make} ${asset.offer.trim}`;
}
function buildDisclaimerContent(asset: Asset): string {
  const { offer } = asset;
  return (
    `${offer.monthlyPayment}/mo. lease for ${offer.term} mos. $${offer.downPayment} due at signing. ` +
    `${offer.milesPerYear.toLocaleString()} miles/year. Offer expires ${offer.expirationDate}. ` +
    `Not all buyers will qualify. Subject to credit approval. Residency restrictions apply. ` +
    `See dealer for complete details. Tax, title, license, and dealer fees extra.`
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 500,
  color: '#686576', letterSpacing: '0.4px', lineHeight: 1.66, marginBottom: 2,
};

export const fieldInputStyle: React.CSSProperties = {
  width: '100%', padding: '6px 8px',
  fontSize: 12, fontFamily: 'Roboto, sans-serif',
  color: '#1f1d25', letterSpacing: '0.17px', lineHeight: 1.43,
  background: '#ffffff', border: '1px solid #dddce0',
  borderRadius: 4, outline: 'none', boxSizing: 'border-box',
};

// ── Props ─────────────────────────────────────────────────────────────────────

export interface AssetHorizontalCardProps {
  asset: Asset;
  /** Multi-select state (controlled by parent) */
  selected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
  /** Lead form state (lifted to parent for bulk operations) */
  leadFormEnabled?: boolean;
  leadFormCta?: string;
  onLeadFormEnabledChange?: (enabled: boolean) => void;
  onLeadFormCtaChange?: (cta: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const AssetHorizontalCard = ({
  asset,
  selected = false,
  onSelect,
  leadFormEnabled = false,
  leadFormCta = 'Claim Offer',
  onLeadFormEnabledChange,
  onLeadFormCtaChange,
}: AssetHorizontalCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const template = TEMPLATES.find((t) => t.id === asset.templateId);

  const isWide = asset.width > asset.height;
  const innerWidthPct  = isWide ? 100 : (asset.width / asset.height) * 100;
  const innerHeightPct = !isWide ? 100 : (asset.height / asset.width) * 100;

  const [expirationDate,    setExpirationDate]    = useState(asset.offer.expirationDate);
  const [destinationUrl,    setDestinationUrl]    = useState(buildDestinationUrl(asset));
  const [disclaimer,        setDisclaimer]        = useState(buildDisclaimer(asset));
  const [disclaimerContent, setDisclaimerContent] = useState(buildDisclaimerContent(asset));

  return (
    <div
      style={{
        background: '#ffffff',
        border: selected ? '2px solid #473bab' : '1px solid rgba(0,0,0,0.12)',
        borderRadius: 12,
        width: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
        transition: 'border-color 0.12s',
      }}
    >
      {/* ── Top: thumbnail + info ── */}
      <div style={{ display: 'flex', alignItems: 'stretch', position: 'relative' }}>

        {/* Thumbnail 90×90 */}
        <div
          style={{
            width: 90, height: 90, flexShrink: 0,
            background: '#f0f2f4', position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {template && asset.offer ? (
            <div style={{ width: `${innerWidthPct}%`, height: `${innerHeightPct}%`, position: 'relative', flexShrink: 0 }}>
              <FilledTemplatePreview template={template} offer={asset.offer} backgroundUrl={asset.backgroundUrl} />
            </div>
          ) : (
            <img src={asset.thumbnailUrl} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          )}

          {/* Selection checkbox — top-left of thumbnail */}
          <div
            style={{ position: 'absolute', top: 0, left: 0, zIndex: 2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ position: 'absolute', top: 7, left: 7, width: 13, height: 13, background: 'white', borderRadius: 1, zIndex: 0 }} />
            <Checkbox
              checked={selected}
              size="small"
              onChange={(e) => { e.stopPropagation(); onSelect?.(asset.id, e.target.checked); }}
              onClick={(e) => e.stopPropagation()}
              sx={{
                padding: '5px', zIndex: 1, position: 'relative',
                '& .MuiSvgIcon-root': { fontSize: 19, color: selected ? '#473bab' : 'rgba(0,0,0,0.54)' },
              }}
            />
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0, padding: 12, display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' }}>
          <AssetStatusChip status={asset.status} />
          <p style={{ margin: 0, fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#1f1d25', letterSpacing: '0.17px', lineHeight: 1.43, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {asset.name}
          </p>
          <div style={{ display: 'flex', gap: 4, fontSize: 11, fontFamily: 'Roboto, sans-serif', color: '#686576', lineHeight: 1.66, letterSpacing: '0.4px' }}>
            <span>{asset.imageType}</span>
            <span>|</span>
            <span>{asset.width} x {asset.height}</span>
          </div>
        </div>
      </div>

      {/* ── Configure Website Data toggle ── */}
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 12px', borderTop: '1px solid rgba(0,0,0,0.08)', cursor: 'pointer', userSelect: 'none'}}
        onClick={() => setExpanded((v) => !v)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#473bab', letterSpacing: '0.46px', lineHeight: '22px', }}>
            Configure Website Data
          </span>
          {expanded
            ? <ExpandLess style={{ fontSize: 18, color: '#473bab' }} />
            : <ExpandMore style={{ fontSize: 18, color: '#473bab' }} />
          }
        </div>
      </div>

      {/* ── Expanded fields ── */}
      {expanded && (
        <div style={{ background: '#ffffff', padding: '12px', display: 'flex', flexDirection: 'column', gap: 10,}}>

          <div>
            <p style={fieldLabelStyle}>Offer Expiration Date</p>
            <input type="text" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} style={fieldInputStyle} />
          </div>

          <div>
            <p style={fieldLabelStyle}>Destination URL</p>
            <input type="text" value={destinationUrl} onChange={(e) => setDestinationUrl(e.target.value)} style={fieldInputStyle} />
          </div>

          <div>
            <p style={fieldLabelStyle}>Disclaimer</p>
            <input type="text" value={disclaimer} onChange={(e) => setDisclaimer(e.target.value)} style={fieldInputStyle} />
          </div>

          <div>
            <p style={fieldLabelStyle}>Disclaimer Content</p>
            <textarea
              value={disclaimerContent}
              onChange={(e) => setDisclaimerContent(e.target.value)}
              rows={4}
              style={{ ...fieldInputStyle, resize: 'vertical', lineHeight: 1.5 }}
            />
          </div>

          {/* ── Lead Form ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={leadFormEnabled}
                  onChange={(e) => onLeadFormEnabledChange?.(e.target.checked)}
                  size="small"
                  sx={{ color: 'rgba(0,0,0,0.54)', '&.Mui-checked': { color: '#473bab' }, padding: '9px' }}
                />
              }
              label={
                <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#1f1d25', letterSpacing: '0.17px', lineHeight: 1.43 }}>
                  Lead Form
                </span>
              }
              sx={{ margin: 0 }}
            />

            {leadFormEnabled && (
              <div style={{ paddingLeft: 38 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, paddingLeft: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#d2323f', lineHeight: '12px' }}>*</span>
                  <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#686576', letterSpacing: '0.15px', lineHeight: '12px' }}>
                    Lead Form CTA
                  </span>
                </div>
                <input
                  type="text"
                  value={leadFormCta}
                  onChange={(e) => onLeadFormCtaChange?.(e.target.value)}
                  style={fieldInputStyle}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
