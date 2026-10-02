import { QC_FINDING_ICON, type QcTag } from '../../utils/alertQc';

/**
 * The amber QC tags for one offer — rendered both over its asset (canvas) and on its Offer Card (Alert
 * Offers panel), so the two always match. Clicking a tag opens the QC warnings panel on that warning;
 * `activeKey` outlines the tag whose warning the panel is currently focused on.
 */
export const QcTagList = ({ tags, activeKey, onSelect, style }: {
  tags: QcTag[];
  activeKey?: string | null;
  onSelect: (tag: QcTag) => void;
  style?: React.CSSProperties;
}) => {
  if (tags.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start', ...style }}>
      {tags.map((tag) => {
        const Icon = tag.findingType ? QC_FINDING_ICON[tag.findingType] : null;
        return (
          <button
            key={tag.key}
            onClick={(e) => { e.stopPropagation(); onSelect(tag); }}
            title="Show in QC warnings"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', border: 'none',
              background: '#FDF4EC', borderRadius: 8, padding: Icon ? '3px 8px 3px 6px' : '3px 8px',
              outline: activeKey === tag.key ? '2px solid #c45500' : 'none',
            }}
          >
            {Icon && <Icon style={{ fontSize: 14, color: '#c45500', flexShrink: 0 }} />}
            <span style={{ fontSize: 11, fontFamily: 'Roboto, sans-serif', fontWeight: 700, color: '#c45500', letterSpacing: '0.4px', whiteSpace: 'nowrap', opacity: 0.75 }}>
              {tag.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
