import { FilledTemplatePreview } from './FilledTemplatePreview';
import { StatusBadge } from './StatusBadge';
import { TEMPLATES } from '../../data/mockData';
import type { Asset } from '../../data/types';

interface AssetHorizontalCardProps {
  asset: Asset;
}

export const AssetHorizontalCard = ({ asset }: AssetHorizontalCardProps) => {
  const template = TEMPLATES.find((t) => t.id === asset.templateId);
  const isWide = asset.width > asset.height;
  const innerWidthPct = isWide ? 100 : (asset.width / asset.height) * 100;
  const innerHeightPct = !isWide ? 100 : (asset.height / asset.width) * 100;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px',
        background: '#f9fafa',
        border: '1px solid #e7e7e9',
        borderRadius: 6,
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          flexShrink: 0,
          width: 48,
          height: 48,
          background: '#f0f2f4',
          borderRadius: 4,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontFamily: 'Roboto, sans-serif',
            fontWeight: 500,
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
        <span
          style={{
            fontSize: 11,
            fontFamily: 'Roboto, sans-serif',
            color: '#686576',
            letterSpacing: '0.4px',
            lineHeight: 1.66,
          }}
        >
          {asset.width} × {asset.height}
        </span>
      </div>

      {/* Status */}
      <div style={{ flexShrink: 0 }}>
        <StatusBadge status={asset.status} />
      </div>
    </div>
  );
};
