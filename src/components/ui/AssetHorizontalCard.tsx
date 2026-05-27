import { useState } from 'react';
import { ExpandMore, ExpandLess, WarningAmber, HourglassEmpty, HighlightOff } from '@mui/icons-material';
import { FilledTemplatePreview } from './FilledTemplatePreview';
import { TEMPLATES } from '../../data/mockData';
import type { Asset, AssetStatus } from '../../data/types';

// ── Status indicator chip shown when the asset is not approved ──────────────

const STATUS_CHIP_CONFIG: Partial<Record<AssetStatus, {
  bg: string;
  color: string;
  opacity?: number;
  label: string;
  Icon: React.ElementType;
}>> = {
  updated: {
    bg: 'rgba(225, 118, 19, 0.08)',
    color: '#c45500',
    opacity: 0.75,
    label: 'Updated',
    Icon: WarningAmber,
  },
  removed: {
    bg: 'rgba(210, 50, 63, 0.08)',
    color: '#be0e1c',
    label: 'Removed',
    Icon: HighlightOff,
  },
  awaiting_approval: {
    bg: 'rgba(225, 118, 19, 0.08)',
    color: '#c45500',
    opacity: 0.75,
    label: 'Awaiting Approval',
    Icon: HourglassEmpty,
  },
};

function AssetStatusChip({ status }: { status: AssetStatus }) {
  const cfg = STATUS_CHIP_CONFIG[status];
  if (!cfg) return null;
  const { bg, color, opacity = 1, label, Icon } = cfg;
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: bg,
        borderRadius: 8,
        padding: '3px 8px 3px 6px',
        flexShrink: 0,
        alignSelf: 'flex-start',
      }}
    >
      <Icon style={{ fontSize: 14, color, flexShrink: 0 }} />
      <span
        style={{
          fontSize: 11,
          fontFamily: 'Roboto, sans-serif',
          fontWeight: 400,
          color,
          opacity,
          letterSpacing: '0.4px',
          lineHeight: 1.66,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </div>
  );
}

interface AssetHorizontalCardProps {
  asset: Asset;
}

function buildDestinationUrl(asset: Asset): string {
  // Derive a plausible URL slug from the offer model
  const slug = asset.offer.model.toLowerCase().replace(/\s+/g, '-');
  return `/${slug}/new`;
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

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontFamily: 'Roboto, sans-serif',
  fontWeight: 500,
  color: '#686576',
  letterSpacing: '0.4px',
  lineHeight: 1.66,
  marginBottom: 2,
};

const fieldInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  fontSize: 12,
  fontFamily: 'Roboto, sans-serif',
  color: '#1f1d25',
  letterSpacing: '0.17px',
  lineHeight: 1.43,
  background: '#ffffff',
  border: '1px solid #dddce0',
  borderRadius: 4,
  outline: 'none',
  boxSizing: 'border-box',
};

export const AssetHorizontalCard = ({ asset }: AssetHorizontalCardProps) => {
  const [expanded, setExpanded] = useState(false);

  const template = TEMPLATES.find((t) => t.id === asset.templateId);

  // Letterbox calculation for the 90×90 thumbnail
  const isWide = asset.width > asset.height;
  const innerWidthPct = isWide ? 100 : (asset.width / asset.height) * 100;
  const innerHeightPct = !isWide ? 100 : (asset.height / asset.width) * 100;

  const [expirationDate, setExpirationDate] = useState(asset.offer.expirationDate);
  const [destinationUrl, setDestinationUrl] = useState(buildDestinationUrl(asset));
  const [disclaimer, setDisclaimer] = useState(buildDisclaimer(asset));
  const [disclaimerContent, setDisclaimerContent] = useState(buildDisclaimerContent(asset));

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.12)',
        borderRadius: 12,
        width: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* ── Top section: thumbnail + info ───────────────── */}
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        {/* Thumbnail 90×90 */}
        <div
          style={{
            width: 90,
            height: 90,
            flexShrink: 0,
            background: '#f0f2f4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
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
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          )}
        </div>

        {/* Info */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            justifyContent: 'center',
          }}
        >
          {/* Status chip — shown for non-approved, non-draft statuses */}
          <AssetStatusChip status={asset.status} />

          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontFamily: 'Roboto, sans-serif',
              fontWeight: 400,
              color: '#1f1d25',
              letterSpacing: '0.17px',
              lineHeight: 1.43,
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
            }}
          >
            <span>{asset.imageType}</span>
            <span>|</span>
            <span>{asset.width} x {asset.height}</span>
          </div>
        </div>
      </div>

      {/* ── Toggle row ──────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          borderTop: '1px solid rgba(0,0,0,0.08)',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              fontSize: 13,
              fontFamily: 'Roboto, sans-serif',
              fontWeight: 500,
              color: '#473bab',
              letterSpacing: '0.46px',
              lineHeight: '22px',
            }}
          >
            Configure Website Data
          </span>
          {expanded
            ? <ExpandLess style={{ fontSize: 18, color: '#473bab' }} />
            : <ExpandMore style={{ fontSize: 18, color: '#473bab' }} />
          }
        </div>
      </div>

      {/* ── Expanded fields ─────────────────────────────── */}
      {expanded && (
        <div
          style={{
            background: '#f9fafa',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            borderTop: '1px solid #dddce0',
          }}
        >
          {/* Offer Expiration Date */}
          <div>
            <p style={fieldLabelStyle}>Offer Expiration Date</p>
            <input
              type="text"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              style={fieldInputStyle}
            />
          </div>

          {/* Destination URL */}
          <div>
            <p style={fieldLabelStyle}>Destination URL</p>
            <input
              type="text"
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              style={fieldInputStyle}
            />
          </div>

          {/* Disclaimer */}
          <div>
            <p style={fieldLabelStyle}>Disclaimer</p>
            <input
              type="text"
              value={disclaimer}
              onChange={(e) => setDisclaimer(e.target.value)}
              style={fieldInputStyle}
            />
          </div>

          {/* Disclaimer Content */}
          <div>
            <p style={fieldLabelStyle}>Disclaimer Content</p>
            <textarea
              value={disclaimerContent}
              onChange={(e) => setDisclaimerContent(e.target.value)}
              rows={4}
              style={{
                ...fieldInputStyle,
                resize: 'vertical',
                lineHeight: 1.5,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
