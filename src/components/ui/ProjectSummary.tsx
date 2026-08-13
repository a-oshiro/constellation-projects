import { useEffect, useRef, useState } from 'react';
import { OpenInNew, Sensors, Public } from '@mui/icons-material';
import type { Asset } from '../../data/types';
import { OverviewAssetCard, ScrollRow } from './OverviewCards';
import { Tooltip } from './Tooltip';

export interface PreviewItem {
  node: React.ReactNode;
  label: string;
}

export interface SummaryCardConfig {
  key: string;
  title: string;
  count: number;
  route: string;
  /** "+N new" green badge — omit or 0 to hide. */
  delta?: number;
  /** Shows the green "Live" indicator instead of the delta badge (Campaign card only). */
  live?: boolean;
  /** Rendered thumbnail content plus a name/label for the avatar-stack preview row, one per item — omit for the Campaign card. */
  previewItems?: PreviewItem[];
}

interface ProjectSummaryProps {
  cards: SummaryCardConfig[];
  latestAssets: Asset[];
  totalAssetsCount: number;
  assetsRoute: string;
  onNavigate: (route: string) => void;
  /** Hides the "Preview" assets strip below the cards without removing it — currently off for Evergreen. */
  showAssetsPreview?: boolean;
}

const AVATAR_SIZE = 36;
const AVATAR_STEP = 24;
const OVERFLOW_LABEL_RESERVE = 84;

/** Overlapping circular thumbnail stack — shows as many previews as the container width allows, then "+N items". */
const AvatarPreviewRow = ({ items }: { items: PreviewItem[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(items.length);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || items.length === 0) return;

    const compute = () => {
      const width = el.clientWidth;
      if (width <= 0) return;
      const fitAll = Math.max(1, Math.floor((width - AVATAR_SIZE) / AVATAR_STEP) + 1);
      if (fitAll >= items.length) {
        setVisibleCount(items.length);
        return;
      }
      const fitTruncated = Math.max(1, Math.floor((width - OVERFLOW_LABEL_RESERVE - AVATAR_SIZE) / AVATAR_STEP) + 1);
      setVisibleCount(Math.min(items.length, fitTruncated));
    };

    compute();
    const observer = new ResizeObserver(compute);
    observer.observe(el);
    return () => observer.disconnect();
  }, [items.length]);

  if (items.length === 0) return null;

  const shown = items.slice(0, visibleCount);
  const truncated = items.slice(visibleCount);
  const overflow = truncated.length;

  return (
    <div ref={containerRef} style={{ display: 'flex', alignItems: 'center', width: '100%', minWidth: 0 }}>
      <div style={{ display: 'flex', flexShrink: 0 }}>
        {shown.map((item, i) => (
          <Tooltip key={i} title={item.label}>
            <div
              style={{
                width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: '50%', flexShrink: 0,
                border: '2.5px solid #f4f5f6', overflow: 'hidden', background: '#ffffff',
                marginLeft: i === 0 ? 0 : -(AVATAR_SIZE - AVATAR_STEP),
              }}
            >
              {item.node}
            </div>
          </Tooltip>
        ))}
      </div>
      {overflow > 0 && (
        <Tooltip title={<>{truncated.map((item, i) => <div key={i}>{item.label}</div>)}</>}>
          <span style={{ marginLeft: 8, fontSize: 13, fontFamily: 'Roboto, sans-serif', fontWeight: 400, color: '#686576', letterSpacing: '0.15px', whiteSpace: 'nowrap', cursor: 'default' }}>
            + {overflow} items
          </span>
        </Tooltip>
      )}
    </div>
  );
};

/** Campaign card's platform indicator — a Website chip plus a green "live" pulse when the campaign is running. */
const CampaignPreview = ({ live }: { live?: boolean }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <div style={{
      width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: '50%', background: '#ffffff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
    }}>
      <Public style={{ fontSize: 20, color: '#1f1d25' }} />
    </div>
    {live && <Sensors style={{ fontSize: 18, color: '#4caf50' }} />}
  </div>
);

const SummaryStatCard = ({ card, onNavigate }: { card: SummaryCardConfig; onNavigate: (route: string) => void }) => (
  <div style={{
    background: '#f4f5f6', borderRadius: 12,
    padding: 16, display: 'flex', flexDirection: 'column', minWidth: 0, gap: 4
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <span style={{
        fontSize: 14, fontWeight: 400, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.1px',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {card.title}
      </span>
      <button
        onClick={() => onNavigate(card.route)}
        title={`Go to ${card.title}`}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', flexShrink: 0, color: '#686576' }}
      >
        <OpenInNew style={{ fontSize: 16 }} />
      </button>
    </div>
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
      <span style={{ fontSize: 24, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#686576', letterSpacing: '0.25px', lineHeight: 1.2 }}>
        {card.count}
      </span>
      <div style={{minHeight: 22, display: 'flex', alignItems: 'center' }}>
        {card.delta ? (
          <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', fontWeight: 500, color: '#4caf50', letterSpacing: '0.17px' }}>
            + {card.delta} new
          </span>
        ) : null}
    </div>
    </div>
    <div style={{marginTop: 4}}>
      {card.key === 'campaigns' ? <CampaignPreview live={card.live} /> : <AvatarPreviewRow items={card.previewItems ?? []} />}
    </div>
  </div>
);

export const ProjectSummary = ({ cards, latestAssets, totalAssetsCount, assetsRoute, onNavigate, showAssetsPreview = true }: ProjectSummaryProps) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    {/* <span style={{ fontSize: 16, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.15px' }}>
      Project Summary
    </span> */}

    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cards.length}, 1fr)`, gap: 8 }}>
      {cards.map((card) => <SummaryStatCard key={card.key} card={card} onNavigate={onNavigate} />)}
    </div>

    {showAssetsPreview && (
      <div style={{ background: '#f4f5f6', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 500, fontFamily: 'Roboto, sans-serif', color: '#1f1d25', letterSpacing: '0.1px', whiteSpace: 'nowrap' }}>
            Preview:
          </span>
          <span style={{ fontSize: 14, fontFamily: 'Roboto, sans-serif', color: '#9c99a9', letterSpacing: '0.1px', whiteSpace: 'nowrap' }}>
            ({totalAssetsCount})
          </span>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => onNavigate(assetsRoute)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
              cursor: 'pointer', color: '#686576', fontSize: 12, fontFamily: 'Roboto, sans-serif',
              fontWeight: 400, letterSpacing: '0.17px', padding: '4px 8px', flexShrink: 0,
            }}
          >
            <OpenInNew style={{ fontSize: 16 }} />
            See all Assets
          </button>
        </div>

        {latestAssets.length > 0 ? (
          <ScrollRow>
            {latestAssets.map((asset) => <OverviewAssetCard key={asset.id} asset={asset} />)}
          </ScrollRow>
        ) : (
          <span style={{ fontSize: 12, fontFamily: 'Roboto, sans-serif', color: '#686576', letterSpacing: '0.17px', lineHeight: 1.43 }}>
            No assets yet — approve an alert above to populate assets here.
          </span>
        )}
      </div>
    )}
  </div>
);
